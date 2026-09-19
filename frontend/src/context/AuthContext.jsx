import { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../api";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const { id, role, name } = parseJwt(token);
    return { token, id, role, name };
  });

  async function login(email, password) {
    const data = await apiLogin({ email, password });
    const { id } = parseJwt(data.token);
    localStorage.setItem("token", data.token);
    setUser({ token: data.token, id, role: data.role, name: data.name });
  }

  async function register(name, email, password, role) {
    const data = await apiRegister({ name, email, password, role });
    const { id } = parseJwt(data.token);
    localStorage.setItem("token", data.token);
    setUser({ token: data.token, id, role: data.role, name: data.name });
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
