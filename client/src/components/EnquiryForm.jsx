import { useState } from "react";
import { useSelector } from "react-redux";
import { api } from "../utils/api";
import { useLanguage } from "../i18n";

// Sends a message to the seller; it shows up in their "My Listings → Enquiries"
export default function EnquiryForm({ property, onSent }) {
  const { currentUser } = useSelector((state) => state.user);
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: currentUser?.username || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    message: `Hi, I'm interested in "${property.title}". Is it still available?`,
  });
  const [status, setStatus] = useState({ loading: false, error: "", sent: false });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", sent: false });
    try {
      await api("/enquiries", { method: "POST", body: { ...form, propertyId: property._id } });
      setStatus({ loading: false, error: "", sent: true });
      onSent?.();
    } catch (error) {
      setStatus({ loading: false, error: error.message, sent: false });
    }
  };

  if (status.sent) {
    return (
      <p className="text-green-700 bg-green-50 rounded-lg p-4">
        ✔ Your message was sent. The seller will contact you soon.
      </p>
    );
  }

  const inputClass = "w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-gray-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input name="name" value={form.name} onChange={handleChange} placeholder={t("yourName")} className={inputClass} required />
      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder={t("email")} className={inputClass} required />
      <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder={t("phone")} className={inputClass} />
      <textarea name="message" value={form.message} onChange={handleChange} rows={4} className={`${inputClass} resize-none`} required />
      {status.error && <p className="text-red-600 text-sm">{status.error}</p>}
      <button
        type="submit"
        disabled={status.loading}
        className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-md font-semibold disabled:opacity-60"
      >
        {status.loading ? t("loading") : t("sendEnquiry")}
      </button>
    </form>
  );
}
