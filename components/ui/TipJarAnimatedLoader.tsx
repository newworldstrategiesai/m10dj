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
      </defs>

      {/* Liquid fill */}
      <rect
        x="112"
        y="480"
        width="288"
        height="0"
        fill="#66bb6a"
        clipPath="url(#jar-interior)"
      >
        {/* Grow fill */}
        <animate
          attributeName="height"
          from="0"
          to="280"
          dur="1.8s"
          repeatCount="indefinite"
          keyTimes="0;0.85;1"
          values="0;280;280"
        />
        {/* Keep bottom fixed */}
        <animate
          attributeName="y"
          from="480"
          to="200"
          dur="1.8s"
          repeatCount="indefinite"
          keyTimes="0;0.85;1"
          values="480;200;200"
        />
      </rect>

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

