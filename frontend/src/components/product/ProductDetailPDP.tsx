"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Search, User, X, Star, Minus, Plus, MapPin, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { useStore } from "@/store/useStore";
import { useAuthGate } from "@/lib/authGate";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { Product, SkincareProduct, MakeupProduct } from "@/lib/products";
import type { CommerceProduct } from "@/lib/homepageData";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { HoverAddToCart } from "@/components/ui/HoverAddToCart";
import { YouMayAlsoLikeSection } from "@/components/shared/YouMayAlsoLikeSection";
import { Price } from "@/components/shared/Price";
import { m, AnimatePresence } from "framer-motion";

import "swiper/css";
import "swiper/css/navigation";

// Static imports for customer images
import imgCustomer1 from "@/images/close-up-beautiful-woman-portrait 1.png";
import imgCustomer2 from "@/images/close-up-skin-pores-face-care-routine 1.png";
import imgCustomer3 from "@/images/close-up-woman-with-acne-posing 1.png";
import imgCustomer4 from "@/images/image 193.png";
import imgCustomer5 from "@/images/image 194.png";
import imgCustomer6 from "@/images/89cc395b05656b4a35cad991e0704dc0 1.png";

import logo from "@/images/logo.png";
import social1 from "@/images/twitter.png";
import social2 from "@/images/facebook.png";
import social3 from "@/images/insta.png";
import social4 from "@/images/github.png";

// Flower and blush smudge decorative assets
import imgYoumightlikeBlush from "@/images/youmightlike_blush.png";

type ProductDetailPDPProps = {
  product: any;
  recommendedProducts: CommerceProduct[];
};

export function ProductDetailPDP({ product: initialProduct, recommendedProducts }: ProductDetailPDPProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const cartItems = useStore((s) => s.cart.items);
  const addToCart = useStore((s) => s.addToCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const withAuthGate = useAuthGate();

  const user = useStore((s) => s.user);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [ratingVal, setRatingVal] = useState<number>(Number(initialProduct.rating) || 4.8);
  const [reviewsCount, setReviewsCount] = useState<number>(Number(initialProduct.reviews) || 0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${initialProduct.slug}/reviews/`);
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data);
        if (data.length > 0) {
          const totalRating = data.reduce((sum: number, r: any) => sum + r.rating, 0);
          setRatingVal(totalRating / data.length);
          setReviewsCount(data.length);
        } else {
          setRatingVal(4.8);
          setReviewsCount(0);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [initialProduct.slug]);

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${initialProduct.slug}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Review submitted successfully!");
        setNewComment("");
        setNewRating(5);
        fetchReviews();
      } else {
        const errorMsg = data.non_field_errors?.[0] || data.detail || data.message || "Failed to submit review.";
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const starDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      const rating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        counts[rating]++;
      }
    });
    const total = reviewsList.length || 1;
    return [
      { star: 5, weight: `${Math.round((counts[5] / total) * 100)}%` },
      { star: 4, weight: `${Math.round((counts[4] / total) * 100)}%` },
      { star: 3, weight: `${Math.round((counts[3] / total) * 100)}%` },
      { star: 2, weight: `${Math.round((counts[2] / total) * 100)}%` },
      { star: 1, weight: `${Math.round((counts[1] / total) * 100)}%` },
    ];
  }, [reviewsList]);
  
  // Reconstruct OOP class instance from plain serialized props
  const product = useMemo(() => {
    return initialProduct.category?.toLowerCase() === "makeup"
      ? new MakeupProduct(initialProduct)
      : new SkincareProduct(initialProduct);
  }, [initialProduct.id]);

  const favorite = isFavorite(product.id);

  // States
  const [activeImage, setActiveImage] = useState<any>(product.image);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [activeShade, setActiveShade] = useState("Rose");
  const [quantity, setQuantity] = useState(1);
  const [zipcode, setZipcode] = useState("123456");
  const [isEditingZip, setIsEditingZip] = useState(false);
  const [zipInput, setZipInput] = useState("123456");
  
  const getDynamicDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return `Delivery by ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  };
  const [zipMessage, setZipMessage] = useState(getDynamicDeliveryDate());
  
  // Accordion tabs
  const [expandedSection, setExpandedSection] = useState<"desc" | "detail" | "ingredients" | null>("desc");

  // Lightbox Modal for Customer Photos
  const [lightboxImage, setLightboxImage] = useState<any>(null);
  const [lightboxReview, setLightboxReview] = useState<any>(null);

  // Main Product Image Lightbox Modal
  const [isMainLightboxOpen, setIsMainLightboxOpen] = useState(false);

  // Swiper refs
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [gallerySwiper, setGallerySwiper] = useState<SwiperType | null>(null);

  // Refs for dynamic diagram positioning
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badge1Ref = useRef<HTMLDivElement>(null);
  const badge2Ref = useRef<HTMLDivElement>(null);
  const badge3Ref = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState({
    line1: "",
    dot1: { cx: 0, cy: 0 },
    line2: "",
    dot2: { cx: 0, cy: 0 },
    line3: "",
    dot3: { cx: 0, cy: 0 }
  });

  const updateCoords = () => {
    if (!containerRef.current || !imageRef.current || !badge1Ref.current || !badge2Ref.current || !badge3Ref.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    const b1Rect = badge1Ref.current.getBoundingClientRect();
    const b2Rect = badge2Ref.current.getBoundingClientRect();
    const b3Rect = badge3Ref.current.getBoundingClientRect();

    // Center of the image relative to container bounds
    const imgX = imageRect.left - containerRect.left + imageRect.width / 2;
    const imgY = imageRect.top - containerRect.top + imageRect.height / 2;

    // Adjust target dots dynamically based on the image size
    const dot1X = imageRect.left - containerRect.left + imageRect.width * 0.15;
    const dot1Y = imageRect.top - containerRect.top + imageRect.height * 0.85;
    const dot2X = imgX;
    const dot2Y = imageRect.top - containerRect.top + imageRect.height * 0.15;
    const dot3X = imageRect.left - containerRect.left + imageRect.width * 0.85;
    const dot3Y = imageRect.top - containerRect.top + imageRect.height * 0.5;

    // Badge bottom centers
    const b1X = b1Rect.left - containerRect.left + b1Rect.width / 2;
    const b1Y = b1Rect.bottom - containerRect.top;

    const b2X = b2Rect.left - containerRect.left + b2Rect.width / 2;
    const b2Y = b2Rect.bottom - containerRect.top;

    const b3X = b3Rect.left - containerRect.left + b3Rect.width / 2;
    const b3Y = b3Rect.bottom - containerRect.top;

    // Badge 1 (Left L-Shape): drops straight down, then turns right to meet the dot
    const line1 = `M ${b1X} ${b1Y} V ${dot1Y} H ${dot1X}`;
    
    // Badge 2 (Top Straight): drops straight down to meet the dot
    const line2 = `M ${b2X} ${b2Y} V ${dot2Y}`;

    // Badge 3 (Right Inverted L-Shape): starts at dot, goes horizontally right, then vertically up to badge
    const line3 = `M ${dot3X} ${dot3Y} H ${b3X} V ${b3Y}`;

    setCoords(prev => {
      if (
        prev.line1 === line1 &&
        prev.line2 === line2 &&
        prev.line3 === line3 &&
        prev.dot1.cx === dot1X &&
        prev.dot1.cy === dot1Y &&
        prev.dot2.cx === dot2X &&
        prev.dot2.cy === dot2Y &&
        prev.dot3.cx === dot3X &&
        prev.dot3.cy === dot3Y
      ) {
        return prev;
      }
      return {
        line1,
        dot1: { cx: dot1X, cy: dot1Y },
        line2,
        dot2: { cx: dot2X, cy: dot2Y },
        line3,
        dot3: { cx: dot3X, cy: dot3Y }
      };
    });
  };

  useEffect(() => {
    updateCoords();
    const intervals = [100, 300, 500, 1000];
    const timers = intervals.map(delay => setTimeout(updateCoords, delay));

    window.addEventListener("resize", updateCoords);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", updateCoords);
    };
  }, [product, activeImage]);

  // Sync main image and defaults if product changes
  useEffect(() => {
    setActiveImage(product.image);
    if (product instanceof MakeupProduct && product.shades && product.shades.length > 0) {
      setActiveShade(product.shades[0].name);
    }
  }, [product]);

  // Thumbnail list dynamically maps product's own image and customer uploads
  const thumbnails = [
    product.image,
    imgCustomer1,
    imgCustomer2,
    imgCustomer3,
    imgCustomer6,
  ];

  // Cast product to subclasses for unique attributes
  const isMakeup = product instanceof MakeupProduct;
  const isSkincare = product instanceof SkincareProduct;
  const makeupProduct = isMakeup ? (product as MakeupProduct) : null;
  const skincareProduct = isSkincare ? (product as SkincareProduct) : null;

  // Local reviews array
  const reviews = [
    {
      id: 1,
      author: "Guy Hawkins",
      date: "02 Jan",
      rating: 5,
      content: "Its very nice, worth every penny! This is a game changer! Give natural and long lasting glow. Go ahead and buy it you won't regret it.",
      avatar: imgCustomer1,
    },
    {
      id: 2,
      author: "Kristin Watson",
      date: "28 Dec",
      rating: 5,
      content: "Absolutely love the texture and buildability. Perfect for daily wear, feels so lightweight on the skin.",
      avatar: imgCustomer2,
    },
    {
      id: 3,
      author: "Albert Flores",
      date: "15 Dec",
      rating: 4,
      content: "Great product, smudge-proof formulation as described. Lasts all day without fading. Highly recommend for oily skin types.",
      avatar: imgCustomer3,
    },
  ];

  const handleZipChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipInput.trim().length >= 5) {
      setZipcode(zipInput);
      setIsEditingZip(false);
      
      const d = new Date();
      // Calculate extra days dynamically based on the zipcode digits
      const zipVal = parseInt(zipInput) || 0;
      const extraDays = (zipVal % 3) + 3; // 3, 4, or 5 days
      d.setDate(d.getDate() + extraDays);
      const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      setZipMessage(`Delivery by ${dateStr}`);
    }
  };

  const handleAddToCart = () => {
    withAuthGate(
      "ADD_TO_CART",
      { ...product, quantity },
      () => {
        addToCart(product as any, quantity);
        toast.success("Added to cart!", {
          description: `${product.name} (Qty: ${quantity})`,
          icon: <ShoppingBag className="w-4 h-4" />,
          duration: 2500,
        });
      }
    );
  };

  const handleThumbnailClick = (thumb: any, idx: number) => {
    setActiveImage(thumb);
    if (gallerySwiper) {
      gallerySwiper.slideTo(idx);
    }
  };

  return (
    <div className="w-full bg-white font-sans text-black antialiased">
      {/* 1. Sub-Header Breadcrumbs */}
      <div className="w-full bg-brand-bg-gray py-4 border-b border-gray-100 mt-[80px]">
        <div className="max-w-[1440px] mx-auto px-5 text-center text-sm md:text-base tracking-wide text-gray-500 uppercase font-semibold">
          <Link href="/" className="hover:text-black transition-colors">Homepage</Link>
          <span className="mx-2">&gt;</span>
          <span className="hover:text-black transition-colors">
            {product.category.toLowerCase() === "makeup" ? "Makeup" : "treatments & masks"}
          </span>
          <span className="mx-2">&gt;</span>
          <span className="hover:text-black transition-colors">
            {product.category.toLowerCase() === "makeup" ? "Lips & Face" : "Masks"}
          </span>
          <span className="mx-2">&gt;</span>
          <span className="text-black font-extrabold">{product.name}</span>
        </div>
      </div>

      {/* 2. Main Product Showcase Block (Two-Column Split Grid) */}
      <section className="max-w-[1440px] mx-auto px-5 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">
          {/* Left Column: Product Image Gallery */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Thumbnail Grid on Left / Top */}
            <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto max-h-[100px] md:max-h-[550px] shrink-0 pb-2 md:pb-0 scrollbar-none">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(thumb, idx)}
                  className={`relative w-20 h-20 md:w-28 md:h-28 bg-brand-bg-image rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === thumb ? "border-black scale-95 shadow-sm" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image src={thumb} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image View (Swiper Carousel) */}
            <div className="flex-1 relative aspect-square bg-brand-bg-image rounded-[24px] md:rounded-[32px] overflow-hidden border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] order-1 md:order-2 group cursor-zoom-in mix-blend-multiply">
              <Swiper
                onSwiper={setGallerySwiper}
                onSlideChange={(swiper) => setActiveImage(thumbnails[swiper.activeIndex])}
                className="w-full h-full"
                grabCursor={true}
              >
                {thumbnails.map((thumb, idx) => (
                  <SwiperSlide
                    key={idx}
                    className="relative w-full h-full"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.hotspot-pin')) return;
                      setIsMainLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={thumb}
                      alt={`${product.name} gallery image ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Hotspot pins overlay for main product image */}
                    {idx === 0 && product.features && product.features.length > 0 && (
                      <div className="absolute inset-0 pointer-events-auto">
                        {product.features.map((feat: any, fIdx: number) => {
                          if (feat.x1 === undefined || feat.y1 === undefined) return null;
                          const isHotspotActive = activeHotspot === fIdx;
                          return (
                            <div
                              key={fIdx}
                              className="absolute hotspot-pin"
                              style={{ left: `${feat.x1}%`, top: `${feat.y1}%`, transform: 'translate(-50%, -50%)' }}
                            >
                              {/* Pulsing indicator */}
                              <button
                                onMouseEnter={() => setActiveHotspot(fIdx)}
                                onMouseLeave={() => setActiveHotspot(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveHotspot(isHotspotActive ? null : fIdx);
                                }}
                                className="relative w-6 h-6 flex items-center justify-center focus:outline-none cursor-pointer group"
                                aria-label={`View feature: ${feat.title}`}
                              >
                                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary/40 animate-ping opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary border-2 border-white shadow-md group-hover:scale-125 transition-transform"></span>
                              </button>

                              {/* Popover Bubble */}
                              <AnimatePresence>
                                {isHotspotActive && (
                                  <m.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-100 z-30 w-[240px] pointer-events-auto text-left"
                                    onMouseEnter={() => setActiveHotspot(fIdx)}
                                    onMouseLeave={() => setActiveHotspot(null)}
                                  >
                                    <div className="flex flex-col gap-1 text-xs">
                                      <span className="bg-brand-primary-light text-brand-secondary font-bold px-2 py-0.5 rounded-full text-[10px] self-start mb-1 uppercase tracking-wider">
                                        {feat.badge || "Feature"}
                                      </span>
                                      <h4 className="font-bold text-black text-sm">{feat.title}</h4>
                                      <p className="text-gray-500 font-semibold mt-1 leading-relaxed">{feat.description}</p>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                                  </m.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Right Column: Metadata & Controls */}
          <div className="flex flex-col gap-6">
            {/* Brand & Naming */}
            <div>
              <p className="text-lg md:text-xl lg:text-2xl font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">
                {isMakeup ? "Lilaa Color Cosmetics" : "Beauty of joseon"}
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-[32px] font-normal font-serif leading-[1.1] mb-3">
                {product.name}
              </h1>
              <p className="text-2xl md:text-3xl font-bold text-gray-600">
                {product.slug === "red-bean-refreshing-pore-mask" ? "140ml" : "30ml"}
              </p>
            </div>

            {/* Rating and Price Row */}
            <div className="flex items-center justify-between border-y border-gray-100 py-5">
              <div className="flex items-center gap-5">
                <Price amount={product.price} className="text-4xl md:text-5xl lg:text-6xl font-black text-black leading-none" />
                {product.originalPrice && (
                  <div className="flex items-center gap-2.5">
                    <Price amount={product.originalPrice} className="text-2xl md:text-3xl text-gray-400 line-through decoration-1" />
                    <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded text-sm font-bold uppercase tracking-wider">
                      {product.discount || "Sale"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 bg-brand-bg-gray border border-gray-100 px-4 py-2 rounded-full shadow-sm">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-lg md:text-xl font-bold text-black ml-1">{ratingVal.toFixed(1)}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-base font-semibold text-gray-500">{reviewsCount} Ratings</span>
              </div>
            </div>

            {/* Inventory / Spec Bullet Points */}
            <div className="flex flex-col gap-4 text-lg md:text-xl text-gray-700 font-medium leading-relaxed bg-brand-bg-gray p-6 rounded-[24px] border border-gray-100">
              <div className="flex items-center gap-2 text-base md:text-lg font-extrabold text-brand-primary mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse"></span>
                Expires on : {product.expiresOn}
              </div>
              <p className="text-lg md:text-xl text-gray-600 font-semibold mb-2">{product.description}</p>
              
              {/* Unique OOP Skincare Properties */}
              {skincareProduct && (
                <div className="border-t border-gray-200/60 pt-3 flex flex-col gap-2 text-lg md:text-xl">
                  <div>
                    <strong className="text-black">Skin Type Focus: </strong>
                    <span className="text-gray-500 font-bold">{skincareProduct.skinConcerns.join(", ")}</span>
                  </div>
                  <div>
                    <strong className="text-black">Key Actives: </strong>
                    <span className="text-gray-500 font-bold">{skincareProduct.keyIngredients.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Variant Shade Selector / Skincare Highlights */}
            {isMakeup && makeupProduct && makeupProduct.shades ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-lg md:text-xl font-bold">
                  <span>Select a Shade: <span className="font-semibold text-gray-600">{activeShade}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  {makeupProduct.shades.map((shade) => (
                    <button
                      key={shade.name}
                      onClick={() => setActiveShade(shade.name)}
                      style={{ backgroundColor: shade.hex }}
                      className={`w-9 h-9 rounded-full border-2 transition-all relative ${
                        activeShade === shade.name ? "border-black scale-110 shadow-md ring-2 ring-black/5" : "border-white hover:scale-105"
                      }`}
                      aria-label={`Select shade ${shade.name}`}
                    >
                      {activeShade === shade.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 border-l-4 border-black pl-4 py-1 text-lg">
                <p className="font-bold text-black uppercase tracking-wider text-sm">Formulation Highlights</p>
                <p className="text-gray-500 font-semibold italic">100% vegan ingredients, cruelty-free certification, and hypoallergenic testing.</p>
              </div>
            )}

            {/* Quantity Selector, Wishlist & Action Buttons */}
            <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Quantity Box */}
                <div className="flex items-center border border-gray-200 rounded-full h-[56px] px-2 bg-gray-50/50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-full hover:bg-white transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-extrabold text-2xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-full hover:bg-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleFavorite(product as any)}
                  className={`w-[56px] h-[56px] flex items-center justify-center rounded-full border transition-all ${
                    favorite ? "border-brand-secondary bg-brand-secondary-light text-brand-secondary scale-95" : "border-gray-200 hover:border-black text-gray-500 hover:text-black"
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart className={`w-6 h-6 ${favorite ? "fill-current" : ""}`} />
                </button>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[150px] h-[56px] rounded-full border-2 border-black bg-white text-black text-lg md:text-xl font-bold hover:bg-gray-50 transition-colors uppercase tracking-wider"
                >
                  Add to cart
                </button>
              </div>

              {/* Checkout Now */}
              <button
                onClick={() => {
                  handleAddToCart();
                  window.location.href = "/cart";
                }}
                className="w-full h-[56px] rounded-full bg-black text-white text-lg md:text-xl font-bold hover:bg-gray-900 transition-colors uppercase tracking-wider shadow-md"
              >
                Checkout Now
              </button>
            </div>

            {/* Logistics Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 pt-5 text-base md:text-lg">
              <div className="flex items-center gap-2.5 text-gray-600 font-bold">
                <MapPin className="w-5 h-5 text-black" />
                <span>{zipMessage}</span>
              </div>
              
              <div className="flex items-center">
                {isEditingZip ? (
                  <form onSubmit={handleZipChange} className="flex gap-2">
                    <input
                      type="text"
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="border border-gray-300 rounded px-2.5 py-1 text-sm w-28 focus:outline-none focus:border-black font-semibold"
                      placeholder="Zipcode"
                      autoFocus
                    />
                    <button type="submit" className="text-sm font-bold text-black border border-black rounded px-2.5 py-1 hover:bg-black hover:text-white transition-colors">
                      Apply
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base md:text-lg text-black bg-gray-100 px-3 py-1 rounded-full">{zipcode}</span>
                    <button
                      onClick={() => setIsEditingZip(true)}
                      className="text-sm font-bold text-brand-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab/Accordion Details Block was relocated to a separate section below */}
          </div>
        </div>
      </section>

      {/* 2b. Product Details Accordion Section */}
      <section className="w-full max-w-[1440px] mx-auto pb-10 bg-white px-4 md:px-[120px] pt-[60px]">
        {/* Table/Accordion Container */}
        <div className="w-full max-w-[1199px] min-h-[245px] h-auto border border-gray-200 rounded-[16px] overflow-hidden bg-white shadow-sm flex flex-col mx-auto">
          {/* Product Description */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setExpandedSection(expandedSection === "desc" ? null : "desc")}
              className="flex justify-between items-center w-full px-5 py-5 text-left font-bold text-xl md:text-2xl hover:bg-gray-50 transition-colors"
            >
              <span>Product Description</span>
              <span className="text-xl font-light">{expandedSection === "desc" ? "−" : "+"}</span>
            </button>
            {expandedSection === "desc" && (
              <div className="px-5 pb-5 pt-1 text-lg md:text-xl text-gray-700 leading-relaxed space-y-3 font-medium">
                <p>
                  {product.description} This formulation glides on smoothly and leaves a natural premium feel. It has a lightweight buildable skin texture, so you can wear it with comfort and confidence throughout the day.
                </p>
                <div className="pt-2">
                  <strong className="text-black block mb-1">Key Features & Benefits:</strong>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Deeply targets skin layers to provide long-lasting benefits.</li>
                    <li>Contains premium botanicals sourced cleanly.</li>
                    <li>Glides smoothly to deliver a natural finish.</li>
                    <li>Hypoallergenic, smudge-proof, and clinically tested formulas.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Product Detail */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setExpandedSection(expandedSection === "detail" ? null : "detail")}
              className="flex justify-between items-center w-full px-5 py-5 text-left font-bold text-xl md:text-2xl hover:bg-gray-50 transition-colors"
            >
              <span>Product Detail</span>
              <span className="text-xl font-light">{expandedSection === "detail" ? "−" : "+"}</span>
            </button>
            {expandedSection === "detail" && (
              <div className="px-5 pb-5 pt-1 text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
                <p>Expiry Date: {product.expiresOn}</p>
                <p>Country of Origin: South Korea</p>
                <p>Category classification: {product.category}</p>
                {isMakeup && <p>Applicator specification: {makeupProduct?.applicator}</p>}
                {isMakeup && <p>Finish specification: {makeupProduct?.finish}</p>}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === "ingredients" ? null : "ingredients")}
              className="flex justify-between items-center w-full px-5 py-5 text-left font-bold text-xl md:text-2xl hover:bg-gray-50 transition-colors"
            >
              <span>Ingredients</span>
              <span className="text-xl font-light">{expandedSection === "ingredients" ? "−" : "+"}</span>
            </button>
            {expandedSection === "ingredients" && (
              <div className="px-5 pb-5 pt-1 text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
                <p>
                  {isSkincare && skincareProduct && skincareProduct.keyIngredients ? (
                    `Main Ingredients: ${skincareProduct.keyIngredients.join(", ")}, Water, Glycerin, Butylene Glycol, 1,2-Hexanediol, Ethylhexylglycerin, Tocopherol.`
                  ) : (
                    "Water, Dimethicone, Butylene Glycol, Iron Oxides (CI 77491, CI 77492, CI 77499), Polyglyceryl-2 Triisostearate, Glycerin, Silica, Salicylic Acid, Ethylhexylglycerin."
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Interactive Callout Feature Diagram ("About the Product") */}
      {product.features && product.features.length >= 3 && (
        <m.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[1440px] mx-auto bg-white border-y border-gray-100 py-16 px-4 md:px-[120px] relative"
        >
          {/* Left-aligned Title */}
          <div className="mb-12">
            <h2 className="text-[56px] font-normal font-serif text-brand-text-dark leading-none">About the Product</h2>
          </div>

          <div ref={containerRef} className="relative w-full grid grid-cols-1 md:grid-cols-3 gap-10 min-h-[450px]">
            
            {/* SVG Pointer Lines Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block">
              {/* Pointer Line 1 (Left Area - Doe foot applicator) */}
              {coords.line1 && (
                <>
                  <m.path
                    d={coords.line1}
                    fill="none"
                    stroke="var(--brand-line-gray)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                  />
                  <m.circle
                    cx={coords.dot1.cx}
                    cy={coords.dot1.cy}
                    r="4"
                    fill="black"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </>
              )}

              {/* Pointer Line 2 (Center/Top - Buildable) */}
              {coords.line2 && (
                <>
                  <m.path
                    d={coords.line2}
                    fill="none"
                    stroke="var(--brand-line-gray)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                  />
                  <m.circle
                    cx={coords.dot2.cx}
                    cy={coords.dot2.cy}
                    r="4"
                    fill="black"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </>
              )}

              {/* Pointer Line 3 (Right Area - Smudge Proof) */}
              {coords.line3 && (
                <>
                  <m.path
                    d={coords.line3}
                    fill="none"
                    stroke="var(--brand-line-gray)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                  />
                  <m.circle
                    cx={coords.dot3.cx}
                    cy={coords.dot3.cy}
                    r="4"
                    fill="black"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </>
              )}
            </svg>

            {/* Left Column (Callout 1) */}
            <div className="flex flex-col justify-end pb-6 md:pb-12">
              <div ref={badge1Ref} className="w-full max-w-[280px] flex flex-col items-start gap-2">
                <div className="border border-gray-200 bg-white rounded-full px-5 py-1.5 font-semibold text-base text-black shadow-sm font-sans">
                  {product.features[0].title}
                </div>
                {product.features[0].description && (
                  <p className="text-sm text-gray-500 font-semibold leading-relaxed ml-2 font-sans">
                    {product.features[0].description}
                  </p>
                )}
              </div>
            </div>

            {/* Center Column (Callout 2 + Product Image) */}
            <div className="flex flex-col items-center justify-between gap-6">
              {/* Top Center Badge */}
              <div ref={badge2Ref} className="w-full max-w-[200px] flex flex-col items-center text-center gap-2">
                <div className="border border-gray-200 bg-white rounded-full px-5 py-1.5 font-semibold text-base text-black shadow-sm font-sans">
                  {product.features[1].title}
                </div>
                {product.features[1].description && (
                  <p className="text-sm text-gray-500 font-semibold leading-relaxed font-sans">
                    {product.features[1].description}
                  </p>
                )}
              </div>

              {/* Central Product Image */}
              <div ref={imageRef} className="w-[250px] h-[250px] flex items-center justify-center select-none relative mt-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={250}
                  height={250}
                  onLoad={updateCoords}
                  className="object-contain transform hover:rotate-3 transition-transform duration-500 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.05)]"
                />
              </div>
            </div>

            {/* Right Column (Callout 3) */}
            <div className="flex flex-col justify-center">
              <div ref={badge3Ref} className="w-full max-w-[280px] md:ml-auto flex flex-col items-start gap-2">
                <div className="border border-gray-200 bg-white rounded-full px-5 py-1.5 font-semibold text-base text-black shadow-sm font-sans">
                  {product.features[2].title}
                </div>
                {product.features[2].description && (
                  <p className="text-sm text-gray-500 font-semibold leading-relaxed ml-2 font-sans">
                    {product.features[2].description}
                  </p>
                )}
              </div>
            </div>

          </div>
        </m.section>
      )}

      {/* 4. Ratings, Reviews, & Social Proof Core */}
      <section className="max-w-[1440px] mx-auto px-5 py-16 border-b border-gray-100">
        <h2 className="text-5xl md:text-6xl font-normal font-serif text-center mb-16">Ratings & Reviews</h2>

        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 items-start">
          {/* Left Block: Aggregated Metrics Matrix */}
          <div className="flex flex-col gap-8 bg-brand-bg-gray p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-6">
              <span className="text-7xl font-bold font-serif leading-none">{ratingVal.toFixed(1)}</span>
              <div className="flex flex-col">
                <div className="flex items-center text-yellow-500 gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.round(ratingVal) ? "fill-current" : "text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-base font-semibold text-gray-500">{reviewsCount} Ratings</span>
              </div>
            </div>

            {/* Star Distribution Rows */}
            <div className="flex flex-col gap-3 font-semibold text-base">
              {starDistribution.map((row) => (
                <div key={row.star} className="flex items-center gap-4">
                  <span className="w-3 text-right">{row.star}</span>
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: row.weight }}></div>
                  </div>
                  <span className="w-10 text-right text-sm text-gray-500">{row.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Block: Photo Stream Canvas & Review List */}
          <div className="flex flex-col gap-10">
            {/* Customer Photos Stream */}
            <div className="flex flex-col gap-4">
              <h3 className="text-3xl font-bold">Customer Photos</h3>
              <div className="flex flex-wrap items-center gap-3">
                {[imgCustomer1, imgCustomer2, imgCustomer3, imgCustomer4, imgCustomer5].map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLightboxImage(img);
                      setLightboxReview(reviews[idx % reviews.length]);
                    }}
                    className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden hover:opacity-90 active:scale-95 transition-all border border-gray-100"
                  >
                    <Image src={img} alt={`Customer Photo ${idx + 1}`} fill className="object-cover" />
                    {idx === 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold">
                        +10 More
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Submission Form */}
            {user ? (
              <div className="bg-brand-bg-gray p-6 rounded-[24px] border border-gray-100 mb-8">
                <h3 className="text-2xl font-bold mb-4 font-serif">Write a Review</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-semibold text-lg">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="text-yellow-500 transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${star <= newRating ? "fill-current" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full min-h-[100px] p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black text-black font-semibold text-base mb-4 resize-none"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="px-6 h-[44px] bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 text-center">
                <p className="text-gray-500 font-semibold text-base mb-3 font-sans">Only logged in customers can leave a review.</p>
                <button
                  onClick={() => {
                    useStore.getState().openAuthModal("PHONE_INPUT");
                  }}
                  className="bg-black text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                  Log In / Sign Up
                </button>
              </div>
            )}

            {/* Individual Review Row Components */}
            <div className="flex flex-col gap-6 divide-y divide-gray-100">
              {reviewsList.length === 0 ? (
                <p className="text-gray-500 font-semibold italic text-lg py-4">No reviews yet. Be the first to review this product!</p>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev.id} className="pt-6 first:pt-0 flex gap-4">
                    {/* Reviewer Initials Avatar */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-700 font-bold shrink-0 text-lg uppercase">
                      {rev.user_name ? rev.user_name[0] : "U"}
                    </div>
                    {/* Review Body */}
                    <div className="flex-1 flex flex-col gap-2 font-medium text-base">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-black text-xl leading-tight mb-1">{rev.user_name}</h4>
                          <div className="flex items-center text-yellow-500 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-current" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : ""}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-lg md:text-xl pr-4">
                        "{rev.comment}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 5. Cross-Sell Carousel Shelf ("You might like") */}
      <YouMayAlsoLikeSection products={recommendedProducts} title="You might like" />

      {/* Ratings Customer Photo Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-[900px] w-full grid grid-cols-1 md:grid-cols-2 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => {
                setLightboxImage(null);
                setLightboxReview(null);
              }}
              className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black/75 hover:bg-black text-white rounded-full transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Photo */}
            <div className="relative aspect-square w-full bg-brand-bg-image md:h-full mix-blend-multiply">
              <Image src={lightboxImage} alt="Customer Review Photo" fill className="object-cover" />
            </div>

            {/* Right Side: Review Detail */}
            <div className="p-8 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xl text-black">
                    {lightboxReview ? lightboxReview.author : "John Doe"}
                  </h4>
                  <span className="text-gray-400 text-sm">
                    {lightboxReview ? lightboxReview.date : "02 Jan"}
                  </span>
                </div>
                
                <div className="flex items-center text-yellow-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < (lightboxReview ? lightboxReview.rating : 5) ? "fill-current" : "text-gray-200"}`}
                    />
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <p className="text-lg font-serif italic text-black leading-snug mb-3">
                    "{lightboxReview ? lightboxReview.content : "Its very nice, worth every penny! This is a game changer! Give natural and long lasting glow."}"
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    This is a game changer! Gives natural and long lasting glow. Go ahead and buy it, you won't regret it. Verified buyer reviews provide absolute confirmation.
                  </p>
                </div>
              </div>

              {/* Helpfulness counter */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <span className="text-xs font-bold text-gray-400">WAS THIS REVIEW HELPFUL?</span>
                <button
                  onClick={() => alert("Thank you for your feedback!")}
                  className="flex items-center gap-2 text-sm font-bold text-black border border-black/25 rounded-full px-5 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  Helpful | 5
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Product Image Lightbox Modal */}
      {isMainLightboxOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsMainLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black text-white rounded-full transition-colors border border-white/20"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lightbox Swiper */}
            <Swiper
              initialSlide={thumbnails.indexOf(activeImage)}
              navigation={true}
              modules={[Navigation]}
              className="w-full h-full flex items-center justify-center"
              grabCursor={true}
            >
              {thumbnails.map((thumb, idx) => (
                <SwiperSlide key={idx} className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full max-w-[800px] max-h-[800px] mx-auto aspect-square">
                    <Image src={thumb} alt={`Large view ${idx + 1}`} fill className="object-contain" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

    </div>
  );
}
