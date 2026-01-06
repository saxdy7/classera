import { Home, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
          <Link href="/dashboard/student">
            <Button variant="outline" className="w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Illustration */}
        <div className="mt-12">
          <svg
            className="w-full max-w-sm mx-auto opacity-50"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="150" r="100" fill="#E9D5FF" />
            <path
              d="M150 130 Q170 110, 190 130"
              stroke="#7C3AED"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M210 130 Q230 110, 250 130"
              stroke="#7C3AED"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M160 180 Q200 200, 240 180"
              stroke="#7C3AED"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
