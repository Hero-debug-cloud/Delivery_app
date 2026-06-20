import { LoginForm } from '@/features/auth/components/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — LogiRoute Ops',
  description: 'Sign in to the LogiRoute admin control panel',
};

export default function LoginPage() {
  return <LoginForm />;
}
