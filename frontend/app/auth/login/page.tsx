import LoginForm from '@/components/auth/login-form';

export const metadata = {
  title: 'Login - Gambling Awareness App',
  description: 'Log in to your account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Gambling Awareness</h1>
          <p className="mt-2 text-sm text-gray-600">
            Understand the real odds of winning jackpots
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
