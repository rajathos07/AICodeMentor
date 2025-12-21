// src/components/auth/SignupPage.jsx
import React, { useState, useEffect, useRef } from "react";

export default function SignupPage({ onSignupSuccess, switchToLogin }) {
  // ✅ Always ensures a proper URL even if env var is missing or malformed
const API_BASE = (() => {
  let base =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
    (typeof process !== "undefined" && process.env?.VITE_API_BASE) ||
    "http://localhost:3000";

  if (!base.startsWith("http")) base = `http://localhost:3000`; // fix :3000 bug
  return base.replace(/\/+$/, ""); // remove trailing slashes if any
})();


  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const debounceRef = useRef(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(form.password));
  }, [form.password]);

  // Debounced username availability check
  useEffect(() => {
    setFieldErrors(prev => ({ ...prev, username: undefined }));
    setUsernameAvailable(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const username = form.username.trim();
    if (!username) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/check-username`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ✅ ADD THIS
             body: JSON.stringify({ username }),
            });

        const data = await resp.json();
        if (data && data.ok) setUsernameAvailable(!!data.available);
      } catch (err) {
        // ignore transient errors for availability
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [form.username]);

  const validate = () => {
    const fe = {};
    if (!form.username.trim()) fe.username = "Username required";
    if (!/^[a-zA-Z0-9_.-]+$/.test(form.username.trim())) fe.username = "Only letters, numbers, . - _ allowed";
    if (form.username.trim().length < 3) fe.username = "Must be at least 3 chars";
    if (form.password.length < 6) fe.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) fe.confirmPassword = "Passwords do not match";
    if (usernameAvailable === false) fe.username = "Username taken";
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
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
        setSuccess(true);
        // auto-login: server returns session user in register response
        if (data.user) {
          onSignupSuccess?.(data.user);
        } else {
          // fallback: call onSignupSuccess after small delay
          setTimeout(() => onSignupSuccess?.(), 1200);
        }
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const p = { ...prev }; delete p[field]; return p; });
    if (error) setError("");
  };

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  if (success) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-5xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Account Created!</h2>
          <p className="text-gray-400">You're now signed in — taking you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-2">Create Account</h1>
            <p className="text-gray-400 text-sm">Join Agentic Coding today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="signup-username" className="block text-sm font-medium text-gray-300">Username</label>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full rounded-xl bg-gray-800/80 border px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none transition ${fieldErrors.username ? "border-red-400" : "border-purple-500/30"}`}
                placeholder="Choose a username"
                disabled={loading}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">3-32 characters, letters, numbers, . - _</p>
                {usernameAvailable === true && <p className="text-xs text-green-400">Available ✓</p>}
                {usernameAvailable === false && <p className="text-xs text-red-400">Taken ✕</p>}
              </div>
              {fieldErrors.username && <p className="text-xs text-red-400 mt-1">{fieldErrors.username}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full rounded-xl bg-gray-800/80 border px-4 py-3 pr-12 text-gray-200 placeholder-gray-500 focus:outline-none transition ${fieldErrors.password ? "border-red-400" : "border-purple-500/30"}`}
                  placeholder="Create a strong password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition" tabIndex={-1}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              {form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength ? strengthColors[passwordStrength] : "bg-gray-700"}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength >= 3 ? "text-green-400" : "text-yellow-400"}`}>Strength: {strengthLabels[passwordStrength] || "Very Weak"}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">Confirm Password</label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`w-full rounded-xl bg-gray-800/80 border px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none transition ${fieldErrors.confirmPassword ? "border-red-400" : "border-purple-500/30"}`}
                placeholder="Confirm your password"
                disabled={loading}
              />
              {fieldErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}

            <button type="submit" disabled={loading || !form.username || !form.password || !form.confirmPassword} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button type="button" onClick={switchToLogin} className="text-purple-400 hover:text-purple-300 font-medium transition" disabled={loading}>Sign in</button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">By creating an account, you agree to our Terms of Service</p>
      </div>
    </div>
  );
}
