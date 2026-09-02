"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HeartPulse } from "lucide-react";

interface PulsingOrbProps {
  size?: "sm" | "md" | "lg";
  letter?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const PulsingOrb: React.FC<PulsingOrbProps> = ({
  size = "md",
  letter,
  icon,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Size mapping
  const config = {
    sm: {
      container: "w-[72px] h-[72px]",
      squircle: "w-11 h-11 rounded-2xl text-xl",
      iconSize: "w-5 h-5",
      ringBase: 44,
      ringStep: 12,
    },
    md: {
      container: "w-[110px] h-[110px]",
      squircle: "w-16 h-16 rounded-2xl text-2xl",
      iconSize: "w-8 h-8",
      ringBase: 70,
      ringStep: 18,
    },
    lg: {
      container: "w-[136px] h-[136px]",
      squircle: "w-20 h-20 rounded-3xl text-3xl",
      iconSize: "w-10 h-10",
      ringBase: 90,
      ringStep: 22,
    },
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center select-none ${config.container} ${className}`}
      aria-hidden="true"
    >
      {/* Concentric Expanding Pulsing Rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border pointer-events-none"
          style={{
            width: config.ringBase + i * config.ringStep,
            height: config.ringBase + i * config.ringStep,
            borderColor:
              i % 2 === 0
                ? `rgba(16, 185, 129, ${0.22 - i * 0.05})`
                : `rgba(14, 165, 233, ${0.25 - i * 0.05})`,
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.07, 1],
                  opacity: [0.4, 0.85, 0.4],
                }
          }
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: i * 0.45,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Central Radiant Squircle with ShasthyaHub Sky-Cyan-Emerald Gradient */}
      <motion.div
        className={`relative z-10 flex items-center justify-center text-white font-black cursor-default shadow-xl ${config.squircle}`}
        style={{
          background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #10B981 100%)",
          backgroundSize: "200% 200%",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                boxShadow: [
                  "0 0 24px rgba(14, 165, 233, 0.35), 0 0 48px rgba(16, 185, 129, 0.20)",
                  "0 0 36px rgba(14, 165, 233, 0.50), 0 0 72px rgba(16, 185, 129, 0.30)",
                  "0 0 24px rgba(14, 165, 233, 0.35), 0 0 48px rgba(16, 185, 129, 0.20)",
                ],
              }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon ? (
          icon
        ) : letter ? (
          <span className="text-white drop-shadow-md">{letter}</span>
        ) : (
          <div className="flex items-center justify-center">
            <HeartPulse className={`${config.iconSize} text-white drop-shadow-md`} strokeWidth={2.4} />
          </div>
        )}
      </motion.div>
    </div>
  );
};
