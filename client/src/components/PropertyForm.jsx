import { useState } from "react";
import { useSelector } from "react-redux";
import { FaHome, FaDollarSign, FaBuilding, FaMapMarkedAlt, FaTimes } from "react-icons/fa";
import { LocationPicker } from "./Maps";
import { AREA_UNITS, splitSize } from "../utils/format";
import { useLanguage } from "../i18n";

const MAX_IMAGES = 4;

const inputClass = "px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 w-full";

const choiceClass = (selected) =>
  `flex items-center gap-2 px-4 py-2 border rounded-lg font-semibold ${
    selected ? "border-orange-700 bg-orange-100" : "border-gray-300"
  }`;

// The form used by both "Sell a property" and "Edit listing".
//   property: the listing being edited (leave out for a new one)
//   onSubmit(formData): sends the form; should throw an Error if it fails
export default function PropertyForm({ property, onSubmit, submitLabel }) {
  const { currentUser } = useSelector((state) => state.user);
  const { t } = useLanguage();
  const initialSize = splitSize(property?.size);

  const [formData, setFormData] = useState({
    action: property?.action || "",
    type: property?.type || "",
    sizeValue: initialSize.value,
    sizeUnit: initialSize.unit,
    title: property?.title || "",
    city: property?.city || "",
    address: property?.address || "",
    description: property?.description || "",
    price: property?.price ?? "",
    bedroom: property?.bedroom ?? "",
    bathroom: property?.bathroom ?? "",
    publisher_name: property?.publisher_name || currentUser?.username || "",
    publisher_num: property?.publisher_num || currentUser?.phone || "",
    publisher_email: property?.publisher_email || currentUser?.email || "",
  });
  const [location, setLocation] = useState(property?.location?.lat ? property.location : null);
  const [keptImages, setKeptImages] = useState(property?.images || []); // already uploaded
  const [newImages, setNewImages] = useState([]); // picked files
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ACTIONS = [
    { value: "rent", label: t("rent"), icon: <FaHome /> },
    { value: "sell", label: t("sell"), icon: <FaDollarSign /> },
  ];
  const TYPES = [
    { value: "Residential", label: t("residential"), icon: <FaHome /> },
    { value: "Commercial", label: t("commercial"), icon: <FaBuilding /> },
    { value: "Plot", label: t("plot"), icon: <FaMapMarkedAlt /> },
  ];

  const setField = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));
  const handleChange = (e) => setField(e.target.name, e.target.value);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    if (keptImages.length + files.length > MAX_IMAGES) {
      setError(`A listing can have up to ${MAX_IMAGES} photos`);
      e.target.value = "";
      return;
    }
    setError("");
    setNewImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.action || !formData.type) return setError("Please choose Rent/Sell and a property type");
    if (keptImages.length + newImages.length === 0) return setError("Please add at least 1 photo");

    const { sizeValue, sizeUnit, ...fields } = formData;
    const data = new FormData();
    Object.entries(fields).forEach(([key, value]) => data.append(key, value));
    data.append("size", `${sizeValue} ${AREA_UNITS[sizeUnit].label}`);
    if (location) {
      data.append("lat", location.lat);
      data.append("lng", location.lng);
    }
    data.append("keepImages", JSON.stringify(keptImages));
    newImages.forEach((image) => data.append("images", image));

    setLoading(true);
    setError("");
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err.message || "Saving failed, please try again");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <div>
        <p className="text-lg font-semibold text-gray-700 mb-2">{t("whatToDo")}</p>
        <div className="flex flex-wrap gap-4">
          {ACTIONS.map((option) => (
            <button key={option.value} type="button" onClick={() => setField("action", option.value)} className={choiceClass(formData.action === option.value)}>
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-lg font-semibold text-gray-700 mb-2">{t("propertyKind")}</p>
        <div className="flex flex-wrap gap-4">
          {TYPES.map((option) => (
            <button key={option.value} type="button" onClick={() => setField("type", option.value)} className={choiceClass(formData.type === option.value)}>
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" name="title" placeholder={t("title")} value={formData.title} onChange={handleChange} className={inputClass} required />
        <input type="text" name="city" placeholder={t("city")} value={formData.city} onChange={handleChange} className={inputClass} required />
        <input type="text" name="address" placeholder={t("address")} value={formData.address} onChange={handleChange} className={inputClass} required />
        <div className="flex gap-2">
          <input type="number" min="0" step="any" name="sizeValue" placeholder={t("size")} value={formData.sizeValue} onChange={handleChange} className={inputClass} required />
          <select name="sizeUnit" value={formData.sizeUnit} onChange={handleChange} className="px-3 py-2 border rounded-md bg-white">
            {Object.entries(AREA_UNITS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <input type="number" min="0" name="price" placeholder={t("price")} value={formData.price} onChange={handleChange} className={inputClass} required />
        {formData.type !== "Plot" && (
          <>
            <input type="number" min="0" name="bedroom" placeholder={t("bedrooms")} value={formData.bedroom} onChange={handleChange} className={inputClass} />
            <input type="number" min="0" name="bathroom" placeholder={t("bathrooms")} value={formData.bathroom} onChange={handleChange} className={inputClass} />
          </>
        )}
      </div>

      <textarea name="description" placeholder={t("describe")} value={formData.description} onChange={handleChange} className={inputClass} rows={5} required />

      {/* Photos */}
      <div>
        <p className="font-semibold text-gray-700 mb-2">{t("photos")}</p>
        {keptImages.length > 0 && (
          <div className="flex gap-3 mb-3 flex-wrap">
            {keptImages.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => setKeptImages(keptImages.filter((u) => u !== url))}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs"
                  aria-label="Remove photo"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
        {keptImages.length < MAX_IMAGES && <input type="file" accept="image/*" multiple onChange={handleImages} />}
        <p className="text-sm text-gray-500 mt-1">
          Up to {MAX_IMAGES} photos, 5 MB each. The first photo is the cover.
        </p>
        {newImages.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {newImages.map((image) => (
              <img key={image.name} src={URL.createObjectURL(image)} alt={image.name} className="w-24 h-24 object-cover rounded-lg border" />
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div>
        <p className="font-semibold text-gray-700 mb-2">{t("pinOnMap")}</p>
        <LocationPicker
          value={location}
          onChange={setLocation}
          defaultSearch={[formData.address, formData.city].filter(Boolean).join(", ")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" name="publisher_name" placeholder={t("yourName")} value={formData.publisher_name} onChange={handleChange} className={inputClass} required />
        <input type="tel" name="publisher_num" placeholder={`${t("phone")} (WhatsApp)`} value={formData.publisher_num} onChange={handleChange} className={inputClass} required />
        <input type="email" name="publisher_email" placeholder={t("email")} value={formData.publisher_email} onChange={handleChange} className={inputClass} required />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg mt-4 disabled:opacity-60">
        {loading ? t("uploading") : submitLabel || t("publish")}
      </button>
    </form>
  );
}
