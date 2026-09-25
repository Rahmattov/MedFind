import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    navigate("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-brand-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your MedFind account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none transition focus:border-brand-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 bg-sand px-4 py-3 text-sm outline-none transition focus:border-brand-900"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-900 px-4 py-3 font-semibold text-white transition hover:bg-brand-700"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-900 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}