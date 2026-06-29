"use client";

import { useRef, useEffect, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Phone, Mail } from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { useStore } from "@/store/useStore";
import { useOtpAuthFlow } from "@/hooks/useOtpAuthFlow";
import { SignupForm } from "./SignupForm";

// ─── Country Code Data ────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+91", flag: "🇮🇳", name: "IN" },
  { code: "+44", flag: "🇬🇧", name: "GB" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
  { code: "+971", flag: "🇦🇪", name: "AE" },
  { code: "+81", flag: "🇯🇵", name: "JP" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+966", flag: "🇸🇦", name: "SA" },
  { code: "+65", flag: "🇸🇬", name: "SG" },
  { code: "+55", flag: "🇧🇷", name: "BR" },
  { code: "+52", flag: "🇲🇽", name: "MX" },
  { code: "+82", flag: "🇰🇷", name: "KR" },
  { code: "+86", flag: "🇨🇳", name: "CN" },
  { code: "+7", flag: "🇷🇺", name: "RU" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{3,15}$/;

const API_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    : "http://127.0.0.1:8000";

export function AuthModal() {
  const { authModal, closeAuthModal, setAuthModalStage, loginUser, flushFrozenIntent } = useStore();

  const {
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
    handleSendOtp: runSendOtp,
    handleVerifyOtp,
    resetForm,
  } = useOtpAuthFlow();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Aliases for compatibility with existing JSX
  const authValue = authMethod;
  const setAuthValue = setAuthMethod;
  const sendError = error;
  const setSendError = setError;
  const verifyError = error;
  const setVerifyError = setError;
  const sendLoading = isLoading;
  const verifyLoading = isLoading;

  const isEmailMode = inputMode === "email";

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (authModal.isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [authModal.isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (authModal.isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [authModal.isOpen]);


  // ── Close & Reset ────────────────────────────────────────────────────────
  const handleClose = () => {
    closeAuthModal();
    setTimeout(() => {
      resetForm();
      setStep("input");
    }, 300);
  };

  // ── Phase 2 → 3: Send OTP ────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    const success = await runSendOtp(e);
    if (success) {
      setAuthModalStage("OTP_VERIFICATION");
    }
  };

  // ── Phase 3 OTP Input Logic ──────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste support — distribute digits across boxes
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const focusIdx = Math.min(index + digits.length, 5);
      otpRefs[focusIdx].current?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // ── Phase 4: Verify OTP & Flush Intent ──────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    await handleVerifyOtp(e, () => {
      handleClose();
      setTimeout(() => flushFrozenIntent(), 100);
    });
  };

  const isOtpVerificationStage = authModal.stage === "OTP_VERIFICATION";
  const otpComplete = otp.join("").length === 6;

  if (!authModal.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="auth-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          ref={modalRef}
          key="auth-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header gradient accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#C9B8A8] via-[#E8D5C4] to-[#D4A574]" />

          <div className="p-8 pt-7">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <AnimatePresence mode="wait">
              {/* ── Phase 1-2: Input ─────────────────────────────────────── */}
              {!isOtpVerificationStage && (
                <motion.div
                  key="input-phase"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 id="auth-modal-title" className="font-serif text-2xl text-black mb-1">Log In or Sign Up</h2>
                  <div className="flex gap-4 mb-4 text-sm">
                    <button
                      onClick={() => setMode("login")}
                      className={mode === "login" ? "font-semibold underline" : "text-neutral-500"}
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => setMode("signup")}
                      className={mode === "signup" ? "font-semibold underline" : "text-neutral-500"}
                    >
                      Sign Up
                    </button>
                  </div>
                  
                  {mode === "login" ? (
                    <>
                      <p className="text-gray-500 text-sm mb-6">
                        Enter your {isEmailMode ? "email" : "phone number"} to receive a one-time code.
                      </p>

                      {/* Mode Toggle */}
                  <div className="flex gap-2 mb-5">
                    <button
                      onClick={() => { setInputMode("phone"); setAuthValue(""); setSendError(""); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                        !isEmailMode
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </button>
                    <button
                      onClick={() => { setInputMode("email"); setAuthValue(""); setSendError(""); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                        isEmailMode
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </div>

                  <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                    {/* Input Field */}
                    <div className="flex items-stretch border border-gray-200 rounded-xl h-[54px] overflow-hidden focus-within:border-black transition-colors bg-white">
                      {!isEmailMode && (
                        <div className="relative flex items-center border-r border-gray-200 bg-gray-50/60 shrink-0">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="h-full pl-3 pr-7 text-gray-700 font-semibold text-sm outline-none bg-transparent cursor-pointer appearance-none"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.flag} {c.code}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-2 pointer-events-none text-gray-400 text-[9px]">▼</div>
                        </div>
                      )}
                      <input
                        type={isEmailMode ? "email" : "tel"}
                        value={authValue}
                        onChange={(e) => { setAuthValue(e.target.value); setSendError(""); }}
                        placeholder={isEmailMode ? "you@example.com" : "9876543210"}
                        className="flex-1 h-full px-4 text-black text-[15px] outline-none placeholder:text-gray-400 bg-transparent"
                        autoFocus
                      />
                    </div>

                    {sendError && (
                      <p className="text-red-500 text-sm -mt-1">{sendError}</p>
                    )}

                    {/* Agreement Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="peer appearance-none w-5 h-5 border border-gray-300 rounded-[4px] checked:bg-black checked:border-black transition-colors cursor-pointer"
                        />
                        <svg
                          className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[13px] text-gray-500 leading-snug">
                        By continuing, you agree to our{" "}
                        <span className="font-bold text-black">Terms of Use</span> and{" "}
                        <span className="font-bold text-black">Privacy Policy.</span>
                      </span>
                    </label>

                    {/* Send OTP Button — disabled until validation passes */}
                    <button
                      type="submit"
                      disabled={!isValid || sendLoading}
                      className="mt-2 w-full h-[52px] flex items-center justify-center text-white text-[15px] font-bold rounded-xl transition-all
                        bg-black hover:bg-gray-800
                        disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {sendLoading ? <Loader size="xs" className="text-white" /> : "Send OTP"}
                    </button>
                  </form>
                  </>
                  ) : (
                    <SignupForm
                      onSignupSuccess={(email, otp) => {
                        setAuthValue(email);
                        setInputMode("email");
                        if (otp) {
                          setDevOtp(otp);
                          alert(`Verification OTP code: ${otp}`);
                        }
                        setAuthModalStage("OTP_VERIFICATION");
                      }}
                    />
                  )}
                </motion.div>
              )}

              {/* ── Phase 3-4: OTP Verification ──────────────────────────── */}
              {isOtpVerificationStage && (
                <motion.div
                  key="otp-phase"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 id="auth-modal-title" className="font-serif text-2xl text-black mb-1">OTP Verification</h2>

                  {/* Back / Edit button */}
                  <div className="flex items-center gap-2 mb-6">
                    <p className="text-gray-500 text-sm">Code sent to</p>
                    <span className="text-black font-bold text-sm">{finalAuthMethod}</span>
                    <button
                      onClick={() => setAuthModalStage(isEmailMode ? "EMAIL_INPUT" : "PHONE_INPUT")}
                      className="text-gray-400 hover:text-black transition-colors"
                      aria-label="Edit number"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dev OTP Banner */}
                  {devOtp && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3"
                    >
                      <span className="text-amber-600 text-lg">🔒</span>
                      <div>
                        <p className="text-amber-800 text-xs font-semibold uppercase tracking-wide">Dev Mode — OTP</p>
                        <p className="text-amber-900 text-2xl font-black tracking-[0.15em]">{devOtp}</p>
                      </div>
                    </motion.div>
                  )}

                  <form onSubmit={handleVerify} className="flex flex-col gap-6">
                    {/* 4-digit OTP Grid */}
                    <div className="flex items-center gap-3 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={otpRefs[i]}
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-full aspect-square max-w-[72px] border-2 border-gray-200 rounded-2xl text-center text-black text-2xl font-black outline-none focus:border-black transition-colors"
                        />
                      ))}
                    </div>

                    {verifyError && (
                      <p className="text-red-500 text-sm -mt-2">{verifyError}</p>
                    )}

                    {/* Resend */}
                    <button
                      type="button"
                      onClick={() => setAuthModalStage(isEmailMode ? "EMAIL_INPUT" : "PHONE_INPUT")}
                      className="text-gray-500 hover:text-black text-sm transition-colors w-fit"
                    >
                      Didn't receive it? <span className="font-semibold underline">Resend OTP</span>
                    </button>

                    {/* Verify Button */}
                    <button
                      type="submit"
                      disabled={!otpComplete || verifyLoading}
                      className="w-full h-[52px] flex items-center justify-center text-white text-[15px] font-bold rounded-xl transition-all
                        bg-black hover:bg-gray-800
                        disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {verifyLoading ? <Loader size="xs" className="text-white" /> : "Verify OTP"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
