"""Database-backed media storage — stores files as base64 in PostgreSQL.
No external services. Works on Vercel and everywhere Django runs."""
import base64
import os
import uuid
from django.core.files.storage import Storage


class DatabaseStorage(Storage):

    def _save(self, name, content):
        from .models import StoredFile
        data = content.read() if hasattr(content, "read") else content
        content_type = getattr(content, "content_type", "application/octet-stream")
        ext = os.path.splitext(name)[1].lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        StoredFile.objects.create(
            name=unique_name,
            content_type=content_type,
            data=base64.b64encode(data).decode("ascii"),
        )
        return unique_name

    def url(self, name):
        if not name:
            return ""
        # If it's already an absolute URL (old Cloudinary/Blob record), return as-is
        if name.startswith("http"):
            return name
        return f"/media/db/{name}"

    def exists(self, name):
        from .models import StoredFile
        return StoredFile.objects.filter(name=name).exists()

    def delete(self, name):
        from .models import StoredFile
        StoredFile.objects.filter(name=name).delete()

    def _open(self, name, mode="rb"):
        raise NotImplementedError("DatabaseStorage does not support open()")

    def size(self, name):
        from .models import StoredFile
        try:
            f = StoredFile.objects.get(name=name)
            return len(base64.b64decode(f.data))
        except Exception:
            return 0
