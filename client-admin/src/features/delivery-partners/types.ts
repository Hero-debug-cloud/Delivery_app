export interface DeliveryPartner {
  id: string;
  userId: string;
  storeId: string | null;
  vehicleType: "motorcycle" | "bicycle" | "car" | "van" | null;
  vehicleNumber: string | null;
  status: "online" | "offline" | "busy";
  onboardingStatus: "pending" | "submitted" | "approved" | "rejected";
  rejectionReason: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  licenseFrontUrl: string | null;
  licenseBackUrl: string | null;
  vehiclePlateImage: string | null;
  identityProofType: string | null;
  identityProofNumber: string | null;
  identityProofImage: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
  createdAt: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface GetDriversParams {
  onboardingStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}
