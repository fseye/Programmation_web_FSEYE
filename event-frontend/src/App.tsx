import { useState, useEffect } from "react";
import AppRoutes from "./AppRoutes";
import { validateToken } from "./API/auth-actions";
import type { User } from "./utils/types";
import { Toaster } from "react-hot-toast";


export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await validateToken();
        setUser(user);
      } catch {
        setUser(null);
      }
    };
    initAuth();
  }, []);

  return <> <AppRoutes user={user} setUser={setUser} />
    <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "rgba(30,30,30,0.9)",
              color: "#fff",
              borderRadius: "12px",
              backdropFilter: "blur(6px)"
            }
          }}
    />
  </>;
}

