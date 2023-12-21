// components/Hero.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import a from "../../assets/a.jpeg";

const heroData = [
  {
    image: 'https://wallpapercave.com/wp/wp4110663.jpg',
    title: 'Find your next heaven place',
    subtitle: 'Profit builders provide a variety of homes.',
  },
  {
    image: a,
    title: 'Luxury made simple',
    subtitle: 'Discover properties that fit your lifestyle.',
  },
  {
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?&w=1600',
    title: 'Your dream home awaits',
    subtitle: 'Modern, elegant, and ready for you.',
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    setShowText(true);
    const interval = setInterval(() => {
      setShowText(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % heroData.length);
        setShowText(true);
      }, 500);
    }, 7000); // Change every 7s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-[80vh] sm:h-screen overflow-hidden">
      {/* Slides */}
      {heroData.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          style={{
            background: `url(${slide.image}) center/cover no-repeat`,
          }}
        ></div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Text */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 md:px-10 text-white">
        <h1
          className={`text-3xl sm:text-4xl md:text-6xl font-bold mb-4 transition-opacity duration-1000 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
          }`}
        >
          {heroData[current].title}
        </h1>
        <p
          className={`mb-6 text-sm sm:text-base md:text-lg text-gray-200 transition-opacity duration-1000 delay-300 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
          }`}
        >
          {heroData[current].subtitle}
        </p>
        <Link
          to="/about"
          className={`inline-block px-5 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-opacity duration-1000 delay-500 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
          }`}
        >
          Let's find...
        </Link>
      </div>
    </div>
  );
}
