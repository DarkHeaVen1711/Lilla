"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Loader } from "@/components/ui/Loader";

interface SignupFormProps {
  onSignupSuccess: (email: string) => void; 
}

type Gender = "male" | "female" | "other";

export function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!gender) newErrors.gender = "Please select a gender.";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiClient.post("/api/auth/signup/", {
        name,
        email,
        gender,
        password,
        confirm_password: confirmPassword,
      });
      onSignupSuccess(email);
    } catch (err: any) {
      const backendErrors = err?.response?.data;
      if (backendErrors && typeof backendErrors === "object") {
        const mapped: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setErrors(mapped);
      } else {
        setErrors({ submit: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-black transition-colors"
          autoComplete="name"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-black transition-colors"
          autoComplete="email"
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-black transition-colors bg-transparent"
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-black transition-colors"
          autoComplete="new-password"
        />
        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-black transition-colors"
          autoComplete="new-password"
        />
        {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>

      {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 w-full h-[52px] flex items-center justify-center text-white text-[15px] font-bold rounded-xl transition-all
          bg-black hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? <Loader size="xs" className="text-white" /> : "Create Account"}
      </button>
    </form>
  );
}
