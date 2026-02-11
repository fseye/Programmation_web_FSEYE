// import { useMemo } from "react";
// import { Navigate, Route, Routes } from "react-router-dom";
// import type { User } from "./utils/types";
// import LoginPage from "./Page/LoginPage";
// import SignUpPage from "./Page/SignUpPage";
// import FirstPage from "./Page/FirstPage";
// import EventsPage from "./Page/EventsPage";

// type Props = {
//   user: User | null;
//   setUser: (user: User | null) => void; //  ajouter setUser ici
// };

// export default function AppRoutes({ user, setUser }: Props) {
//   const token = localStorage.getItem("token");
//   const isAuthenticated = useMemo(
//     () => Boolean(token && user),
//     [token, user]
//   );

//   return (
//     <Routes>
//       <Route
//         path="/"
//         element={isAuthenticated ? <Navigate to="/events" /> : <FirstPage />}
//       />

//       <Route path="/login" element={<LoginPage setUser={setUser} />} />

//       <Route
//         path="/signup"
//         element={<SignUpPage setUser={setUser} />}
//        />


//       <Route
//         path="/events"
//         element={isAuthenticated ? <EventsPage /> : <Navigate to="/login" />}
//       />
//     </Routes>
//   );
// }

import { Navigate, Route, Routes } from "react-router-dom";
import EventsPage from "./Page/EventsPage";
import HomePage from "./Page/HomePage";
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
    </Routes>
  );
}
