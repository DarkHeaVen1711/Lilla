import { Metadata } from "next";
import dynamic from "next/dynamic";

const OtpAuthForm = dynamic(() =>
  import("./otp-auth-form").then((mod) => mod.OtpAuthForm),
);

export const metadata: Metadata = {
  title: "Log In or Sign Up | LILAA",
  description: "Access your LILAA account via OTP.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#FDF7F7] flex flex-col items-center justify-center py-20 px-5 font-sans">
      <div className="w-full max-w-[480px]">
        {/* The Auth Card */}
        <div className="bg-white rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-black/5 p-6 sm:p-12 relative">
          <OtpAuthForm />
        </div>
      </div>
    </main>
  );
}
