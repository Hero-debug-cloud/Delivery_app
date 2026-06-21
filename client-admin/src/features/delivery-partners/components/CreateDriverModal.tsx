import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useStores } from "@/features/products/hooks/useProducts";
import type { CreateDriverInput } from "../types";

const createDriverFormSchema = z.object({
  name: z.string().min(1, "Full name is required").max(100),
  phone: z.string().min(6, "Valid phone number is required (min 6 digits)"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  storeId: z.string().uuid("Invalid store selected").optional().or(z.literal("")),
  vehicleType: z.enum(["motorcycle", "bicycle", "car", "van"]).default("motorcycle"),
  vehicleNumber: z.string().optional().or(z.literal("")),
});

type CreateDriverFormValues = z.infer<typeof createDriverFormSchema>;

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateDriverInput) => Promise<void>;
  isCreating: boolean;
}

export function CreateDriverModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreateDriverModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { stores, isLoading: isLoadingStores } = useStores();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDriverFormValues>({
    resolver: zodResolver(createDriverFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      storeId: "",
      vehicleType: "motorcycle",
      vehicleNumber: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        phone: "",
        email: "",
        storeId: "",
        vehicleType: "motorcycle",
        vehicleNumber: "",
      });
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: CreateDriverFormValues) => {
    try {
      setSubmitError(null);
      // Clean up values for payload
      const cleanedData: CreateDriverInput = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() || null,
        storeId: values.storeId || null,
        vehicleType: values.vehicleType,
        vehicleNumber: values.vehicleNumber?.trim() || null,
      };
      await onCreate(cleanedData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to create driver. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-neutral-200 rounded-md shadow-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-[18px] font-bold text-neutral-900">
              Add New Delivery Partner
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Manually register a driver. They can then log in using phone OTP.
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4.5">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] font-medium animate-fade-in">
              {submitError}
            </div>
          )}

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Driver Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
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

          {/* Phone Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Phone Number (with country code)</label>
            <input
              type="text"
              placeholder="e.g. +919876543210"
              {...register("phone")}
              className={`px-3 py-2 border rounded-md text-[14px] bg-white focus:outline-none transition-all ${
                errors.phone
                  ? "border-red-300 focus:border-red-500"
                  : "border-neutral-200 focus:border-primary-600"
              }`}
            />
            {errors.phone && (
              <span className="text-[11px] font-medium text-red-500">{errors.phone.message}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. johndoe@gmail.com"
              {...register("email")}
              className={`px-3 py-2 border rounded-md text-[14px] bg-white focus:outline-none transition-all ${
                errors.email
                  ? "border-red-300 focus:border-red-500"
                  : "border-neutral-200 focus:border-primary-600"
              }`}
            />
            {errors.email && (
              <span className="text-[11px] font-medium text-red-500">{errors.email.message}</span>
            )}
          </div>

          {/* Assigned Store Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-neutral-700">Assign Default Store (Optional)</label>
            <select
              {...register("storeId")}
              className={`px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all ${
                errors.storeId ? "border-red-300" : ""
              }`}
              disabled={isLoadingStores}
            >
              <option value="">No Store Assigned</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            {errors.storeId && (
              <span className="text-[11px] font-medium text-red-500">{errors.storeId.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Vehicle Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Vehicle Type</label>
              <select
                {...register("vehicleType")}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              >
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>

            {/* Vehicle Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Plate Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. KA03EX1234"
                {...register("vehicleNumber")}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-primary-600 transition-all uppercase"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-end gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-[13px] font-semibold transition-all cursor-pointer"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold text-[13px] px-5 py-2 rounded-md flex items-center justify-center shadow-button-primary transition-all min-w-[90px] cursor-pointer"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
