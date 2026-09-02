/**
 * Media & Document Upload Client
 * Provides secure multipart file upload methods for Next.js frontend
 */

export interface UploadResponse {
  status: "success" | "error";
  data: {
    url: string;
    filename: string;
    original_name: string;
    size: number;
    content_type: string;
  };
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    throw new Error(`Invalid format. Allowed: JPG, PNG, WEBP, SVG`);
  }

  // 5MB Limit
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image size must be less than 5MB");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/uploads/image", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload image");
  }

  return res.json();
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.type)) {
    throw new Error("Invalid document format. Allowed: PDF, JPG, PNG");
  }

  // 10MB Limit
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Document size must be less than 10MB");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/uploads/document", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload document");
  }

  return res.json();
}
