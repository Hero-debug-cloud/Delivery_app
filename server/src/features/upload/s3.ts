import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const s3Region = process.env.S3_REGION || "us-east-1";
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || "minioadmin";
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "minioadminpassword";
const s3Bucket = process.env.S3_BUCKET || "logiroute-uploads";
const s3PublicUrl = process.env.S3_PUBLIC_URL || "http://localhost:9000";

export const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: s3Region,
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
  forcePathStyle: true, // Required for MinIO
});

// Dedicated S3 Client for computing presigned URLs.
// Configured with the browser-resolvable public hostname (http://localhost:9000)
// so that the generated cryptographic signature matches requests sent by browser.
export const signingS3Client = new S3Client({
  endpoint: s3PublicUrl,
  region: s3Region,
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
  forcePathStyle: true,
});

export async function uploadToS3(fileBuffer: Buffer | ArrayBuffer, mimeType: string, filename: string): Promise<string> {
  const extension = filename.split(".").pop() || "bin";
  const uniqueFilename = `${crypto.randomUUID()}.${extension}`;
  const key = `uploads/${uniqueFilename}`;

  const buffer = fileBuffer instanceof ArrayBuffer ? Buffer.from(fileBuffer) : fileBuffer;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return key;
}

export async function getPresignedUrl(objectKey: string | null): Promise<string | null> {
  if (!objectKey) return null;

  // If it's already a full external URL (e.g. Unsplash placeholders), return as-is
  if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
    return objectKey;
  }

  const command = new GetObjectCommand({
    Bucket: s3Bucket,
    Key: objectKey,
  });

  try {
    const signedUrl = await getSignedUrl(signingS3Client, command, { expiresIn: 86400 }); // Expires in 24 hours
    return signedUrl;
  } catch (error) {
    console.error("Error generating presigned URL for key:", objectKey, error);
    return null;
  }
}

export function extractS3Key(urlOrKey: string | null): string | null {
  if (!urlOrKey) return null;
  if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
    try {
      const url = new URL(urlOrKey);
      const pathname = url.pathname; // e.g. "/logiroute-uploads/uploads/filename.png"
      const prefix = `/${s3Bucket}/`;
      if (pathname.startsWith(prefix)) {
        return pathname.substring(prefix.length);
      }
    } catch (e) {
      // Ignore URL parsing errors and return original
    }
  }
  return urlOrKey;
}

export { s3Bucket };

