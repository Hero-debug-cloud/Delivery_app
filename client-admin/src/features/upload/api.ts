const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface UploadResponse {
  key: string;
  url: string;
}

export async function apiUploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message ?? errorData?.error ?? "File upload failed");
  }

  return res.json() as Promise<UploadResponse>;
}
