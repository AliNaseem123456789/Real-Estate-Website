import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaEdit, FaTrash, FaWhatsapp, FaEnvelope, FaPlus } from "react-icons/fa";
import { api } from "../utils/api";
import { formatPrice, PLACEHOLDER_IMAGE, whatsappLink } from "../utils/format";
import { useLanguage } from "../i18n";

// ---------- My listings ----------
function MyListings() {
  const { t } = useLanguage();
  const [listings, setListings] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api("/properties/mine")
      .then(setListings)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const toggleSold = async (property) => {
    try {
      await api(`/properties/${property._id}/sold`, { method: "PATCH", body: { sold: !property.sold } });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (property) => {
    if (!window.confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
    try {
      await api(`/properties/${property._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!listings) return <p className="text-gray-500">{t("loading")}</p>;
  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 mb-4">You haven&apos;t listed any property yet.</p>
        <Link to="/sell" className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold">
          {t("sell")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((property) => (
        <div key={property._id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-4">
          <img src={property.images[0] || PLACEHOLDER_IMAGE} alt="" className="w-full sm:w-40 h-32 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-1">
              {property.approved === false ? (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{t("pending")}</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">{t("live")}</span>
              )}
              {property.sold && <span className="text-xs px-2 py-1 rounded-full bg-gray-900 text-white">{t("sold")}</span>}
            </div>
            <Link to={`/properties/${property._id}`} className="font-semibold text-lg hover:underline">
              {property.title}
            </Link>
            <p className="text-gray-500 text-sm">
              {property.city} · {formatPrice(property.price)}
            </p>
          </div>
          <div className="flex sm:flex-col gap-2 flex-wrap">
            <Link to={`/properties/${property._id}/edit`} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
              <FaEdit /> {t("edit")}
            </Link>
            <button onClick={() => toggleSold(property)} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
              {property.sold ? t("markAvailable") : t("markSold")}
            </button>
            <button onClick={() => remove(property)} className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
              <FaTrash /> {t("delete")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Enquiries ----------
function Enquiries() {
  const { t } = useLanguage();
  const [enquiries, setEnquiries] = useState(null);

  const load = () =>
    api("/enquiries")
      .then(setEnquiries)
      .catch(() => setEnquiries([]));

  useEffect(() => {
    load();
  }, []);

  const markRead = async (enquiry) => {
    if (enquiry.read) return;
    await api(`/enquiries/${enquiry._id}/read`, { method: "PATCH" }).catch(() => {});
    load();
  };

  const remove = async (enquiry) => {
    if (!window.confirm("Delete this enquiry?")) return;
    await api(`/enquiries/${enquiry._id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  if (!enquiries) return <p className="text-gray-500">{t("loading")}</p>;
  if (enquiries.length === 0) return <p className="text-gray-600 py-8 text-center">No enquiries yet.</p>;

  return (
    <div className="space-y-4">
      {enquiries.map((enquiry) => (
        <div
          key={enquiry._id}
          onClick={() => markRead(enquiry)}
          className={`rounded-xl shadow p-4 ${enquiry.read ? "bg-white" : "bg-indigo-50 border-s-4 border-indigo-500"}`}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-semibold">
              {enquiry.name}
              {!enquiry.read && <span className="ms-2 text-xs text-indigo-600">● New</span>}
            </p>
            <p className="text-xs text-gray-400">{new Date(enquiry.createdAt).toLocaleString()}</p>
          </div>
          {enquiry.property && (
            <Link to={`/properties/${enquiry.property._id}`} className="text-sm text-red-600 hover:underline">
              {enquiry.property.title}
            </Link>
          )}
          <p className="text-gray-700 mt-2 whitespace-pre-line">{enquiry.message}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${enquiry.property?.title || "your enquiry"}`)}`} className="flex items-center gap-2 px-3 py-1 border rounded-lg text-sm bg-white">
              <FaEnvelope /> {enquiry.email}
            </a>
            {enquiry.phone && (
              <a href={whatsappLink(enquiry.phone, `Hi ${enquiry.name}, thanks for your enquiry.`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1 border rounded-lg text-sm bg-white">
                <FaWhatsapp className="text-green-600" /> {enquiry.phone}
              </a>
            )}
            <button onClick={(e) => { e.stopPropagation(); remove(enquiry); }} className="px-3 py-1 text-sm text-red-600">
              {t("delete")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Alerts (saved searches) ----------
const describeFilters = (filters) => {
  const parts = [];
  parts.push(filters.action === "sell" ? "For sale" : "For rent");
  if (filters.type) parts.push(filters.type);
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.minPrice) parts.push(`from ${formatPrice(filters.minPrice)}`);
  if (filters.maxPrice) parts.push(`up to ${formatPrice(filters.maxPrice)}`);
  if (filters.bedrooms) parts.push(`${filters.bedrooms}+ beds`);
  if (filters.minArea) parts.push(`${Number(filters.minArea) / 225}+ Marla`);
  return parts.join(" · ");
};

function Alerts() {
  const { t } = useLanguage();
  const [searches, setSearches] = useState(null);

  const load = () =>
    api("/saved-searches")
      .then(setSearches)
      .catch(() => setSearches([]));

  useEffect(() => {
    load();
  }, []);

  const remove = async (search) => {
    await api(`/saved-searches/${search._id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  if (!searches) return <p className="text-gray-500">{t("loading")}</p>;

  return (
    <div>
      <p className="text-gray-600 mb-4">
        You get a notification (bell icon) when a new listing matches one of these searches, and when a property you saved drops in price.
        Create one with the &quot;{t("alertMe")}&quot; button on the search page.
      </p>
      {searches.length === 0 && <p className="text-gray-500">No alerts yet.</p>}
      <div className="space-y-3">
        {searches.map((search) => (
          <div key={search._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center gap-4">
            <Link to={`/properties?${new URLSearchParams(search.filters)}`} className="hover:underline">
              {describeFilters(search.filters)}
            </Link>
            <button onClick={() => remove(search)} className="text-red-600 text-sm">
              {t("delete")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = {
  listings: { label: "myListings", Component: MyListings },
  enquiries: { label: "enquiries", Component: Enquiries },
  alerts: { label: "alerts", Component: Alerts },
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS[searchParams.get("tab")] ? searchParams.get("tab") : "listings";
  const { Component } = TABS[tab];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <Link to="/sell" className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold">
          <FaPlus /> {t("sell")}
        </Link>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {Object.entries(TABS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setSearchParams({ tab: key })}
            className={`px-4 py-2 -mb-px border-b-2 font-semibold ${
              tab === key ? "border-red-500 text-red-600" : "border-transparent text-gray-500"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <Component />
    </div>
  );
}
