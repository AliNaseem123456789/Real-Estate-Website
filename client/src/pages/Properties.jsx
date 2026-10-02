import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaBell } from "react-icons/fa";
import PropertyCard from "../components/PropertyCard";
import { api } from "../utils/api";
import { AREA_UNITS } from "../utils/format";
import { useLanguage } from "../i18n";

const inputClass =
  "px-4 py-2 rounded-xl border shadow-sm bg-white text-gray-700 focus:ring-2 focus:ring-red-500 w-full";

// The filters live in the page address (e.g. /properties?action=rent&city=Lahore),
// so a search can be bookmarked, shared, or saved as an alert.
const FILTER_KEYS = ["action", "type", "city", "minPrice", "maxPrice", "bedrooms", "bathrooms", "minArea", "sort"];

export default function Properties() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || ""]));
  if (!filters.action) filters.action = "rent";
  const page = Number(searchParams.get("page")) || 1;

  const [result, setResult] = useState({ properties: [], total: 0, totalPages: 1 });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // bump to load again after an error

  const queryString = searchParams.toString();

  // Load the listings (waits a moment while the user is still typing)
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(queryString);
    if (!params.get("action")) params.set("action", "rent");

    const timer = setTimeout(() => {
      api(`/properties?${params}`)
        .then(setResult)
        .catch(() => setError("Failed to load properties. Please try again."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [queryString, reloadKey]);

  useEffect(() => {
    api("/properties/cities").then(setCities).catch(() => {});
  }, []);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // back to page 1 when filters change
    setSearchParams(params, { replace: true });
  };

  const goToPage = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => setSearchParams({ action: filters.action });

  // Save these filters; the user gets a notification when a new listing matches
  const saveAlert = async () => {
    if (!currentUser) return navigate("/sign-in");
    try {
      const searchFilters = { ...filters };
      delete searchFilters.sort; // sorting doesn't matter for alerts
      await api("/saved-searches", { method: "POST", body: searchFilters });
      setAlertMessage(t("alertSaved"));
    } catch (err) {
      setAlertMessage(err.message);
    }
    setTimeout(() => setAlertMessage(""), 4000);
  };

  // Area is stored in sq ft; the box shows Marla
  const minAreaMarla = filters.minArea ? Number(filters.minArea) / AREA_UNITS.marla.sqft : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            {filters.action === "sell" ? t("propertiesForSale") : t("propertiesForRent")}
          </h1>
          <p className="text-gray-500 mt-2">{t("searchSubtitle")}</p>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} className={inputClass}>
              <option value="rent">{t("rent")}</option>
              <option value="sell">{t("buy")}</option>
            </select>
            <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value)} className={inputClass}>
              <option value="">{t("anyType")}</option>
              <option value="Residential">{t("residential")}</option>
              <option value="Commercial">{t("commercial")}</option>
              <option value="Plot">{t("plot")}</option>
            </select>
            <input list="city-list" placeholder={t("city")} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className={inputClass} />
            <datalist id="city-list">
              {cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
            <input type="number" min="0" placeholder={t("minPrice")} value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} className={inputClass} />
            <input type="number" min="0" placeholder={t("maxPrice")} value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} className={inputClass} />
            <input type="number" min="0" placeholder={t("minBedrooms")} value={filters.bedrooms} onChange={(e) => updateFilter("bedrooms", e.target.value)} className={inputClass} />
            <input type="number" min="0" placeholder={t("minBathrooms")} value={filters.bathrooms} onChange={(e) => updateFilter("bathrooms", e.target.value)} className={inputClass} />
            <input
              type="number"
              min="0"
              step="any"
              placeholder={t("minArea")}
              value={minAreaMarla}
              onChange={(e) => updateFilter("minArea", e.target.value ? Number(e.target.value) * AREA_UNITS.marla.sqft : "")}
              className={inputClass}
            />
            <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)} className={inputClass}>
              <option value="">{t("sortNewest")}</option>
              <option value="price_asc">{t("sortPriceLow")}</option>
              <option value="price_desc">{t("sortPriceHigh")}</option>
              <option value="area_desc">{t("sortAreaLarge")}</option>
            </select>
            <button onClick={clearFilters} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
              {t("clearFilters")}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <p className="text-sm text-gray-500">
              {!loading && `${result.total} ${t("results")}`}
            </p>
            <button onClick={saveAlert} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
              <FaBell /> {t("alertMe")}
            </button>
          </div>
          {alertMessage && <p className="text-sm text-indigo-700 mt-2 text-end">{alertMessage}</p>}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600" />
            <p className="mt-4 text-gray-600">{t("loading")}</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 text-6xl mb-4">⚠️</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={() => setReloadKey((key) => key + 1)} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && result.properties.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-6xl mb-4">🏠</p>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t("noResults")}</h3>
            <p className="text-gray-600">{t("noResultsHelp")}</p>
          </div>
        )}

        {!loading && !error && result.properties.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {result.properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            {result.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white border shadow-sm disabled:opacity-40">
                  {t("previous")}
                </button>
                <span className="text-gray-600">
                  {t("page")} {page} {t("of")} {result.totalPages}
                </span>
                <button onClick={() => goToPage(page + 1)} disabled={page === result.totalPages} className="px-4 py-2 rounded-xl bg-white border shadow-sm disabled:opacity-40">
                  {t("next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
