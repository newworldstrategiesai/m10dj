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
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading"
      className={className}
    >
      <defs>
        {/* Jar interior clip */}
        <clipPath id="jar-clip">
          <path d="
            M144 156
            C144 128 168 108 192 108
            H320
            C344 108 368 128 368 156
            V404
            C368 432 344 452 320 452
            H192
            C168 452 144 432 144 404
            Z
          " />
        </clipPath>

        <linearGradient id="liquid-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7FE08C"/>
          <stop offset="100%" stopColor="#3C8D4B"/>
        </linearGradient>
      </defs>

      {/* === LIQUID SYSTEM === */}
      <g clipPath="url(#jar-clip)">
        <g transform="translate(0,210)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 210; 0 0; 0 210"
            dur="2.3s"
            repeatCount="indefinite"
            keyTimes="0;0.75;1"
            calcMode="spline"
            keySplines="
              0.4 0 0.6 1;
              0.4 0 0.6 1
            "
          />

          {/* Base liquid (intentionally extends ABOVE wave) */}
          <rect
            x="112"
            y="80"
            width="288"
            height="500"
            fill="#4CAF50"
          />

          {/* Light green surface (defines ONLY visible top) */}
          <path
            fill="url(#liquid-grad)"
            d="
              M112 240
              C170 215, 250 275, 320 250
              C360 240, 380 265, 400 255
              L400 580
              L112 580
              Z
            "
          >
            <animate
              attributeName="d"
              dur="1.05s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="
                0.4 0 0.6 1;
                0.4 0 0.6 1
              "
              values="
                M112 240 C170 215,250 275,320 250 C360 240,380 265,400 255 L400 580 L112 580 Z;
                M112 240 C170 275,250 215,320 270 C360 280,380 245,400 265 L400 580 L112 580 Z;
                M112 240 C170 215,250 275,320 250 C360 240,380 265,400 255 L400 580 L112 580 Z
              "
            />
          </path>

          {/* Thin dark green border following the wave */}
          <path
            fill="none"
            stroke="#2E7D32"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="
              M112 240
              C170 215, 250 275, 320 250
              C360 240, 380 265, 400 255
            "
          >
            <animate
              attributeName="d"
              dur="1.05s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="
                0.4 0 0.6 1;
                0.4 0 0.6 1
              "
              values="
                M112 240 C170 215,250 275,320 250 C360 240,380 265,400 255;
                M112 240 C170 275,250 215,320 270 C360 280,380 245,400 265;
                M112 240 C170 215,250 275,320 250 C360 240,380 265,400 255
              "
            />
          </path>
        </g>
      </g>

      {/* === JAR BODY === */}
      <path
        d="
          M144 156
          C144 128 168 108 192 108
          H320
          C344 108 368 128 368 156
          V404
          C368 432 344 452 320 452
          H192
          C168 452 144 432 144 404
          Z
        "
        fill="none"
        stroke="#2E7D32"
        strokeWidth="10"
      />

      {/* === LID (with matching stroke) === */}
      <rect
        x="160"
        y="64"
        width="192"
        height="44"
        rx="22"
        fill="#6BD27C"
        stroke="#2E7D32"
        strokeWidth="10"
      />

      {/* === DOLLAR SIGN === */}
      <text
        x="256"
        y="330"
        textAnchor="middle"
        fontSize="180"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont"
      >
        $
      </text>
    </svg>
  );
}

