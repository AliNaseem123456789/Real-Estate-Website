import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Real Estate Portal</h3>
          <p className="text-gray-400">
            Helping you find your dream home with ease. Modern, luxurious, and reliable.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-red-500 transition">Home</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-red-500 transition">About</Link>
            </li>
            <li>
              <Link to="/search" className="hover:text-red-500 transition">Listings</Link>
            </li>
            <li>
              <Link to="/ContactForm" className="hover:text-red-500 transition">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-20 text-white">Contact</h3>
          <p className="text-gray-400 mb-2">123 Main Street, City, Country</p>
          <p className="text-gray-400 mb-2">email@example.com</p>
          <p className="text-gray-400">+123 456 7890</p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="hover:text-red-500 transition">Facebook</a>
            <a href="#" className="hover:text-red-500 transition">Twitter</a>
            <a href="#" className="hover:text-red-500 transition">Instagram</a>
          </div>
        </div>

      </div>

      <div className="border-t border-gray-800 mt-8 py-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Real Estate Portal. All rights reserved.
      </div>
    </footer>
  );
}
