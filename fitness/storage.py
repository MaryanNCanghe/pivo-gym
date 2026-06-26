"""Cloudinary media storage — replaces local filesystem for Vercel."""
import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.core.files.storage import Storage


def _configure():
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def _public_id(name: str) -> str:
    """Strip extension — Cloudinary uses the base path as the public_id."""
    return os.path.splitext(name)[0]


class CloudinaryStorage(Storage):
    def __init__(self):
        _configure()

    def _save(self, name, content):
        _configure()
        result = cloudinary.uploader.upload(
            content,
            public_id=_public_id(name),
            overwrite=True,
            resource_type="auto",
        )
        fmt = result.get("format", "")
        pid = result["public_id"]
        return f"{pid}.{fmt}" if fmt else pid

    def url(self, name):
        if not name:
            return ""
        _configure()
        return cloudinary.CloudinaryImage(_public_id(name)).build_url(secure=True)

    def exists(self, name):
        _configure()
        try:
            cloudinary.api.resource(_public_id(name))
            return True
        except Exception:
            return False

    def delete(self, name):
        _configure()
        try:
            cloudinary.uploader.destroy(_public_id(name))
        except Exception:
            pass

    def _open(self, name, mode="rb"):
        raise NotImplementedError("CloudinaryStorage does not support open()")

    def size(self, name):
        _configure()
        try:
            res = cloudinary.api.resource(_public_id(name))
            return res.get("bytes", 0)
        except Exception:
            return 0
