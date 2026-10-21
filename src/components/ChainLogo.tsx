"use client";

import React from "react";
import { getChainMeta } from "@/lib/chains";

interface ChainLogoProps {
  chain: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ChainLogo({ chain, className, size = "md" }: ChainLogoProps) {
  const meta = getChainMeta(chain);
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 rounded-xl text-xs"
      : size === "lg"
      ? "h-12 w-12 rounded-2xl text-base"
      : "h-10 w-10 rounded-2xl text-sm";

  const norm = chain.trim();

  // 1. שופרסל (כולל דיל, שלי, אקספרס)
  if (norm.includes("שופרסל")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#e30613] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#e30613" />
          {/* Shufersal stylized white "ש" mark */}
          <path
            d="M26 30 C26 26 30 22 34 22 C38 22 42 26 42 30 L42 54 C42 62 48 68 56 68 C64 68 70 62 70 54 L70 30 C70 26 74 22 78 22 C82 22 86 26 86 30 L86 54 C86 70 73 82 56 82 C39 82 26 70 26 54 Z"
            fill="white"
          />
          <circle cx="56" cy="38" r="8" fill="white" />
          <path
            d="M50 48 L62 48 L62 58 C62 61 59 64 56 64 C53 64 50 61 50 58 Z"
            fill="white"
          />
        </svg>
      </div>
    );
  }

  // 2. רמי לוי
  if (norm.includes("רמי לוי")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#003b95] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#003b95" />
          {/* Circular badge with red accent arc and bold typography */}
          <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="3" />
          <path d="M22 66 C32 80 68 80 78 66" stroke="#e30613" strokeWidth="6" strokeLinecap="round" />
          <text
            x="50"
            y="48"
            fill="white"
            fontSize="22"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            רמי לוי
          </text>
          <text
            x="50"
            y="62"
            fill="#ffdd00"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            השקמה
          </text>
        </svg>
      </div>
    );
  }

  // 3. אושר עד
  if (norm.includes("אושר עד")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#002f6c] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#002f6c" />
          {/* Osher Ad crown points in gold */}
          <path d="M35 28 L42 36 L50 24 L58 36 L65 28 L62 44 L38 44 Z" fill="#ffc700" />
          <text
            x="50"
            y="64"
            fill="#ffc700"
            fontSize="21"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            אושר עד
          </text>
          <line x1="24" y1="74" x2="76" y2="74" stroke="#ffc700" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 4. יוחננוף
  if (norm.includes("יוחננוף")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#007a3d] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#007a3d" />
          {/* Fresh sprout leaf */}
          <path
            d="M50 22 C62 22 72 32 72 44 C72 56 60 56 50 64 C40 56 28 56 28 44 C28 32 38 22 50 22 Z"
            fill="#34d399"
          />
          <path d="M50 26 L50 56" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <text
            x="50"
            y="80"
            fill="white"
            fontSize="18"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            יוחננוף
          </text>
        </svg>
      </div>
    );
  }

  // 5. ויקטורי
  if (norm.includes("ויקטורי")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#e5007d] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#e5007d" />
          {/* Large Victory V with wing */}
          <path
            d="M24 26 L48 78 L58 78 L80 26 L66 26 L53 62 L40 26 Z"
            fill="white"
          />
          <text
            x="50"
            y="92"
            fill="white"
            fontSize="11"
            fontWeight="900"
            letterSpacing="1"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            VICTORY
          </text>
        </svg>
      </div>
    );
  }

  // 6. קרפור
  if (norm.includes("קרפור") || norm.toLowerCase().includes("carrefour")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-white border border-slate-200 p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="white" />
          {/* Carrefour signature optical illusion C diamond */}
          <path d="M22 48 L46 22 C42 28 39 36 39 46 C39 56 42 64 46 70 L22 48 Z" fill="#e30613" />
          <path d="M78 48 L54 22 C58 28 61 36 61 46 C61 56 58 64 54 70 L78 48 Z" fill="#004e9a" />
        </svg>
      </div>
    );
  }

  // 7. חצי חינם
  if (norm.includes("חצי חינם")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#0a4b9c] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#0a4b9c" />
          <text
            x="50"
            y="54"
            fill="#ffd700"
            fontSize="36"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            ½
          </text>
          <text
            x="50"
            y="80"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            חצי חינם
          </text>
        </svg>
      </div>
    );
  }

  // 8. טיב טעם
  if (norm.includes("טיב טעם")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#800020] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#800020" />
          <circle cx="50" cy="30" r="10" fill="#eab308" />
          <text
            x="50"
            y="62"
            fill="white"
            fontSize="19"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            טיב טעם
          </text>
          <text
            x="50"
            y="82"
            fill="#fecdd3"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            TIV TAAM
          </text>
        </svg>
      </div>
    );
  }

  // 9. am:pm
  if (norm.includes("am:pm") || norm.toLowerCase().includes("am:pm")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-black p-1 shadow-2xs border border-zinc-800 ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#09090b" />
          <circle cx="50" cy="50" r="40" stroke="#facc15" strokeWidth="2.5" />
          <text
            x="50"
            y="58"
            fill="#facc15"
            fontSize="26"
            fontWeight="900"
            letterSpacing="-1"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            am:pm
          </text>
        </svg>
      </div>
    );
  }

  // 10. קשת טעמים
  if (norm.includes("קשת טעמים")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#b91c1c] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#b91c1c" />
          {/* Rainbow arc */}
          <path d="M26 44 C26 28 74 28 74 44" stroke="#fbbf24" strokeWidth="4" fill="none" />
          <path d="M32 44 C32 32 68 32 68 44" stroke="#34d399" strokeWidth="4" fill="none" />
          <text
            x="50"
            y="70"
            fill="white"
            fontSize="18"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            קשת
          </text>
        </svg>
      </div>
    );
  }

  // 11. יש / יש חסד
  if (norm.includes("יש")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#007a3d] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#007a3d" />
          <circle cx="50" cy="50" r="38" stroke="#a7f3d0" strokeWidth="2.5" />
          <text
            x="50"
            y="60"
            fill="white"
            fontSize="32"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            יש
          </text>
          <text
            x="50"
            y="78"
            fill="#a7f3d0"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            חסד
          </text>
        </svg>
      </div>
    );
  }

  // 12. מחסני השוק
  if (norm.includes("מחסני השוק")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#15803d] p-1 shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="#15803d" />
          {/* Awning roof */}
          <path d="M22 36 L78 36 L72 48 L28 48 Z" fill="#fde047" />
          <text
            x="50"
            y="70"
            fill="white"
            fontSize="15"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            מחסני השוק
          </text>
        </svg>
      </div>
    );
  }

  // 13. מכולת שכונתית / צרכנייה (כולל מבוא חורון)
  if (norm.includes("מכולת") || norm.includes("צרכניה") || norm.includes("צרכנייה")) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 p-1 text-white shadow-2xs ${sizeClass} ${className ?? ""}`}
        aria-label={chain}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill="url(#groGrad)" />
          {/* Market basket / shop building icon */}
          <path
            d="M32 44 L68 44 L62 76 L38 76 Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M40 44 C40 32 60 32 60 44"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="50" cy="58" r="4" fill="#d97706" />
          <defs>
            <linearGradient id="groGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Default fallback: Stylized letter mark in chain colors
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl shadow-2xs font-black ${sizeClass} ${meta.bg} ${meta.text} ${className ?? ""}`}
      aria-label={chain}
    >
      {meta.logoLetter}
    </div>
  );
}
