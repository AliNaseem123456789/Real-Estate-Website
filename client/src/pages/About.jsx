// AboutUs.jsx
import React from "react";
import { Container, Typography, Button, Card, CardContent } from "@mui/material";
import { RocketLaunch, People, Security } from "@mui/icons-material";

const AboutUs = () => {
  return (
    <Container maxWidth="lg" className="py-16">
      {/* Header Section */}
      <div className="text-center mb-16">
        <Typography variant="h3" className="font-bold mb-4">
          About Us
        </Typography>
        <Typography variant="h6" className="text-gray-600">
          We empower businesses to sell smarter, faster, and more efficiently with our SaaS e-commerce platform.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          className="mt-6 px-8 py-3 text-lg"
        >
          Get Started
        </Button>
      </div>

      {/* Mission Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardContent className="text-center">
            <RocketLaunch fontSize="large" className="text-blue-500 mb-4" />
            <Typography variant="h6" className="font-semibold mb-2">
              Our Mission
            </Typography>
            <Typography className="text-gray-600">
              To make e-commerce effortless for businesses of all sizes, combining powerful technology with simplicity.
            </Typography>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardContent className="text-center">
            <People fontSize="large" className="text-green-500 mb-4" />
            <Typography variant="h6" className="font-semibold mb-2">
              Who We Are
            </Typography>
            <Typography className="text-gray-600">
              A team of innovators with expertise in technology, retail, and customer experience, dedicated to helping your business grow.
            </Typography>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardContent className="text-center">
            <Security fontSize="large" className="text-red-500 mb-4" />
            <Typography variant="h6" className="font-semibold mb-2">
              Our Commitment
            </Typography>
            <Typography className="text-gray-600">
              Customer success is our top priority. We continuously improve our platform and provide support to help your business thrive.
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <Typography variant="h4" className="font-bold mb-4">
          Join Us Today
        </Typography>
        <Typography className="text-gray-600 mb-6">
          Whether you’re starting out or scaling globally, we provide the tools and insights to grow your online business.
        </Typography>
        <Button variant="contained" color="primary" className="px-8 py-3 text-lg">
          Start Free Trial
        </Button>
      </div>
    </Container>
  );
};

export default AboutUs;
