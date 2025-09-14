import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import p1Image from './a.jpeg';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand } from '@fortawesome/free-solid-svg-icons';
import { FaBed, FaBath, FaHeart } from 'react-icons/fa';

export default function Action() {
  const [properties, setProperties] = useState([]);
  const [liked, setLiked] = useState({});
  const [currentEndpoint, setCurrentEndpoint] = useState('getProperties');
  const [filters, setFilters] = useState({
    action: 'rent',
    type: '',
    price: '',
    bedroom: '',
    bathroom: '',
  });

  useEffect(() => {
    fetchData();
  }, [currentEndpoint, filters]);

  const fetchData = () => {
    axios
      .get(`http://localhost:3001/${currentEndpoint}`, { params: filters })
      .then((response) => setProperties(response.data))
      .catch((err) => console.log(err));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleLikeClick = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="h-10 px-3 border rounded-lg bg-white text-gray-700 shadow-sm"
          >
            <option value="rent">Rent</option>
            <option value="sell">Sell</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="h-10 px-3 border rounded-lg bg-white text-gray-700 shadow-sm"
          >
            <option value="">Property Type</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="plot">Plot</option>
          </select>

          <input
            type="number"
            placeholder="Price"
            value={filters.price}
            onChange={(e) => handleFilterChange('price', e.target.value)}
            className="h-10 px-3 border rounded-lg shadow-sm text-gray-700"
          />

          <input
            type="number"
            placeholder="Bedrooms"
            value={filters.bedroom}
            onChange={(e) => handleFilterChange('bedroom', e.target.value)}
            className="h-10 px-3 border rounded-lg shadow-sm text-gray-700"
          />

          <input
            type="number"
            placeholder="Bathrooms"
            value={filters.bathroom}
            onChange={(e) => handleFilterChange('bathroom', e.target.value)}
            className="h-10 px-3 border rounded-lg shadow-sm text-gray-700"
          />
        </div>

        <p className="text-xl font-semibold text-gray-700 mb-6">
          {filters.type
            ? `${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)} Properties for ${
                filters.action === 'rent' ? 'Rent' : 'Sale'
              }`
            : `Properties for ${filters.action === 'rent' ? 'Rent' : 'Sale'}`}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div
              key={prop._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition relative"
            >
              <Link to={`/properties/${prop._id}`}>
                <Slider {...sliderSettings} className="h-64">
                  {[p1Image, p1Image, p1Image].map((img, idx) => (
                    <div key={idx} className="h-64 w-full overflow-hidden">
                      <img
                        src={img}
                        alt={`Property ${idx}`}
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                    </div>
                  ))}
                </Slider>
              </Link>

              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-500 font-bold text-lg">PKR {prop.price}</span>
                  <button onClick={() => handleLikeClick(prop._id)}>
                    <FaHeart
                      className={`text-xl transition-colors ${liked[prop._id] ? 'text-red-500' : 'text-gray-400'}`}
                    />
                  </button>
                </div>

                <div className="flex items-center text-gray-600 text-sm gap-4 mb-2">
                  <div className="flex items-center gap-1">
                    <FaBed /> {prop.bedroom}
                  </div>
                  <div className="flex items-center gap-1">
                    <FaBath /> {prop.bathroom}
                  </div>
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faExpand} /> {prop.size} sqft
                  </div>
                </div>

                <p className="text-gray-700 text-sm line-clamp-3">{prop.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
