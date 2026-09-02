from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Request, Response
from typing import Dict, Any
from app.core.limiter import limiter
from app.core.storage import storage_service
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/image", response_model=Dict[str, Any])
@limiter.limit("20/minute")
async def upload_image(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
):
    """
    Secure Image Upload Endpoint:
    - Accepts JPEG, PNG, WEBP, SVG
    - Maximum size: 5 MB
    - Sanitizes filename and generates cryptographically unique path
    - Rate limited to 20 uploads/minute per IP
    """
    result = await storage_service.save_image(file)
    return {
        "status": "success",
        "data": result
    }


@router.post("/document", response_model=Dict[str, Any])
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
):
    """
    Secure Document Upload Endpoint (Admit cards, ID cards, PDF receipts):
    - Accepts PDF, JPEG, PNG
    - Maximum size: 10 MB
    - Sanitizes filename and prevents directory traversal
    - Rate limited to 10 uploads/minute per IP
    """
    result = await storage_service.save_document(file)
    return {
        "status": "success",
        "data": result
    }
