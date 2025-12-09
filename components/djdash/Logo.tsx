import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className = '', width = 40, height = 40 }: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Open D shape - thick curved band, open on left side */}
      {/* Top horizontal stroke */}
      <path
        d="M 15 20 L 15 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Curved band forming the D - sweeps down and right, then curves back */}
      <path
        d="M 15 20
           Q 15 20 20 18
           Q 45 15 65 25
           Q 80 35 75 50
           Q 70 65 55 72
           Q 40 78 25 75
           Q 15 73 15 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Bottom horizontal stroke */}
      <path
        d="M 15 70 L 15 75"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Lightning bolt inside the D - angled from bottom left to top right, sharp jagged edges */}
      <path
        d="M 22 68
           L 28 58
           L 25 52
           L 35 48
           L 32 42
           L 42 35
           L 38 28
           L 48 22
           L 45 18
           L 55 15"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

