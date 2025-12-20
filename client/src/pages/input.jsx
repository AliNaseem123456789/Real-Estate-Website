import React, { useState } from "react";
import axios from "axios";
import building from "./imarat.svg";
import {
  faHome,
  faDollarSign,
  faBuilding,
  faImage,
  faUser,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faRulerCombined,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function InputForm() {
  const [formData, setFormData] = useState({
    type: "",
    action: "",
    size: "",
    title: "",
    city: "",
    address: "",
    description: "",
    price: "",
    bedroom: "",
    bathroom: "",
    publisher_name: "",
    publisher_num: "",
    publisher_email: "",
  });

  const [images, setImages] = useState([]);
  const [action, setAction] = useState(null);
  const [type, setType] = useState(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action || !type) return alert("Select action and property type");
    if (!images || images.length === 0) return alert("Upload at least 1 image");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) =>
      data.append(key, value)
    );
    data.append("action", action);
    data.append("type", type);
    for (let i = 0; i < images.length; i++) data.append("images", images[i]);

    try {
      await axios.post(
        "https://real-estate-website-uvk2.onrender.com/submitForm",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Property uploaded successfully!");
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HERO */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-14 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">
              List Your Property Like a Pro
            </h1>
            <p className="text-white/90 max-w-lg">
              Reach thousands of buyers & tenants by publishing your property
              with professional visibility.
            </p>
          </div>
          <img src={building} className="w-[420px]" />
        </div>
      </div>

      {/* CONTENT */}
      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-6 py-12"
      >
        {/* MAIN FORM */}
        <div className="lg:col-span-2 space-y-10">
          {/* ACTION */}
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">
              What do you want to do?
            </h2>
            <div className="flex gap-4">
              {["rent", "sell"].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setAction(opt)}
                  className={`flex-1 py-3 rounded-lg border font-semibold ${
                    action === opt
                      ? "bg-red-100 border-red-500 text-red-600"
                      : "border-gray-300"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={opt === "rent" ? faHome : faDollarSign}
                    className="mr-2"
                  />
                  {opt.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* PROPERTY TYPE */}
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">
              Property Category
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {["Residential", "Commercial", "Plot"].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setType(opt)}
                  className={`py-3 rounded-lg border font-semibold ${
                    type === opt
                      ? "bg-red-100 border-red-500 text-red-600"
                      : "border-gray-300"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={
                      opt === "Commercial" ? faBuilding : faHome
                    }
                    className="mr-2"
                  />
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* DETAILS */}
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">
              Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["city", "City", faMapMarkerAlt],
                ["address", "Address"],
                ["size", "Size", faRulerCombined],
                ["title", "Listing Title"],
                ["price", "Price"],
                ["bedroom", "Bedrooms"],
                ["bathroom", "Bathrooms"],
              ].map(([name, placeholder, icon]) => (
                <div key={name} className="relative">
                  {icon && (
                    <FontAwesomeIcon
                      icon={icon}
                      className="absolute top-3 left-3 text-gray-400"
                    />
                  )}
                  <input
                    name={name}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      icon ? "pl-10" : ""
                    }`}
                  />
                </div>
              ))}
            </div>

            <textarea
              name="description"
              rows={5}
              placeholder="Describe your property..."
              value={formData.description}
              onChange={handleChange}
              className="w-full mt-4 px-4 py-3 border rounded-lg"
            />
          </section>

          {/* IMAGES */}
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">
              Property Images
            </h2>
            <label className="border-2 border-dashed p-8 rounded-lg text-center cursor-pointer block">
              <FontAwesomeIcon icon={faImage} size="2x" />
              <p className="mt-2 text-sm text-gray-500">
                Upload up to 4 images
              </p>
              <input
                type="file"
                multiple
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files.length > 4)
                    return alert("Max 4 images allowed");
                  setImages(e.target.files);
                }}
              />
            </label>
          </section>

          {/* PUBLISHER */}
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="publisher_name"
                placeholder="Your Name"
                value={formData.publisher_name}
                onChange={handleChange}
                className="px-4 py-3 border rounded-lg"
              />
              <input
                name="publisher_num"
                placeholder="Phone Number"
                value={formData.publisher_num}
                onChange={handleChange}
                className="px-4 py-3 border rounded-lg"
              />
              <input
                name="publisher_email"
                placeholder="Email Address"
                value={formData.publisher_email}
                onChange={handleChange}
                className="px-4 py-3 border rounded-lg md:col-span-2"
              />
            </div>
          </section>

          <button
            type="submit"
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-lg font-semibold"
          >
            Publish Property
          </button>
        </div>

        {/* SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4">
              Listing Checklist
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✔ Action selected</li>
              <li>✔ Property type</li>
              <li>✔ Images uploaded</li>
              <li>✔ Complete details</li>
              <li>✔ Contact info</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}
