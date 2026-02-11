import { Navigate, Route, Routes } from "react-router-dom";
import EventsPage from "./Page/EventsPage";
import HomePage from "./Page/HomePage";
import EventDetailPage from "./Page/EventDetailPage";
import type { User } from "./utils/types";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function AppRoutes({ user, setUser }: Props) {
  const token = localStorage.getItem("token");
  const isAuthenticated = Boolean(token && user);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/events" /> : <HomePage setUser={setUser} />}
      />
      <Route
        path="/events"
        element={isAuthenticated ? <EventsPage /> : <Navigate to="/" />}
      />
      <Route
        path="/events/:eventId"
        element={isAuthenticated ? <EventDetailPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}
