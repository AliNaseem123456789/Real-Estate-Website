import { useState } from "react";
import { AREA_UNITS, convertArea } from "../utils/format";
import { useLanguage } from "../i18n";

// Converts between Marla, Kanal, square feet and square yards
export default function AreaConverter({ initialValue = 1, initialUnit = "marla" }) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);
  const [unit, setUnit] = useState(initialUnit);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t("areaConverter")}</h2>
      <div className="flex gap-3">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="px-3 py-2 border rounded-md bg-white">
          {Object.entries(AREA_UNITS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {Object.entries(AREA_UNITS)
          .filter(([key]) => key !== unit)
          .map(([key, { label }]) => (
            <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-semibold">
                {Number(convertArea(value || 0, unit, key).toFixed(2)).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        1 Marla = 225 sq ft and 1 Kanal = 20 Marla (the size most housing societies use).
      </p>
    </div>
  );
}
