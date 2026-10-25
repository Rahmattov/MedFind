# Patient App — Beta

React + Vite + React Router. Includes patient registration, login, and a protected patient profile alongside doctor search and profiles.

## Authentication modes

For a local demonstration without the backend, set `VITE_USE_MOCK_AUTH=true` in `frontend/.env` (see `frontend/.env.example`). Doctor search, specialty filters, and doctor profiles use the sample catalog in `frontend/src/data/doctors.js`. Mock accounts and the current session are stored in browser `localStorage`; patient registration does not contact or create an account on a backend. Password storage is only for this temporary demo and must be replaced with ASP.NET Core authentication, password hashing, and JWT/secure cookies before production.

Demo login: `patient@medfind.demo` / `Patient123!`. The real-backend setup below uses `VITE_USE_MOCK_AUTH=false`.

## Run the API and database

Requirements: Docker Desktop, the .NET 10 SDK, and Node.js.

From the repository root, start PostgreSQL:

```powershell
docker compose up -d db
```

Configure the backend user secrets for the PostgreSQL connection on port `5434` and a JWT signing key of at least 32 characters. Keep both values in user secrets; do not put them in source files. Then start the API:

```powershell
Set-Location backend\iDoctor.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your local PostgreSQL connection string>"
dotnet user-secrets set "Jwt:Key" "<a random development key of at least 32 characters>"
dotnet run --launch-profile http
```

In another terminal, run the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

The frontend `.env` must have `VITE_USE_MOCK_AUTH=false` and `VITE_API_BASE_URL=http://localhost:5195/api`. Restart Vite after changing `.env`. On startup in Development, the API applies pending EF Core migrations and seeds local doctor and clinic schedules. Swagger is available at `http://localhost:5195/swagger`.

Patients can register and log in through the API, select one of the available doctor times, and submit an appointment. The API stores the booking in PostgreSQL with a pending-confirmation status; the patient's profile loads saved appointments from `GET /api/appointments/me`, including after logout and login. Patients can cancel future pending or confirmed appointments from their profile; the time becomes available again while the cancelled appointment remains in the appointment history.

The original scaffold covers:

1. React project created and configured (Vite).
2. Basic patient-side app structure and navigation (bottom nav: Home / Search / Doctor).
3. Initial pages: Home, Doctor Search, Doctor Profile.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

## Structure

```
src/
  main.jsx           entry point, router setup
  App.jsx             routes + layout shell
  index.css           design tokens + all styling
  components/
    BottomNav.jsx      bottom tab navigation
  pages/
    Home.jsx           featured doctors, specialty shortcuts
    DoctorSearch.jsx    search + specialty filter
    DoctorProfile.jsx   doctor detail + "book appointment" CTA
  data/
    doctors.js          mock doctor data (replace with real API later)
```

## Appointment API

- `GET /api/appointments/availability?doctorId={guid}&date=YYYY-MM-DD` lists available times.
- `POST /api/appointments` creates a booking for the authenticated patient.
- `GET /api/appointments/me` lists the authenticated patient's saved bookings.
- `GET /api/appointments/{id}` returns one of the authenticated patient's bookings.
- `PATCH /api/appointments/{id}/cancel` cancels a future pending or confirmed booking and reopens its slot.

Example requests are in `backend/iDoctor.Api/iDoctor.Api.http`.
