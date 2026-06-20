import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiLogin } from '../api';
import { useAuthStore } from '../store';
import type { LoginFormValues } from '../types';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  const mutation = useMutation({
    mutationFn: apiLogin,
    onSuccess: (data) => {
      setUser(data.user);
      router.push('/dashboard');
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return {
    form,
    onSubmit,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
