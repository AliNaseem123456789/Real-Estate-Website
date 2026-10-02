import { FaBalanceScale } from "react-icons/fa";
import { MAX_COMPARE, toggleCompare, useCompareList } from "../utils/localLists";
import { useLanguage } from "../i18n";

// Adds / removes a property from the compare list (max 3)
export default function CompareButton({ propertyId, className = "" }) {
  const compareList = useCompareList();
  const { t } = useLanguage();
  const selected = compareList.includes(propertyId);

  const handleClick = (e) => {
    e.preventDefault();
    if (!toggleCompare(propertyId)) {
      alert(`You can compare up to ${MAX_COMPARE} properties. Remove one first.`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border transition ${
        selected
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-600 border-gray-300 hover:border-indigo-500"
      } ${className}`}
    >
      <FaBalanceScale /> {selected ? t("inCompare") : t("addToCompare")}
    </button>
  );
}
