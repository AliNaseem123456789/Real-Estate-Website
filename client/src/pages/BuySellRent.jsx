import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaPlusCircle, FaEnvelope } from 'react-icons/fa';

export default function BuySellRent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center justify-center px-4 py-12">
      
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-12 text-center">
        Welcome to <span className="text-blue-600">Real Estate Portal</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <Link to="/action">
          <div className="flex flex-col items-center justify-center w-64 h-40 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer">
            <FaHome className="text-4xl mb-3" />
            <span className="text-lg font-semibold text-center">Buy, Sell & Rent</span>
          </div>
        </Link>

        <Link to="/input">
          <div className="flex flex-col items-center justify-center w-64 h-40 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer">
            <FaPlusCircle className="text-4xl mb-3" />
            <span className="text-lg font-semibold text-center">Enter Your Property</span>
          </div>
        </Link>

        <Link to="/ContactForm">
          <div className="flex flex-col items-center justify-center w-64 h-40 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer">
            <FaEnvelope className="text-4xl mb-3" />
            <span className="text-lg font-semibold text-center">Contact Us</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
