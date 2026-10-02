import { useState } from "react";
import { formatPrice } from "../utils/format";
import { useLanguage } from "../i18n";

// Monthly instalment for a home loan:
// EMI = P × r × (1 + r)^n / ((1 + r)^n − 1), r = monthly rate, n = number of months
const calculateEmi = (loanAmount, yearlyRatePercent, years) => {
  const months = years * 12;
  const monthlyRate = yearlyRatePercent / 12 / 100;
  if (loanAmount <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return loanAmount / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return (loanAmount * monthlyRate * growth) / (growth - 1);
};

export default function EmiCalculator({ price = 10000000 }) {
  const { t } = useLanguage();
  const [propertyPrice, setPropertyPrice] = useState(price);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);

  const loan = propertyPrice * (1 - downPaymentPercent / 100);
  const emi = calculateEmi(loan, rate, years);
  const totalPaid = emi * years * 12;

  const inputClass = "w-full px-3 py-2 border rounded-md";

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t("emiCalculator")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-sm text-gray-600">
          Property price (PKR)
          <input type="number" min="0" value={propertyPrice} onChange={(e) => setPropertyPrice(Number(e.target.value))} className={inputClass} />
        </label>
        <label className="text-sm text-gray-600">
          Down payment: {downPaymentPercent}%
          <input type="range" min="0" max="90" step="5" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))} className="w-full mt-3" />
        </label>
        <label className="text-sm text-gray-600">
          Yearly interest rate (%)
          <input type="number" min="0" max="40" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className={inputClass} />
        </label>
        <label className="text-sm text-gray-600">
          Loan length (years)
          <input type="number" min="1" max="30" value={years} onChange={(e) => setYears(Number(e.target.value))} className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-center">
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Monthly instalment</p>
          <p className="text-xl font-bold text-red-600">{formatPrice(Math.round(emi))}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Loan amount</p>
          <p className="text-lg font-semibold">{formatPrice(Math.round(loan))}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total interest</p>
          <p className="text-lg font-semibold">{formatPrice(Math.round(totalPaid - loan))}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">An estimate only — ask your bank for exact rates.</p>
    </div>
  );
}
