import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import PropertyCard from "../components/PropertyCard";
import { api } from "../utils/api";
import { useLanguage } from "../i18n";

export default function Favorites() {
  const { t } = useLanguage();
  const { currentUser } = useSelector((state) => state.user);
  const [properties, setProperties] = useState(null);

  // Reload when a heart is clicked (the list of ids changes)
  const favoriteIds = (currentUser?.favorites || []).join(",");
  useEffect(() => {
    api("/user/favorites")
      .then(setProperties)
      .catch(() => setProperties([]));
  }, [favoriteIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{t("favorites")} ❤️</h1>
      {!properties && <p className="text-gray-500">{t("loading")}</p>}
      {properties?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">Tap the heart on any property to save it here.</p>
          <Link to="/properties" className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold">
            Browse properties
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties?.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </div>
  );
}
