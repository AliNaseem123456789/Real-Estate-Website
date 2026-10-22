import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./components/Header";
import Footer from "./components/Landing/Footer";
import FloatingChat from "./components/FloatingChat";
import CompareBar from "./components/CompareBar";
import PrivateRoute, { AdminRoute } from "./components/PrivateRoute";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import SellProperty from "./pages/SellProperty";
import EditProperty from "./pages/EditProperty";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import Tools from "./pages/Tools";
import AgentProfile from "./pages/AgentProfile";
import Admin from "./pages/Admin";
import MarketMap from "./pages/MarketMap";
import NotFound from "./pages/NotFound";
import { api } from "./utils/api";
import { signOutUserSuccess, updateUserSuccess } from "./redux/user/userSlice";

export default function App() {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // On page load, refresh the signed-in user from the server
  // (favourites, admin role...). If the login has expired, sign out.
  const userId = currentUser?._id;
  useEffect(() => {
    if (!userId) return;
    api("/user/me")
      .then((user) => dispatch(updateUserSuccess(user)))
      .catch((error) => {
        if (error.status === 401 || error.status === 403) dispatch(signOutUserSuccess());
      });
  }, [userId, dispatch]);

  return (
    <BrowserRouter>
      <Header />
      {/* bottom padding leaves room for the mobile bottom bar */}
      <div className="pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/market" element={<MarketMap />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/agents/:id" element={<AgentProfile />} />

          {/* Pages that need the user to be signed in */}
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/sell" element={<SellProperty />} />
            <Route path="/properties/:id/edit" element={<EditProperty />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
      <CompareBar />
      <FloatingChat primaryColor="#10B981" userId={currentUser?._id} />
    </BrowserRouter>
  );
}
