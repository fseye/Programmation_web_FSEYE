import type { LoginResponse, User } from "../utils/types";

// POST login
export async function login(username: string, password: string): Promise<string> {
  // console.log("Logging in with", username, password);
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }
  // console.log("Login response", res);
  const data: LoginResponse = await res.json();
  localStorage.setItem("token", data.token);
  // console.log("Token stored:", data.token);
  return data.token;
}

// POST signup
export async function signup(username: string, password: string): Promise<string> {
  // console.log("Signing up with", username, password);
  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  // console.log("Signup response", res);
  if (!res.ok) {
    let msg = "Cannot create user";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  // console.log("Signup successful");
  const data: LoginResponse = await res.json();
  localStorage.setItem("token", data.token);
  return data.token;
}

// GET validate token and get user info
export async function validateToken(): Promise<User> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("No token found");
    }
    // console.log("Validating token:", token);
    const res = await fetch("/api/me", {
        headers: {
            "Authorization": `Bearer ${token}`
        },
    });
    // console.log("Token validation response", res);
    if (!res.ok) {
        // Handle 401 Unauthorized - invalid/expired token
        if (res.status === 401) {
            localStorage.removeItem("token");
            throw new Error("Invalid or expired token");
        }
        throw new Error("Token validation failed");
    }
 // console.log("Token valid, fetching user info");
    const data = await res.json();
    return data.user;
}