import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { MultiImageUploadField } from "@/features/upload/components/MultiImageUploadField";
import { InfiniteSelect } from "@/components/shared/InfiniteSelect";
import { useInfiniteCategories, useInfiniteStores } from "../hooks/useProducts";
import type { Product } from "../types";

const productFormSchema = z.object({
  storeId: z.string().uuid("Please select a store hub"),
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().optional().nullable(),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }).nonnegative("Price must be positive"),
  unitSize: z.string().min(1, "Unit size is required (e.g., 500 g, 1 kg, 1 unit)"),
  categoryId: z.string().uuid("Please select a category").optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  brand: z.string().optional().nullable(),
  shelfLife: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  ingredients: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isVeg: z.boolean().default(true),
  inStock: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  product?: Product | null;
  isSaving: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  isSaving,
}: ProductModalProps) {
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use infinite scrolling hooks instead of static fetchers
  const {
    items: infiniteStores,
    isLoading: isLoadingStores,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasNextStores,
    isFetchingNextPage: isFetchingNextStores,
  } = useInfiniteStores();

  const {
    items: infiniteCategories,
    isLoading: isLoadingCategories,
    fetchNextPage: fetchNextCategories,
    hasNextPage: hasNextCategories,
    isFetchingNextPage: isFetchingNextCategories,
  } = useInfiniteCategories({ isActive: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      storeId: "",
      name: "",
      description: "",
      price: 0,
      unitSize: "",
      categoryId: "",
      imageUrl: "",
      images: [],
      brand: "",
      shelfLife: "",
      origin: "",
      ingredients: "",
      isFeatured: false,
      isVeg: true,
      inStock: true,
    },
  });

  const watchedImageUrl = watch("imageUrl");
  const firstStoreId = infiniteStores[0]?.id;

  useEffect(() => {
    if (product) {
      reset({
        storeId: product.storeId,
        name: product.name,
        description: product.description || "",
        price: product.price / 100, // Convert paisa to Rupees for form display
        unitSize: product.unitSize || "",
        categoryId: product.categoryId || "",
        imageUrl: product.imageUrl || "",
        images: product.images || [],
        brand: product.brand || "",
        shelfLife: product.shelfLife || "",
        origin: product.origin || "",
        ingredients: product.ingredients || "",
        isFeatured: product.isFeatured,
        isVeg: product.isVeg,
        inStock: product.inStock,
      });
      setImagesPreviews(product.images || (product.imageUrl ? [product.imageUrl] : []));
    } else {
      reset({
        storeId: firstStoreId || "",
        name: "",
        description: "",
        price: 0,
        unitSize: "",
        categoryId: "",
        imageUrl: "",
        images: [],
        brand: "",
        shelfLife: "",
        origin: "",
        ingredients: "",
        isFeatured: false,
        isVeg: true,
        inStock: true,
      });
      setImagesPreviews([]);
    }
    setSubmitError(null);
  }, [product, reset, isOpen, firstStoreId]);

  if (!isOpen) return null;

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setSubmitError(null);
      const apiPayload = {
        ...values,
        price: Math.round(values.price * 100),
        categoryId: values.categoryId || null,
        brand: values.brand || null,
        shelfLife: values.shelfLife || null,
        origin: values.origin || null,
        ingredients: values.ingredients || null,
      };
      await onSave(apiPayload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save product. Please try again.");
    }
  };

  const handleImagesChange = (keys: string[], urls: string[]) => {
    setValue("images", keys);
    setImagesPreviews(urls);
    setValue("imageUrl", keys.length > 0 ? keys[0] : "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-neutral-200 rounded-md shadow-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-[18px] font-bold text-neutral-900">
              {product ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Fill in details to list items on the customer app.
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] font-medium">
              {submitError}
            </div>
          )}

          {/* Store Selection (Infinite Scroll) */}
          <div className="flex flex-col gap-1.5">
            <Controller
              control={control}
              name="storeId"
              render={({ field }) => (
                <InfiniteSelect
                  label="Store Hub Link"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Select Store Hub --"
                  error={errors.storeId?.message}
                  items={infiniteStores}
                  fetchNextPage={fetchNextStores}
                  hasNextPage={hasNextStores}
                  isFetchingNextPage={isFetchingNextStores}
                  isLoading={isLoadingStores}
                />
              )}
            />
          </div>

          {/* Product Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Product Name</label>
            <input
              type="text"
              placeholder="e.g. Fresh Red Apples"
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

          {/* Grid for Price and Unit Size */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price (INR Decimal) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Price (in ₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-400 text-[14px]">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price")}
                  className={`pl-7 pr-3 py-2 border rounded-md w-full text-[14px] bg-white focus:outline-none transition-all ${
                    errors.price
                      ? "border-red-300 focus:border-red-500"
                      : "border-neutral-200 focus:border-primary-600"
                  }`}
                />
              </div>
              {errors.price && (
                <span className="text-[11px] font-medium text-red-500">{errors.price.message}</span>
              )}
            </div>

            {/* Unit Size */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Unit Size / Pack</label>
              <input
                type="text"
                placeholder="e.g. 500 g, 1 kg, 6 pcs"
                {...register("unitSize")}
                className={`px-3 py-2 border rounded-md w-full text-[14px] bg-white focus:outline-none transition-all ${
                  errors.unitSize
                    ? "border-red-300 focus:border-red-500"
                    : "border-neutral-200 focus:border-primary-600"
                }`}
              />
              {errors.unitSize && (
                <span className="text-[11px] font-medium text-red-500">{errors.unitSize.message}</span>
              )}
            </div>
          </div>

          {/* Category Dropdown (Infinite Scroll) */}
          <div className="flex flex-col gap-1.5">
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <InfiniteSelect
                  label="Product Category"
                  value={field.value || ""}
                  onChange={(val) => field.onChange(val || null)}
                  placeholder="Uncategorized"
                  error={errors.categoryId?.message}
                  items={infiniteCategories}
                  fetchNextPage={fetchNextCategories}
                  hasNextPage={hasNextCategories}
                  isFetchingNextPage={isFetchingNextCategories}
                  isLoading={isLoadingCategories}
                />
              )}
            />
          </div>

          {/* Brand & Shelf Life */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Brand</label>
              <input
                type="text"
                placeholder="e.g. Amul, Coca-Cola"
                {...register("brand")}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Shelf Life</label>
              <input
                type="text"
                placeholder="e.g. 9 Months, 7 Days"
                {...register("shelfLife")}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
          </div>

          {/* Origin & Ingredients */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Country of Origin</label>
              <input
                type="text"
                placeholder="e.g. India, USA"
                {...register("origin")}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Ingredients</label>
              <input
                type="text"
                placeholder="e.g. Milk Fat, Salt"
                {...register("ingredients")}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Description</label>
            <textarea
              placeholder="Provide product nutritional facts, details or storage conditions..."
              rows={2}
              {...register("description")}
              className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all resize-none"
            />
          </div>

          {/* Multi Image Upload Field */}
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <MultiImageUploadField
                label="Product Images (Up to 5)"
                values={field.value || []}
                previewUrls={imagesPreviews}
                onChange={(keys, urls) => {
                  field.onChange(keys);
                  handleImagesChange(keys, urls);
                }}
                error={errors.images?.message}
              />
            )}
          />

          {/* Options grid */}
          <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-md border border-neutral-200 mt-1">
            {/* Vegetarian flag */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVeg"
                {...register("isVeg")}
                className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 focus:outline-none cursor-pointer"
              />
              <label htmlFor="isVeg" className="text-[12px] font-semibold text-neutral-700 cursor-pointer select-none">
                Veg Option 🌱
              </label>
            </div>

            {/* Featured flag */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                {...register("isFeatured")}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:outline-none cursor-pointer"
              />
              <label htmlFor="isFeatured" className="text-[12px] font-semibold text-neutral-700 cursor-pointer select-none">
                Featured Item ⭐
              </label>
            </div>

            {/* In stock flag */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inStock"
                {...register("inStock")}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:outline-none cursor-pointer"
              />
              <label htmlFor="inStock" className="text-[12px] font-semibold text-neutral-700 cursor-pointer select-none">
                In Stock ✅
              </label>
            </div>
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
              {isSaving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
