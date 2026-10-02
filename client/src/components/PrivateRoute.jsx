import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";
import NotFound from "../pages/NotFound";

// Shows the page only to signed-in users, otherwise sends them to Sign In
export default function PrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);
  return currentUser ? <Outlet /> : <Navigate to="/sign-in" replace />;
}

// Shows the page only to admins (the server checks again on every request)
export function AdminRoute() {
  const { currentUser } = useSelector((state) => state.user);
  return currentUser?.role === "admin" ? <Outlet /> : <NotFound />;
}
