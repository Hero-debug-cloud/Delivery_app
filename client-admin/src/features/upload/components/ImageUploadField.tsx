import React, { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { apiUploadFile } from "../api";

interface ImageUploadFieldProps {
  value?: string | null;
  previewUrl?: string | null;
  onChange: (key: string | null, url: string | null) => void;
  label?: string;
  error?: string;
}

export function ImageUploadField({
  value,
  previewUrl,
  onChange,
  label = "Image",
  error,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await apiUploadFile(file);
      onChange(response.key, response.url);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await apiUploadFile(file);
      onChange(response.key, response.url);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadError(null);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-[13px] font-semibold text-neutral-700">{label}</span>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[140px] relative overflow-hidden bg-neutral-50/50 hover:bg-neutral-50 ${
          error || uploadError 
            ? "border-red-300 hover:border-red-400" 
            : previewUrl 
              ? "border-neutral-200" 
              : "border-neutral-300 hover:border-primary-400"
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary-500" size={24} />
            <span className="text-[12px] font-medium text-neutral-500">Uploading image to secure storage...</span>
          </div>
        ) : previewUrl ? (
          <div className="relative w-full h-full min-h-[108px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={previewUrl} 
              alt="Uploaded Preview" 
              className="max-h-[110px] max-w-full rounded object-contain shadow-sm bg-white"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-all border border-red-200"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
              <Upload size={18} />
            </div>
            <p className="text-[13px] font-semibold text-neutral-700">
              Click to upload or drag & drop
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Supports PNG, JPG, WEBP (Max 5MB)
            </p>
          </div>
        )}
      </div>

      {(error || uploadError) && (
        <span className="text-[11px] font-medium text-red-500 mt-0.5">
          {error || uploadError}
        </span>
      )}
    </div>
  );
}
