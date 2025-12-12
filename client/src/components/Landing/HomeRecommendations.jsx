import React from "react";
import { FaDollarSign, FaMapMarkerAlt } from "react-icons/fa"; // icons for tags
import img1 from "../../assets/Home1.jpeg";
import img2 from "../../assets/Home2.jpeg";
import img3 from "../../assets/Home3.jpeg";

export default function HomeRecommendations() {
  const recommendations = [
    {
      img: img1,
      price: "$695,000",
      desc: "4 bd | 3 ba | 3,102 sqft | House for Sale",
    },
    {
      img: img2,
      price: "$520,000",
      desc: "3 bd | 2 ba | 2,400 sqft | Apartment for Sale",
    },
    {
      img: img3,
      price: "$880,000",
      desc: "5 bd | 4 ba | 4,200 sqft | Villa for Sale",
    },
  ];

  return (
    <div className="w-full flex justify-center py-24 bg-white">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 px-6 items-center">

        {/* LEFT TEXT */}
        <div className="relative z-10">
          <h4 className="text-blue-500 font-semibold mb-1">
            Personalized Recommendations
          </h4>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-snug">
            Get home suggestions <br /> tailored for you
          </h2>
          <p className="text-gray-600 mb-6">
            Sign in for a more personalized experience and see homes that match your preferences and budget.
          </p>
          <button className="px-6 py-3 rounded-full border border-blue-500 text-blue-600 font-medium hover:bg-blue-50">
            Sign in
          </button>
        </div>

        {/* RIGHT SIDE STACKED CARDS */}
        <div className="relative w-full flex justify-center items-center h-96">

          {recommendations.map((rec, index) => {
            const offset = 20 * (recommendations.length - index - 1);
            const scale = 1 - 0.05 * (recommendations.length - index - 1);
            const widthAdjustment = index < recommendations.length - 1 ? 250 : 350; // back cards wider
            const heightAdjustment = index < recommendations.length - 1 ? 160 : 200; // back cards taller
            const isFront = index === recommendations.length - 1;

            return (
              <div
                key={index}
                className="absolute rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  top: offset,
                  left: offset,
                  zIndex: index + 1,
                  transform: `scale(${scale})`,
                  width: `${widthAdjustment}px`,
                  height: `${heightAdjustment}px`,
                }}
              >
                <img
                  src={rec.img}
                  alt={`home ${index}`}
                  className="w-full h-full object-cover"
                />

                {isFront && (
                  <div className="absolute bottom-0 left-0 w-full bg-white/95 p-4 rounded-b-2xl">
                    <h3 className="font-bold text-xl mb-1">{rec.price}</h3>
                    <p className="text-gray-600 text-sm">{rec.desc}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* RECOMMENDATION TAGS */}
          <div className="absolute top-0 -left-16 bg-white shadow-md px-4 py-2 rounded-xl flex items-center gap-2 z-20 w-72">
            <FaDollarSign className="text-green-500 w-5 h-5" />
            <span className="text-sm font-medium leading-tight">
              Recommended homes <br />
              <span className="font-normal text-gray-600">
                based on your monthly budget
              </span>
            </span>
          </div>

          <div className="absolute top-24 -left-16 bg-white shadow-md px-4 py-2 rounded-xl flex items-center gap-2 z-20 w-72">
            <FaMapMarkerAlt className="text-orange-500 w-5 h-5" />
            <span className="text-sm font-medium leading-tight">
              Recommended homes <br />
              <span className="font-normal text-gray-600">
                based on your preferred location
              </span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
