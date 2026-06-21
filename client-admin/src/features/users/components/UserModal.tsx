import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, User as UserIcon, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import type { User } from "../types";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format").or(z.literal("")).transform(v => v === "" ? null : v),
  phone: z.string().or(z.literal("")).transform(v => v === "" ? null : v),
  role: z.enum(["super_admin", "store_manager", "dispatcher", "delivery_partner", "customer"]),
  isActive: z.boolean().default(true),
  password: z.string().or(z.literal("")).transform(v => v === "" ? null : v),
});

type UserFormValues = z.input<typeof userFormSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  user?: any | null;
  isSaving: boolean;
  fixedRole?: "customer" | "delivery_partner" | "staff";
  isSelf?: boolean;
}

export function UserModal({ isOpen, onClose, onSave, user, isSaving, fixedRole, isSelf = false }: UserModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getDefaultRole = () => {
    if (fixedRole === "customer") return "customer";
    if (fixedRole === "delivery_partner") return "delivery_partner";
    if (fixedRole === "staff") return "store_manager";
    return "customer";
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: getDefaultRole(),
      isActive: true,
      password: "",
    },
  });

  const watchedRole = watch("role");
  const watchedIsActive = watch("isActive");

  // Show password fields only for administrative users
  const isWebAdminRole = ["super_admin", "store_manager", "dispatcher"].includes(watchedRole);

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setShowPassword(false);
      
      if (user) {
        reset({
          name: user.name,
          email: user.email ?? "",
          phone: user.phone ?? "",
          role: user.role,
          isActive: user.isActive,
          password: "", // Password is always blank on load for edit
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          role: getDefaultRole(),
          isActive: true,
          password: "",
        });
      }
    }
  }, [user, reset, isOpen, fixedRole]);

  const onSubmit = async (values: any) => {
    // Override/enforce fixed role on submission if set
    const finalRole = fixedRole === "customer" 
      ? "customer" 
      : fixedRole === "delivery_partner" 
        ? "delivery_partner" 
        : values.role;

    // Validate password presence for new admin users
    if (!user && !isSelf && ["super_admin", "store_manager", "dispatcher"].includes(finalRole)) {
      if (!values.password || values.password.length < 6) {
        setSubmitError("Password is required and must be at least 6 characters for administrative roles.");
        return;
      }
    }

    try {
      setSubmitError(null);
      
      let payload: any;
      if (isSelf) {
        payload = {
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
        };
        if (values.password && values.password.trim() !== "") {
          payload.password = values.password;
        }
      } else {
        // Clean values
        payload = { ...values, role: finalRole };
        
        const isRoleAdmin = ["super_admin", "store_manager", "dispatcher"].includes(finalRole);
        if (!isRoleAdmin || !payload.password) {
          delete payload.password;
        }
      }
      
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save user details.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-neutral-200 rounded-md shadow-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-[18px] font-bold text-neutral-900">
              {isSelf ? "Edit Your Profile" : user ? "Edit User Account" : "Create New User"}
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {isSelf ? "Update your personal details and security credentials." : user ? "Modify account profile and access credentials." : "Register a new account credentials and role settings."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition-all p-1.5 hover:bg-neutral-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-neutral-50/30">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] font-semibold">
              {submitError}
            </div>
          )}

          {/* Profile Details */}
          <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm flex flex-col gap-4">
            <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-2">
              <UserIcon size={14} className="text-primary-600" />
              <span>User Identity</span>
            </h3>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-neutral-600">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                {...register("name")}
                className={`px-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                  errors.name ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                }`}
              />
              {errors.name && <span className="text-[11px] font-medium text-red-500">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-neutral-600">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  {...register("email")}
                  className={`w-full pl-9 pr-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                    errors.email ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                  }`}
                />
              </div>
              {errors.email && <span className="text-[11px] font-medium text-red-500">{errors.email.message}</span>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-neutral-600">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  {...register("phone")}
                  className={`w-full pl-9 pr-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                    errors.phone ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                  }`}
                />
              </div>
              {errors.phone && <span className="text-[11px] font-medium text-red-500">{errors.phone.message}</span>}
            </div>
          </div>

          {/* Role and Permissions */}
          {(!fixedRole || fixedRole === "staff" || isSelf) && (
            <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                <span>{isSelf ? "🔑 Security Credentials" : "🔑 Role & Authentication"}</span>
              </h3>

              {/* Role Select */}
              {!isSelf && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-neutral-600">Account Role *</label>
                  <select
                    {...register("role")}
                    disabled={!!user} // Role is locked after creation to preserve system references
                    className="px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-700 cursor-pointer"
                  >
                    {fixedRole === "staff" ? (
                      <>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="store_manager">Store Manager</option>
                        <option value="super_admin">Super Admin</option>
                      </>
                    ) : (
                      <>
                        <option value="customer">Customer</option>
                        <option value="delivery_partner">Driver (Delivery Partner)</option>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="store_manager">Store Manager</option>
                        <option value="super_admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  {user && <span className="text-[10px] text-neutral-400 italic">Role changes are restricted for safety reasons.</span>}
                </div>
              )}

              {/* Password Field (Only shown for administrative web users) */}
              {(isWebAdminRole || isSelf) && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-neutral-600">
                    {user || isSelf ? "Reset Password" : "Password *"}
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-neutral-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={user || isSelf ? "Leave blank to keep current" : "Minimum 6 characters"}
                      {...register("password")}
                      className="w-full pl-9 pr-10 py-2 border border-neutral-200 rounded-md text-[13px] focus:outline-none focus:border-primary-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 transition-all"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <span className="text-[11px] font-medium text-red-500">{errors.password.message}</span>}
                </div>
              )}
            </div>
          )}

          {/* Status Toggle Card */}
          {!isSelf && (
            <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-neutral-700">Account Status</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Inactive users cannot log into the platform.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={watchedIsActive}
                  onChange={(e) => setValue("isActive", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 bg-white mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-[13px] font-semibold transition-all cursor-pointer"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold text-[13px] px-5 py-2 rounded-md shadow-button-primary transition-all min-w-[90px] cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center gap-1.5 justify-center">
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving...</span>
                </div>
              ) : isSelf ? (
                "Save Profile"
              ) : user ? (
                "Update User"
              ) : (
                "Save User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
