"use client";

import { useEffect, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

/**
 * ScrollToTopFAB — Floating Action Button that appears after scrolling 400px.
 * Smoothly scrolls the window back to top on click.
 */
export function ScrollToTopFAB() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-to-top"
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-black text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center justify-center hover:bg-gray-800 hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)] transition-all"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
