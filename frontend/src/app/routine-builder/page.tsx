"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ChevronRight, ChevronLeft, Check, ShoppingBag, Droplet, Sun, Moon, RefreshCw } from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { m as motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getProducts, type FrontendProduct } from "@/lib/productAdapter";
import { Price } from "@/components/shared/Price";

// ─── Quiz Questions & Options Definitions ─────────────────────────────────────
interface Option {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: Option[];
  isMulti?: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: "skinType",
    title: "What is your skin type?",
    subtitle: "Select the option that best describes how your skin feels normally.",
    options: [
      { id: "Dry", label: "Dry", desc: "Feels tight, flaky, or dehydrated", icon: "❄️" },
      { id: "Oily", label: "Oily", desc: "Excess sebum, shiny T-zone, or breakouts", icon: "✨" },
      { id: "Combination", label: "Combination", desc: "Oily in T-zone, dry on cheeks", icon: "🌓" },
      { id: "Normal", label: "Normal", desc: "Balanced, comfortable, not oily or dry", icon: "🌸" },
    ],
  },
  {
    id: "concerns",
    title: "What are your primary skin concerns?",
    subtitle: "Select all that apply to target specifically.",
    isMulti: true,
    options: [
      { id: "Acne", label: "Acne & Breakouts", desc: "Blemishes, clogged pores, redness", icon: "🔴" },
      { id: "Pigmentation", label: "Dark Spots & Pigmentation", desc: "Sun damage, acne marks, uneven tone", icon: "🍪" },
      { id: "Anti-aging", label: "Signs of Aging", desc: "Fine lines, wrinkles, loss of elasticity", icon: "⏳" },
      { id: "Dryness", label: "Dryness & Dehydration", desc: "Dull texture, tightness, scaling", icon: "💧" },
      { id: "Barrier repair", label: "Damaged Barrier / Redness", desc: "Sensitivity, stinging, visible redness", icon: "🛡️" },
    ],
  },
  {
    id: "goal",
    title: "What is your main skin goal?",
    subtitle: "Which result do you want to prioritize the most?",
    options: [
      { id: "glow", label: "Radiant Glow", desc: "Brighten and revitalize tired skin", icon: "🌟" },
      { id: "hydration", label: "Deep Hydration", desc: "Plump, soft, and richly moisturized skin", icon: "🌊" },
      { id: "texture", label: "Smooth Texture", desc: "Refine pores and exfoliate rough spots", icon: "🥋" },
      { id: "clear", label: "Clear Skin", desc: "Balance oils and eliminate active blemishes", icon: "🧼" },
    ],
  },
];

export default function RoutineBuilderPage() {
  const addToCart = useStore((s) => s.addToCart);
  const applyCoupon = useStore((s) => s.applyCoupon);

  // States
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    skinType: "",
    concerns: [],
    goal: "",
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    cleanse: FrontendProduct | null;
    treat: FrontendProduct | null;
    moisturize: FrontendProduct | null;
  } | null>(null);

  const [allProducts, setAllProducts] = useState<FrontendProduct[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch all products once for matching
  useEffect(() => {
    getProducts().then((prods) => setAllProducts(prods)).catch(console.error);
  }, []);

  const handleOptionSelect = (qId: string, optId: string, isMulti?: boolean) => {
    if (isMulti) {
      const current = (answers[qId] as string[]) || [];
      const updated = current.includes(optId)
        ? current.filter((id) => id !== optId)
        : [...current, optId];
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: optId }));
    }
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateRoutine();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateRoutine = () => {
    setLoading(true);
    setTimeout(() => {
      const type = answers.skinType as string;
      const concerns = answers.concerns as string[];
      const goal = answers.goal as string;

      // ─── Cleanse Recommendation ──────────────────────────────────────────
      // Default fallback is AHA BHA toner or Mugwort wash pack if oily/combo, otherwise floral soap or mist
      let cleanser = allProducts.find(
        (p) => p.id === "aha-bha-exfoliating-toner"
      ) || null;
      if (type === "Dry" || type === "Normal") {
        cleanser = allProducts.find((p) => p.id === "floral-soap") || cleanser;
      }

      // ─── Treat Recommendation (Serum) ──────────────────────────────────────
      let treat = allProducts.find((p) => p.id === "hyaluronic-acid-serum") || null;
      if (concerns.includes("Acne")) {
        treat = allProducts.find((p) => p.id === "ceo-afterglow-vitamin-c-serum") || allProducts.find((p) => p.id === "centella-ampoule") || treat;
      } else if (concerns.includes("Pigmentation")) {
        treat = allProducts.find((p) => p.id === "ceo-afterglow-vitamin-c-serum") || treat;
      } else if (concerns.includes("Barrier repair")) {
        treat = allProducts.find((p) => p.id === "snail-mucin-essence") || treat;
      } else if (concerns.includes("Anti-aging")) {
        treat = allProducts.find((p) => p.id === "radiance-pink-daily-serum") || treat;
      }

      // ─── Moisturize Recommendation ─────────────────────────────────────────
      let moisturize = allProducts.find((p) => p.id === "vitamin-c-cream") || null;
      if (type === "Oily" || type === "Combination") {
        moisturize = allProducts.find((p) => p.id === "cica-soothing-cream") || moisturize;
      } else if (concerns.includes("Anti-aging")) {
        moisturize = allProducts.find((p) => p.id === "retinol-night-cream") || moisturize;
      }

      setResults({ cleanse: cleanser, treat, moisturize });
      setLoading(false);
    }, 1500);
  };

  const handleBuyRoutine = async () => {
    if (!results) return;
    const items = [results.cleanse, results.treat, results.moisturize].filter(Boolean) as FrontendProduct[];
    items.forEach((item) => {
      addToCart({
        id: item.id,
        slug: item.slug,
        name: item.name,
        image: item.image,
        price: item.price,
        originalPrice: item.originalPrice,
        discount: item.discount,
        rating: item.rating,
        reviews: item.reviews,
        category: item.category,
      }, 1);
    });

    // Automatically apply ROUTINE15 bundle coupon
    await applyCoupon("ROUTINE15");
    setAddedToCart(true);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({ skinType: "", concerns: [], goal: "" });
    setResults(null);
    setAddedToCart(false);
  };

  // Check if current step has a valid selection to unlock Next button
  const currentQuestion = QUESTIONS[currentStep];
  const isNextDisabled =
    currentQuestion.isMulti
      ? (answers[currentQuestion.id] as string[]).length === 0
      : !answers[currentQuestion.id];

  const totalBundlePrice = results
    ? ((results.cleanse?.price || 0) + (results.treat?.price || 0) + (results.moisturize?.price || 0))
    : 0;

  const discountedBundlePrice = totalBundlePrice * 0.85;

  return (
    <main className="min-h-screen bg-brand-bg-cream pt-8 pb-24 px-6 md:px-12 font-sans text-black">
      <div className="max-w-[1000px] mx-auto">
        <AnimatePresence mode="wait">
          {/* 1. QUIZ RUNNING STATE */}
          {!loading && !results && (
            <motion.div
              key="quiz-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100/50 flex flex-col min-h-[500px]"
            >
              {/* Progress Indicator */}
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
                <span>Quiz Step {currentStep + 1} of {QUESTIONS.length}</span>
                <div className="w-1/3 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="font-serif text-4xl mb-2 leading-tight">{currentQuestion.title}</h1>
              <p className="text-gray-500 text-sm mb-10 font-medium">{currentQuestion.subtitle}</p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentQuestion.isMulti
                    ? (answers[currentQuestion.id] as string[]).includes(opt.id)
                    : answers[currentQuestion.id] === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.isMulti)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group focus:outline-none ${
                        isSelected
                          ? "border-brand-primary bg-brand-primary-light/10 shadow-sm"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="text-3xl filter drop-shadow-sm select-none">{opt.icon}</div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-bold text-sm text-black">{opt.label}</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute right-4 top-4 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer Controls */}
              <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-50">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-0 focus:outline-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  {currentStep === QUESTIONS.length - 1 ? "Get Routine" : "Next"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* 2. LOADING MATCHING ROUTINE STATE */}
          {loading && (
            <motion.div
              key="quiz-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100/50 flex flex-col justify-center items-center text-center min-h-[500px]"
            >
              <div className="mb-6">
                <Loader size="lg" className="text-brand-primary" />
              </div>
              <h2 className="font-serif text-3xl mb-3">Customizing your routine...</h2>
              <p className="text-gray-400 text-sm font-semibold max-w-sm">
                Analysing your concerns, skin goals, and type to construct a premium, harmonized 3-step routine.
              </p>
            </motion.div>
          )}

          {/* 3. RESULTS STATE */}
          {!loading && results && (
            <motion.div
              key="quiz-results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-8"
            >
              {/* Header Box */}
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100/50 text-center relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-brand-primary-light/20 rounded-full filter blur-2xl -mr-16 -mt-16"></div>
                <div className="absolute left-0 bottom-0 w-32 h-32 bg-brand-secondary/20 rounded-full filter blur-2xl -ml-16 -mb-16"></div>

                <div className="inline-flex items-center gap-2 bg-brand-primary-light text-brand-secondary font-bold px-4 py-1.5 rounded-full text-xs shadow-sm mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Your Skin Match Is Ready
                </div>
                <h1 className="font-serif text-4xl md:text-5xl leading-tight">Your Customized Skincare Routine</h1>
                <p className="text-gray-500 font-medium text-sm mt-3 max-w-2xl mx-auto">
                  Based on your <span className="font-bold text-black">{answers.skinType}</span> skin and concern with 
                  {" "}<span className="font-bold text-black">{QUESTIONS[1].options.find(o => o.id === (answers.concerns as string[])[0])?.label}</span>. 
                  We recommend a simple, harmonized 3-step ritual.
                </p>
              </div>

              {/* Routine Steps Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { step: 1, label: "CLEANSE", product: results.cleanse, desc: "Gentle wash to lift dirt and oil without stripping.", time: "Day & Night" },
                  { step: 2, label: "TREAT", product: results.treat, desc: "Active targeted serum addressing your concern.", time: "Night" },
                  { step: 3, label: "MOISTURIZE", product: results.moisturize, desc: "Hydrate, seal ingredients, and support skin barrier.", time: "Day & Night" },
                ].map((item) => {
                  const p = item.product;
                  if (!p) return null;

                  return (
                    <div key={item.step} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 flex flex-col relative group">
                      <span className="absolute left-6 top-6 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right block mb-6">
                        {item.time}
                      </span>

                      {/* Image Container */}
                      <Link href={`/products/${p.slug}`} className="w-full aspect-[4/5] bg-brand-bg-image rounded-2xl flex items-center justify-center p-4 relative overflow-hidden mb-6 cursor-pointer">
                        <Image src={p.image} alt={p.name} fill className="object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                      </Link>

                      {/* Info */}
                      <div className="flex-grow flex flex-col font-sans">
                        <span className="text-xs font-bold text-brand-primary tracking-wider uppercase mb-1">{item.label}</span>
                        <Link href={`/products/${p.slug}`}>
                          <h3 className="font-bold text-base text-black line-clamp-2 leading-tight hover:text-brand-primary transition-colors pr-1 min-h-[44px]">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed flex-grow">{item.desc}</p>
                        
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                          <Price amount={p.price} className="text-[18px] font-black text-black" />
                          {p.originalPrice && (
                            <Price amount={p.originalPrice} className="text-xs text-gray-400 line-through" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bundle Purchase Call To Action Box */}
              <div className="bg-black text-white rounded-3xl p-8 md:p-12 shadow-lg border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-brand-primary-light/5 rounded-full filter blur-3xl"></div>
                <div className="flex-1 space-y-2">
                  <span className="bg-brand-primary-light text-brand-secondary font-bold text-xs uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                    Exclusive Routine Offer
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl mt-3">Get the Entire 3-Step Routine Bundle</h2>
                  <p className="text-gray-400 text-sm max-w-lg font-medium leading-relaxed">
                    Buy your customized routine steps together today and automatically receive a <span className="text-white font-bold">15% bundle discount</span>!
                  </p>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4 flex-shrink-0">
                  <div className="flex items-baseline gap-3">
                    <Price amount={discountedBundlePrice} className="text-4xl font-black text-white" />
                    <Price amount={totalBundlePrice} className="text-lg text-gray-400 line-through decoration-1" />
                  </div>

                  {addedToCart ? (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Link
                        href="/cart"
                        className="bg-brand-primary hover:bg-brand-primary/90 text-black font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm active:scale-[0.98] w-full"
                      >
                        <Check className="w-4 h-4" /> Go to Cart
                      </Link>
                      <button
                        onClick={resetQuiz}
                        className="text-xs text-gray-400 font-bold hover:text-white transition-colors cursor-pointer w-full text-center"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 w-full md:w-auto">
                      <button
                        onClick={resetQuiz}
                        className="border border-gray-800 hover:border-gray-600 bg-transparent text-white font-bold px-6 py-4 rounded-xl transition-all text-sm cursor-pointer"
                      >
                        Retake Quiz
                      </button>
                      <button
                        onClick={handleBuyRoutine}
                        className="bg-white text-black hover:bg-gray-100 font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm active:scale-[0.98]"
                      >
                        <ShoppingBag className="w-4 h-4" /> Add Bundle to Cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
