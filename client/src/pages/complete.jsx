import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import p1 from "./p1.webp";
import p2 from "./p2.webp";
import p3 from "./p3.webp";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faBath, faExpand, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import ContactForm from './ContactForm';

Modal.setAppElement('#root');

export default function Complete() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msgModal, setMsgModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [id]);

  if (!property) return <div className="text-center py-20 text-gray-600">Loading...</div>;

  const images = [p1, p2, p3];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Section: Images */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="h-64 sm:h-80 rounded-xl overflow-hidden cursor-pointer relative shadow-lg"
                  onClick={() => setIsModalOpen(true)}
                >
                  <img src={img} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition"></div>
                </div>
              ))}
            </div>
            <Modal
              isOpen={isModalOpen}
              onRequestClose={() => setIsModalOpen(false)}
              className="max-w-3xl mx-auto mt-24 bg-white rounded-xl overflow-hidden shadow-xl outline-none"
              overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-start z-50"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-red-500"
              >
                &times;
              </button>
              <img src={p1} alt="Property Large" className="w-full h-96 object-cover" />
            </Modal>
          </div>

          {/* Right Section: Details */}
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{property.title}</h1>
            <p className="text-2xl font-semibold text-red-500">PKR {property.price}</p>
            <p className="text-gray-700">{property.description}</p>

            <div className="flex gap-6 text-gray-600 text-lg">
              <div className="flex items-center gap-2"><FontAwesomeIcon icon={faBed} /> {property.bedroom} Beds</div>
              <div className="flex items-center gap-2"><FontAwesomeIcon icon={faBath} /> {property.bathroom} Baths</div>
              <div className="flex items-center gap-2"><FontAwesomeIcon icon={faExpand} /> {property.size} sqft</div>
            </div>

            <p className="text-gray-700 font-semibold mt-2">{property.type}</p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setMsgModal(true)}
                className="flex-1 py-3 bg-white border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                <FontAwesomeIcon icon={faPhone} className="mr-2" /> Call
              </button>
              <button
                onClick={() => setEmailModal(true)}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              >
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Email
              </button>
            </div>

            <div className="mt-6 bg-white p-4 rounded-xl shadow">
              <h2 className="font-semibold text-gray-700 mb-2">Published By</h2>
              <p className="text-gray-600">{property.publisher_name}</p>
              <p className="text-gray-600">{property.publisher_email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={msgModal}
        onRequestClose={() => setMsgModal(false)}
        className="max-w-md mx-auto mt-40 bg-white rounded-xl shadow-lg p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-start z-50"
      >
        <h2 className="text-xl font-semibold mb-4">Call {property.publisher_name}</h2>
        <p className="mb-6">Phone: {property.publisher_phone || 'N/A'}</p>
        <button
          onClick={() => setMsgModal(false)}
          className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Close
        </button>
      </Modal>
      <Modal
        isOpen={emailModal}
        onRequestClose={() => setEmailModal(false)}
        className="max-w-md mx-auto mt-40 bg-white rounded-xl shadow-lg p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-start z-50"
      >
        <h2 className="text-xl font-semibold mb-4">Contact {property.publisher_name}</h2>
        <ContactForm />
        <button
          onClick={() => setEmailModal(false)}
          className="mt-4 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Close
        </button>
      </Modal>
    </div>
  );
}
