from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import Address, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "first_name", "last_name", "is_email_verified", "is_active"]
    list_filter = ["is_email_verified", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("first_name", "last_name", "phone")}),
        ("Auth", {"fields": ("is_email_verified",)}),
        ("GDPR", {"fields": ("gdpr_consent", "gdpr_consent_at")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "password1", "password2"),
        }),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["full_name", "city", "postcode", "is_default", "user"]
    list_filter = ["is_default", "country"]
    search_fields = ["full_name", "postcode", "city"]
