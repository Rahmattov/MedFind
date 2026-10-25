import { apiRequest } from "./client";

export function getAppointmentAvailability(doctorId, date, options = {}) {
  const query = new URLSearchParams({ doctorId, date });
  return apiRequest(`/appointments/availability?${query}`, options);
}

export function createAppointment(details, options = {}) {
  return apiRequest("/appointments", {
    ...options,
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function listMyAppointments(options = {}) {
  return apiRequest("/appointments/me", options);
}

export function cancelAppointment(id, options = {}) {
  return apiRequest(`/appointments/${encodeURIComponent(id)}/cancel`, {
    ...options,
    method: "PATCH",
  });
}
