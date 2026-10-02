import { useState } from "react";
import { FaLink, FaShareAlt, FaWhatsapp } from "react-icons/fa";
import { formatPrice } from "../utils/format";
import { useLanguage } from "../i18n";

// Share a property. The /share/... link shows a photo + price preview in WhatsApp/Facebook.
export default function ShareButtons({ property }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/share/properties/${property._id}`;
  const text = `${property.title} — ${formatPrice(property.price)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  // Phones: open the system share menu
  const nativeShare = () => navigator.share({ title: property.title, text, url: shareUrl }).catch(() => {});

  const buttonClass = "flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-gray-500">{t("share")}:</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`}
        target="_blank"
        rel="noreferrer"
        className={buttonClass}
      >
        <FaWhatsapp className="text-green-600" /> WhatsApp
      </a>
      <button type="button" onClick={copyLink} className={buttonClass}>
        <FaLink /> {copied ? "Copied!" : "Copy link"}
      </button>
      {navigator.share && (
        <button type="button" onClick={nativeShare} className={buttonClass}>
          <FaShareAlt /> More
        </button>
      )}
    </div>
  );
}
