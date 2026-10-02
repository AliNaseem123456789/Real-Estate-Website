import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Modal from "react-modal";
import {
  FaBed,
  FaBath,
  FaExpand,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaCheckCircle,
  FaFlag,
  FaEdit,
} from "react-icons/fa";
import ImageGallery from "../components/ImageGallery";
import { PropertyMap } from "../components/Maps";
import EnquiryForm from "../components/EnquiryForm";
import EmiCalculator from "../components/EmiCalculator";
import ShareButtons from "../components/ShareButtons";
import FavoriteButton from "../components/FavoriteButton";
import CompareButton from "../components/CompareButton";
import RecentlyViewed from "../components/RecentlyViewed";
import PriceCheck from "../components/PriceCheck";
import { api } from "../utils/api";
import { addRecentlyViewed } from "../utils/localLists";
import { AREA_UNITS, formatPrice, whatsappLink } from "../utils/format";
import { useLanguage } from "../i18n";

Modal.setAppElement("#root");

// "10 Marla" → "2,250 sq ft · 0.5 Kanal"
function OtherAreaUnits({ areaSqft }) {
  if (!areaSqft) return null;
  const marla = areaSqft / AREA_UNITS.marla.sqft;
  return (
    <p className="text-sm text-gray-500">
      = {areaSqft.toLocaleString()} sq ft · {+marla.toFixed(2)} Marla · {+(marla / 20).toFixed(2)} Kanal
    </p>
  );
}

function ReportForm({ propertyId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const sendReport = async (e) => {
    e.preventDefault();
    try {
      setMessage(await api(`/properties/${propertyId}/report`, { method: "POST", body: { reason } }));
      setOpen(false);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (message) return <p className="text-sm text-gray-500">{message}</p>;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600">
        <FaFlag /> Report this listing
      </button>
    );
  }
  return (
    <form onSubmit={sendReport} className="flex gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong? (fake, already sold, wrong price...)"
        className="flex-1 border rounded-md px-3 py-2 text-sm"
        required
      />
      <button className="px-3 py-2 bg-gray-800 text-white rounded-md text-sm">Send</button>
    </form>
  );
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { currentUser } = useSelector((state) => state.user);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    setProperty(null);
    setError(null);
    api(`/properties/${id}`)
      .then((data) => {
        setProperty(data);
        addRecentlyViewed(id);
      })
      .catch((err) => setError(err.message));
    window.scrollTo(0, 0);
  }, [id]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-700 text-xl mb-4">{error}</p>
        <Link to="/properties" className="text-red-600 font-semibold hover:underline">
          ← Back to properties
        </Link>
      </div>
    );
  }
  if (!property) return <div className="text-center py-20 text-gray-600">{t("loading")}</div>;

  const owner = property.owner; // may be missing on very old listings
  const canEdit = currentUser && (owner?._id === currentUser._id || currentUser.role === "admin");
  const isPlot = property.type === "Plot";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {property.approved === false && (
          <p className="mb-6 bg-yellow-100 text-yellow-800 rounded-lg p-3">{t("pending")}</p>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Photos */}
          <div className="lg:w-3/5">
            <ImageGallery images={property.images} title={property.title} />
          </div>

          {/* Main details */}
          <div className="lg:w-2/5 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-semibold">
                {property.action === "sell" ? t("forSale") : t("forRent")} · {t(property.type.toLowerCase())}
              </span>
              {property.sold && (
                <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-sm font-bold uppercase">
                  {t("sold")}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">{property.title}</h1>
              <p className="flex items-center gap-2 text-gray-500 mt-2">
                <FaMapMarkerAlt /> {property.address}, {property.city}
              </p>
            </div>

            <p className="text-3xl font-semibold text-red-500">
              {formatPrice(property.price)}
              {property.action === "rent" && <span className="text-base text-gray-500"> / month</span>}
            </p>

            <div>
              <div className="flex flex-wrap gap-6 text-gray-600 text-lg">
                {!isPlot && (
                  <>
                    <span className="flex items-center gap-2">
                      <FaBed /> {property.bedroom} {t("beds")}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaBath /> {property.bathroom} {t("baths")}
                    </span>
                  </>
                )}
                <span className="flex items-center gap-2">
                  <FaExpand /> {property.size}
                </span>
              </div>
              <OtherAreaUnits areaSqft={property.areaSqft} />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-3 gap-3">
              <a href={`tel:${property.publisher_num}`} className="py-3 bg-white border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 flex items-center justify-center gap-2">
                <FaPhone /> {t("call")}
              </a>
              <a
                href={whatsappLink(property.publisher_num, `Hi, I saw "${property.title}" on Profit Builders. Is it still available?`)}
                target="_blank"
                rel="noreferrer"
                className="py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <FaWhatsapp /> {t("whatsapp")}
              </a>
              <button onClick={() => setEnquiryOpen(true)} className="py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 flex items-center justify-center gap-2">
                <FaEnvelope /> {t("message")}
              </button>
            </div>
            <p className="text-sm text-gray-500 -mt-2">{property.publisher_num}</p>

            <div className="flex flex-wrap items-center gap-3">
              <FavoriteButton propertyId={property._id} className="border" />
              <CompareButton propertyId={property._id} className="py-2" />
              {canEdit && (
                <Link to={`/properties/${property._id}/edit`} className="flex items-center gap-2 text-sm px-3 py-2 rounded-full border bg-white hover:bg-gray-50">
                  <FaEdit /> {t("editListing")}
                </Link>
              )}
            </div>

            <ShareButtons property={property} />

            {/* Posted by */}
            <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
              {owner?.avatar && <img src={owner.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />}
              <div>
                <p className="text-sm text-gray-500">{t("postedBy")}</p>
                {owner ? (
                  <Link to={`/agents/${owner._id}`} className="font-semibold text-gray-800 hover:underline flex items-center gap-1">
                    {owner.agency || property.publisher_name}
                    {owner.verified && <FaCheckCircle className="text-blue-500" title={t("verified")} />}
                  </Link>
                ) : (
                  <p className="font-semibold text-gray-800">{property.publisher_name}</p>
                )}
                <p className="text-sm text-gray-500">{property.publisher_email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description + map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3">{t("description")}</h2>
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          </div>
          {property.location?.lat && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-3">{t("location")}</h2>
              <PropertyMap location={property.location} />
            </div>
          )}
        </div>

        <div className="mt-10">
          <PriceCheck propertyId={property._id} />
        </div>

        {property.action === "sell" && (
          <div className="mt-10">
            <EmiCalculator key={property._id} price={property.price} />
          </div>
        )}

        {currentUser && !canEdit && (
          <div className="mt-6">
            <ReportForm propertyId={property._id} />
          </div>
        )}
      </div>

      <RecentlyViewed excludeId={property._id} />

      {/* Enquiry pop-up */}
      <Modal
        isOpen={enquiryOpen}
        onRequestClose={() => setEnquiryOpen(false)}
        className="max-w-md w-full mx-4 mt-24 bg-white rounded-xl shadow-lg p-6 outline-none"
        overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-start z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Message {property.publisher_name}</h2>
          <button onClick={() => setEnquiryOpen(false)} className="text-2xl text-gray-500" aria-label="Close">
            &times;
          </button>
        </div>
        {owner ? (
          <EnquiryForm property={property} />
        ) : (
          <p className="text-gray-600">
            This seller can be reached by phone or WhatsApp: {property.publisher_num}
          </p>
        )}
      </Modal>
    </div>
  );
}
