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
      if (data.otp) {
        setDevOtp(data.otp);
        alert(`Verification OTP code: ${data.otp}`);
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

  const handleVerifyOtp = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return false;

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: finalAuthMethod, otp: code }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.detail || errorData.error || "Invalid verification code.");
        return false;
      }
      const data = await res.json();

      const cookieRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access: data.access, refresh: data.refresh }),
      });

      if (!cookieRes.ok) {
        throw new Error("Failed to initialize secure session cookies.");
      }

      localStorage.setItem("lilla-user", JSON.stringify(data.user));
      loginUser(finalAuthMethod, !!data.user?.is_staff, { email: data.user?.email || "" });
      onSuccess();
      return true;
    } catch (err: any) {
      console.error("Auth verify OTP error:", err);
      setError(err.message || "Error verifying OTP code.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAuthMethod("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setDevOtp(null);
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
    handleVerifyOtp,
    resetForm,
  };
}
