import EmiCalculator from "../components/EmiCalculator";
import AreaConverter from "../components/AreaConverter";
import { useLanguage } from "../i18n";

export default function Tools() {
  const { t } = useLanguage();
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{t("tools")}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <EmiCalculator />
        <AreaConverter />
      </div>
    </div>
  );
}
