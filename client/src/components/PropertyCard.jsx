import { Link } from "react-router-dom";
import { FaBed, FaBath, FaExpand, FaMapMarkerAlt } from "react-icons/fa";
import FavoriteButton from "./FavoriteButton";
import CompareButton from "./CompareButton";
import { formatPrice, PLACEHOLDER_IMAGE } from "../utils/format";
import { useLanguage } from "../i18n";

// One property in a grid of listings
export default function PropertyCard({ property }) {
  const { t } = useLanguage();
  const coverImage = property.images?.[0] || PLACEHOLDER_IMAGE;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col">
      {/* Image */}
      <div className="relative h-60 overflow-hidden">
        <Link to={`/properties/${property._id}`}>
          <img
            src={coverImage}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transform group-hover:scale-110 transition duration-700"
            onError={(e) => {
              e.target.src = PLACEHOLDER_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </Link>

        <FavoriteButton propertyId={property._id} className="absolute top-4 right-4" />

        <span className="absolute top-4 left-4 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
          {property.action === "sell" ? t("forSale") : t("forRent")}
        </span>
        {property.sold && (
          <span className="absolute top-12 left-4 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
            {t("sold")}
          </span>
        )}

        <span className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow">
          {formatPrice(property.price)}
          {property.action === "rent" && <span className="font-normal"> /month</span>}
        </span>
      </div>

      {/* Details */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-1">{property.title}</h3>
        <p className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <FaMapMarkerAlt /> {property.city}
        </p>

        <div className="flex gap-4 text-gray-600 text-sm mb-3">
          {property.type !== "Plot" && (
            <>
              <span className="flex items-center gap-1">
                <FaBed /> {property.bedroom || 0}
              </span>
              <span className="flex items-center gap-1">
                <FaBath /> {property.bathroom || 0}
              </span>
            </>
          )}
          <span className="flex items-center gap-1">
            <FaExpand /> {property.size || "-"}
          </span>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{property.description}</p>

        <div className="flex items-center justify-between mt-auto pt-4">
          <Link
            to={`/properties/${property._id}`}
            className="text-red-600 font-semibold hover:underline"
          >
            {t("viewDetails")} →
          </Link>
          <CompareButton propertyId={property._id} />
        </div>
      </div>
    </div>
  );
}
