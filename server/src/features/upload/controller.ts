import type { Context } from "hono";
import * as uploadService from "./service.ts";

export async function uploadFile(c: Context) {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json(
        { error: "VALIDATION_ERROR", message: "No file payload found under 'file' parameter key" },
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type;
    const filename = file.name;

    const result = await uploadService.uploadFile(arrayBuffer, mimeType, filename);
    return c.json(result, 200);
  } catch (err) {
    console.error("[uploadFile] controller error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to upload file to storage" }, 500);
  }
}
