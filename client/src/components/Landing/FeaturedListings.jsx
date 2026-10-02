import { Link } from "react-router-dom";
import featuredListing1 from "../../assets/featuredlisting1.jpeg";
import featuredListing2 from "../../assets/featuredlisting2.jpeg";
import featuredListing3 from "../../assets/featuredlisting3.jpeg";

// Hand-picked listings shown on the home page (ids are real properties in the database)
const listings = [
  {
    id: "65a27e1897fedcd313d5d3d3",
    name: '12 Marla Plot in Clifton, Karachi',
    image: featuredListing1,
    price: 'PKR 2,400,000',
  },
  {
    id: "65a27e1897fedcd313d5d3d8",
    name: '4 Bedrooms House in G-14, Islamabad',
    image: featuredListing2,
    price: 'PKR 15,000,000',
  },
  {
    id: '65a27e1897fedcd313d5d3cd',
    name: '10 Marla Plot in Bahria Town, Karachi',
    image: featuredListing3,
    price: 'PKR 2,000,000',
  },
];

export default function FeaturedListings() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-center mb-12">Featured Listings</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {listings.map((listing) => (
          <Link key={listing.id} to={`/properties/${listing.id}`}>
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
