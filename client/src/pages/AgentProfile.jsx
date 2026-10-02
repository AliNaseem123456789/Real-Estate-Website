import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaCheckCircle, FaEnvelope, FaPhone, FaWhatsapp } from "react-icons/fa";
import PropertyCard from "../components/PropertyCard";
import { api } from "../utils/api";
import { whatsappLink } from "../utils/format";
import { useLanguage } from "../i18n";

// Public page for an agent / seller with all their listings
export default function AgentProfile() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/agents/${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-center py-20 text-gray-700">{error}</p>;
  if (!data) return <p className="text-center py-20 text-gray-600">{t("loading")}</p>;

  const { profile, listings } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-10">
        <img src={profile.avatar} alt="" className="h-28 w-28 rounded-full object-cover border-4 border-gray-100" />
        <div className="flex-1 text-center sm:text-start">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start">
            {profile.agency || profile.username}
            {profile.verified && (
              <span className="flex items-center gap-1 text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <FaCheckCircle /> {t("verified")}
              </span>
            )}
          </h1>
          {profile.agency && <p className="text-gray-500">{profile.username}</p>}
          {profile.isAgent && <p className="text-sm text-gray-500">Real estate agent</p>}
          {profile.bio && <p className="text-gray-700 mt-3 whitespace-pre-line">{profile.bio}</p>}

          {profile.isAgent && (
            <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
              {profile.phone && (
                <>
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                    <FaPhone /> {profile.phone}
                  </a>
                  <a href={whatsappLink(profile.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg">
                    <FaWhatsapp /> {t("whatsapp")}
                  </a>
                </>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                  <FaEnvelope /> {profile.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">
        Listings ({listings.length})
      </h2>
      {listings.length === 0 && <p className="text-gray-500">No listings yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {listings.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </div>
  );
}
