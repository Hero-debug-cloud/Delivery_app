import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiSignup } from '../api';
import { useAuthStore } from '../store';
import type { SignupFormValues } from '../types';

const signupSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function useSignup() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: apiSignup,
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
