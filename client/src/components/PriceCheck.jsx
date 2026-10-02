import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartBar } from "react-icons/fa";
import { api } from "../utils/api";
import { RAMP, formatMonthYear, pkr } from "../utils/market";

const VERDICTS = {
  below: "Below the typical range",
  typical: "Within the typical range",
  above: "Above the typical range",
};

// "Is this a good price?" — compares a listing's price per Marla with its neighbourhood
export default function PriceCheck({ propertyId }) {
  const [check, setCheck] = useState(null);

  useEffect(() => {
    setCheck(null);
    api(`/market/price-check/${propertyId}`)
      .then(setCheck)
      .catch(() => setCheck(null));
  }, [propertyId]);

  if (!check?.found || !check.verdict) return null;

  const { area, pricePerMarla, differencePct, verdict } = check;
  const rent = area.purpose === "rent";

  // Scale for the little bar: a bit wider than the typical range, and wide enough for this listing
  const low = Math.min(area.p25PricePerMarla * 0.6, pricePerMarla * 0.95);
  const high = Math.max(area.p75PricePerMarla * 1.4, pricePerMarla * 1.05);
  const position = (value) => `${((value - low) / (high - low)) * 100}%`;

  const mapLink = `/market?city=${encodeURIComponent(area.city)}&purpose=${area.purpose}&category=${
    area.category
  }&area=${encodeURIComponent(area.location)}`;

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
        <FaChartBar className="text-gray-400" /> Price check
      </h2>
      <p className="text-gray-800">
        <strong>{VERDICTS[verdict]}</strong> for {area.location}:{" "}
        {pkr(pricePerMarla)} per Marla{rent && " / month"}, which is{" "}
        <strong>
          {Math.abs(differencePct)}% {differencePct < 0 ? "below" : "above"}
        </strong>{" "}
        the typical {pkr(area.medianPricePerMarla)}.
      </p>

      {/* Typical range (shaded) with this listing's marker */}
      <div className="relative h-10 mt-5" aria-hidden="true">
        <div className="absolute top-4 left-0 right-0 h-2 rounded-full bg-gray-100" />
        <div
          className="absolute top-4 h-2 rounded-full"
          style={{
            left: position(area.p25PricePerMarla),
            width: `calc(${position(area.p75PricePerMarla)} - ${position(area.p25PricePerMarla)})`,
            background: RAMP[1],
          }}
        />
        <div className="absolute top-2 w-1 h-6 rounded-full bg-gray-900" style={{ left: position(pricePerMarla) }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Typical range: {pkr(area.p25PricePerMarla)} – {pkr(area.p75PricePerMarla)} per Marla</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1 h-3 bg-gray-900 rounded-full" /> This listing
        </span>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Compared with {area.count} {area.category} listings for {rent ? "rent" : "sale"} in {area.location}, {area.city} (asking
        prices, {formatMonthYear(area.dataCollectedOn)}){area.lowConfidence && " — few listings, so only a rough guide"}.{" "}
        <Link to={mapLink} className="text-red-600 hover:underline">
          See on the price map →
        </Link>
      </p>
    </div>
  );
}
