import { useNavigate } from "react-router-dom";
import PropertyForm from "../components/PropertyForm";
import { api } from "../utils/api";
import building from "../assets/building.webp";

export default function SellProperty() {
  const navigate = useNavigate();

  const createProperty = async (formData) => {
    const property = await api("/properties", { method: "POST", body: formData });
    navigate(`/properties/${property._id}`);
  };

  return (
    <div className="bg-white py-10 px-4 sm:px-6 lg:px-20">
      {/* Banner */}
      <div className="flex flex-col md:flex-row items-center justify-center bg-red-500 rounded-xl text-white mb-10 p-6">
        <h2 className="flex-1 text-3xl sm:text-4xl font-bold text-center md:text-start">
          Upload your property details
        </h2>
        <img
          src={building}
          alt=""
          className="w-[250px] sm:w-[350px] md:w-[400px] lg:w-[500px] h-auto mt-6 md:mt-0 md:ms-10"
        />
      </div>

      <PropertyForm onSubmit={createProperty} />
    </div>
  );
}
