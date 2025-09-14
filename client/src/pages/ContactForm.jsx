import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    description: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
  };

  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-md max-w-2xl mx-auto w-full">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center">Contact Us</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-gray-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-gray-500"
            required
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-gray-500 resize-none"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors w-full text-center"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
