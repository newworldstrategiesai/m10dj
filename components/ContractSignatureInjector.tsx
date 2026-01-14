import React, { useEffect, useRef } from 'react';
import SignatureCapture from './SignatureCapture';

interface ContractSignatureInjectorProps {
  contractHtml: string;
  signatureName: string;
  onSignatureChange: (data: string, method: 'draw' | 'type', signerType?: 'client' | 'owner') => void;
  onOwnerSignatureChange: (data: string) => void;
  signatureData: string;
  ownerSignatureData: string;
}

export default function ContractSignatureInjector({
  contractHtml,
  signatureName,
  onSignatureChange,
  onOwnerSignatureChange,
  signatureData,
  ownerSignatureData,
}: ContractSignatureInjectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contractHtml) return;

    // Find signature areas in the contract HTML
    const clientSignatureArea = containerRef.current.querySelector('#client-signature-area');
    const ownerSignatureArea = containerRef.current.querySelector('#owner-signature-area');

    // Create a wrapper div for React to mount components
    if (clientSignatureArea && !clientSignatureArea.querySelector('.signature-capture-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'signature-capture-wrapper';
      clientSignatureArea.innerHTML = '';
      clientSignatureArea.appendChild(wrapper);

      // Create a React root and render SignatureCapture
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(wrapper);
        root.render(
          <SignatureCapture
            onSignatureChange={(data, method) => onSignatureChange(data, method, 'client')}
            defaultMethod="type"
            initialName={signatureName}
          />
        );
      });
    }

    if (ownerSignatureArea && !ownerSignatureArea.querySelector('.signature-capture-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'signature-capture-wrapper';
      ownerSignatureArea.innerHTML = '';
      ownerSignatureArea.appendChild(wrapper);

      // Owner signature is typically pre-filled, but we can still allow editing
      if (ownerSignatureData) {
        const img = document.createElement('img');
        img.src = ownerSignatureData;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.border = '1px solid #ddd';
        img.style.background = 'white';
        img.style.padding = '10px';
        img.style.borderRadius = '4px';
        wrapper.appendChild(img);
      } else {
        // For owner, we might want to show it as read-only or allow admin to sign later
        const placeholder = document.createElement('div');
        placeholder.className = 'signature-placeholder text-gray-400 text-sm';
        placeholder.textContent = 'Owner signature will be added';
        wrapper.appendChild(placeholder);
      }
    }
  }, [contractHtml, signatureName, onSignatureChange, onOwnerSignatureChange, signatureData, ownerSignatureData]);

  return (
    <div 
      ref={containerRef}
      className="contract-signature-container"
      dangerouslySetInnerHTML={{ __html: contractHtml }}
    />
  );
}
