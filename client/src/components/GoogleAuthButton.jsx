import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { app } from "../firebase";
import { signInFailure, signInSuccess } from "../redux/user/userSlice";

export default function GoogleAuthButton({ label = "Continue with Google" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleClick = async () => {
    try {
      const result = await signInWithPopup(getAuth(app), new GoogleAuthProvider());
      // Send Google's signed token; the server checks it is real
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signInFailure(data.message));
        return;
      }
      dispatch(signInSuccess(data));
      navigate("/");
    } catch (error) {
      console.log("Could not sign in with Google", error);
      dispatch(signInFailure("Could not sign in with Google"));
    }
  };

  return (
    <button
      onClick={handleGoogleClick}
      type="button"
      className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-xl py-3 hover:bg-red-600 hover:text-white transition-all duration-300"
    >
      <FaGoogle /> {label}
    </button>
  );
}
