import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PropertyForm from "../components/PropertyForm";
import { api } from "../utils/api";
import { useLanguage } from "../i18n";

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/properties/${id}`)
      .then(setProperty)
      .catch((err) => setError(err.message));
  }, [id]);

  const saveProperty = async (formData) => {
    await api(`/properties/${id}`, { method: "PUT", body: formData });
    navigate(`/properties/${id}`);
  };

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-700 mb-4">{error}</p>
        <Link to="/dashboard" className="text-red-600 font-semibold hover:underline">
          ← {t("myListings")}
        </Link>
      </div>
    );
  }
  if (!property) return <p className="text-center py-20 text-gray-600">{t("loading")}</p>;

  return (
    <div className="bg-white py-10 px-4 sm:px-6 lg:px-20">
      <h1 className="text-3xl font-bold text-center mb-8">{t("editListing")}</h1>
      <PropertyForm property={property} onSubmit={saveProperty} submitLabel={t("saveChanges")} />
    </div>
  );
}
