import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';

// Load html5-qrcode from CDN or npm
let Html5Qrcode = null;
let html5QrcodeLoaded = false;

const loadHtml5Qrcode = async () => {
  if (html5QrcodeLoaded && Html5Qrcode) {
    return Html5Qrcode;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Skip npm package loading at build time - use CDN only
    // This avoids webpack trying to resolve the package during build

    // Load from CDN as fallback
    if (!window.Html5Qrcode) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    Html5Qrcode = window.Html5Qrcode;
    html5QrcodeLoaded = true;
    return Html5Qrcode;
  } catch (error) {
    console.error('Failed to load html5-qrcode:', error);
    return null;
  }
};

export default function QRCodeScanner({ onScan, onClose, scanning }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanning) {
      loadAndStartScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanning]);

  const loadAndStartScanner = async () => {
    setLoading(true);
    setError(null);
    
    const Html5QrcodeClass = await loadHtml5Qrcode();
    
    if (!Html5QrcodeClass) {
      setError('Failed to load QR scanner. Please refresh the page.');
      setLoading(false);
      return;
    }

    setLoading(false);
    await startScanner(Html5QrcodeClass);
  };

  const startScanner = async (Html5QrcodeClass) => {
    if (!Html5QrcodeClass) {
      setError('QR scanner library not loaded. Please refresh the page.');
      return;
    }

    try {
      // Check camera permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, Html5Qrcode will handle it
        setCameraPermission('granted');
      } catch (permErr) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
          setCameraPermission('denied');
          return;
        }
        throw permErr;
      }

      setError(null);

      // Initialize Html5Qrcode
      const html5QrCode = new Html5QrcodeClass('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      // Get available cameras
      const devices = await Html5QrcodeClass.getCameras();
      const cameraId = devices.length > 0 
        ? devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id
        : { facingMode: 'environment' };

      // Start scanning
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        (decodedText, decodedResult) => {
          // Successfully scanned
          if (onScan) {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (they're normal while looking for QR code)
          // Only log if it's not a "not found" error
          if (!errorMessage.includes('No QR code found')) {
            // Silent - these are expected during scanning
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
        setCameraPermission('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please use a device with a camera.');
        setCameraPermission('not-found');
      } else {
        setError(`Error starting camera: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(err => {
        console.error('Error stopping scanner:', err);
      });
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
  };

  if (!scanning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {loading ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <Loader2 className="w-12 h-12 text-brand-gold mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading scanner...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300 mb-4">{error}</p>
              {cameraPermission === 'denied' && (
                <p className="text-sm text-gray-400">
                  Go to your browser settings to allow camera access for this site.
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden min-h-[300px]"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-brand-gold rounded-lg w-64 h-64"></div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <p className="text-sm text-gray-400 text-center">
            Position the QR code within the frame
          </p>
        </div>
      </div>
    </div>
  );
}

