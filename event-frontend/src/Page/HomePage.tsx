import { useState, type FormEvent } from "react";
import { login, signup, validateToken } from "../API/auth-actions";
import { useNavigate } from "react-router-dom";
import type { User } from "../utils/types";
import "./styles/HomePage.scss";

// welcome page with login/signup form
type Props = {
  setUser: (user: User | null) => void;
};


export default function HomePage({ setUser }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password);
      }

      const user = await validateToken();
      setUser(user);
      navigate("/events");
    } catch (err: any) {
      alert(err.message || "Erreur");
    }
  }

  return (
    <div className="auth-container">
      <h1>Bienvenue sur le site de Fatou!</h1>
      <h2>{mode === "login" ? "Connexion" : "Inscription"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{mode === "login" ? "Se connecter" : "S'inscrire"}</button>
      </form>
      <button
        className="switch-mode"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login"
          ? "Pas encore de compte ? S'inscrire"
          : "Déjà un compte ? Se connecter"}
      </button>
    </div>
  );
}
