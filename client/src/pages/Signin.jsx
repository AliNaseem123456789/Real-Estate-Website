import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import { FaGoogle } from 'react-icons/fa';
import OAuth from '../components/OAuth';

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signInFailure(data.message));
        return;
      }
      dispatch(signInSuccess(data));
      navigate('/');
    } catch (err) {
      dispatch(signInFailure(err.message));
    }
  };

  const animatedLines = [
    "Welcome Back!",
    "Your Property Hub",
    "Connect & Manage Easily"
  ];

  const [currentLine, setCurrentLine] = useState(0);
  const [showLine, setShowLine] = useState(false);

  useEffect(() => {
    setShowLine(true);
    const interval = setInterval(() => {
      setShowLine(false);
      setTimeout(() => {
        setCurrentLine((prev) => (prev + 1) % animatedLines.length);
        setShowLine(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      
      {/* Left Animated Section */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center relative overflow-hidden p-12">
        <div className="text-center">
          {animatedLines.map((line, index) => (
            <h1
              key={index}
              className={`text-5xl font-extrabold text-white mb-6 transition-all duration-1000 ${
                index === currentLine
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-5 absolute'
              }`}
            >
              {line}
            </h1>
          ))}
        </div>

        {/* Abstract shapes */}
        <span className="absolute w-32 h-32 bg-purple-700 rounded-full mix-blend-multiply opacity-20 animate-pulse -top-16 -left-16"></span>
        <span className="absolute w-48 h-48 bg-red-600 rounded-full mix-blend-multiply opacity-20 animate-pulse -bottom-24 -right-24"></span>
      </div>

      {/* Right Form Section */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 space-y-6 animate-fadeIn">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email input */}
            <div>
              <label htmlFor="email" className="text-gray-700 font-medium mb-1 block">
                Email
              </label>
              <input
                type="email"
                id="email"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
              />
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="text-gray-700 font-medium mb-1 block">
                Password
              </label>
              <input
                type="password"
                id="password"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-white text-red-600 font-semibold py-3 rounded-xl shadow-md border border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 disabled:opacity-70"
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-2 text-gray-400 my-3">
            <span className="flex-1 border-b border-gray-300"></span>
            <span className="text-sm">OR</span>
            <span className="flex-1 border-b border-gray-300"></span>
          </div>

          {/* OAuth buttons */}
          <div className="flex justify-center gap-4">
            <button className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-xl py-2 hover:bg-red-600 hover:text-white transition-all duration-300">
              <FaGoogle /> Sign in with Google
            </button>
            <OAuth />
          </div>

          <div className="text-center text-gray-600 mt-4">
            <p>
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-red-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
