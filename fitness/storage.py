"""Vercel Blob media storage — no filesystem writes, no extra dependencies."""
import json
import os
import ssl
import urllib.parse
import urllib.request
from django.core.files.storage import Storage

BLOB_API = "https://blob.vercel-storage.com"


def _ssl_ctx():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def _token():
    t = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
    if not t:
        raise EnvironmentError(
            "BLOB_READ_WRITE_TOKEN is not set. "
            "Create a Vercel Blob store in your Vercel dashboard and connect it to this project."
        )
    return t


class VercelBlobStorage(Storage):

    def _save(self, name, content):
        token = _token()
        data = content.read() if hasattr(content, "read") else content
        content_type = getattr(content, "content_type", "application/octet-stream")
        url = f"{BLOB_API}/{urllib.parse.quote(name, safe='/')}"
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": content_type,
                "x-api-version": "7",
            },
            method="PUT",
        )
        with urllib.request.urlopen(req, context=_ssl_ctx()) as resp:
            result = json.loads(resp.read())
        # Store the full public URL — url() returns it as-is
        return result["url"]

    def url(self, name):
        return name or ""

    def exists(self, name):
        # Always return False — Vercel Blob generates unique hashed URLs so
        # collisions don't happen; returning False lets Django skip the check.
        return False

    def delete(self, name):
        if not name:
            return
        try:
            token = _token()
            body = json.dumps({"urls": [name]}).encode()
            req = urllib.request.Request(
                BLOB_API,
                data=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "x-api-version": "7",
                },
                method="DELETE",
            )
            urllib.request.urlopen(req, context=_ssl_ctx())
        except Exception:
            pass

    def _open(self, name, mode="rb"):
        raise NotImplementedError("VercelBlobStorage does not support open()")

    def size(self, name):
        return 0
