"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingBag } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useStore } from "@/store/useStore";
import { useAuthGate } from "@/lib/authGate";
import { toast } from "sonner";
import type { Testimonial, CommerceProduct } from "@/lib/homepageData";
import happyClientsDeco from "@/images/happy_clients_Deco.png";

type HappyClientsSectionProps = {
  testimonials: Testimonial[];
  products: CommerceProduct[];
};

export function HappyClientsSection({ testimonials, products }: HappyClientsSectionProps) {
  const addToCart = useStore((s) => s.addToCart);
  const withAuthGate = useAuthGate();

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="relative w-full bg-brand-bg-pink py-20 px-5 lg:px-12 overflow-hidden font-sans">
      {/* Wax Seal Decoration */}
      <div className="absolute top-6 left-6 lg:top-[61px] lg:left-[120px] z-0 w-[100px] h-[100px] lg:w-[147px] lg:h-[147px] opacity-100 pointer-events-none">
        <Image 
          src={happyClientsDeco} 
          alt="Wax Seal Decoration" 
          fill 
          className="object-contain"
        />
      </div>

      <div className="w-full max-w-[1440px] mx-auto relative z-10">
        <h2 
          className="text-center text-4xl md:text-[54px] text-black mb-16"
          style={{
            fontFamily: "var(--font-serif), 'Nyght Serif', serif",
            fontWeight: 400,
            lineHeight: "1.1",
          }}
        >
          Happy Clients
        </h2>

        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            768: {
              slidesPerView: "auto",
            },
          }}
          className="w-full max-w-[1201px] mx-auto px-4 md:px-0 py-8"
        >
          {testimonials.map((testimonial) => {
            const linkedProduct = products.find(p => p.slug === testimonial.productSlug);

            return (
              <SwiperSlide key={testimonial.id} className="!w-auto h-auto flex justify-center w-full md:w-auto">
              <div 
                key={testimonial.id}
                className="bg-white p-7 flex flex-col shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] w-full md:w-[387px]"
                style={{
                  height: '344px',
                  borderRadius: '30px',
                  border: '0.4px solid var(--brand-border-light)', // Approx gray-200
                }}
              >
                {/* Header: Avatar, Name, Rating */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden relative shrink-0 border border-gray-100">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[22px] font-medium text-black tracking-tight leading-none">
                      {testimonial.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < testimonial.rating ? "fill-brand-rating-star text-brand-rating-star" : "fill-gray-200 text-gray-200"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-gray-400 text-lg leading-relaxed font-light mb-8 flex-1">
                  {testimonial.text}
                </p>

                {/* Product Snippet */}
                {linkedProduct && (
                  <div className="bg-brand-bg-light rounded-[20px] p-3 flex items-center gap-4">
                    <Link href={`/products/${linkedProduct.slug}`} className="w-[58px] h-[58px] relative shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity">
                      <Image 
                        src={linkedProduct.image} 
                        alt={linkedProduct.name} 
                        fill 
                        className="object-contain drop-shadow-sm"
                      />
                    </Link>
                    <div className="flex flex-col justify-center gap-0.5 pr-2">
                      <Link href={`/products/${linkedProduct.slug}`}>
                        <h4 className="text-[13px] font-medium text-black leading-tight line-clamp-2 hover:text-brand-primary transition-colors">
                          {linkedProduct.name}
                        </h4>
                      </Link>
                      <button 
                        onClick={() => {
                          withAuthGate(
                            "ADD_TO_CART",
                            { ...linkedProduct, quantity: 1 },
                            () => {
                              addToCart(linkedProduct);
                              toast.success("Added to cart!", {
                                description: linkedProduct.name,
                                icon: <ShoppingBag className="w-4 h-4" />,
                                duration: 2500,
                              });
                            }
                          );
                        }}
                        className="text-brand-primary text-[13px] font-medium hover:underline decoration-brand-primary/30 underline-offset-2 text-left mt-1"
                      >
                        Shop now
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
