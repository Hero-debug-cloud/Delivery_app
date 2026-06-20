import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Sparkles } from "lucide-react";
import { ImageUploadField } from "@/features/upload/components/ImageUploadField";
import type { Category } from "../types";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const PRESET_IMAGES = [
  { name: "Fruits", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60" },
  { name: "Dairy", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60" },
  { name: "Bakery", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60" },
  { name: "Drinks", url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=60" },
  { name: "Snacks", url: "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=400&auto=format&fit=crop&q=60" },
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormValues) => Promise<void>;
  category?: Category | null;
  isSaving: boolean;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  isSaving,
}: CategoryModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
    },
  });

  const watchedImageUrl = watch("imageUrl");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        isActive: category.isActive,
      });
      setImagePreview(category.imageUrl || null);
    } else {
      reset({
        name: "",
        description: "",
        imageUrl: "",
        isActive: true,
      });
      setImagePreview(null);
    }
    setSubmitError(null);
  }, [category, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      setSubmitError(null);
      await onSave(values);
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save category. Please try again.");
    }
  };

  const handleImageChange = (key: string | null, url: string | null) => {
    setValue("imageUrl", key || "");
    setImagePreview(url);
  };

  const selectPreset = (url: string) => {
    setValue("imageUrl", url);
    setImagePreview(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-neutral-200 rounded-md shadow-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-[18px] font-bold text-neutral-900">
              {category ? "Edit Category" : "Add New Category"}
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Create product groups just like Zepto and Blinkit.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition-all p-1.5 hover:bg-neutral-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] font-medium">
              {submitError}
            </div>
          )}

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Fruits & Vegetables"
              {...register("name")}
              className={`px-3 py-2 border rounded-md text-[14px] bg-white focus:outline-none transition-all ${
                errors.name
                  ? "border-red-300 focus:border-red-500"
                  : "border-neutral-200 focus:border-primary-600"
              }`}
            />
            {errors.name && (
              <span className="text-[11px] font-medium text-red-500">{errors.name.message}</span>
            )}
          </div>

          {/* Description Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Description</label>
            <textarea
              placeholder="Describe what kind of products go into this category..."
              rows={3}
              {...register("description")}
              className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all resize-none"
            />
          </div>

          {/* Image Upload Field */}
          <ImageUploadField
            label="Category Banner / Icon"
            value={watchedImageUrl}
            previewUrl={imagePreview}
            onChange={handleImageChange}
            error={errors.imageUrl?.message}
          />

          {/* Presets Helper */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 text-[12px] font-semibold text-primary-600">
              <Sparkles size={14} />
              <span>Or Select a Quick-Commerce Preset Banner</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset.url)}
                  className={`border rounded-md p-1 bg-white hover:bg-neutral-50 transition-all flex flex-col items-center gap-1.5 text-center ${
                    watchedImageUrl === preset.url
                      ? "border-primary-600 ring-2 ring-primary-100"
                      : "border-neutral-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-8 object-cover rounded bg-neutral-100"
                  />
                  <span className="text-[9px] font-bold text-neutral-700 truncate w-full">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:outline-none"
            />
            <label htmlFor="isActive" className="text-[13px] font-semibold text-neutral-700 cursor-pointer">
              Mark Category as Active
            </label>
          </div>

          {/* Footer Actions */}
          <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-end gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-[13px] font-semibold transition-all"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold text-[13px] px-5 py-2 rounded-md flex items-center justify-center shadow-button-primary transition-all min-w-[90px]"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
