import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5195/api"
).replace(/\/$/, "");

export default function Register() {
  const navigate = useNavigate();
  const { register, registerDoctor } = useAuth();

  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [specialties, setSpecialties] = useState([]);
  const [specialtyId, setSpecialtyId] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [consultationPrice, setConsultationPrice] = useState("");
  const [bio, setBio] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role !== "doctor") return;

    let active = true;

    fetch(`${API_URL}/specialties`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error("Could not load specialties.");
        }

        return Array.isArray(data)
          ? data
          : data.items ?? data.specialties ?? data.$values ?? [];
      })
      .then((data) => {
        if (active) setSpecialties(data);
      })
      .catch(() => {
        if (active) {
          setError("Could not load specialties. Check that the backend is running.");
        }
      });

    return () => {
      active = false;
    };
  }, [role]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");

    if (role === "doctor" && !specialtyId) {
      setError("Please select your specialty.");
      return;
    }

    try {
      setSubmitting(true);

      const details = {
        firstName,
        lastName,
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      };

      if (role === "doctor") {
        await registerDoctor({
          ...details,
          specialtyIds: [Number(specialtyId)],
          experienceYears: Number(experienceYears),
          consultationPrice:
            consultationPrice.trim() === ""
              ? null
              : Number(consultationPrice),
          bio: bio.trim(),
        });
      } else {
        await register(details);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function getSpecialtyId(item) {
    return item.id ?? item.specialtyId;
  }

  function getSpecialtyName(item) {
    return item.name ?? item.specialtyName ?? item.title ?? "Specialty";
  }

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-[1fr_480px] md:py-14">
      <section>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Забота о здоровье начинается здесь
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight text-brand-900 lg:text-5xl">
          Присоединяйтесь к MedFind
        </h1>
        <p className="mt-5 max-w-lg leading-7 text-slate-600">
          Создайте профиль пациента или врача, чтобы находить специалистов и
          управлять медицинской информацией в одном месте.
        </p>
        <div className="mt-8 space-y-3">
          {["Удобный поиск специалистов", "Подробные профили врачей", "Личный кабинет"].map(
            (item) => (
              <p key={item} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  ✓
                </span>
                {item}
              </p>
            ),
          )}
        </div>
      </section>

      <div className="w-full rounded-3xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl text-brand-900">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Register to use MedFind
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setRole("patient");
              setError("");
            }}
            className={`rounded-xl border px-4 py-3 font-medium ${
              role === "patient"
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-stone-200 bg-sand text-slate-700 transition hover:border-brand-300"
            }`}
          >
            Patient
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("doctor");
              setError("");
            }}
            className={`rounded-xl border px-4 py-3 font-medium ${
              role === "doctor"
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-stone-200 bg-sand text-slate-700 transition hover:border-brand-300"
            }`}
          >
            Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Phone number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+992XXXXXXXXX"
              pattern="\+992[0-9]{9}"
              title="Enter a Tajikistan phone number, e.g. +992900123456"
              autoComplete="tel"
              required
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
            />
          </div>

          {role === "doctor" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Specialty
                </label>
                <select
                  value={specialtyId}
                  onChange={(event) => setSpecialtyId(event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
                >
                  <option value="">Select your specialty</option>
                  {specialties.map((item) => (
                    <option
                      key={getSpecialtyId(item)}
                      value={getSpecialtyId(item)}
                    >
                      {getSpecialtyName(item)}
                    </option>
                  ))}
                </select>

                {specialties.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Loading specialties or no specialties available.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Experience (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={experienceYears}
                  onChange={(event) => setExperienceYears(event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Consultation price
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  value={consultationPrice}
                  onChange={(event) => setConsultationPrice(event.target.value)}
                  placeholder="Price (optional)"
                  className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Professional bio
                </label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={4000}
                  rows={3}
                  placeholder="Describe your qualifications and experience"
                  className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="Confirm your password"
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none focus:border-brand-900"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-900 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting
              ? "Creating account..."
              : `Register as ${role === "doctor" ? "doctor" : "patient"}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-900 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}