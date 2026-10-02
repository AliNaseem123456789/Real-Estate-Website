import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl mb-4">🏚️</p>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Page not found</h1>
      <p className="text-gray-600 mb-6">
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
      >
        Back to home
      </Link>
    </div>
  );
}
