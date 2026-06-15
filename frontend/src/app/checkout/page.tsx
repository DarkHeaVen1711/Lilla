import { CheckoutBreadcrumbs } from "@/components/checkout/CheckoutBreadcrumbs";
import { BillingForm } from "@/components/checkout/BillingForm";
import { OrderReviewAccordion } from "@/components/checkout/OrderReviewAccordion";

export default function CheckoutPage() {
  return (
    <div className="w-full min-h-screen bg-brand-bg-cream flex justify-center pb-20 pt-10">
      <div className="w-full max-w-[1440px] px-8 lg:px-16 mx-auto min-h-[650px] flex flex-col">
        <CheckoutBreadcrumbs currentStep="checkout" />
        
        {/* Split horizontal presentation container layout divided across two responsive columns */}
        <div className="flex flex-col lg:flex-row gap-8 w-full mt-4">
          
          {/* Left-Side Form Box Canvas */}
          <div className="w-full lg:w-3/5">
            <BillingForm />
          </div>

          {/* Right-Side Review Box Canvas */}
          <div className="w-full lg:w-2/5">
            <OrderReviewAccordion />
          </div>

        </div>
      </div>
    </div>
  );
}
