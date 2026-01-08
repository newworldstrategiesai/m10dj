'use client';

import React from 'react';

interface TipJarAnimatedLoaderProps {
  size?: number;
  className?: string;
}

/**
 * Animated Tip Jar loading component
 * Shows a jar filling with liquid animation
 */
export default function TipJarAnimatedLoader({ 
  size = 96,
  className = ''
}: TipJarAnimatedLoaderProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      role="img"
      aria-label="Loading"
      className={className}
    >
      <defs>
        {/* Jar interior (used to clip liquid) */}
        <clipPath id="jar-interior">
          <path
            d="
              M144 128
              C120 152 112 176 112 208
              V400
              C112 448 152 480 192 480
              H320
              C360 480 400 448 400 400
              V208
              C400 176 392 152 368 128
              Z
            "
          />
        </clipPath>
        
        {/* Liquid gradient */}
        <linearGradient id="liquid-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#66BB6A" />
        </linearGradient>
      </defs>

      {/* 🌊 LIGHT GREEN SURFACE with wave animation */}
      <path
        id="wave"
        fill="url(#liquid-grad)"
        clipPath="url(#jar-interior)"
        d="
          M96 260
          C160 225, 240 285, 320 255
          C360 245, 390 265, 416 255
          L416 640
          L96 640
          Z
        "
      >
        <animate
          attributeName="d"
          dur="1.1s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="
            0.4 0 0.6 1;
            0.4 0 0.6 1
          "
          values="
            M96 260 C160 225,240 285,320 255 C360 245,390 265,416 255 L416 640 L96 640 Z;
            M96 260 C160 285,240 225,320 275 C360 285,390 245,416 270 L416 640 L96 640 Z;
            M96 260 C160 225,240 285,320 255 C360 245,390 265,416 255 L416 640 L96 640 Z
          "
        />
      </path>

      {/* 🌊 DARK GREEN THIN BORDER (same wave, stroke only) */}
      <path
        fill="none"
        stroke="#2E7D32"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#jar-interior)"
        d="
          M96 260
          C160 225, 240 285, 320 255
          C360 245, 390 265, 416 255
        "
      >
        <animate
          attributeName="d"
          dur="1.1s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="
            0.4 0 0.6 1;
            0.4 0 0.6 1
          "
          values="
            M96 260 C160 225,240 285,320 255 C360 245,390 265,416 255;
            M96 260 C160 285,240 225,320 275 C360 285,390 245,416 270;
            M96 260 C160 225,240 285,320 255 C360 245,390 265,416 255
          "
        />
      </path>

      {/* Jar outline */}
      <path
        d="
          M144 128
          C120 152 112 176 112 208
          V400
          C112 448 152 480 192 480
          H320
          C360 480 400 448 400 400
          V208
          C400 176 392 152 368 128
          Z
        "
        fill="none"
        stroke="#3e8f3e"
        strokeWidth="16"
        strokeLinejoin="round"
      />

      {/* Lid */}
      <rect
        x="120"
        y="72"
        width="272"
        height="56"
        rx="28"
        fill="#7acb7f"
      />

      {/* Dollar sign */}
      <text
        x="256"
        y="335"
        textAnchor="middle"
        fontSize="180"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
      >
        $
      </text>
    </svg>
  );
}

