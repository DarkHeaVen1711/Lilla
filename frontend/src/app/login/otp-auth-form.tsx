"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { m as motion, AnimatePresence } from "framer-motion";
import { Loader2, Edit3 } from "lucide-react";
import logo from "@/images/logo.png";

export function OtpAuthForm() {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [authMethod, setAuthMethod] = useState<string>("");
  const [countryCode, setCountryCode] = useState("+1");
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authMethod || !agreed) return;
    
    setIsLoading(true);
    try {
      const finalAuth = hasPhoneFormat ? `${countryCode}${authMethod.replace(/^\+/, "")}` : authMethod;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE_URL}/api/auth/request-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: finalAuth }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || errorData.error || "Failed to send OTP code.");
        return;
      }
      setStep("otp");
    } catch (err) {
      console.error("Auth send OTP error:", err);
      alert("Error contacting the auth server. Please check if your backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      const finalAuth = hasPhoneFormat ? `${countryCode}${authMethod.replace(/^\+/, "")}` : authMethod;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: finalAuth, otp: code }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || errorData.error || "Invalid verification code.");
        return;
      }
      const data = await res.json();
      
      // Save tokens in secure HTTP-only cookies
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
      window.location.href = "/";
    } catch (err: any) {
      console.error("Auth verify OTP error:", err);
      alert(err.message || "Error verifying OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      // Focus last filled
      const focusIndex = Math.min(index + pasted.length, 5);
      otpRefs[focusIndex].current?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const isNumeric = (str: string) => /^\d+$/.test(str.replace(/[\s\-\+]/g, ""));
  const hasPhoneFormat = isNumeric(authMethod) && authMethod.length > 0;

  return (
    <div className="w-full font-sans">
      {/* Top Logo */}
      <div className="flex justify-center mb-10">
        <Image
          src={logo}
          alt="LILAA"
          width={160}
          height={60}
          className="h-[46px] w-auto object-contain"
          priority
        />
      </div>

      <AnimatePresence mode="wait">
        {step === "input" ? (
          <motion.div
            key="input-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-black font-semibold text-[18px] mb-4">
              Log In or Sign Up
            </h2>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              {/* Dynamic Input (Phone/Email) */}
              <div className="relative flex items-center border border-gray-200 rounded-[6px] h-[52px] bg-white overflow-hidden focus-within:border-black transition-colors">
                {hasPhoneFormat && (
                  <div className="relative h-full border-r border-gray-200 bg-gray-50/50 flex items-center">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-full pl-3 pr-8 text-gray-600 font-medium text-[14px] outline-none bg-transparent cursor-pointer appearance-none"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <div className="absolute right-2.5 pointer-events-none text-gray-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                )}
                <input
                  type={hasPhoneFormat ? "tel" : "text"}
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  placeholder="Enter Your e-mail or Phone Number"
                  className="flex-1 h-full px-4 text-black text-[15px] outline-none placeholder:text-gray-400 bg-transparent"
                />
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mt-1">
                <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border border-gray-300 rounded-[3px] checked:bg-black checked:border-black transition-colors cursor-pointer"
                  />
                  <svg
                    className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[14.5px] text-gray-600 leading-snug">
                  By continuing, you agree to our <span className="font-bold text-black">Terms of Use</span> and <span className="font-bold text-black">Privacy Policy.</span>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={!authMethod || !agreed || isLoading}
                className="mt-6 w-full h-[52px] flex items-center justify-center text-white text-[16px] font-semibold transition-colors disabled:bg-brand-disabled-gray disabled:cursor-not-allowed bg-black hover:bg-gray-800"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-black font-semibold text-[18px] mb-2">
              OTP Verification
            </h2>
            <p className="text-[15px] text-gray-500 mb-1">
              We've sent a verification code on
            </p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-black font-bold text-[15px]">
                {hasPhoneFormat ? `${countryCode} ${authMethod}` : authMethod}
              </span>
              <button onClick={() => setStep("input")} className="text-gray-500 hover:text-black">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-start">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-[45px] sm:w-[50px] h-[50px] sm:h-[54px] border border-gray-200 rounded-[6px] text-center text-black text-[20px] font-bold outline-none focus:border-black transition-colors"
                  />
                ))}
              </div>

              <button type="button" className="text-left text-gray-500 hover:text-black text-[15px] transition-colors w-fit">
                Resend OTP
              </button>

              <button
                type="submit"
                disabled={otp.join("").length !== 6 || isLoading}
                className="mt-2 w-full h-[52px] flex items-center justify-center text-white text-[16px] font-semibold transition-colors disabled:bg-brand-disabled-gray disabled:cursor-not-allowed bg-black hover:bg-gray-800"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
