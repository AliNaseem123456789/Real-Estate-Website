import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
// import ListingItem from '../components/ListingItem';

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  SwiperCore.use([Navigation]);

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('....');
        const data = await res.json();
        setOfferListings(data);
        fetchRentListings();
      } catch (error) {
        console.log(error);
      }
    };
    const fetchRentListings = async () => {
      try {
        const res = await fetch('.....');
        const data = await res.json();
        setRentListings(data);
        fetchSaleListings();
      } catch (error) {
        console.log(error);
      }
    };
    const fetchSaleListings = async () => {
      try {
        const res = await fetch('...');
        const data = await res.json();
        setSaleListings(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOfferListings();
  }, []);

  return (
    <div className="font-sans text-gray-800">
      <div
        className="relative w-full h-screen flex items-center justify-center"
        style={{
          background: `url('https://wallpapercave.com/wp/wp4110663.jpg') center/cover no-repeat`,
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white max-w-3xl px-4">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4">
            Find your next <span className="text-red-500">heaven</span> place with luxury
          </h1>
          <p className="mb-6 text-sm sm:text-base text-gray-200">
            Profit builders provide a variety of homes. <br />
            Find your palace, find your heaven.
          </p>
          <Link
            to="/about"
            className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition"
          >
            Let's find...
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto my-12 px-4">
        <Swiper navigation spaceBetween={20} slidesPerView={1} loop>
          {offerListings.map((listing) => (
            <SwiperSlide key={listing._id}>
              <div
                className="relative h-96 rounded-xl overflow-hidden shadow-lg"
                style={{
                  background: `url(${listing.imageUrls[0]}) center/cover no-repeat`,
                }}
              >
                <div className="absolute inset-0 bg-black/30 flex items-end p-6">
                  <h3 className="text-white text-xl font-bold">
                    {listing.name || 'Beautiful Home'}
                  </h3>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-12">
        {offerListings.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Recent Offers</h2>
              <Link to="/search?offer=true" className="text-blue-600 hover:underline">
                Show more
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {rentListings.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Recent Rentals</h2>
              <Link to="/search?type=rent" className="text-blue-600 hover:underline">
                Show more
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {saleListings.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Recent Sales</h2>
              <Link to="/search?type=sale" className="text-blue-600 hover:underline">
                Show more
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-16 bg-gray-900 text-gray-200">
  <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
    
    <div>
      <h3 className="text-xl font-bold mb-4 text-white">Real Estate Portal</h3>
      <p className="text-gray-400">
        Helping you find your dream home with ease. Modern, luxurious, and reliable.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-bold mb-4 text-white">Quick Links</h3>
      <ul className="space-y-2">
        <li>
          <Link to="/" className="hover:text-red-500 transition">
            Home
          </Link>
        </li>
        <li>
          <Link to="/about" className="hover:text-red-500 transition">
            About
          </Link>
        </li>
        <li>
          <Link to="/search" className="hover:text-red-500 transition">
            Listings
          </Link>
        </li>
        <li>
          <Link to="/ContactForm" className="hover:text-red-500 transition">
            Contact
          </Link>
        </li>
      </ul>
    </div>

    <div>
      <h3 className="text-xl font-bold mb-20 text-white">Contact</h3>
      <p className="text-gray-400 mb-2">123 Main Street, City, Country</p>
      <p className="text-gray-400 mb-2">email@example.com</p>
      <p className="text-gray-400">+123 456 7890</p>
      <div className="flex space-x-4 mt-4">
        <a href="#" className="hover:text-red-500 transition">Facebook</a>
        <a href="#" className="hover:text-red-500 transition">Twitter</a>
        <a href="#" className="hover:text-red-500 transition">Instagram</a>
      </div>
    </div>

  </div>

  <div className="border-t border-gray-800 mt-8 py-4 text-center text-gray-500 text-sm">
    &copy; {new Date().getFullYear()} Real Estate Portal. All rights reserved.
  </div>
</div>

    </div>
  );
}
