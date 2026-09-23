import os
import re
import uuid
import logging
from pathlib import Path
from typing import Optional
import httpx
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/jpg",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}
BUCKET_NAME = "field-observations"

# Local fallback uploads path (server/uploads)
LOCAL_UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


class StorageService:
    """
    Object storage service handling ground observation photo uploads to Supabase Storage
    with local disk fallback for development / offline environments.
    """

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """
        Sanitize filename to prevent directory traversal and unsafe characters.
        """
        basename = os.path.basename(filename)
        # Keep alphanumeric, dots, hyphens, and underscores
        clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", basename)
        return clean or "photo.jpg"

    @classmethod
    def validate_image(cls, file_bytes: bytes, filename: str, content_type: Optional[str]) -> str:
        """
        Validate file size and MIME/extension type. Returns normalized content_type.
        """
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
            )

        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        effective_mime = content_type.lower() if content_type else "image/jpeg"
        if effective_mime not in ALLOWED_MIME_TYPES and not effective_mime.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid MIME type '{content_type}'. Must be an image format.",
            )

        return effective_mime

    @classmethod
    def _ensure_supabase_bucket(cls, client: httpx.Client, secret_key: str):
        """
        Ensure the field-observations bucket exists in Supabase Storage.
        """
        try:
            url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/bucket"
            headers = {
                "Authorization": f"Bearer {secret_key}",
                "apiKey": secret_key,
                "Content-Type": "application/json",
            }
            # Check if bucket exists
            res = client.get(f"{url}/{BUCKET_NAME}", headers=headers, timeout=5.0)
            if res.status_code == 404:
                # Create public bucket
                create_res = client.post(
                    url,
                    json={"id": BUCKET_NAME, "name": BUCKET_NAME, "public": True},
                    headers=headers,
                    timeout=5.0,
                )
                if create_res.status_code in (200, 201):
                    logger.info(f"Created Supabase storage bucket '{BUCKET_NAME}' successfully.")
        except Exception as e:
            logger.warning(f"Unable to check/create Supabase bucket: {e}")

    @classmethod
    def upload_field_photo(
        cls,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str],
        case_id: str,
    ) -> str:
        """
        Uploads image file bytes to Object Storage (Supabase) or local fallback.
        Returns the stored public URL reference.
        """
        mime_type = cls.validate_image(file_bytes, filename, content_type)
        safe_filename = cls.sanitize_filename(filename)
        unique_id = uuid.uuid4().hex
        object_path = f"{case_id}/{unique_id}/{safe_filename}"

        secret_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_SECRET_KEY
        supabase_url = settings.SUPABASE_URL

        # Attempt Supabase Storage Upload if configured
        if (
            supabase_url
            and not supabase_url.startswith("https://your-project")
            and secret_key
            and not secret_key.startswith("your-supabase")
        ):
            try:
                with httpx.Client(timeout=15.0) as client:
                    cls._ensure_supabase_bucket(client, secret_key)

                    upload_url = f"{supabase_url.rstrip('/')}/storage/v1/object/{BUCKET_NAME}/{object_path}"
                    headers = {
                        "Authorization": f"Bearer {secret_key}",
                        "apiKey": secret_key,
                        "Content-Type": mime_type,
                        "x-upsert": "true",
                    }
                    resp = client.post(upload_url, content=file_bytes, headers=headers)
                    if resp.status_code in (200, 201):
                        public_url = f"{supabase_url.rstrip('/')}/storage/v1/object/public/{BUCKET_NAME}/{object_path}"
                        logger.info(f"Successfully uploaded photo to Supabase Storage: {public_url}")
                        return public_url
                    else:
                        logger.warning(
                            f"Supabase storage upload returned status {resp.status_code}: {resp.text}. Falling back to local storage."
                        )
            except Exception as e:
                logger.warning(f"Supabase storage upload failed: {e}. Falling back to local storage.")

        # Local fallback storage
        local_dir = LOCAL_UPLOADS_DIR / BUCKET_NAME / case_id / unique_id
        local_dir.mkdir(parents=True, exist_ok=True)
        file_path = local_dir / safe_filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        local_url = f"/uploads/{BUCKET_NAME}/{case_id}/{unique_id}/{safe_filename}"
        logger.info(f"Saved photo locally at {file_path}. URL: {local_url}")
        return local_url
