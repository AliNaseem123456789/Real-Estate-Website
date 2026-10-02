import { Link, useLocation } from "react-router-dom";
import { clearCompareList, useCompareList } from "../utils/localLists";
import { useLanguage } from "../i18n";

// Small bar at the bottom of the screen while properties are picked for comparing
export default function CompareBar() {
  const compareList = useCompareList();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  if (compareList.length === 0 || pathname === "/compare") return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-full shadow-2xl px-5 py-3 flex items-center gap-4">
      <span className="text-sm">
        {compareList.length} / 3 {t("compare")}
      </span>
      <Link
        to="/compare"
        className="bg-indigo-500 hover:bg-indigo-600 px-4 py-1 rounded-full text-sm font-semibold"
      >
        {t("compare")} →
      </Link>
      <button onClick={clearCompareList} className="text-gray-300 hover:text-white text-sm" aria-label="Clear">
        ✕
      </button>
    </div>
  );
}
