from rest_framework import serializers

from .models import Review


def _display_name(user) -> str:
    """First name + last initial, e.g. 'Sarah M.'. Falls back to 'Anonymous'."""
    if not user:
        return "Anonymous"
    first = (user.first_name or "").strip()
    last = (user.last_name or "").strip()
    if first and last:
        return f"{first} {last[0].upper()}."
    if first:
        return first
    if user.email:
        return user.email.split("@")[0]
    return "Anonymous"


class ReviewSerializer(serializers.ModelSerializer):
    """Public-facing review (no PII beyond display name)."""

    display_name = serializers.SerializerMethodField()
    is_verified_buyer = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    is_own = serializers.SerializerMethodField()
    has_voted_helpful = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "rating",
            "title",
            "body",
            "display_name",
            "is_verified_buyer",
            "helpful_count",
            "admin_reply",
            "admin_reply_at",
            "created_at",
            "updated_at",
            "is_editable",
            "is_own",
            "has_voted_helpful",
        ]

    def get_display_name(self, obj):
        return _display_name(obj.user)

    def get_is_verified_buyer(self, obj):
        return obj.order_id is not None

    def get_is_editable(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if obj.user_id != request.user.id:
            return False
        return obj.is_editable

    def get_is_own(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.user_id == request.user.id

    def get_has_voted_helpful(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        voted_ids = self.context.get("voted_ids")
        if voted_ids is not None:
            return obj.id in voted_ids
        return obj.helpful_votes.filter(user=request.user).exists()


class ReviewWriteSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    body = serializers.CharField(
        min_length=Review.BODY_MIN_LENGTH,
        max_length=Review.BODY_MAX_LENGTH,
    )
