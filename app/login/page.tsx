import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginForm } from './login-form';

function LoginLoadingFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
