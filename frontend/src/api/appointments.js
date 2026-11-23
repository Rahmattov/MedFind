import { apiRequest } from "./client";

const MISSING_WORKING_HOURS_ERROR = "Doctor or clinic not found.";

export function isSlotAvailable(slot) {
  if (!slot || typeof slot !== "object") return false;
  if (typeof slot.startTime !== "string" || !slot.startTime.trim()) return false;
  if (
    slot.isAvailable === false ||
    slot.available === false ||
    slot.isBooked === true
  ) {
    return false;
  }
  if (
    typeof slot.status === "string" &&
    slot.status.trim().toLowerCase() !== "available"
  ) {
    return false;
  }
  return true;
}

export async function getAppointmentAvailability(doctorId, date, options = {}) {
  const query = new URLSearchParams({ doctorId, date });
  const data = await apiRequest(`/appointments/availability?${query}`, options);
  if (!Array.isArray(data)) {
    throw new Error("Сервер вернул некорректный список времени.");
  }
  return data.filter(isSlotAvailable);
}

export async function getAppointmentSlots(
  doctorId,
  clinicId,
  date,
  options = {},
) {
  const { isKnownDoctorClinic = false, ...requestOptions } = options;
  const query = new URLSearchParams({
    doctorId: String(doctorId),
    date: String(date),
    clinicId: String(clinicId),
  });

  try {
    const data = await apiRequest(
      `/appointments/slots?${query.toString()}`,
      requestOptions,
    );
    if (!Array.isArray(data)) {
      throw new Error("Сервер вернул некорректный список времени.");
    }
    return data.filter(isSlotAvailable);
  } catch (error) {
    if (
      isKnownDoctorClinic &&
      error?.status === 404 &&
      error?.payload?.error === MISSING_WORKING_HOURS_ERROR
    ) {
      return [];
    }
    throw error;
  }
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
