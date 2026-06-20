import type { AuthUser, LoginFormValues, SignupFormValues } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
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
