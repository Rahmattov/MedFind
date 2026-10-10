import { apiRequest } from "./client";

export function mapDoctor(doctor) {
  const specialties = doctor.specialties?.map((specialty) => specialty.name) ?? [];
  const clinics = doctor.clinics?.map((clinic) => clinic.name) ?? [];

  return {
    id: doctor.id,
    name: doctor.fullName,
    photoUrl: doctor.photoUrl,
    specialty: specialties.join(", ") || "Специальность не указана",
    experience: doctor.experienceYears,
    rating: doctor.averageRating,
    price: doctor.consultationPrice,
    clinic: clinics.join(", "),
    clinics: doctor.clinics ?? [],
    about: doctor.bio || "Информация о враче пока не добавлена.",
  };
}

export async function searchDoctors(params = {}, options = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  }

  const result = await apiRequest(`/doctors?${query}`, options);
  return {
    ...result,
    items: (result?.items ?? []).map(mapDoctor),
  };
}

export async function getDoctor(id, options = {}) {
  const doctor = await apiRequest(`/doctors/${encodeURIComponent(id)}`, options);
  return mapDoctor(doctor);
}

export function getSpecialtyLabel(specialty) {
  return specialty.nameRu || specialty.nameTj || specialty.name;
}

export function listSpecialties(options = {}) {
  return apiRequest("/specialties", options);
}
