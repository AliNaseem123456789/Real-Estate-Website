import Hero from "../components/Landing/Hero";
import Features from "../components/Landing/Features";
import FeaturedListings from "../components/Landing/FeaturedListings";
import Testimonials from "../components/Landing/Testimonials";
import HomeRecommendations from "../components/Landing/HomeRecommendations";
import CTA from "../components/Landing/CTA";
import Stats from "../components/Landing/Stats";
import RecentlyViewed from "../components/RecentlyViewed";

export default function Home() {
  return (
    <div className="font-sans text-gray-800">
      <Hero />
      <Features />
      <FeaturedListings />
      <RecentlyViewed />
      <Testimonials />
      <HomeRecommendations />
      <CTA />
      <Stats />
    </div>
  );
}
