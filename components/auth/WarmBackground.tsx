"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface WarmBackgroundProps {
  className?: string;
}

export const WarmBackground: React.FC<WarmBackgroundProps> = ({
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/70 via-cyan-50/40 to-emerald-50/50 dark:from-gray-950 dark:via-sky-950/30 dark:to-emerald-950/20" />

      {/* Top-Left Radiant Sky/Cyan Orb */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-sky-400/35 to-cyan-400/20 dark:from-sky-500/15 dark:to-cyan-500/10 blur-[100px] md:blur-[140px]"
        style={{
          width: 580,
          height: 580,
          top: -140,
          left: -120,
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 30, -20, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.08, 0.96, 1],
              }
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom-Left Emerald Glow Orb */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-tr from-emerald-400/30 to-teal-400/20 dark:from-emerald-500/12 dark:to-teal-500/10 blur-[110px] md:blur-[150px]"
        style={{
          width: 480,
          height: 480,
          bottom: -100,
          left: 60,
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -40, 25, 0],
                y: [0, 30, -25, 0],
                scale: [1, 1.1, 0.95, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Right Soft Spotlight Orb */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-cyan-400/25 to-sky-300/20 dark:from-cyan-500/10 dark:to-sky-500/5 blur-[120px] md:blur-[160px]"
        style={{
          width: 500,
          height: 500,
          top: "30%",
          right: -100,
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -30, 20, 0],
                y: [0, 40, -30, 0],
                scale: [1, 1.06, 0.98, 1],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Subtle Noise Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};
