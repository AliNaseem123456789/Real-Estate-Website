// components/FeaturedListings.jsx
import { Link } from 'react-router-dom';

const listings = [
  {
    id: 1,
    name: 'Luxury Villa in Beverly Hills',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?&w=600',
    price: '$3,200,000',
  },
  {
    id: 2,
    name: 'Modern Apartment Downtown',
    image: 'https://images.unsplash.com/photo-1572120360610-d971b9b639f8?&w=600',
    price: '$850,000',
  },
  {
    id: 3,
    name: 'Cozy Family House',
    image: 'https://images.unsplash.com/photo-1598928506312-94bfa4d21b2f?&w=600',
    price: '$450,000',
  },
];

export default function FeaturedListings() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-center mb-12">Featured Listings</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {listings.map((listing) => (
          <Link key={listing.id} to={`/listing/${listing.id}`}>
            <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition">
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${listing.image})` }}
              ></div>
              <div className="p-4 bg-white">
                <h3 className="font-semibold text-lg">{listing.name}</h3>
                <p className="text-red-500 font-bold">{listing.price}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
