import { useState } from "react";
import { FaHome, FaShoppingCart, FaStore, FaTag, FaInfoCircle, FaUser, FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCardClick = (actionType) => {
    if (actionType === "input") {
      navigate("/input");
    } else {
      navigate(`/actions?action=${actionType}`);
    }
  };

  const navItems = [
    { name: "Home", icon: <FaHome />, link: "/" },
    { name: "Buy", icon: <FaShoppingCart />, link: "/actions?action=sell" },
    { name: "Rent", icon: <FaStore />, link: "/actions?action=rent" },
    { name: "Sell", icon: <FaTag />, link: "/input" },
    { name: "About", icon: <FaInfoCircle />, link: "/about" },
  ];

  return (
    <>
      {/* Header */}
      <header className="box-decoration-slice bg-gradient-to-r from-indigo-600 to-red-500 px-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto p-3">
          {/* Hamburger for mobile */}
          <button
            className="md:hidden text-white text-2xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Logo */}
          <Link to="/" className="mx-auto md:mx-0">
            <h1 className="font-bold text-sm sm:text-xl flex flex-wrap items-center justify-center">
              <span className="text-white">Profit</span>
              <span className="box-decoration-slice bg-gradient-to-r from-indigo-600 to-red-500 text-black ml-1">
                Builders
              </span>
            </h1>
          </Link>

          {/* Desktop Centered Nav */}
          <ul className="hidden sm:flex flex-1 justify-center gap-8 items-center">
            {navItems.map((item, idx) => (
              <Link key={idx} to={item.link}>
                <li className="flex items-center text-white font-mono gap-1 hover:text-gray-200">
                  {item.icon} {item.name}
                </li>
              </Link>
            ))}
          </ul>
          
          {/* Desktop Profile / Sign-in */}
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/profile">
              {currentUser ? (
                <img className="rounded-full h-7 w-7 object-cover" src={currentUser.avatar} alt="profile" />
              ) : (
                <div className="flex items-center text-slate-100 hover:underline gap-1">
                  <FaUser /> Sign in
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-48 bg-gradient-to-b from-indigo-600 to-red-500 text-white flex flex-col justify-between p-3 md:hidden z-30 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button inside sidebar */}
        <button
          className="text-white text-2xl self-end mb-4"
          onClick={() => setSidebarOpen(false)}
        >
          <FaTimes />
        </button>

        <div className="flex flex-col gap-6 mt-4">
          <Link to="/" onClick={() => setSidebarOpen(false)}>
            <div className="flex flex-col items-center gap-1">
              <FaHome /> Home
            </div>
          </Link>
          <Link to="/about" onClick={() => setSidebarOpen(false)}>
            <div className="flex flex-col items-center gap-1">
              <FaInfoCircle /> About
            </div>
          </Link>
        </div>

        <Link to="/profile" onClick={() => setSidebarOpen(false)}>
          <div className="flex flex-col items-center gap-1">
            {currentUser ? (
              <img className="rounded-full h-7 w-7 object-cover" src={currentUser.avatar} alt="profile" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <FaUser /> Sign in
              </div>
            )}
          </div>
        </Link>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-inner flex justify-around py-2 md:hidden z-20">
        <Link to="/">
          <div className="flex flex-col items-center text-gray-600 hover:text-indigo-600">
            <FaHome /> Home
          </div>
        </Link>
        <Link to="/actions?action=sell">
          <div className="flex flex-col items-center text-gray-600 hover:text-indigo-600">
            <FaShoppingCart /> Buy
          </div>
        </Link>
        <Link to="/actions?action=rent">
          <div className="flex flex-col items-center text-gray-600 hover:text-indigo-600">
            <FaStore /> Rent
          </div>
        </Link>
        <Link to="/input">
          <div className="flex flex-col items-center text-gray-600 hover:text-indigo-600">
            <FaTag /> Sell
          </div>
        </Link>
      </nav>
    </>
  );
}
