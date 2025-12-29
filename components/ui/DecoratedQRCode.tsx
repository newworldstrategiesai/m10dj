/**
 * DecoratedQRCode Component
 * 
 * Displays a QR code with festive decorative elements:
 * - Colorful corner brackets (rainbow style)
 * - Confetti elements (curved lines, dots)
 * - Floating celebration decorations
 * 
 * Used for printable QR codes on the requests page.
 */

import React from 'react';

interface DecoratedQRCodeProps {
  qrCodeUrl: string;
  size?: number;
  className?: string;
  showDecorations?: boolean;
}

export function DecoratedQRCode({ 
  qrCodeUrl, 
  size = 200,
  className = '',
  showDecorations = true
}: DecoratedQRCodeProps) {
  const padding = 24;
  const totalSize = size + padding * 2;
  const cornerLength = 40;
  const cornerThickness = 4;
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ 
        width: totalSize + 60, // Extra space for decorations
        height: totalSize + 60,
        padding: 30
      }}
    >
      {/* Background confetti elements */}
      {showDecorations && (
        <>
          {/* Top-left curved line (blue) */}
          <svg 
            className="absolute" 
            style={{ top: 10, left: 0 }}
            width="60" 
            height="80" 
            viewBox="0 0 60 80"
          >
            <path 
              d="M45 5 Q30 30, 10 75" 
              stroke="#4285F4" 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Top-left dots */}
          <svg 
            className="absolute" 
            style={{ top: 45, left: 8 }}
            width="20" 
            height="20" 
            viewBox="0 0 20 20"
          >
            <circle cx="10" cy="10" r="4" fill="#FBBC04" />
          </svg>
          <svg 
            className="absolute" 
            style={{ top: 75, left: 20 }}
            width="12" 
            height="12" 
            viewBox="0 0 12 12"
          >
            <circle cx="6" cy="6" r="3" fill="#EA4335" />
          </svg>

          {/* Top-right curved line (green) */}
          <svg 
            className="absolute" 
            style={{ top: 0, right: 5 }}
            width="50" 
            height="70" 
            viewBox="0 0 50 70"
          >
            <path 
              d="M5 60 Q20 30, 45 10" 
              stroke="#34A853" 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {/* Bottom-left curved line (purple) */}
          <svg 
            className="absolute" 
            style={{ bottom: 10, left: 5 }}
            width="60" 
            height="70" 
            viewBox="0 0 60 70"
          >
            <path 
              d="M50 5 Q30 25, 10 65" 
              stroke="#9B59B6" 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Bottom-left dot */}
          <svg 
            className="absolute" 
            style={{ bottom: 30, left: 45 }}
            width="10" 
            height="10" 
            viewBox="0 0 10 10"
          >
            <circle cx="5" cy="5" r="3" fill="#34A853" />
          </svg>

          {/* Bottom-right curved line (yellow/orange) */}
          <svg 
            className="absolute" 
            style={{ bottom: 5, right: 0 }}
            width="55" 
            height="75" 
            viewBox="0 0 55 75"
          >
            <path 
              d="M5 10 Q25 40, 50 70" 
              stroke="#FBBC04" 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Bottom-right dot */}
          <svg 
            className="absolute" 
            style={{ bottom: 55, right: 15 }}
            width="10" 
            height="10" 
            viewBox="0 0 10 10"
          >
            <circle cx="5" cy="5" r="3" fill="#EA4335" />
          </svg>

          {/* Additional accent dots */}
          <svg 
            className="absolute" 
            style={{ top: 20, right: 35 }}
            width="8" 
            height="8" 
            viewBox="0 0 8 8"
          >
            <circle cx="4" cy="4" r="2.5" fill="#4285F4" />
          </svg>
        </>
      )}

      {/* QR Code Card with corner brackets */}
      <div 
        className="relative bg-white rounded-xl shadow-lg"
        style={{ 
          width: totalSize,
          height: totalSize,
          padding: padding
        }}
      >
        {/* Corner Brackets */}
        {showDecorations && (
          <>
            {/* Top-left corner (blue) */}
            <svg 
              className="absolute" 
              style={{ top: -2, left: -2 }}
              width={cornerLength + 10} 
              height={cornerLength + 10}
            >
              <path 
                d={`M${cornerThickness} ${cornerLength} L${cornerThickness} ${cornerThickness} L${cornerLength} ${cornerThickness}`}
                stroke="#4285F4" 
                strokeWidth={cornerThickness} 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Top-right corner (red/orange) */}
            <svg 
              className="absolute" 
              style={{ top: -2, right: -2 }}
              width={cornerLength + 10} 
              height={cornerLength + 10}
            >
              <path 
                d={`M${10} ${cornerThickness} L${cornerLength + 6} ${cornerThickness} L${cornerLength + 6} ${cornerLength}`}
                stroke="#EA4335" 
                strokeWidth={cornerThickness} 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bottom-left corner (green) */}
            <svg 
              className="absolute" 
              style={{ bottom: -2, left: -2 }}
              width={cornerLength + 10} 
              height={cornerLength + 10}
            >
              <path 
                d={`M${cornerThickness} ${10} L${cornerThickness} ${cornerLength + 6} L${cornerLength} ${cornerLength + 6}`}
                stroke="#34A853" 
                strokeWidth={cornerThickness} 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bottom-right corner (blue) */}
            <svg 
              className="absolute" 
              style={{ bottom: -2, right: -2 }}
              width={cornerLength + 10} 
              height={cornerLength + 10}
            >
              <path 
                d={`M${10} ${cornerLength + 6} L${cornerLength + 6} ${cornerLength + 6} L${cornerLength + 6} ${10}`}
                stroke="#4285F4" 
                strokeWidth={cornerThickness} 
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}

        {/* QR Code Image */}
        <img 
          src={qrCodeUrl} 
          alt="QR Code" 
          className="block"
          style={{ 
            width: size, 
            height: size,
            imageRendering: 'pixelated'
          }}
        />
      </div>
    </div>
  );
}

/**
 * Generates SVG markup string for the decorated QR code
 * Used for PDF generation where we need inline SVG/HTML
 */
export function generateDecoratedQRCodeHTML(
  qrCodeUrl: string, 
  size: number = 200,
  includeDecorations: boolean = true
): string {
  const padding = 24;
  const totalSize = size + padding * 2;
  const cornerLength = 40;
  const cornerThickness = 4;
  const containerSize = totalSize + 60;

  const decorationsSvg = includeDecorations ? `
    <!-- Top-left curved line (blue) -->
    <svg style="position: absolute; top: 10px; left: 0;" width="60" height="80" viewBox="0 0 60 80">
      <path d="M45 5 Q30 30, 10 75" stroke="#4285F4" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
    
    <!-- Top-left dots -->
    <svg style="position: absolute; top: 45px; left: 8px;" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="4" fill="#FBBC04"/>
    </svg>
    <svg style="position: absolute; top: 75px; left: 20px;" width="12" height="12" viewBox="0 0 12 12">
      <circle cx="6" cy="6" r="3" fill="#EA4335"/>
    </svg>

    <!-- Top-right curved line (green) -->
    <svg style="position: absolute; top: 0; right: 5px;" width="50" height="70" viewBox="0 0 50 70">
      <path d="M5 60 Q20 30, 45 10" stroke="#34A853" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>

    <!-- Bottom-left curved line (purple) -->
    <svg style="position: absolute; bottom: 10px; left: 5px;" width="60" height="70" viewBox="0 0 60 70">
      <path d="M50 5 Q30 25, 10 65" stroke="#9B59B6" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
    
    <!-- Bottom-left dot -->
    <svg style="position: absolute; bottom: 30px; left: 45px;" width="10" height="10" viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="3" fill="#34A853"/>
    </svg>

    <!-- Bottom-right curved line (yellow) -->
    <svg style="position: absolute; bottom: 5px; right: 0;" width="55" height="75" viewBox="0 0 55 75">
      <path d="M5 10 Q25 40, 50 70" stroke="#FBBC04" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
    
    <!-- Bottom-right dot -->
    <svg style="position: absolute; bottom: 55px; right: 15px;" width="10" height="10" viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="3" fill="#EA4335"/>
    </svg>

    <!-- Additional accent dot -->
    <svg style="position: absolute; top: 20px; right: 35px;" width="8" height="8" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="2.5" fill="#4285F4"/>
    </svg>
  ` : '';

  const cornerBrackets = includeDecorations ? `
    <!-- Top-left corner (blue) -->
    <svg style="position: absolute; top: -2px; left: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
      <path d="M${cornerThickness} ${cornerLength} L${cornerThickness} ${cornerThickness} L${cornerLength} ${cornerThickness}" 
            stroke="#4285F4" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <!-- Top-right corner (red) -->
    <svg style="position: absolute; top: -2px; right: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
      <path d="M10 ${cornerThickness} L${cornerLength + 6} ${cornerThickness} L${cornerLength + 6} ${cornerLength}" 
            stroke="#EA4335" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <!-- Bottom-left corner (green) -->
    <svg style="position: absolute; bottom: -2px; left: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
      <path d="M${cornerThickness} 10 L${cornerThickness} ${cornerLength + 6} L${cornerLength} ${cornerLength + 6}" 
            stroke="#34A853" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <!-- Bottom-right corner (blue) -->
    <svg style="position: absolute; bottom: -2px; right: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
      <path d="M10 ${cornerLength + 6} L${cornerLength + 6} ${cornerLength + 6} L${cornerLength + 6} 10" 
            stroke="#4285F4" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  ` : '';

  return `
    <div style="
      position: relative;
      display: inline-block;
      width: ${containerSize}px;
      height: ${containerSize}px;
      padding: 30px;
    ">
      ${decorationsSvg}
      
      <!-- QR Code Card -->
      <div style="
        position: relative;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        width: ${totalSize}px;
        height: ${totalSize}px;
        padding: ${padding}px;
        box-sizing: border-box;
      ">
        ${cornerBrackets}
        
        <!-- QR Code Image -->
        <img 
          src="${qrCodeUrl}" 
          alt="QR Code"
          style="
            display: block;
            width: ${size}px;
            height: ${size}px;
            image-rendering: pixelated;
          "
        />
      </div>
    </div>
  `;
}

export default DecoratedQRCode;

