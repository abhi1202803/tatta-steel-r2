"use client";

import { useEffect, useState } from "react";
import { Wrench, Activity, Cpu, Shield } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { label: "Connecting to plant systems", icon: Activity },
  { label: "Loading equipment registry", icon: Cpu },
  { label: "Syncing ML prediction pipeline", icon: Shield },
  { label: "Preparing executive dashboard", icon: Wrench },
];

interface AppSplashProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function AppSplash({ onComplete, minDuration = 1800 }: AppSplashProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(95, (elapsed / minDuration) * 100);
      setProgress(pct);
      setStepIndex(Math.min(STEPS.length - 1, Math.floor((elapsed / minDuration) * STEPS.length)));
    }, 50);

    const timer = setTimeout(() => {
      setProgress(100);
      setExiting(true);
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDuration, onComplete]);

  const StepIcon = STEPS[stepIndex].icon;

  return (
    <div className={`app-splash ${exiting ? "app-splash-exit" : ""}`}>
      <div className="app-splash-grid" />
      <div className="app-splash-glow app-splash-glow-a" />
      <div className="app-splash-glow app-splash-glow-b" />

      <div className="app-splash-content">
        <motion.div
          className="app-splash-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="app-splash-logo-icon">
            <Wrench className="w-8 h-8 text-accent-light" />
          </div>
          <div className="app-splash-logo-ring" />
          <div className="app-splash-logo-ring" style={{ inset: "-14px", animationDirection: "reverse", animationDuration: "12s" }} />
        </motion.div>

        <motion.h1
          className="app-splash-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Tata Steel
        </motion.h1>
        <motion.p
          className="app-splash-subtitle"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          Industrial Agentic AI
        </motion.p>
        <p className="app-splash-plant"></p>

        <div className="app-splash-progress-wrap">
          <div className="app-splash-progress-bar">
            <div className="app-splash-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="app-splash-step">
            <StepIcon className="w-3.5 h-3.5 text-accent-light" />
            <span>{STEPS[stepIndex].label}</span>
            <span className="app-splash-pct">{Math.round(progress)}%</span>
          </div>
        </div>

        <motion.div
          className="app-splash-badges"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <span className="app-splash-badge">Multi-Agent</span>
          <span className="app-splash-badge">9-Layer ML</span>
          <span className="app-splash-badge">Real-Time</span>
          <span className="app-splash-badge">RAG Powered</span>
        </motion.div>
      </div>
    </div>
  );
}
