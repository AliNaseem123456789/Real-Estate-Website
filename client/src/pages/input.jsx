import React, { useState } from 'react';
import axios from 'axios';
import building from './imarat.svg';
import { faBed, faBath, faHome, faDollarSign, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaBed, FaBath, FaHeart } from 'react-icons/fa';

export default function InputForm() {
  const [formData, setFormData] = useState({
    type: '',
    action: '',
    size: '',
    title: '',
    city: '',
    address: '',
    description: '',
    price: '',
    bedroom: '',
    bathroom: '',
    publisher_name: '',
    publisher_num: '',
    publisher_email: '',
  });

  const [images, setImages] = useState([]);
  const [action, setAction] = useState(null);
  const [type, setType] = useState(null);

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
  const handleButtonClick = (selectedAction) => setAction(selectedAction);
  const handleButtonclicktype = (selectedType) => setType(selectedType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action || !type) return alert('Select action and property type');
    if (!images || images.length === 0) return alert('Upload at least 1 image');

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append('action', action);
    data.append('type', type);
    for (let i = 0; i < images.length; i++) data.append('images', images[i]);

    try {
      // await axios.post(`https://real-estate-website-uvk2.onrender.com/properties/${id}`);
      await axios.post(
  'https://real-estate-website-uvk2.onrender.com/submitForm',
  data,
  {
    headers: { 'Content-Type': 'multipart/form-data' },
  }
);

      alert('Property uploaded successfully!');
      setFormData({
        type: '',
        action: '',
        size: '',
        title: '',
        city: '',
        address: '',
        description: '',
        price: '',
        bedroom: '',
        bathroom: '',
        publisher_name: '',
        publisher_num: '',
        publisher_email: '',
      });
      setImages([]);
      setAction(null);
      setType(null);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  return (
    <div className="bg-white py-10 px-4 sm:px-6 lg:px-20">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-center bg-red-500 rounded-xl text-white mb-10 p-6 relative">
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Upload your property details</h2>
        </div>
        <img
          src={building}
          alt="Building"
          className="w-[250px] sm:w-[350px] md:w-[400px] lg:w-[500px] h-auto mt-6 md:mt-0 md:ml-10"
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Action Type */}
        <div>
          <p className="text-lg font-semibold text-gray-700 mb-2">What do you want to do?</p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => handleButtonClick('rent')}
              className={`px-4 py-2 border rounded-lg font-semibold ${action === 'rent' ? 'border-orange-700 bg-orange-100' : 'border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faHome} className="mr-2" /> Rent
            </button>
            <button
              type="button"
              onClick={() => handleButtonClick('sell')}
              className={`px-4 py-2 border rounded-lg font-semibold ${action === 'sell' ? 'border-orange-700 bg-orange-100' : 'border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faDollarSign} className="mr-2" /> Sell
            </button>
          </div>
        </div>

        {/* Property Type */}
        <div>
          <p className="text-lg font-semibold text-gray-700 mb-2">What kind of property do you have?</p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => handleButtonclicktype('Residential')}
              className={`px-4 py-2 border rounded-lg font-semibold ${type === 'Residential' ? 'border-orange-700 bg-orange-100' : 'border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faHome} className="mr-2" /> Residential
            </button>
            <button
              type="button"
              onClick={() => handleButtonclicktype('Commercial')}
              className={`px-4 py-2 border rounded-lg font-semibold ${type === 'Commercial' ? 'border-orange-700 bg-orange-100' : 'border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faBuilding} className="mr-2" /> Commercial
            </button>
            <button
              type="button"
              onClick={() => handleButtonclicktype('Plot')}
              className={`px-4 py-2 border rounded-lg font-semibold ${type === 'Plot' ? 'border-orange-700 bg-orange-100' : 'border-gray-300'}`}
            >
              Plot
            </button>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="text"
            name="address"
            placeholder="Address, Block, Street..."
            value={formData.address}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="text"
            name="size"
            placeholder="Size"
            value={formData.size}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="text"
            name="title"
            placeholder="Property Title"
            value={formData.title}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="number"
            name="bedroom"
            placeholder="Bedrooms"
            value={formData.bedroom}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="number"
            name="bathroom"
            placeholder="Bathrooms"
            value={formData.bathroom}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
        </div>

        {/* Description */}
        <textarea
          name="description"
          placeholder="What do you love about your property?"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none"
          rows={5}
        />

        {/* Images */}
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files.length > 4) return alert('Only 4 images allowed');
              setImages(e.target.files);
            }}
          />
          <p className="text-sm text-gray-500 mt-1">Upload max 4 images</p>
        </div>

        {/* Publisher Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="publisher_name"
            placeholder="Your Name"
            value={formData.publisher_name}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="number"
            name="publisher_num"
            placeholder="Phone Number"
            value={formData.publisher_num}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
          <input
            type="email"
            name="publisher_email"
            placeholder="Email"
            value={formData.publisher_email}
            onChange={handleChange}
            className="px-3 py-2 border rounded-md focus:outline-none w-full"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg mt-4"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
