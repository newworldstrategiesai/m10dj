import React, { useEffect, useRef, useState } from 'react';
import SignatureCapture from './SignatureCapture';

interface SignatureCaptureInjectorProps {
  contractHtml: string;
  signatureName: string;
  onSignatureChange: (data: string, method: 'draw' | 'type', signerType?: 'client' | 'owner') => void;
  signatureData: string;
}

export default function SignatureCaptureInjector({
  contractHtml,
  signatureName,
  onSignatureChange,
  signatureData,
}: SignatureCaptureInjectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clientSignatureArea, setClientSignatureArea] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !contractHtml) return;

    // Find the client signature area in the rendered HTML
    const area = containerRef.current.querySelector('#client-signature-area') as HTMLElement;
    if (area && !area.querySelector('.signature-capture-component')) {
      setClientSignatureArea(area);
    }
  }, [contractHtml]);

  // If signature is already captured, don't show the capture component
  if (signatureData) {
    return null;
  }

  return (
    <div ref={containerRef} className="hidden">
      <div 
        className="prose prose-sm sm:prose-base max-w-none text-xs sm:text-sm"
        dangerouslySetInnerHTML={{ __html: contractHtml }}
      />
      {clientSignatureArea && (
        <div className="mt-4">
          <SignatureCapture
            onSignatureChange={(data, method) => onSignatureChange(data, method, 'client')}
            defaultMethod="type"
            initialName={signatureName}
            label=""
          />
        </div>
      )}
    </div>
  );
}
