import { apiRequest } from "./client";
import { doctors as mockDoctors, specialties as mockSpecialties } from "../data/doctors";

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_AUTH === "true";

const localSpecialties = mockSpecialties
  .filter((name) => name !== "Все")
  .map((name, index) => ({
    id: index + 1,
    name,
    nameRu: name,
  }));

function searchMockDoctors(params) {
  const query = String(params.q ?? "").trim().toLocaleLowerCase("ru");
  const specialtyId = String(params.specialtyId ?? "");
  const specialty = String(params.specialty ?? "");
  const filteredDoctors = mockDoctors.filter((doctor) => {
    const matchesQuery =
      !query ||
      [doctor.name, doctor.specialty, doctor.clinic, doctor.about]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("ru").includes(query));
    const selectedSpecialty = localSpecialties.find(
      (item) =>
        String(item.id) === specialtyId ||
        item.name.toLocaleLowerCase("ru") === specialtyId.toLocaleLowerCase("ru") ||
        item.name.toLocaleLowerCase("ru") === specialty.toLocaleLowerCase("ru"),
    );

    return (
      matchesQuery &&
      (!selectedSpecialty || doctor.specialty === selectedSpecialty.name)
    );
  });

  const pageSize = Math.max(1, Number(params.pageSize) || 12);
  const totalCount = filteredDoctors.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    items: filteredDoctors.slice(startIndex, startIndex + pageSize),
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

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
  if (USE_MOCK_DATA) {
    return searchMockDoctors(params);
  }

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
  if (USE_MOCK_DATA) {
    const doctor = mockDoctors.find((item) => String(item.id) === String(id));
    if (!doctor) {
      throw new Error("Врач не найден.");
    }
    return doctor;
  }

  const doctor = await apiRequest(`/doctors/${encodeURIComponent(id)}`, options);
  return mapDoctor(doctor);
}

export function getSpecialtyLabel(specialty) {
  return specialty.nameRu || specialty.nameTj || specialty.name;
}

export function listSpecialties(options = {}) {
  if (USE_MOCK_DATA) {
    return Promise.resolve(localSpecialties);
  }

  return apiRequest("/specialties", options);
}
