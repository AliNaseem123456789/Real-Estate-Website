import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
} from "../redux/user/userSlice.js";

export default function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({});
  const [avatarStatus, setAvatarStatus] = useState(""); // "", "uploading", "done", "error"
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const dispatch = useDispatch();

  // Uploads the new photo to Cloudinary (through our API); it is saved on "Update Profile"
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarStatus("uploading");
    const body = new FormData();
    body.append("avatar", file);

    try {
      const res = await fetch("/api/user/avatar", { method: "POST", body });
      const data = await res.json();
      if (data.success === false) throw new Error(data.message);
      setFormData((prev) => ({ ...prev, avatar: data.url }));
      setAvatarStatus("done");
    } catch {
      setAvatarStatus("error");
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) return;
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess());
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch("/api/auth/signout");
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        return;
      }
      dispatch(signOutUserSuccess());
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300";

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 py-12 px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Your Profile</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="relative group"
            aria-label="Change profile photo"
          >
            <img
              src={formData.avatar || currentUser.avatar}
              alt="profile"
              className="rounded-full h-28 w-28 object-cover border-4 border-gray-200 shadow-lg transition-all duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold text-sm">
              Change
            </span>
          </button>
          <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleAvatarChange} />
          <p className="text-sm mt-2">
            {avatarStatus === "uploading" && <span className="text-gray-700">Uploading…</span>}
            {avatarStatus === "done" && (
              <span className="text-green-600">Photo uploaded — click Update Profile to save</span>
            )}
            {avatarStatus === "error" && (
              <span className="text-red-600">Error uploading image (max 5 MB)</span>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="username" className="font-medium text-gray-700 mb-1 block">
              Username
            </label>
            <input type="text" id="username" defaultValue={currentUser.username} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="email" className="font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <input type="email" id="email" defaultValue={currentUser.email} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="password" className="font-medium text-gray-700 mb-1 block">
              New password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Leave empty to keep your password"
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Agent profile (public page: /agents/your-id) */}
          <div className="border rounded-xl p-4 space-y-4">
            <label className="flex items-center gap-2 font-medium text-gray-700">
              <input type="checkbox" id="isAgent" defaultChecked={currentUser.isAgent} onChange={handleChange} />
              I am a real estate agent (show my phone and email on my public profile)
            </label>
            <input type="tel" id="phone" placeholder="Phone / WhatsApp" defaultValue={currentUser.phone} onChange={handleChange} className={inputClass} />
            <input type="text" id="agency" placeholder="Agency name (optional)" defaultValue={currentUser.agency} onChange={handleChange} className={inputClass} />
            <textarea id="bio" rows={3} maxLength={500} placeholder="About you (optional)" defaultValue={currentUser.bio} onChange={handleChange} className={inputClass} />
            <Link to={`/agents/${currentUser._id}`} className="inline-block text-sm text-indigo-600 hover:underline">
              View my public profile →
              {currentUser.verified && " (verified ✔)"}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || avatarStatus === "uploading"}
            className="bg-white text-red-600 font-semibold py-3 rounded-xl shadow-md border border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 disabled:opacity-70"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Link
            className="bg-green-600 text-white py-3 rounded-xl text-center hover:bg-green-700 transition-all duration-300"
            to="/dashboard"
          >
            My Listings & Enquiries
          </Link>
          <Link
            className="bg-pink-600 text-white py-3 rounded-xl text-center hover:bg-pink-700 transition-all duration-300"
            to="/favorites"
          >
            Saved Properties
          </Link>
          <button
            onClick={handleDeleteUser}
            className="bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-all duration-300"
          >
            Delete Account
          </button>
          <button
            onClick={handleSignOut}
            className="bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300"
          >
            Sign Out
          </button>
        </div>

        {updateSuccess && (
          <p className="text-green-600 text-center mt-4">Profile updated successfully!</p>
        )}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
