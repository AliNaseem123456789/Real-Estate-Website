import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { api } from "../utils/api";
import { setFavorites } from "../redux/user/userSlice";

// Heart button that saves a property to the signed-in user's favourites
export default function FavoriteButton({ propertyId, className = "" }) {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const isSaved = currentUser?.favorites?.includes(propertyId);

  const handleClick = async (e) => {
    e.preventDefault(); // the button can sit inside a link
    if (!currentUser) return navigate("/sign-in");

    setBusy(true);
    try {
      const favorites = await api(`/user/favorites/${propertyId}`, { method: "POST" });
      dispatch(setFavorites(favorites));
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`bg-white/90 p-2 rounded-full shadow ${className}`}
      aria-label={isSaved ? "Remove from saved" : "Save property"}
      title={isSaved ? "Remove from saved" : "Save property"}
    >
      <FaHeart className={`text-lg ${isSaved ? "text-red-500" : "text-gray-400"}`} />
    </button>
  );
}
