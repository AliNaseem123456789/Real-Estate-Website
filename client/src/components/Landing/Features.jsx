import React from "react";
import buying from "../../assets/features1.jpeg";
import renting from "../../assets/features2.jpeg";
import selling from "../../assets/features3.jpeg";
import { useNavigate } from "react-router-dom";

export default function Features() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Buy a home",
      description:
        "A real estate agent can provide you with a clear breakdown of costs so that you can avoid surprise expenses.",
      button: "Find a local agent",
      image: buying,
      action: "buy",
    },
    {
      title: "Rent a home",
      description:
        "We're creating a seamless online experience – from shopping on the largest rental network, to applying, to paying rent.",
      button: "Find rentals",
      image: renting,
      action: "rent",
    },
    {
      title: "Sell a home",
      description:
        "No matter what path you take to sell your home, we can help you navigate a successful sale.",
      button: "See your options",
      image: selling,
      action: "sell",
    },
  ];

  const handleCardClick = (actionType) => {
    navigate(`/actions?action=${actionType}`);
  };

  return (
    <div className="w-full flex justify-center py-12 bg-white">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl shadow-md p-6 text-center border border-gray-200 bg-white cursor-pointer hover:shadow-lg transition"
            onClick={() => handleCardClick(card.action)}
          >
            <div className="w-full flex justify-center mb-6">
              <img
                src={card.image}
                alt={card.title}
                className="w-28 h-28 object-cover rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{card.description}</p>
            <button className="px-5 py-2 rounded-full border border-blue-500 text-blue-600 font-medium hover:bg-blue-50">
              {card.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
