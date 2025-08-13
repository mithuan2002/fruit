import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-2">Page Not Found</h2>
          <p className="text-gray-600 mt-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="space-y-4">
          <Link href="/dashboard">
            <a 
              data-testid="link-dashboard"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </a>
          </Link>
          <div className="text-sm text-gray-500">
            <Link href="/">
              <a data-testid="link-home" className="hover:text-gray-700">
                Return to Home
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}