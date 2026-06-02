"""
Dropship-aware availability + filtering.

Dropship products never accrue local stock (the supplier ships per
order). Treating their stock_quantity as the availability signal
would render every freshly-created dropship variant as "Out of
stock" forever — which is the bug these tests exist to prevent
regressing.

Covers:
  - ProductListSerializer.in_stock: True for dropship with 0 stock
    as long as at least one active variant exists.
  - ProductVariantSerializer.in_stock: True for dropship variant
    even when stock_quantity = 0.
  - ProductFilter(?in_stock=true): dropship products surface even
    with no on-hand stock.
  - orders.services.validate_cart: dropship variants pass the
    insufficient-stock gate (the order placement path already
    skips the decrement, but the cart-validation step would
    otherwise block checkout).
  - Admin inventory list: hides dropship variants by default
    so the page isn't dominated by permanent 0-stock noise.
"""

from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.products.models import (
    Product,
    ProductTranslation,
    ProductVariant,
)
from apps.products.serializers import (
    ProductListSerializer,
    ProductVariantSerializer,
)
from apps.products.filters import ProductFilter


def _make_product(*, fulfillment: str, name: str) -> Product:
    product = Product.objects.create(fulfillment_type=fulfillment)
    ProductTranslation.objects.create(
        product=product,
        language="en",
        name=name,
        description="",
        short_description="",
    )
    # Slug is auto-generated from the translation
    product.slug = None
    product.save()
    return product


def _make_variant(
    product: Product,
    *,
    sku: str,
    stock: int = 0,
    price: int = 1000,
    manual_unavailable: bool = False,
) -> ProductVariant:
    return ProductVariant.objects.create(
        product=product,
        sku=sku,
        price=price,
        stock_quantity=stock,
        manual_unavailable=manual_unavailable,
    )


class DropshipInStockSerializerTests(TestCase):
    def test_dropship_list_in_stock_true_with_zero_stock(self):
        product = _make_product(fulfillment="dropship", name="Dropship Toy")
        _make_variant(product, sku="DROP-001", stock=0)

        data = ProductListSerializer(product).data
        self.assertTrue(data["in_stock"])
        self.assertEqual(data["fulfillment_type"], "dropship")

    def test_dropship_list_in_stock_false_when_no_active_variant(self):
        # Without any variant, the product has nothing to sell — even
        # for dropship we shouldn't claim availability.
        product = _make_product(fulfillment="dropship", name="No Variants")
        data = ProductListSerializer(product).data
        self.assertFalse(data["in_stock"])

    def test_self_fulfilled_still_requires_positive_stock(self):
        product = _make_product(fulfillment="self", name="Self Coat")
        _make_variant(product, sku="SELF-001", stock=0)

        data = ProductListSerializer(product).data
        self.assertFalse(data["in_stock"])

    def test_dropship_variant_in_stock_true_with_zero_stock(self):
        product = _make_product(fulfillment="dropship", name="Dropship Bowl")
        variant = _make_variant(product, sku="DROP-002", stock=0)

        data = ProductVariantSerializer(variant).data
        self.assertTrue(data["in_stock"])

    def test_self_fulfilled_variant_respects_stock_quantity(self):
        product = _make_product(fulfillment="self", name="Self Bowl")
        variant = _make_variant(product, sku="SELF-002", stock=0)

        data = ProductVariantSerializer(variant).data
        self.assertFalse(data["in_stock"])


class DropshipFilterTests(TestCase):
    def test_in_stock_filter_includes_dropship_with_zero_stock(self):
        dropship = _make_product(fulfillment="dropship", name="Drop Filter")
        _make_variant(dropship, sku="DF-001", stock=0)

        self_empty = _make_product(fulfillment="self", name="Self Empty")
        _make_variant(self_empty, sku="SE-001", stock=0)

        self_stocked = _make_product(fulfillment="self", name="Self Stocked")
        _make_variant(self_stocked, sku="SS-001", stock=5)

        factory = APIRequestFactory()
        request = factory.get("/", {"in_stock": "true"})
        f = ProductFilter(
            data=request.GET, queryset=Product.objects.all(), request=request,
        )
        ids = set(str(p.id) for p in f.qs)
        self.assertIn(str(dropship.id), ids)
        self.assertIn(str(self_stocked.id), ids)
        self.assertNotIn(str(self_empty.id), ids)


class DropshipStorefrontDetailTests(TestCase):
    """
    End-to-end flow check: admin-created dropship variant with stock=0
    surfaces on the storefront product detail with in_stock=True for
    both the product and the variant. Catches regressions where
    `fulfillment_type` is dropped from the response or `in_stock` is
    computed off `stock_quantity` again.
    """

    def test_storefront_detail_reports_dropship_variant_in_stock(self):
        from django.test import Client

        product = _make_product(fulfillment="dropship", name="Drop Detail")
        _make_variant(product, sku="DD-001", stock=0)
        product.refresh_from_db()

        res = Client().get(f"/api/v1/products/{product.slug}/")
        self.assertEqual(res.status_code, 200)
        body = res.json().get("data") or res.json()

        self.assertEqual(body["fulfillment_type"], "dropship")
        self.assertTrue(body["in_stock"], body)
        self.assertEqual(len(body["variants"]), 1)
        self.assertTrue(body["variants"][0]["in_stock"], body["variants"][0])


class DropshipCartValidationTests(TestCase):
    def test_validate_cart_allows_dropship_with_zero_stock(self):
        from apps.orders.services import validate_cart, CartValidationError

        product = _make_product(fulfillment="dropship", name="Drop Cart")
        variant = _make_variant(product, sku="DC-001", stock=0)

        try:
            result = validate_cart([
                {"variant_id": str(variant.id), "quantity": 3},
            ])
        except CartValidationError as exc:
            self.fail(f"validate_cart should not raise for dropship: {exc.code} {exc.details}")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["quantity"], 3)

    def test_validate_cart_blocks_self_fulfilled_with_zero_stock(self):
        from apps.orders.services import validate_cart, CartValidationError

        product = _make_product(fulfillment="self", name="Self Cart")
        variant = _make_variant(product, sku="SC-001", stock=0)

        with self.assertRaises(CartValidationError) as ctx:
            validate_cart([{"variant_id": str(variant.id), "quantity": 1}])

        self.assertEqual(ctx.exception.code, "checkout.validation_failed")
        codes = [d["code"] for d in ctx.exception.details]
        self.assertIn("checkout.insufficient_stock", codes)


class ManualUnavailableTests(TestCase):
    """
    Admin override that flips a variant to out-of-stock regardless of
    stock_quantity or fulfillment_type. Used when a dropship supplier
    runs out without us wanting to deactivate the variant entirely.
    """

    def test_dropship_variant_with_manual_unavailable_is_out_of_stock(self):
        product = _make_product(fulfillment="dropship", name="OOS Drop")
        variant = _make_variant(
            product, sku="OD-001", stock=0, manual_unavailable=True,
        )
        self.assertFalse(ProductVariantSerializer(variant).data["in_stock"])

    def test_self_variant_with_stock_and_manual_unavailable_is_out_of_stock(self):
        # Override beats positive stock — useful for pulling a self-
        # fulfilled SKU without zeroing the count.
        product = _make_product(fulfillment="self", name="OOS Self")
        variant = _make_variant(
            product, sku="OS-001", stock=10, manual_unavailable=True,
        )
        self.assertFalse(ProductVariantSerializer(variant).data["in_stock"])

    def test_list_serializer_excludes_manual_unavailable_dropship(self):
        # A dropship product whose only variant is flagged unavailable
        # surfaces as out-of-stock on the storefront grid.
        product = _make_product(fulfillment="dropship", name="OOS Drop List")
        _make_variant(product, sku="ODL-001", stock=0, manual_unavailable=True)
        self.assertFalse(ProductListSerializer(product).data["in_stock"])

    def test_in_stock_filter_excludes_manual_unavailable(self):
        from rest_framework.test import APIRequestFactory

        unavailable_drop = _make_product(fulfillment="dropship", name="MU Drop")
        _make_variant(unavailable_drop, sku="MUD-001", stock=0, manual_unavailable=True)

        stocked_self = _make_product(fulfillment="self", name="MU Self")
        _make_variant(stocked_self, sku="MUS-001", stock=5)

        factory = APIRequestFactory()
        request = factory.get("/", {"in_stock": "true"})
        f = ProductFilter(
            data=request.GET, queryset=Product.objects.all(), request=request,
        )
        ids = set(str(p.id) for p in f.qs)
        self.assertIn(str(stocked_self.id), ids)
        self.assertNotIn(str(unavailable_drop.id), ids)

    def test_validate_cart_blocks_manual_unavailable(self):
        from apps.orders.services import validate_cart, CartValidationError

        product = _make_product(fulfillment="dropship", name="Block Drop")
        variant = _make_variant(
            product, sku="BD-001", stock=0, manual_unavailable=True,
        )

        with self.assertRaises(CartValidationError) as ctx:
            validate_cart([{"variant_id": str(variant.id), "quantity": 1}])

        self.assertEqual(ctx.exception.code, "checkout.validation_failed")
        codes = [d["code"] for d in ctx.exception.details]
        self.assertIn("checkout.insufficient_stock", codes)
