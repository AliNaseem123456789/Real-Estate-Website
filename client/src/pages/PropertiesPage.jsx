import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand } from "@fortawesome/free-solid-svg-icons";
import { FaBed, FaBath, FaHeart } from "react-icons/fa";

export default function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get("action") || "rent";

  const [filters, setFilters] = useState({
    action: initialAction,
    type: "",
    price: "",
    bedroom: "",
    bathroom: "",
  });

  const [properties, setProperties] = useState([]);
  const [liked, setLiked] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentEndpoint = "getProperties";

  // When action query param changes
  useEffect(() => {
    const currentAction = searchParams.get("action") || "rent";
    setFilters((prev) => ({ ...prev, action: currentAction }));
  }, [searchParams]);

  // Fetch when filters change
  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    axios
      .get(`https://real-estate-website-uvk2.onrender.com/${currentEndpoint}`, {
        params: filters,
      })
      .then((res) => {
        setProperties(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setError("Failed to load properties. Please try again.");
        setLoading(false);
      });
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

  // --- MINIMAL IMAGE FUNCTION ---
  const getFirstImage = (prefix) => {
    try {
      return new URL(`/src/assets/properties/${prefix}-1.jpeg`, import.meta.url)
        .href;
    } catch (err) {
      return "";
    }
  };

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse"
        >
          <div className="h-64 bg-gray-300"></div>
          <div className="p-5">
            <div className="flex gap-4 mb-3">
              <div className="h-5 w-12 bg-gray-300 rounded"></div>
              <div className="h-5 w-12 bg-gray-300 rounded"></div>
              <div className="h-5 w-12 bg-gray-300 rounded"></div>
            </div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      <p className="mt-4 text-gray-600">Loading properties...</p>
    </div>
  );

  // Error Component
  const ErrorDisplay = () => (
    <div className="text-center py-20">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Failed to Load Properties
      </h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={fetchData}
        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Try Again
      </button>
    </div>
  );

  // Empty State Component
  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="text-gray-400 text-6xl mb-4">🏠</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No Properties Found
      </h3>
      <p className="text-gray-600">
        No properties match your current filters. Try adjusting your search
        criteria.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* HERO TITLE */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            Discover Premium Properties
          </h1>
          <p className="text-gray-500 mt-2">
            Hand-picked listings tailored to your lifestyle
          </p>
        </div>

        {/* FILTER BAR */}
        <div className="backdrop-blur-md bg-white/70 border border-gray-200 rounded-2xl shadow-lg p-6 mb-10">
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              {
                value: filters.action,
                onChange: (e) => handleFilterChange("action", e.target.value),
                options: [
                  { v: "rent", l: "Rent" },
                  { v: "sell", l: "Buy" },
                ],
              },
              {
                value: filters.type,
                onChange: (e) => handleFilterChange("type", e.target.value),
                options: [
                  { v: "", l: "Property Type" },
                  { v: "commercial", l: "Commercial" },
                  { v: "residential", l: "Residential" },
                  { v: "plot", l: "Plot" },
                ],
              },
            ].map((select, i) => (
              <select
                key={i}
                value={select.value}
                onChange={select.onChange}
                className="px-4 py-2 rounded-xl border shadow-sm bg-white text-gray-700 focus:ring-2 focus:ring-red-500"
              >
                {select.options.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            ))}

            {["price", "bedroom", "bathroom"].map((field) => (
              <input
                key={field}
                type="number"
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={filters[field]}
                onChange={(e) => handleFilterChange(field, e.target.value)}
                className="px-4 py-2 rounded-xl border shadow-sm focus:ring-2 focus:ring-red-500"
              />
            ))}

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Error State */}
        {!loading && error && <ErrorDisplay />}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && <EmptyState />}

        {/* Properties Grid */}
        {!loading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((prop) => (
              <div
                key={prop._id}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                {/* IMAGE */}
                <div className="relative h-64 overflow-hidden">
                  <Link to={`/properties/${prop._id}`}>
                    <img
                      src={getFirstImage(prop.image_prefix)}
                      className="h-full w-full object-cover transform group-hover:scale-110 transition duration-700"
                      alt={prop.title}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </Link>

                  {/* LIKE */}
                  <button
                    onClick={() => handleLikeClick(prop._id)}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow"
                  >
                    <FaHeart
                      className={`text-lg ${
                        liked[prop._id] ? "text-red-500" : "text-gray-400"
                      }`}
                    />
                  </button>

                  {/* PRICE BADGE */}
                  <span className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow">
                    PKR {prop.price?.toLocaleString()}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <div className="flex gap-4 text-gray-600 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <FaBed /> {prop.bedroom || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaBath /> {prop.bathroom || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faExpand} /> {prop.size || 0} sqft
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {prop.description}
                  </p>

                  <Link
                    to={`/properties/${prop._id}`}
                    className="inline-block mt-4 text-red-600 font-semibold hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
