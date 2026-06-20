import { uploadToS3, getPresignedUrl } from "./s3.ts";

export async function uploadFile(
  fileBuffer: Buffer | ArrayBuffer,
  mimeType: string,
  filename: string
): Promise<{ key: string; url: string | null }> {
  if (!filename) {
    filename = "file.bin";
  }
  const key = await uploadToS3(fileBuffer, mimeType, filename);
  const url = await getPresignedUrl(key);
  return { key, url };
}
