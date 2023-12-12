// components/Hero.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const heroData = [
  {
    image: 'https://wallpapercave.com/wp/wp4110663.jpg',
    title: 'Find your next heaven place',
    subtitle: 'Profit builders provide a variety of homes.',
  },
  {
    image: 'https://images.unsplash.com/photo-1560185127-6f6a992f0e37?&w=1600',
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
    <div className="relative w-full h-screen overflow-hidden">
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

      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 text-white">
        <h1
          className={`text-4xl sm:text-6xl font-bold mb-4 transition-opacity duration-1000 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
          }`}
        >
          {heroData[current].title}
        </h1>
        <p
          className={`mb-6 text-sm sm:text-base text-gray-200 transition-opacity duration-1000 delay-300 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
          }`}
        >
          {heroData[current].subtitle}
        </p>
        <Link
          to="/about"
          className={`inline-block px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-opacity duration-1000 delay-500 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
          }`}
        >
          Let's find...
        </Link>
      </div>
    </div>
  );
}
