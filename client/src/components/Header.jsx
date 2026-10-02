import { useState } from "react";
import {
  FaHome,
  FaShoppingCart,
  FaStore,
  FaTag,
  FaInfoCircle,
  FaEnvelope,
  FaUser,
  FaBars,
  FaTimes,
  FaHeart,
  FaCalculator,
  FaBalanceScale,
  FaListAlt,
  FaUserShield,
  FaMapMarkedAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import NotificationBell from "./NotificationBell";
import { useLanguage } from "../i18n";

function ProfileLink({ currentUser, onClick, t }) {
  return (
    <Link to="/profile" onClick={onClick} className="flex flex-col items-center gap-1">
      {currentUser ? (
        <img className="rounded-full h-8 w-8 object-cover border-2 border-white" src={currentUser.avatar} alt="profile" />
      ) : (
        <span className="flex items-center gap-1 text-slate-100 hover:underline">
          <FaUser /> {t("signIn")}
        </span>
      )}
    </Link>
  );
}

function LanguageToggle({ className = "" }) {
  const { lang, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      className={`px-2 py-1 rounded-md border border-white/60 text-white text-sm hover:bg-white/10 ${className}`}
      aria-label="Change language"
    >
      {lang === "en" ? "اردو" : "English"}
    </button>
  );
}

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  // "sell" listings are the ones a visitor can buy
  const navItems = [
    { name: t("home"), icon: <FaHome />, link: "/" },
    { name: t("buy"), icon: <FaShoppingCart />, link: "/properties?action=sell" },
    { name: t("rent"), icon: <FaStore />, link: "/properties?action=rent" },
    { name: t("sell"), icon: <FaTag />, link: "/sell" },
    { name: t("priceMap"), icon: <FaMapMarkedAlt />, link: "/market" },
    { name: t("tools"), icon: <FaCalculator />, link: "/tools" },
    { name: t("about"), icon: <FaInfoCircle />, link: "/about" },
  ];

  const sidebarItems = [
    ...(currentUser
      ? [
          { name: t("dashboard"), icon: <FaListAlt />, link: "/dashboard" },
          { name: t("favorites"), icon: <FaHeart />, link: "/favorites" },
        ]
      : []),
    { name: t("priceMap"), icon: <FaMapMarkedAlt />, link: "/market" },
    { name: t("compare"), icon: <FaBalanceScale />, link: "/compare" },
    { name: t("tools"), icon: <FaCalculator />, link: "/tools" },
    { name: t("about"), icon: <FaInfoCircle />, link: "/about" },
    { name: t("contact"), icon: <FaEnvelope />, link: "/contact" },
    ...(currentUser?.role === "admin" ? [{ name: t("admin"), icon: <FaUserShield />, link: "/admin" }] : []),
  ];

  return (
    <>
      <header className="bg-gradient-to-r from-indigo-600 to-red-500 px-4 sticky top-0 z-30">
        <div className="flex justify-between items-center max-w-7xl mx-auto py-3 gap-4">
          {/* Hamburger (mobile) */}
          <button className="lg:hidden text-white text-2xl" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Open menu">
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Logo */}
          <Link to="/" className="lg:me-4">
            <h1 className="font-bold text-sm sm:text-xl flex items-center" dir="ltr">
              <span className="text-white">Profit</span>
              <span className="text-black ms-1">Builders</span>
            </h1>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex flex-1 justify-center gap-6 items-center">
            {navItems.map((item) => (
              <li key={item.link}>
                <Link to={item.link} className="flex items-center text-white gap-1 hover:text-gray-200">
                  {item.icon} {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden sm:block" />
            {currentUser && (
              <>
                {currentUser.role === "admin" && (
                  <Link to="/admin" className="hidden lg:block text-white text-xl" title={t("admin")}>
                    <FaUserShield />
                  </Link>
                )}
                <Link to="/dashboard" className="hidden lg:block text-white text-xl" title={t("dashboard")}>
                  <FaListAlt />
                </Link>
                <Link to="/favorites" className="hidden sm:block text-white text-xl" title={t("favorites")}>
                  <FaHeart />
                </Link>
                <NotificationBell />
              </>
            )}
            <ProfileLink currentUser={currentUser} t={t} />
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 start-0 h-full w-56 bg-gradient-to-b from-indigo-600 to-red-500 text-white flex flex-col gap-6 p-4 lg:hidden z-40 transform transition-transform duration-300 overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        }`}
      >
        <button className="text-white text-2xl self-end" onClick={closeSidebar} aria-label="Close menu">
          <FaTimes />
        </button>
        <div className="flex flex-col gap-5">
          {sidebarItems.map((item) => (
            <Link key={item.link} to={item.link} onClick={closeSidebar} className="flex items-center gap-3">
              {item.icon} {item.name}
            </Link>
          ))}
        </div>
        <LanguageToggle className="self-start" />
      </aside>

      {/* Mobile bottom bar: Home, Buy, Rent, Sell */}
      <nav className="fixed bottom-0 start-0 w-full bg-white shadow-inner flex justify-around py-2 md:hidden z-20">
        {navItems.slice(0, 4).map((item) => (
          <Link key={item.link} to={item.link}>
            <div className="flex flex-col items-center text-gray-600 hover:text-indigo-600 text-sm">
              {item.icon} {item.name}
            </div>
          </Link>
        ))}
      </nav>
    </>
  );
}
