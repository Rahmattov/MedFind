# Patient App — Beta

React + Vite + React Router. Includes patient registration, login, and a protected patient profile alongside doctor search and profiles.

## Authentication modes

For local demonstration, set `VITE_USE_MOCK_AUTH=true` in `.env` (see `.env.example`). Mock accounts and the current session are stored in browser `localStorage`; registration does not contact or create an account on a backend. Password storage is only for this temporary demo and must be replaced with ASP.NET Core authentication, password hashing, and JWT/secure cookies before production.

Demo login: `patient@medfind.demo` / `Patient123!`.

To use the real API later, change `VITE_USE_MOCK_AUTH=false` and set `VITE_API_BASE_URL` to the backend URL, for example `http://localhost:3000/api`. The frontend expects `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, and optionally `POST /auth/logout`. Login/registration may return `{ accessToken, patient }` (or `{ token, user }`) or establish an HTTP-only cookie. Configure backend CORS for the frontend origin when using cookies. Restart Vite after changing `.env`.

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

## Remaining work

- Replace mock doctor data in `src/data/doctors.js` with the doctors API.
- Add the appointment booking flow (the CTA button on the doctor profile is currently a placeholder).
