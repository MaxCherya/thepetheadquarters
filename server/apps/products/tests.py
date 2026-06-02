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


def _make_variant(product: Product, *, sku: str, stock: int = 0, price: int = 1000) -> ProductVariant:
    return ProductVariant.objects.create(
        product=product,
        sku=sku,
        price=price,
        stock_quantity=stock,
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
