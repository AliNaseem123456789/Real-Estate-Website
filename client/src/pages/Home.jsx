// pages/Home.jsx
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import Testimonials from '../components/Landing/Testimonials';
import Pricing from '../components/Landing/Pricing';

import CTA from '../components/Landing/CTA';
import Stats from '../components/Landing/Stats';
import HomeRecommendations from '../components/Landing/HomeRecommendations';
import FeaturedListings from '../components/Landing/FeaturedListing';

export default function Home() {
  return (
    <div className="font-sans text-gray-800">
      <Hero />
      <Features />
       <FeaturedListings/>
      <Testimonials />
     <HomeRecommendations/>
      {/* <Pricing /> */}
      <CTA/>
      <Stats/>
      
    </div>
  );
}
