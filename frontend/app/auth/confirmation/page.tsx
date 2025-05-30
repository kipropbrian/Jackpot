import Link from 'next/link';

export const metadata = {
  title: 'Registration Confirmation - Gambling Awareness App',
  description: 'Registration confirmation page',
};

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Check Your Email</h1>
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <div className="text-6xl mb-4">✉️</div>
            <p className="text-lg mb-4">
              We&apos;ve sent a confirmation link to your email address.
            </p>
            <p className="text-gray-600 mb-6">
              Please check your inbox and click the link to confirm your account.
            </p>
            <div className="mt-8">
              <Link
                href="/auth/login"
                className="inline-block px-5 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
