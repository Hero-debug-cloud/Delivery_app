import { z } from "zod";

export const adminLoginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional().default(false),
});

export const adminSignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8),
  role: z.enum(["super_admin", "store_manager", "dispatcher"]).optional().default("dispatcher"),
}).refine((d) => d.email || d.phone, {
  message: "Email or phone is required",
  path: ["email"],
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const otpRequestSchema = z.object({
  phone: z.string().min(6, "Valid phone number required"),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(6),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminSignupInput = z.infer<typeof adminSignupSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  driverProfile?: any;
}

export interface AuthResult {
  user: AuthUser;
  sessionId: string;
}
