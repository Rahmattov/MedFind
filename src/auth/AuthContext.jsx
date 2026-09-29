import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const TOKEN_KEY = "medfind_access_token";
const USER_KEY = "medfind_patient";
const MOCK_ACCOUNTS_KEY = "medfind_mock_accounts";
const MOCK_SESSION_KEY = "medfind_mock_session";
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

const demoAccount = {
  email: "patient@medfind.demo",
  password: "Patient123!",
  patient: {
    id: "demo-patient",
    firstName: "Shukrulloh",
    lastName: "Rahmatov",
    email: "patient@medfind.demo",
    phone: "+7 700 123 45 67",
    dateOfBirth: "2005-05-15",
    gender: "Male",
    address: "Almaty, Kazakhstan",
    role: "patient",
  },
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function readMockAccounts() {
  try {
    const accounts = JSON.parse(
      localStorage.getItem(MOCK_ACCOUNTS_KEY) || "[]",
    );
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function readMockSession() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function mockAccountError(message) {
  return new Error(message);
}

function getUser(payload) {
  const data = payload?.data ?? payload;
  const user = data?.patient ?? data?.user ?? data;
  return user && (user.id || user.email || user.firstName || user.name)
    ? user
    : null;
}

function getToken(payload) {
  const data = payload?.data ?? payload;
  return data?.accessToken ?? data?.token;
}

async function apiRequest(path, options = {}) {
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
  ).replace(/\/$/, "");
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
        payload?.error ||
        "Не удалось выполнить запрос. Попробуйте ещё раз.",
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

function saveSession(payload, patient) {
  const token = getToken(payload);
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (patient) localStorage.setItem(USER_KEY, JSON.stringify(patient));
  return patient;
}

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(() =>
    USE_MOCK_AUTH ? (readMockSession()?.patient ?? null) : getStoredUser(),
  );
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    apiRequest("/auth/me")
      .then((payload) => {
        const currentPatient = getUser(payload);
        if (!active) return;
        setPatient(currentPatient);
        saveSession(payload, currentPatient);
        setAuthError("");
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setPatient(null);
        } else if (!getStoredUser()) {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function authenticate(path, credentials) {
    const payload = await apiRequest(path, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    let currentPatient = getUser(payload);

    if (!currentPatient) {
      currentPatient = await apiRequest("/auth/me").then(getUser);
    }

    saveSession(payload, currentPatient);
    setPatient(currentPatient);
    setAuthError("");
    return currentPatient;
  }

  async function register(details) {
    if (USE_MOCK_AUTH) {
      const email = details.email.trim().toLowerCase();
      const accounts = readMockAccounts();
      const emailAlreadyUsed =
        email === demoAccount.email ||
        accounts.some((account) => account.email === email);

      if (emailAlreadyUsed) {
        throw mockAccountError(
          "Аккаунт с такой электронной почтой уже существует.",
        );
      }

      const account = {
        email,
        // Demo-only: replace localStorage credentials with backend password hashing/JWT.
        password: details.password,
        patient: {
          id: `patient-${Date.now()}`,
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          email,
          phone: details.phone.trim(),
          dateOfBirth: details.dateOfBirth || "",
          gender: details.gender || "",
          address: details.address || "",
          role: "patient",
        },
      };

      localStorage.setItem(
        MOCK_ACCOUNTS_KEY,
        JSON.stringify([...accounts, account]),
      );
      return account.patient;
    }

    return authenticate("/auth/register", { ...details, role: "patient" });
  }

  async function login(credentials) {
    if (USE_MOCK_AUTH) {
      const email = credentials.email.trim().toLowerCase();
      const account =
        (email === demoAccount.email ? demoAccount : null) ??
        readMockAccounts().find((item) => item.email === email);

      if (!account || account.password !== credentials.password) {
        throw mockAccountError("Неверная электронная почта или пароль.");
      }

      const session = { patient: account.patient };
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
      setPatient(account.patient);
      setAuthError("");
      return account.patient;
    }

    return authenticate("/auth/login", credentials);
  }

  async function refreshProfile() {
    if (USE_MOCK_AUTH) {
      const session = readMockSession();
      const sessionEmail = session?.patient?.email;
      const account =
        sessionEmail === demoAccount.email
          ? demoAccount
          : readMockAccounts().find((item) => item.email === sessionEmail);

      if (!account) {
        localStorage.removeItem(MOCK_SESSION_KEY);
        setPatient(null);
        return null;
      }

      localStorage.setItem(
        MOCK_SESSION_KEY,
        JSON.stringify({ patient: account.patient }),
      );
      setPatient(account.patient);
      return account.patient;
    }

    const payload = await apiRequest("/auth/me");
    const currentPatient = getUser(payload);
    saveSession(payload, currentPatient);
    setPatient(currentPatient);
    setAuthError("");
    return currentPatient;
  }

  async function logout() {
    if (USE_MOCK_AUTH) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      setPatient(null);
      return;
    }

    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Clear the local session even when the API logout endpoint is unavailable.
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setPatient(null);
  }

  return (
    <AuthContext.Provider
      value={{
        patient,
        loading,
        authError,
        register,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
