"""
Create opening StockBatch records for variants that have stock_quantity > 0
but no existing batches. Used after deploying the procurement app for the
first time so FIFO COGS calculation has a basis to consume from.

Usage: python manage.py backfill_stock_batches
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.procurement.models import StockBatch, StockMovement
from apps.products.models import ProductVariant


class Command(BaseCommand):
    help = "Create opening StockBatch entries for variants with stock but no batches."

    def handle(self, *args, **options):
        created = 0
        skipped = 0
        for variant in ProductVariant.objects.filter(stock_quantity__gt=0):
            if variant.stock_batches.exists():
                skipped += 1
                continue

            unit_cost = variant.cost_price or 0

            batch = StockBatch.objects.create(
                variant=variant,
                purchase_order_item=None,
                quantity_received=variant.stock_quantity,
                quantity_remaining=variant.stock_quantity,
                unit_cost=unit_cost,
                received_at=timezone.now(),
                notes="Opening stock (backfill)",
            )

            StockMovement.objects.create(
                variant=variant,
                type=StockMovement.MovementType.PURCHASE_RECEIVED,
                quantity=variant.stock_quantity,
                batch=batch,
                unit_cost_at_time=unit_cost,
                total_cost=variant.stock_quantity * unit_cost,
                notes="Opening stock backfill",
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(f"Backfilled {created} batches, skipped {skipped} variants with existing batches.")
        )
