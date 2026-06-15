"use client";

import { m as motion } from "framer-motion";

type TrustBadge = {
  line1: string;
  line2: string;
};

type Frame525SectionProps = {
  badges: TrustBadge[];
};

const icons = [
  <svg key="clinically" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-secondary)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v7.31L3.15 19.23A2 2 0 0 0 4.86 22h10.28a2 2 0 0 0 1.71-2.77L13 9.31V2" /><path d="M7.5 2h5" /><path d="M3.5 16h11" /><path d="M21 16.5c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5c0-1.93 3.5-5.5 3.5-5.5s3.5 3.57 3.5 5.5Z" /></svg>,
  <svg key="cruelty" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-secondary)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M13 16a3 3 0 0 1 2.24 5" /><path d="M18 12h.01" /><path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" /><path d="M20 8.54V4a2 2 0 1 0-4 0v3" /><path d="M5 3c-.8 0-1.5.7-1.5 1.5 0 1.5 3 4 3 4s3-2.5 3-4c0-.8-.7-1.5-1.5-1.5a1.5 1.5 0 0 0-1.5 1A1.5 1.5 0 0 0 5 3z" /></svg>,
  <svg key="vegan" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-secondary)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" /></svg>,
  <svg key="clean" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-secondary)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /></svg>,
];

export function TrustBadgesSection({ badges }: Frame525SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="relative w-full bg-brand-bg-trust font-sans py-10 md:py-[60px] transform-gpu"
    >
      <div className="max-w-[1440px] mx-auto px-5 lg:px-[60px]">
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 gap-y-8 gap-x-4 sm:gap-10 lg:flex lg:flex-row lg:justify-between lg:items-center px-2 sm:px-0"
        >
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className="flex flex-col lg:flex-row items-center text-center lg:text-left lg:justify-start gap-3 sm:gap-4 lg:gap-[52px] transform-gpu will-change-transform"
            >
              <div className="flex-shrink-0 flex items-center justify-center text-brand-secondary scale-90 sm:scale-100 lg:origin-left">
                {icons[index % icons.length]}
              </div>
              <h3 className="text-black font-serif font-normal text-[16px] sm:text-[20px] md:text-[28px] lg:text-[36px] leading-tight lg:leading-[44px] tracking-normal">
                <span className="block">{badge.line1}</span>
                <span className="block">{badge.line2}</span>
              </h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
