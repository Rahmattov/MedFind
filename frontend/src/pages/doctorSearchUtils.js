const specialtyNames = {
  Therapist: "Терапевт",
  Cardiologist: "Кардиолог",
  Dermatologist: "Дерматолог",
  Neurologist: "Невролог",
  Pediatrician: "Педиатр",
};

export function normalizeDoctor(doctor) {
  const specialty = doctor.specialties
    ?.map((item) => specialtyNames[item.name] || item.name)
    .join(", ") || "Специальность не указана";

  return {
    id: doctor.id,
    name: doctor.fullName,
    rating: doctor.averageRating ?? 0,
    price: doctor.consultationPrice ?? 0,
    specialty,
    experience: doctor.experienceYears ?? 0,
    clinic: doctor.clinics?.[0]?.name || "Клиника не указана",
    searchTerms: [
      ...(doctor.specialties ?? []).map((item) => item.name),
      ...(doctor.clinics ?? []).map((item) => item.name),
    ],
    photoUrl: doctor.photoUrl || doctor.PhotoUrl,
  };
}

export function filterDoctors(doctors, search, specialty) {
  const query = search.trim().toLocaleLowerCase("ru");
  return doctors.filter((doctor) => {
    const matchesSearch = [doctor.name, doctor.specialty, doctor.clinic, ...doctor.searchTerms]
      .some((value) => value?.toLocaleLowerCase("ru").includes(query));
    const matchesSpecialty = specialty === "Все" ||
      doctor.specialty.split(",").some((item) => item.trim() === specialty);
    return matchesSearch && matchesSpecialty;
  });
}
