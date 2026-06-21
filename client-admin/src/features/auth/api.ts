import type { AuthUser, LoginFormValues, SignupFormValues, UpdateProfileFormValues } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data?.error === 'VALIDATION_ERROR' && data?.details?.fieldErrors) {
      const fieldErrors = data.details.fieldErrors;
      const messages = Object.entries(fieldErrors)
        .map(([field, msgs]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          return `${fieldName}: ${(msgs as string[]).join(', ')}`;
        })
        .join('; ');
      throw new Error(`Validation Error — ${messages}`);
    }
    throw new Error(data?.error ?? 'Request failed');
  }
  return data as T;
}

export async function apiLogin(values: LoginFormValues): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      identifier: values.identifier,
      password: values.password,
      rememberMe: values.rememberMe,
    }),
  });
  return handleResponse<{ user: AuthUser }>(res);
}

export async function apiSignup(values: SignupFormValues): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API}/auth/admin/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: values.name,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    }),
  });
  return handleResponse<{ user: AuthUser }>(res);
}

export async function apiGetMe(): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse<{ user: AuthUser }>(res);
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function apiUpdateProfile(values: UpdateProfileFormValues): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(values),
  });
  return handleResponse<{ user: AuthUser }>(res);
}
