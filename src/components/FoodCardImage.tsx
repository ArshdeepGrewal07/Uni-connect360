"use client";

import { useState } from "react";

interface FoodCardImageProps {
  src?: string | null;
  name: string;
  topDish?: string | null;
  className?: string;
  onClick?: () => void;
}

export function FoodCardImage({
  src,
  name,
  topDish,
  className = "h-16 w-20 shrink-0 rounded-xl object-cover shadow-2xs",
  onClick,
}: FoodCardImageProps) {
  const [error, setError] = useState(false);

  // Reliable backup mapping if src is missing or failed
  const getFallbackTheme = () => {
    const combined = `${name || ""} ${topDish || ""}`.toLowerCase();
    if (combined.includes("chai") || combined.includes("tapri")) {
      return {
        bg: "bg-[#f5ebd7]",
        accent: "#c2410c",
        label: "☕ Cutting Chai",
        type: "chai",
      };
    }
    if (combined.includes("momo")) {
      return {
        bg: "bg-[#faedcd]",
        accent: "#b45309",
        label: "🥟 Steamed Momos",
        type: "momos",
      };
    }
    if (combined.includes("pav") || combined.includes("bhaji")) {
      return {
        bg: "bg-[#fee8d6]",
        accent: "#ea580c",
        label: "🧈 Pav Bhaji",
        type: "pav",
      };
    }
    if (combined.includes("thali") || combined.includes("main") || combined.includes("biryani")) {
      return {
        bg: "bg-[#fef3c7]",
        accent: "#d97706",
        label: "🍛 Special Thali",
        type: "thali",
      };
    }
    if (combined.includes("salad") || combined.includes("green") || combined.includes("bowl")) {
      return {
        bg: "bg-[#e8f5e9]",
        accent: "#15803d",
        label: "🥗 Green Bowl",
        type: "salad",
      };
    }
    return {
      bg: "bg-[#fdeed9]",
      accent: "#c2410c",
      label: "✨ Campus Treat",
      type: "general",
    };
  };

  const theme = getFallbackTheme();

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} cursor-pointer transition-transform active:scale-95`}
        loading="lazy"
        onError={() => setError(true)}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center overflow-hidden border border-line/70 cursor-pointer shadow-2xs ${theme.bg} ${className}`}
    >
      <svg
        viewBox="0 0 80 64"
        className="h-full w-full select-none"
      >
        <defs>
          <linearGradient id={`grad-${theme.type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect width="80" height="64" fill={`url(#grad-${theme.type})`} />

        {theme.type === "chai" && (
          <g transform="translate(40, 36)">
            {/* Kulhad/Cup */}
            <path d="M -14 -6 L 14 -6 L 10 16 L -10 16 Z" fill="#b45309" rx="2" />
            <ellipse cx="0" cy="-6" rx="14" ry="5" fill="#fef3c7" />
            <ellipse cx="0" cy="-6" rx="11" ry="3.5" fill="#92400e" />
            {/* Rising Steam */}
            <path d="M -4 -12 Q -2 -18 -6 -22" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" opacity="0.75">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" />
            </path>
            <path d="M 4 -12 Q 6 -18 2 -24" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" opacity="0.75">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.8s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {theme.type === "momos" && (
          <g transform="translate(40, 34)">
            {/* Bamboo basket rim */}
            <ellipse cx="0" cy="10" rx="28" ry="12" fill="#d97706" opacity="0.25" />
            <ellipse cx="0" cy="8" rx="26" ry="10" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            {/* Momos dumplings */}
            <ellipse cx="-10" cy="6" rx="7" ry="5" fill="#ffffff" stroke="#d97706" strokeWidth="0.8" />
            <ellipse cx="10" cy="6" rx="7" ry="5" fill="#ffffff" stroke="#d97706" strokeWidth="0.8" />
            <ellipse cx="0" cy="3" rx="8" ry="6" fill="#ffffff" stroke="#d97706" strokeWidth="0.8" />
            {/* Chili chutney drop */}
            <circle cx="0" cy="10" r="2.5" fill="#dc2626" />
          </g>
        )}

        {theme.type === "pav" && (
          <g transform="translate(40, 32)">
            {/* Bhaji bowl */}
            <ellipse cx="-12" cy="6" rx="14" ry="9" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />
            {/* Butter square */}
            <rect x="-15" y="2" width="6" height="4" rx="1" fill="#fef08a" />
            {/* Golden toasted Pav Buns */}
            <ellipse cx="12" cy="2" rx="11" ry="8" fill="#d97706" stroke="#92400e" strokeWidth="1" />
            <ellipse cx="12" cy="0" rx="9" ry="6" fill="#fde68a" />
          </g>
        )}

        {theme.type === "thali" && (
          <g transform="translate(40, 32)">
            {/* Thali plate */}
            <circle cx="0" cy="0" r="22" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="19" fill="#fff7ed" />
            {/* Katori bowls */}
            <circle cx="-9" cy="-7" r="5.5" fill="#f59e0b" />
            <circle cx="9" cy="-7" r="5.5" fill="#dc2626" />
            <circle cx="0" cy="-11" r="5" fill="#10b981" />
            {/* Roti bread */}
            <circle cx="0" cy="7" r="8" fill="#fef3c7" stroke="#d97706" strokeWidth="0.6" />
          </g>
        )}

        {theme.type === "salad" && (
          <g transform="translate(40, 34)">
            <ellipse cx="0" cy="4" rx="22" ry="12" fill="#dcfce7" stroke="#15803d" strokeWidth="1" />
            {/* Greens & avocado */}
            <circle cx="-8" cy="2" r="6" fill="#22c55e" />
            <circle cx="8" cy="2" r="6" fill="#16a34a" />
            <circle cx="0" cy="0" r="5" fill="#86efac" />
            <circle cx="0" cy="5" r="2.5" fill="#ef4444" />
          </g>
        )}

        {theme.type === "general" && (
          <g transform="translate(40, 32)">
            <circle cx="0" cy="0" r="18" fill="#ffedd5" stroke="#ea580c" strokeWidth="1" />
            <text x="0" y="5" textAnchor="middle" fontSize="16">✨</text>
          </g>
        )}
      </svg>

      <span className="absolute bottom-1 right-1 rounded-md bg-black/40 px-1 py-0.2 text-[8px] font-bold text-white backdrop-blur-xs">
        Fresh
      </span>
    </div>
  );
}
