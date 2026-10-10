export const ACCESS_TOKEN_KEY = "medfind_access_token";
export const USER_KEY = "medfind_patient";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5195/api"
).replace(/\/$/, "");

function getErrorMessage(payload) {
  const message = payload?.error ?? payload?.message ?? payload?.detail ?? payload?.title;
  if (message) return message;

  if (payload?.errors) {
    const validationMessages = Object.values(payload.errors)
      .flat()
      .filter((value) => typeof value === "string");
    if (validationMessages.length > 0) return validationMessages.join(" ");
  }

  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте позже.",
    );
  }

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
    const error = new Error(getErrorMessage(payload));
    error.status = response.status;
    throw error;
  }

  return payload;
}
