import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { getRecentlyViewed } from "../utils/localLists";
import PropertyCard from "./PropertyCard";
import { useLanguage } from "../i18n";

// Properties this browser looked at recently (newest first)
export default function RecentlyViewed({ excludeId, limit = 3 }) {
  const { t } = useLanguage();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const ids = getRecentlyViewed().filter((id) => id !== excludeId).slice(0, limit);
    if (ids.length === 0) return setProperties([]);

    api(`/properties?ids=${ids.join(",")}`)
      .then((data) => {
        // Keep the "most recent first" order
        const byId = Object.fromEntries(data.properties.map((p) => [p._id, p]));
        setProperties(ids.map((id) => byId[id]).filter(Boolean));
      })
      .catch(() => setProperties([]));
  }, [excludeId, limit]);

  if (properties.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">{t("recentlyViewed")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </section>
  );
}
