export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'super_admin' | 'store_manager' | 'dispatcher' | 'delivery_partner' | 'customer';
  isActive: boolean;
  storeId?: string | null;
}

export interface LoginFormValues {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileFormValues {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}
