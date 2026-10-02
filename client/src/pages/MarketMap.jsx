import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { FaMapMarkedAlt, FaListUl, FaInfoCircle } from "react-icons/fa";
import { api } from "../utils/api";
import {
  CATEGORIES,
  MUTED,
  RAMP,
  SIZE_BANDS,
  areaValue,
  colorFor,
  formatMonthYear,
  metricTitle,
  pkr,
  quintileBreaks,
  radiusFor,
  valueLabel,
} from "../utils/market";
import { useLanguage } from "../i18n";

const MODES = [
  { value: "price", label: "Prices" },
  { value: "rentYears", label: "Rent vs buy" },
  { value: "budget", label: "My budget" },
];

const segmentClass = (active) =>
  `px-3 py-2 text-sm font-semibold rounded-lg transition ${
    active ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
  }`;

// Fits the map to the circles whenever the city or filters change
function FitToAreas({ areas }) {
  const map = useMap();
  useEffect(() => {
    if (areas.length === 0) return;
    const bounds = L.latLngBounds(areas.map((a) => [a.lat, a.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  }, [areas, map]);
  return null;
}

// Moves the map to an area picked from the list
function FlyToArea({ area }) {
  const map = useMap();
  useEffect(() => {
    if (area) map.flyTo([area.lat, area.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [area, map]);
  return null;
}

function Legend({ breaks, view, values }) {
  if (view.mode === "budget") {
    return (
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: RAMP[3] }} /> Within budget
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: MUTED }} /> Above budget
        </span>
      </div>
    );
  }
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const edges = [min, ...breaks, max];
  const short = (v) => (view.mode === "rentYears" ? `${Math.round(v)} yrs` : pkr(v).replace("PKR ", ""));

  return (
    <div className="text-sm text-gray-700">
      <p className="font-semibold mb-1">{metricTitle(view)}</p>
      <div className="flex">
        {RAMP.map((color, i) => (
          <div key={color} className="flex-1 min-w-0">
            <div className="h-3" style={{ background: color, marginRight: i < RAMP.length - 1 ? 2 : 0 }} />
            <p className="text-xs text-gray-500 mt-1 truncate">
              {short(edges[i])}
              {i === RAMP.length - 1 && `–${short(edges[i + 1])}`}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {view.mode === "rentYears" ? "Lighter = fewer years (better for buyers)" : "Lighter = cheaper"} · Bigger circle = more
        listings · Faded = fewer than 10 listings
      </p>
    </div>
  );
}

function AreaDetails({ area, view, onClose }) {
  const rent = view.purpose === "rent";
  return (
    <div>
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{area.location}</h2>
          <p className="text-sm text-gray-500">
            {area.city} · {CATEGORIES.find((c) => c.value === area.category)?.label} for {rent ? "rent" : "sale"}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
          &times;
        </button>
      </div>

      {area.subAreas?.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Includes {area.subAreas.slice(0, 6).join(", ")}
          {area.subAreas.length > 6 && ` and ${area.subAreas.length - 6} more`}
        </p>
      )}

      {area.lowConfidence && (
        <p className="mt-3 text-xs bg-gray-100 text-gray-700 rounded-lg p-2 flex gap-2">
          <FaInfoCircle className="mt-0.5 flex-shrink-0" /> Only {area.count} listings here, so treat these numbers as a rough
          guide.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <dt className="text-xs text-gray-500">{rent ? "Rent per Marla / month" : "Price per Marla"}</dt>
          <dd className="text-lg font-bold text-gray-900">{pkr(area.medianPricePerMarla)}</dd>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <dt className="text-xs text-gray-500">Typical range</dt>
          <dd className="text-sm font-semibold text-gray-900">
            {pkr(area.p25PricePerMarla).replace("PKR ", "")} – {pkr(area.p75PricePerMarla).replace("PKR ", "")}
          </dd>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <dt className="text-xs text-gray-500">Typical {rent ? "rent" : "price"}</dt>
          <dd className="text-sm font-semibold text-gray-900">
            {pkr(area.medianPrice)}
            {rent && " / month"}
          </dd>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <dt className="text-xs text-gray-500">Typical size</dt>
          <dd className="text-sm font-semibold text-gray-900">
            {area.medianAreaMarla} Marla
            {area.medianBedrooms > 0 && ` · ${area.medianBedrooms} beds`}
          </dd>
        </div>
        {area.rentYears && (
          <div className="bg-gray-50 rounded-xl p-3 col-span-2">
            <dt className="text-xs text-gray-500">Rent vs buy</dt>
            <dd className="text-sm text-gray-900">
              Buying costs about <strong>{area.rentYears} years</strong> of rent for a similar {area.category}.
            </dd>
          </div>
        )}
      </dl>

      {area.sizeBands?.length > 0 && (
        <table className="w-full text-sm mt-4">
          <caption className="text-left text-xs text-gray-500 mb-1">Typical {rent ? "monthly rent" : "price"} by size</caption>
          <tbody>
            {area.sizeBands.map((band) => (
              <tr key={band.band} className="border-t">
                <td className="py-1.5 text-gray-700">{band.band}</td>
                <td className="py-1.5 text-right font-semibold text-gray-900">{pkr(band.medianPrice)}</td>
                <td className="py-1.5 text-right text-xs text-gray-500">{band.count} listings</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-gray-500 mt-3">Based on {area.count} asking prices.</p>
      <Link
        to={`/properties?action=${view.purpose}&city=${encodeURIComponent(area.city)}`}
        className="inline-block mt-3 text-red-600 font-semibold hover:underline text-sm"
      >
        See listings in {area.city} on our site →
      </Link>
    </div>
  );
}

function AreaList({ title, areas, view, onPick }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <ol className="space-y-1">
        {areas.map((area) => (
          <li key={area._id}>
            <button
              onClick={() => onPick(area)}
              className="w-full flex justify-between gap-2 text-sm rounded-lg px-2 py-1.5 hover:bg-gray-100 text-left"
            >
              <span className="truncate text-gray-800">{area.location}</span>
              <span className="text-gray-600 whitespace-nowrap">{valueLabel(area.value, view).replace(" / month", "")}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function MarketMap() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const view = {
    city: params.get("city") || "",
    purpose: params.get("purpose") === "rent" ? "rent" : "sell",
    category: params.get("category") || "house",
    mode: params.get("mode") || "price",
    band: params.get("band") || "",
    budget: Number(params.get("budget")) || 0,
  };
  if (view.purpose === "rent" && view.mode === "rentYears") view.mode = "price";

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const setView = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next, { replace: true });
  };

  // Cities list; open the biggest city first
  useEffect(() => {
    api("/market/cities")
      .then((list) => {
        setCities(list);
        if (!params.get("city") && list[0]) setView({ city: list[0].city });
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!view.city) return;
    setLoading(true);
    setSelected(null);
    api(`/market/areas?city=${encodeURIComponent(view.city)}&purpose=${view.purpose}&category=${view.category}`)
      .then((list) => {
        setAreas(list);
        // Opened from a listing's "See on price map" link
        const wanted = params.get("area");
        if (wanted) setSelected(list.find((a) => a.location === wanted) || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.city, view.purpose, view.category]);

  // Each area's number for the current view; areas without data for it are hidden
  const shown = useMemo(
    () =>
      areas
        .map((area) => ({ ...area, value: areaValue(area, view) }))
        .filter((area) => area.value != null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areas, view.mode, view.band]
  );
  const values = shown.map((a) => a.value);
  const breaks = useMemo(() => quintileBreaks(values), [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  const byValue = [...shown].sort((a, b) => a.value - b.value);
  const cityInfo = cities.find((c) => c.city === view.city);

  const fill = (area) => {
    if (view.mode === "budget") return view.budget && area.value <= view.budget ? RAMP[3] : MUTED;
    return colorFor(area.value, breaks);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaMapMarkedAlt className="text-red-500" /> {t("priceMap")}
          </h1>
          <p className="text-gray-500 mt-1">
            Typical asking prices by neighbourhood
            {cityInfo && ` · ${formatMonthYear(cityInfo.dataCollectedOn)} data`}
          </p>
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
        >
          {showTable ? <FaMapMarkedAlt /> : <FaListUl />} {showTable ? "Map view" : "Table view"}
        </button>
      </div>

      {/* Filters: one row above the map */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={view.city}
          onChange={(e) => setView({ city: e.target.value, area: "" })}
          className="px-3 py-2 border rounded-lg bg-white"
          aria-label="City"
        >
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.listings.toLocaleString()})
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            ["sell", t("buy")],
            ["rent", t("rent")],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setView({ purpose: value, area: "" })} className={segmentClass(view.purpose === value)}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
          {CATEGORIES.filter((c) => !(view.purpose === "rent" && c.value === "plot")).map((c) => (
            <button key={c.value} onClick={() => setView({ category: c.value, area: "" })} className={segmentClass(view.category === c.value)}>
              {c.label}
            </button>
          ))}
        </div>

        <select
          value={view.band}
          onChange={(e) => setView({ band: e.target.value })}
          className="px-3 py-2 border rounded-lg bg-white"
          aria-label="Size"
          disabled={view.mode === "rentYears"}
        >
          {SIZE_BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {MODES.filter((m) => !(view.purpose === "rent" && m.value === "rentYears")).map((m) => (
            <button key={m.value} onClick={() => setView({ mode: m.value })} className={segmentClass(view.mode === m.value)}>
              {m.label}
            </button>
          ))}
        </div>

        {view.mode === "budget" && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Budget (PKR)
            <input
              type="number"
              min="0"
              step="100000"
              value={view.budget || ""}
              onChange={(e) => setView({ budget: e.target.value })}
              placeholder={view.purpose === "rent" ? "e.g. 80000" : "e.g. 25000000"}
              className="w-40 px-3 py-2 border rounded-lg"
            />
          </label>
        )}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map or table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
          {showTable ? (
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3">Neighbourhood</th>
                    <th className="text-right p-3">{metricTitle(view)}</th>
                    <th className="text-right p-3">Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {byValue.map((area) => (
                    <tr key={area._id} onClick={() => setSelected(area)} className="border-t hover:bg-gray-50 cursor-pointer">
                      <td className="p-3">{area.location}</td>
                      <td className="p-3 text-right">{valueLabel(area.value, view)}</td>
                      <td className="p-3 text-right text-gray-500">{area.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <MapContainer center={[30.3753, 69.3451]} zoom={5} className="market-map h-[420px] sm:h-[560px] w-full">
              {/* Free OpenStreetMap tiles, shown in grey (see index.css) so the coloured circles stand out */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToAreas areas={shown} />
              <FlyToArea area={selected} />
              {shown.map((area) => (
                <CircleMarker
                  key={area._id}
                  center={[area.lat, area.lng]}
                  radius={radiusFor(area.count)}
                  pathOptions={{
                    color: selected?._id === area._id ? "#111827" : "#ffffff",
                    weight: selected?._id === area._id ? 3 : 2,
                    fillColor: fill(area),
                    fillOpacity: area.lowConfidence ? 0.45 : 0.9,
                  }}
                  eventHandlers={{ click: () => setSelected(area) }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <strong>{area.location}</strong>
                    <br />
                    {valueLabel(area.value, view)}
                    <br />
                    <span style={{ color: "#6b7280" }}>{area.count} listings</span>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
          <div className="p-4 border-t">
            {loading ? (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : shown.length === 0 ? (
              <p className="text-sm text-gray-500">No data for this choice — try another city, type or size.</p>
            ) : (
              <Legend breaks={breaks} view={view} values={values} />
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="bg-white rounded-2xl shadow p-5 h-fit">
          {selected ? (
            <AreaDetails area={selected} view={view} onClose={() => setSelected(null)} />
          ) : view.mode === "budget" ? (
            <div>
              <h2 className="text-lg font-bold mb-1">Where can I afford?</h2>
              <p className="text-sm text-gray-500 mb-4">
                {view.budget
                  ? `${shown.filter((a) => a.value <= view.budget).length} of ${shown.length} neighbourhoods have a typical ${
                      view.purpose === "rent" ? "rent" : "price"
                    } within ${pkr(view.budget)}.`
                  : "Enter your budget above. Pick a size too, for a fairer comparison."}
              </p>
              {view.budget > 0 && (
                <AreaList
                  title="Closest to your budget"
                  areas={byValue.filter((a) => a.value <= view.budget).reverse().slice(0, 8)}
                  view={view}
                  onPick={setSelected}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Tap a circle (or a name below) for details.</p>
              <AreaList title="Lowest" areas={byValue.slice(0, 5)} view={view} onPick={setSelected} />
              <AreaList title="Highest" areas={byValue.slice(-5).reverse()} view={view} onPick={setSelected} />
            </div>
          )}
        </aside>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Based on asking prices from public property listings
        {cityInfo && ` collected in ${formatMonthYear(cityInfo.dataCollectedOn)}`}, after removing duplicates and extreme
        values. Asking prices can differ from final sale prices, and prices have changed since. 1 Marla = 225 sq ft.
      </p>
    </div>
  );
}
