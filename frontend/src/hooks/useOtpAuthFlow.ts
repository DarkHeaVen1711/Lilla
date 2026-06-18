import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{3,15}$/;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function useOtpAuthFlow() {
  const loginUser = useStore((s) => s.loginUser);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [authMethod, setAuthMethod] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"phone" | "email">("phone");

  const isNumeric = (str: string) => /^\d+$/.test(str.replace(/[\s\-\+]/g, ""));
  const hasPhoneFormat = isNumeric(authMethod) && authMethod.length > 0;

  useEffect(() => {
    if (authMethod) {
      if (hasPhoneFormat) {
        setInputMode("phone");
      } else if (authMethod.includes("@")) {
        setInputMode("email");
      }
    }
  }, [authMethod, hasPhoneFormat]);

  const finalAuthMethod = inputMode === "email"
    ? authMethod.trim()
    : `${countryCode}${authMethod.replace(/^\+/, "").trim()}`;

  const isValid = agreed && (
    inputMode === "email"
      ? EMAIL_REGEX.test(authMethod.trim())
      : PHONE_REGEX.test(finalAuthMethod)
  );

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return false;

    setIsLoading(true);
    setError("");
    setDevOtp(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/request-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: finalAuthMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Failed to send OTP code.");
        return false;
      }
      setStep("otp");
      return true;
    } catch (err) {
      console.error("Auth send OTP error:", err);
      setError("Error contacting the auth server. Please check if your backend is running.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    step,
    setStep,
    authMethod,
    setAuthMethod,
    countryCode,
    setCountryCode,
    agreed,
    setAgreed,
    otp,
    setOtp,
    isLoading,
    error,
    setError,
    devOtp,
    setDevOtp,
    inputMode,
    setInputMode,
    finalAuthMethod,
    isValid,
    hasPhoneFormat,
    handleSendOtp,
  };
}
