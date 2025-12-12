// components/CTA.jsx
import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center bg-gray-900 text-white rounded-xl shadow-lg">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        Ready to find your dream home?
      </h2>
      <p className="mb-6 text-gray-300 text-lg">
        Join thousands of satisfied clients who found their perfect property with us.
      </p>
      <Link
        to="/search"
        className="px-8 py-4 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition"
      >
        Get Started
      </Link>
    </div>
  );
}
