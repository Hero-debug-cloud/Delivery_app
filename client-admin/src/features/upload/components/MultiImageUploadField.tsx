import React, { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { apiUploadFile } from "../api";

interface MultiImageUploadFieldProps {
  values: string[];
  previewUrls: string[];
  onChange: (keys: string[], urls: string[]) => void;
  label?: string;
  error?: string;
  max?: number;
}

export function MultiImageUploadField({
  values = [],
  previewUrls = [],
  onChange,
  label = "Product Images (Up to 5)",
  error,
  max = 5,
}: MultiImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    const remainingSlots = max - values.length - uploadingCount;
    if (remainingSlots <= 0) {
      setUploadError(`You can only upload up to ${max} images.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (filesToUpload.length === 0) return;

    setUploadError(null);
    setUploadingCount(prev => prev + filesToUpload.length);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate type
        if (!file.type.startsWith("image/")) {
          throw new Error("Invalid file type. Please select PNG, JPG, or WEBP.");
        }
        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File size must be less than 5MB.");
        }

        const response = await apiUploadFile(file);
        return response; // { key, url }
      });

      const results = await Promise.all(uploadPromises);
      const newKeys = [...values, ...results.map(r => r.key)];
      const newUrls = [...previewUrls, ...results.map(r => r.url || "")];
      onChange(newKeys, newUrls);
    } catch (err: any) {
      console.error("Multi-upload failed:", err);
      setUploadError(err.message || "Failed to upload one or more images.");
    } finally {
      setUploadingCount(prev => Math.max(0, prev - filesToUpload.length));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const newKeys = values.filter((_, idx) => idx !== indexToRemove);
    const newUrls = previewUrls.filter((_, idx) => idx !== indexToRemove);
    onChange(newKeys, newUrls);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        <span className="text-[13px] font-semibold text-neutral-700">{label}</span>
        <span className="text-[11px] font-medium text-neutral-400">
          {values.length} / {max} uploaded
        </span>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 border border-neutral-200 bg-neutral-50/50 rounded-md min-h-[120px]"
      >
        {/* Render uploaded images */}
        {previewUrls.map((url, idx) => (
          <div 
            key={values[idx] || idx} 
            className="group relative border border-neutral-200 bg-white rounded-md aspect-square overflow-hidden flex items-center justify-center shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={url} 
              alt={`Product Thumbnail ${idx + 1}`} 
              className="w-full h-full object-contain p-1 bg-white"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-all border border-red-200"
              title="Remove image"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/60 text-white text-[9px] py-0.5 text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {idx === 0 ? "Main Image" : `Image ${idx + 1}`}
            </div>
          </div>
        ))}

        {/* Render loaders for images uploading */}
        {Array.from({ length: uploadingCount }).map((_, idx) => (
          <div 
            key={`uploading-${idx}`} 
            className="border border-neutral-200 bg-white rounded-md aspect-square flex flex-col items-center justify-center gap-1.5 p-2 text-center"
          >
            <Loader2 className="animate-spin text-primary-500" size={16} />
            <span className="text-[9px] font-medium text-neutral-500">Uploading...</span>
          </div>
        ))}

        {/* Dash box to upload more */}
        {values.length + uploadingCount < max && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 hover:border-primary-500 rounded-md aspect-square flex flex-col items-center justify-center text-center cursor-pointer bg-white transition-all p-2 hover:bg-neutral-50"
          >
            <Upload className="text-neutral-400 mb-1" size={18} />
            <span className="text-[11px] font-semibold text-neutral-600">Add Photo</span>
            <span className="text-[9px] text-neutral-400 mt-0.5">Max 5MB</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
          disabled={values.length + uploadingCount >= max}
        />
      </div>

      {(error || uploadError) && (
        <span className="text-[11px] font-medium text-red-500 mt-0.5">
          {error || uploadError}
        </span>
      )}
    </div>
  );
}
