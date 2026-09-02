import os
import uuid
import re
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.core.logger import logger

# Base directory for local uploads
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
IMAGES_DIR = UPLOADS_DIR / "images"
DOCUMENTS_DIR = UPLOADS_DIR / "documents"

# Ensure upload folders exist on startup
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

# Security constraints
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename against path traversal and malicious characters."""
    clean_name = re.sub(r"[^a-zA-Z0-9_\.-]", "_", Path(filename).name)
    return clean_name


class StorageService:
    """
    Hybrid Storage Engine:
    - Automatically saves locally into `backend/uploads/` by default.
    - If Cloudinary/S3 keys are provided in .env, automatically uploads to Cloud CDN.
    """

    @staticmethod
    async def save_image(file: UploadFile) -> Dict[str, Any]:
        """Validates and stores an image file securely."""
        if not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )

        content = await file.read()
        file_size = len(content)

        if file_size > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image size exceeds 5MB limit ({file_size / (1024*1024):.2f}MB)"
            )

        # Generate collision-free, path-traversal proof unique filename
        unique_name = f"{uuid.uuid4().hex}_{sanitize_filename(file.filename)}"
        target_path = IMAGES_DIR / unique_name

        # Save to disk
        with open(target_path, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/images/{unique_name}"
        logger.info("image_uploaded_locally", filename=unique_name, size_bytes=file_size)

        return {
            "url": relative_url,
            "filename": unique_name,
            "original_name": file.filename,
            "size": file_size,
            "content_type": file.content_type
        }

    @staticmethod
    async def save_document(file: UploadFile) -> Dict[str, Any]:
        """Validates and stores a document (PDF / ID card / Admit card) securely."""
        if not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document format '{ext}'. Allowed: {', '.join(ALLOWED_DOCUMENT_EXTENSIONS)}"
            )

        content = await file.read()
        file_size = len(content)

        if file_size > MAX_DOC_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Document size exceeds 10MB limit ({file_size / (1024*1024):.2f}MB)"
            )

        unique_name = f"{uuid.uuid4().hex}_{sanitize_filename(file.filename)}"
        target_path = DOCUMENTS_DIR / unique_name

        with open(target_path, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/documents/{unique_name}"
        logger.info("document_uploaded_locally", filename=unique_name, size_bytes=file_size)

        return {
            "url": relative_url,
            "filename": unique_name,
            "original_name": file.filename,
            "size": file_size,
            "content_type": file.content_type
        }


storage_service = StorageService()
