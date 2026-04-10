from django.conf import settings

from apps.core.responses import error_response, success_response

from apps.admin_panel.services.uploads import UploadError, upload_image
from apps.admin_panel.views.base import AdminBaseView


class AdminImageUploadView(AdminBaseView):
    """
    Upload an image file. Returns the public URL.
    Storage backend (Cloudinary or local) is determined by settings.CLOUDINARY_URL.
    """

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return error_response("upload.no_file")

        folder = request.data.get("folder", "products")

        try:
            result = upload_image(file, folder=folder)
        except UploadError as e:
            return error_response(e.code)

        return success_response(data={
            "url": result["url"],
            "storage": result["storage"],
            "public_id": result["public_id"],
        })


class AdminUploadInfoView(AdminBaseView):
    """Returns which storage backend is currently active."""

    def get(self, request):
        return success_response(data={
            "storage": "cloudinary" if settings.CLOUDINARY_URL else "local",
            "max_file_size_mb": 8,
            "allowed_formats": ["JPEG", "PNG", "WEBP", "GIF"],
        })
