// AboutUs.jsx
import React from "react";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import {
  RocketLaunch,
  AutoAwesome,
  Public,
  Bolt,
} from "@mui/icons-material";

const AboutUs = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">
      {/* Background Glow */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]" />

      <Container maxWidth="lg" className="relative py-24">
        {/* HERO */}
        <div className="text-center max-w-3xl mx-auto mb-32">
          <Typography
            variant="h2"
            className="font-extrabold tracking-tight mb-6"
          >
            Redefining How You Discover Real Estate
          </Typography>

          <Typography className="text-gray-300 text-lg mb-10">
            A modern real estate platform built to help you buy, sell, and rent
            properties with clarity, confidence, and style.
          </Typography>

          <Button
            size="large"
            className="px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg hover:scale-105 transition"
          >
            Explore Properties
          </Button>
        </div>

        {/* FEATURE GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {[
            {
              icon: <RocketLaunch />,
              title: "Smart Listings",
              desc: "Carefully curated properties with clear details and visuals.",
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: <AutoAwesome />,
              title: "Modern Experience",
              desc: "A clean, intuitive interface designed for effortless browsing.",
              color: "from-cyan-500 to-blue-500",
            },
            {
              icon: <Bolt />,
              title: "Fast Search",
              desc: "Quick filters and smooth navigation to find the right home faster.",
              color: "from-yellow-400 to-orange-500",
            },
            {
              icon: <Public />,
              title: "City-Wide Coverage",
              desc: "Residential and commercial properties across prime locations.",
              color: "from-green-400 to-emerald-500",
            },
          ].map((item, index) => (
            <Card
              key={index}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:translate-y-[-6px] transition-all duration-300"
            >
              <CardContent className="text-center p-8">
                <div
                  className={`w-14 h-14 mx-auto mb-6 rounded-xl flex items-center justify-center bg-gradient-to-r ${item.color}`}
                >
                  {item.icon}
                </div>
                <Typography variant="h6" className="font-semibold mb-3">
                  {item.title}
                </Typography>
                <Typography className="text-gray-400 text-sm">
                  {item.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* STORY SECTION */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <Typography variant="h4" className="font-bold mb-6">
              Built for Buyers, Sellers & Investors
            </Typography>
            <Typography className="text-gray-400 leading-relaxed mb-6">
              This platform was created to simplify real estate decisions.
              Whether you’re searching for your next home, listing a property,
              or exploring investment opportunities, everything is designed to
              feel clear and reliable.
            </Typography>
            <Typography className="text-gray-400 leading-relaxed">
              No clutter. No confusion. Just properties presented the way they
              should be.
            </Typography>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-cyan-500/30 rounded-3xl blur-xl" />
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
              <Typography variant="h5" className="font-semibold mb-4">
                Our Approach
              </Typography>
              <ul className="space-y-4 text-gray-300">
                <li>• Verified and detailed property listings</li>
                <li>• Clean, distraction-free browsing</li>
                <li>• Designed for both mobile and desktop</li>
                <li>• Focused on trust and transparency</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-20 rounded-3xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 backdrop-blur-xl border border-white/10">
          <Typography variant="h4" className="font-bold mb-6">
            Find Your Next Place With Confidence
          </Typography>
          <Typography className="text-gray-300 mb-10 max-w-xl mx-auto">
            Discover homes, apartments, plots, and commercial spaces designed
            to match your lifestyle and goals.
          </Typography>
          <Button
            size="large"
            className="px-12 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 transition"
          >
            Browse Listings
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default AboutUs;
