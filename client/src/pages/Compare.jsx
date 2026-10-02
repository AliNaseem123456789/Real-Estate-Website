import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { clearCompareList, toggleCompare, useCompareList } from "../utils/localLists";
import { AREA_UNITS, formatPrice, PLACEHOLDER_IMAGE } from "../utils/format";
import { useLanguage } from "../i18n";

// Rows of the comparison table: [label, how to show the value]
const ROWS = [
  ["Price", (p) => formatPrice(p.price) + (p.action === "rent" ? " / month" : "")],
  ["Purpose", (p) => (p.action === "sell" ? "For sale" : "For rent")],
  ["Type", (p) => p.type],
  ["City", (p) => p.city],
  ["Address", (p) => p.address],
  ["Size", (p) => p.size],
  ["Area (sq ft)", (p) => (p.areaSqft ? p.areaSqft.toLocaleString() : "-")],
  ["Price per Marla", (p) => (p.areaSqft ? formatPrice(Math.round(p.price / (p.areaSqft / AREA_UNITS.marla.sqft))) : "-")],
  ["Bedrooms", (p) => (p.type === "Plot" ? "-" : p.bedroom)],
  ["Bathrooms", (p) => (p.type === "Plot" ? "-" : p.bathroom)],
  ["Status", (p) => (p.sold ? "Sold" : "Available")],
];

export default function Compare() {
  const { t } = useLanguage();
  const compareList = useCompareList();
  const [properties, setProperties] = useState([]);
  const ids = compareList.join(",");

  useEffect(() => {
    if (!ids) return setProperties([]);
    api(`/properties?ids=${ids}`)
      .then((data) => setProperties(data.properties))
      .catch(() => setProperties([]));
  }, [ids]);

  if (compareList.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <h1 className="text-3xl font-bold mb-4">{t("compare")}</h1>
        <p className="text-gray-600 mb-6">
          Click &quot;{t("addToCompare")}&quot; on up to 3 properties to see them side by side.
        </p>
        <Link to="/properties" className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold">
          Browse properties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("compare")}</h1>
        <button onClick={clearCompareList} className="text-sm text-red-600">
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-4 w-36" />
              {properties.map((p) => (
                <th key={p._id} className="p-4 align-top text-start min-w-[220px]">
                  <img src={p.images[0] || PLACEHOLDER_IMAGE} alt="" className="w-full h-36 object-cover rounded-lg mb-2" />
                  <Link to={`/properties/${p._id}`} className="font-semibold text-base hover:underline">
                    {p.title}
                  </Link>
                  <button onClick={() => toggleCompare(p._id)} className="block text-xs text-red-600 mt-1">
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, show]) => (
              <tr key={label} className="border-t">
                <td className="p-4 font-semibold text-gray-600">{label}</td>
                {properties.map((p) => (
                  <td key={p._id} className="p-4">
                    {show(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
