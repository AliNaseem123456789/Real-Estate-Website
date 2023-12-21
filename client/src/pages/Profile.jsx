import { useSelector } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
} from '../redux/user/userSlice.js';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

export default function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData({ ...formData, avatar: downloadURL })
        );
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 py-12 px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Your Profile
        </h1>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              onClick={() => fileRef.current.click()}
              src={formData.avatar || currentUser.avatar}
              alt="profile"
              className="rounded-full h-28 w-28 object-cover border-4 border-gray-200 shadow-lg cursor-pointer transition-all duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white font-semibold text-sm">
                Change
              </span>
            </div>
          </div>
          <input
            type="file"
            ref={fileRef}
            hidden
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <p className="text-sm mt-2">
            {fileUploadError ? (
              <span className="text-red-600">
                Error uploading image (max 2MB)
              </span>
            ) : filePerc > 0 && filePerc < 100 ? (
              <span className="text-gray-700">{`Uploading ${filePerc}%`}</span>
            ) : filePerc === 100 ? (
              <span className="text-green-600">Upload complete!</span>
            ) : (
              ''
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="username" className="font-medium text-gray-700 mb-1 block">
              Username
            </label>
            <input
              type="text"
              id="username"
              defaultValue={currentUser.username}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
            />
          </div>

          <div>
            <label htmlFor="email" className="font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <input
              type="email"
              id="email"
              defaultValue={currentUser.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
            />
          </div>

          <div>
            <label htmlFor="password" className="font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <input
              type="password"
              id="password"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-red-600 font-semibold py-3 rounded-xl shadow-md border border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 disabled:opacity-70"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        {/* Links */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
          <Link
            className="bg-green-600 text-white py-3 rounded-xl text-center hover:bg-green-700 transition-all duration-300"
            to="/create-listing"
          >
            Create Listing
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

        {/* Success/Error Messages */}
        {updateSuccess && (
          <p className="text-green-600 text-center mt-4">
            User updated successfully!
          </p>
        )}
        {error && (
          <p className="text-red-600 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
