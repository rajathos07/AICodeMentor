// src/components/auth/LoginPage.jsx
import React, { useState } from "react";

export default function LoginPage({ onLogin, switchToSignup }) {
 // ✅ Always ensures a proper URL even if env var is missing or malformed
const API_BASE = (() => {
  let base =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
    (typeof process !== "undefined" && process.env?.VITE_API_BASE) ||
    "http://localhost:3000";

  if (!base.startsWith("http")) base = `http://localhost:3000`; // fix :3000 bug
  return base.replace(/\/+$/, ""); // remove trailing slashes if any
})();


  const [form, setForm] = useState({ username: "", password: "", remember: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const fe = {};
    if (!form.username.trim()) fe.username = "Username required";
    if (!form.password || form.password.length < 6) fe.password = "Password must be 6+ chars";
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          remember: form.remember,
        }),
      });

      let data;
      const ct = response.headers.get("content-type") || "";
      if (ct.includes("application/json")) data = await response.json();
      else {
        const text = await response.text();
        data = { success: false, message: text || "Request failed" };
      }

      if (response.ok && data.success) {
        onLogin?.(data.user);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const p = { ...prev }; delete p[field]; return p; });
    if (error) setError("");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full rounded-xl bg-gray-800/80 border px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none transition ${fieldErrors.username ? "border-red-400" : "border-purple-500/30"}`}
                placeholder="Enter your username"
                disabled={loading}
              />
              {fieldErrors.username && <p className="text-xs text-red-400 mt-1">{fieldErrors.username}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full rounded-xl bg-gray-800/80 border px-4 py-3 pr-12 text-gray-200 placeholder-gray-500 focus:outline-none transition ${fieldErrors.password ? "border-red-400" : "border-purple-500/30"}`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition" tabIndex={-1}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={form.remember} onChange={(e) => handleInputChange("remember", e.target.checked)} className="w-4 h-4 rounded" disabled={loading} />
              <span>Remember me for 30 days</span>
            </label>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}

            <button type="submit" disabled={loading || !form.username || !form.password} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button type="button" onClick={switchToSignup} className="text-purple-400 hover:text-purple-300 font-medium transition" disabled={loading}>Create one now</button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">🔒 Your connection is secure</p>
      </div>
    </div>
  );
}
