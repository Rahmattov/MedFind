# Patient App — Week 1-2 scaffold

React + Vite + React Router. Covers the Week 1-2 tasks:
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

## Next steps (not yet done)
- Replace mock data in `src/data/doctors.js` with a real API/backend.
- Add authentication.
- Add the appointment booking flow (the CTA button on the profile page is currently a placeholder).
