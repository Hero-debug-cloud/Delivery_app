import { z } from "zod";

export const onboardDriverSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  vehicleType: z.enum(["motorcycle", "bicycle", "car", "van"]),
  vehicleNumber: z.string().min(1, "Vehicle plate number is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  licenseFrontUrl: z.string().min(1, "License front image is required"),
  licenseBackUrl: z.string().min(1, "License back image is required"),
  vehiclePlateImage: z.string().min(1, "Vehicle plate image is required"),
  identityProofType: z.string().min(1, "Identity proof type is required"),
  identityProofNumber: z.string().min(1, "Identity proof number is required"),
  identityProofImage: z.string().min(1, "Identity proof image is required"),
  profilePictureUrl: z.string().min(1, "Profile picture is required"),
});

export const rejectDriverSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(500),
});

export type OnboardDriverInput = z.infer<typeof onboardDriverSchema>;
export type RejectDriverInput = z.infer<typeof rejectDriverSchema>;

export interface GetDriversFilters {
  onboardingStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}
