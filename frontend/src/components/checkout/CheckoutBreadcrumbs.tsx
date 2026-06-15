import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CheckoutBreadcrumbsProps {
  currentStep: "cart" | "checkout" | "payment" | "success";
}

export function CheckoutBreadcrumbs({ currentStep }: CheckoutBreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 justify-center w-full mb-8">
      <Link href="/" className="hover:text-black transition-colors font-sans">
        Home
      </Link>
      <ChevronRight className="w-4 h-4" />
      <Link href="/cart" className={`transition-colors font-sans ${currentStep === "cart" ? "text-black font-semibold" : "hover:text-black"}`}>
        Cart
      </Link>
      <ChevronRight className="w-4 h-4" />
      <Link href="/checkout" className={`transition-colors font-sans ${currentStep === "checkout" ? "text-black font-semibold" : "hover:text-black"}`}>
        Checkout
      </Link>
      {(currentStep === "payment" || currentStep === "success") && (
        <>
          <ChevronRight className="w-4 h-4" />
          <Link href="/checkout/payment" className={`transition-colors font-sans ${currentStep === "payment" ? "text-black font-semibold" : "hover:text-black"}`}>
            Payment
          </Link>
        </>
      )}
      {currentStep === "success" && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="text-black font-semibold font-sans">Success</span>
        </>
      )}
    </nav>
  );
}
