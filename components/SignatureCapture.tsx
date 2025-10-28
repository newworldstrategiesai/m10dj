import React, { useRef, useState, useEffect } from 'react';
import { Pen, Type, Eraser, RotateCcw } from 'lucide-react';

interface SignatureCaptureProps {
  onSignatureChange: (signatureData: string, method: 'draw' | 'type') => void;
  defaultValue?: string;
  defaultMethod?: 'draw' | 'type';
  label?: string;
  disabled?: boolean;
}

export default function SignatureCapture({
  onSignatureChange,
  defaultValue,
  defaultMethod = 'draw',
  label = 'Your Signature',
  disabled = false
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>(defaultMethod);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('Allura');
  const [hasSignature, setHasSignature] = useState(false);

  // Cursive font options
  const cursiveFonts = [
    { name: 'Allura', value: 'Allura' },
    { name: 'Dancing Script', value: 'Dancing Script' },
    { name: 'Great Vibes', value: 'Great Vibes' },
    { name: 'Pacifico', value: 'Pacifico' },
    { name: 'Sacramento', value: 'Sacramento' },
  ];

  useEffect(() => {
    if (defaultValue) {
      setHasSignature(true);
      if (defaultMethod === 'type') {
        // Extract typed name from data URL if available
        // For now, we'll just set has signature
      }
    }
  }, [defaultValue, defaultMethod]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Configure drawing context
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (signatureMethod === 'type' && typedName) {
      renderTypedSignature();
    }
  }, [signatureMethod]);

  const renderTypedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (typedName) {
      // Draw typed name in cursive font
      ctx.fillStyle = '#000000';
      ctx.font = `48px '${selectedFont}', cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, rect.width / 2, rect.height / 2);

      // Convert to data URL and notify parent
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl, 'type');
      setHasSignature(true);
    }
  };

  useEffect(() => {
    if (signatureMethod === 'type') {
      renderTypedSignature();
    }
  }, [typedName, selectedFont]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || signatureMethod !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || signatureMethod !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl, 'draw');
    setHasSignature(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    setTypedName('');
    setHasSignature(false);
    onSignatureChange('', signatureMethod);
  };

  const switchMethod = (method: 'draw' | 'type') => {
    setSignatureMethod(method);
    clearSignature();
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Method Selector */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => switchMethod('draw')}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${signatureMethod === 'draw'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Pen className="w-4 h-4" />
          Draw
        </button>
        <button
          type="button"
          onClick={() => switchMethod('type')}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${signatureMethod === 'type'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Type className="w-4 h-4" />
          Type
        </button>
      </div>

      {/* Type Name Input (for type method) */}
      {signatureMethod === 'type' && (
        <div className="space-y-3">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full name..."
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Font Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Font:</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              disabled={disabled}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cursiveFonts.map(font => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`
            w-full h-40 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white
            ${signatureMethod === 'draw' && !disabled ? 'cursor-crosshair' : 'cursor-default'}
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{
            touchAction: 'none',
          }}
        />

        {/* Instructions */}
        {!hasSignature && signatureMethod === 'draw' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Sign here with your mouse or finger
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </button>

        {hasSignature && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Signature captured
          </div>
        )}
      </div>
    </div>
  );
}

