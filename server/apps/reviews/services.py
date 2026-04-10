"""
Review service layer.

The single piece of non-trivial logic here is `find_verified_order` —
the gate that proves a user actually bought a given product (in any
delivered or shipped order). It's used both by the eligibility endpoint
(so the UI can show/hide the "Write a review" button) and by the create
endpoint (so the backend enforces the same rule).
"""

from apps.orders.models import Order, OrderItem
from apps.orders.services import link_guest_orders_to_user


def find_verified_order(*, user, product) -> Order | None:
    """
    Return the most recent order from this user that contains this product
    AND has been paid for. Returns None if no such order exists.

    We accept any non-cancelled status from PAID onwards. This is the most
    permissive gate that still proves the customer actually bought the
    product (Stripe took the money), and matches what mainstream marketplaces
    do. Premature reviews are mitigated by the 30-day edit window — a
    customer who hates the product after it arrives can update their rating.

    Before searching, we attach any guest orders sharing this user's email
    to their account. This handles the common flow where someone checks
    out as a guest, then later creates an account with the same email and
    expects to be able to review the products they bought.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return None

    link_guest_orders_to_user(user)

    eligible_statuses = [
        Order.Status.PAID,
        Order.Status.PROCESSING,
        Order.Status.SHIPPED,
        Order.Status.DELIVERED,
    ]

    item = (
        OrderItem.objects.filter(
            order__user=user,
            order__status__in=eligible_statuses,
            product_id=product.id,
        )
        .select_related("order")
        .order_by("-order__paid_at")
        .first()
    )
    return item.order if item else None
