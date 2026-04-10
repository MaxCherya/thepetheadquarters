"""
Grant is_staff (and optionally is_superuser) to an existing user by email.

Usage:
    python manage.py make_admin user@example.com
    python manage.py make_admin user@example.com --superuser
"""

from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User


class Command(BaseCommand):
    help = "Grant staff (admin) access to an existing user by email."

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email of the user to promote")
        parser.add_argument(
            "--superuser",
            action="store_true",
            help="Also grant superuser access",
        )

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise CommandError(f"No user found with email: {email}")

        user.is_staff = True
        if options["superuser"]:
            user.is_superuser = True

        update_fields = ["is_staff"]
        if options["superuser"]:
            update_fields.append("is_superuser")
        user.save(update_fields=update_fields)

        flags = "staff" + (" + superuser" if options["superuser"] else "")
        self.stdout.write(
            self.style.SUCCESS(f"Granted {flags} to {user.email}")
        )
