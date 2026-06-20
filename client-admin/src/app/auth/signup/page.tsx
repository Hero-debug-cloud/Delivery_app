import { SignupForm } from '@/features/auth/components/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account — LogiRoute Ops',
  description: 'Create a new admin account on LogiRoute',
};

export default function SignupPage() {
  return <SignupForm />;
}
