import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isAdminEmail } from '@/utils/auth-helpers/admin-roles';
import SignatureCapture from '@/components/SignatureCapture';
import ContractFieldsEditor from '@/components/admin/ContractFieldsEditor';
import { triggerConfetti } from '@/utils/confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Download,
  Mail,
  Edit,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  CreditCard
} from 'lucide-react';

interface ContractData {
  id: string;
  contract_number: string;
  contract_html: string;
  event_name: string;
  event_date: string;
  event_type?: string;
  event_time?: string;
  end_time?: string;
  venue_name?: string;
  venue_address?: string;
  guest_count?: number | null;
  total_amount: number;
  deposit_amount?: number | null;
  status: string;
  signed_at?: string;
  signed_by_client?: string;
  signed_by_client_email?: string;
  client_signature_data?: string;
  signed_by_vendor?: string;
  signed_by_vendor_at?: string;
  vendor_signature_data?: string;
  contact: {
    first_name: string;
    last_name?: string;
    email_address: string;
  };
}

export default function SignContractPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [participantData, setParticipantData] = useState<any | null>(null);
  const [isParticipantSigning, setIsParticipantSigning] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [ownerSignatureData, setOwnerSignatureData] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  const [contractHtmlWithSignatures, setContractHtmlWithSignatures] = useState<string>('');
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signingFor, setSigningFor] = useState<'client' | 'owner' | 'participant'>('client');
  const contractContentRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | undefined>(undefined);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (router.isReady && token) {
      validateToken();
      checkAdminStatus();
    }
  }, [router.isReady, token]);

  const checkAdminStatus = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      const admin = await isAdminEmail(user?.email);
      console.log('[sign-contract] Admin status check:', { 
        userEmail: user?.email, 
        isAdmin: admin 
      });
      setIsAdmin(admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Map calculated field values to field keys for click detection
  const getFieldKeyFromClick = (target: HTMLElement, contractData: ContractData | null): string | null => {
    if (!contractData) return null;
    
    const clickedText = target.textContent?.trim() || '';
    const textLower = clickedText.toLowerCase();
    
    // Get parent and grandparent elements to check for labels (labels might be in siblings or parents)
    const parent = target.parentElement;
    const grandparent = parent?.parentElement;
    const parentText = (parent?.textContent || '').toLowerCase();
    const grandparentText = (grandparent?.textContent || '').toLowerCase();
    const combinedContext = `${parentText} ${grandparentText}`;
    
    // Check for field labels in parent context
    const labelMappings: Record<string, string> = {
      'event name': 'event_name',
      'event date': 'event_date',
      'event type': 'event_type',
      'start time': 'event_time',
      'end time': 'end_time',
      'venue name': 'venue_name',
      'venue': 'venue_name',
      'address': 'venue_address',
      'venue address': 'venue_address',
      'guest count': 'guest_count',
      'guests': 'guest_count',
      'total amount': 'total_amount',
      'total': 'total_amount',
      'contract amount': 'total_amount',
      'deposit amount': 'deposit_amount',
      'deposit': 'deposit_amount',
      'contract number': 'contract_number',
    };
    
    // Check if parent or grandparent contains a label - prioritize this for accuracy
    for (const [label, key] of Object.entries(labelMappings)) {
      if (combinedContext.includes(label)) {
        // For time fields, verify the clicked text looks like a time
        if (key === 'event_time' || key === 'end_time') {
          // More flexible time pattern - matches "7:00 PM", "7pm", "7 PM", "19:00", etc.
          const timePattern = /\d{1,2}(:\d{0,2})?\s*(am|pm)?/i;
          if (timePattern.test(clickedText.trim())) {
            return key;
          }
        } else {
          return key;
        }
      }
    }
    
    // Map values to field keys (exact matches)
    const valueMappings: Array<{ value: string; key: string }> = [
      { value: contractData.event_name?.toLowerCase() || '', key: 'event_name' },
      { value: contractData.event_type?.toLowerCase() || '', key: 'event_type' },
      { value: contractData.venue_name?.toLowerCase() || '', key: 'venue_name' },
      { value: contractData.venue_address?.toLowerCase() || '', key: 'venue_address' },
      { value: contractData.contract_number?.toLowerCase() || '', key: 'contract_number' },
      { value: contractData.guest_count?.toString() || '', key: 'guest_count' },
    ];
    
    // Check for formatted dates
    if (contractData.event_date) {
      const formattedDate = new Date(contractData.event_date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).toLowerCase();
      if (textLower.includes(formattedDate) || formattedDate.includes(textLower)) {
        return 'event_date';
      }
    }
    
    // Check for formatted times - handle multiple formats
    const checkTimeMatch = (timeStr: string, fieldKey: 'event_time' | 'end_time'): boolean => {
      if (!timeStr) return false;
      
      try {
        const timeParts = timeStr.split(':');
        const hours24 = parseInt(timeParts[0], 10);
        const minutes = timeParts[1]?.split(/[^0-9]/)[0] || '00'; // Extract just numbers from minutes
        const seconds = timeParts[2]?.split(/[^0-9]/)[0] || '00';
        
        if (isNaN(hours24)) return false;
        
        const hour12 = hours24 % 12 || 12;
        const ampm = hours24 >= 12 ? 'pm' : 'am';
        
        // Generate multiple format variations
        const formats = [
          `${hour12}:${minutes.padStart(2, '0')} ${ampm}`, // "7:00 PM"
          `${hour12}:${minutes} ${ampm}`, // "7:0 PM"
          `${hour12} ${ampm}`, // "7 PM"
          `${hour12}:${minutes}${ampm}`, // "7:00PM"
          `${hour12}${ampm}`, // "7PM"
          `${hours24}:${minutes.padStart(2, '0')}`, // "19:00"
          `${hours24}:${minutes}:${seconds}`, // "19:00:00"
        ];
        
        // Check if clicked text matches any format (case-insensitive)
        for (const format of formats) {
          if (textLower.includes(format.toLowerCase()) || format.toLowerCase().includes(textLower)) {
            return true;
          }
        }
        
        // Also check if parent or grandparent contains "start time" or "end time" label
        if (fieldKey === 'event_time' && (combinedContext.includes('start time') || combinedContext.includes('event time'))) {
          // If we're in a time context and the text looks like a time, match it
          const timePattern = /\d{1,2}(:\d{0,2})?\s*(am|pm)?/i;
          if (timePattern.test(clickedText.trim())) {
            return true;
          }
        }
        
        if (fieldKey === 'end_time' && combinedContext.includes('end time')) {
          const timePattern = /\d{1,2}(:\d{0,2})?\s*(am|pm)?/i;
          if (timePattern.test(clickedText.trim())) {
            return true;
          }
        }
        
        return false;
      } catch {
        return false;
      }
    };
    
    // Check start time first (event_time)
    if (contractData.event_time && checkTimeMatch(contractData.event_time, 'event_time')) {
      return 'event_time';
    }
    
    // Check end time
    if (contractData.end_time && checkTimeMatch(contractData.end_time, 'end_time')) {
      return 'end_time';
    }
    
    // Fallback: if parent context clearly indicates start/end time, use that
    if (combinedContext.includes('start time') && /\d{1,2}(:\d{0,2})?\s*(am|pm)?/i.test(clickedText.trim())) {
      return 'event_time';
    }
    
    if (combinedContext.includes('end time') && /\d{1,2}(:\d{0,2})?\s*(am|pm)?/i.test(clickedText.trim())) {
      return 'end_time';
    }
    
    // Check for amounts (with or without $)
    if (contractData.total_amount) {
      const amountStr = contractData.total_amount.toFixed(2);
      const withDollar = `$${amountStr}`.toLowerCase();
      if (textLower.includes(withDollar) || textLower.includes(amountStr)) {
        return 'total_amount';
      }
    }
    
    if (contractData.deposit_amount) {
      const amountStr = contractData.deposit_amount.toFixed(2);
      const withDollar = `$${amountStr}`.toLowerCase();
      if (textLower.includes(withDollar) || textLower.includes(amountStr)) {
        return 'deposit_amount';
      }
    }
    
    // Check exact value matches
    for (const { value, key } of valueMappings) {
      if (value && (textLower === value || textLower.includes(value) || value.includes(textLower))) {
        return key;
      }
    }
    
    return null;
  };

  // Use event delegation on the contract content container for more reliable click handling
  useEffect(() => {
    if (!contractHtmlWithSignatures && !contractData?.contract_html) {
      return;
    }

    const setupClickHandlers = () => {
      const contractContent = contractContentRef.current;
      if (!contractContent) {
        // Retry if content not ready
        setTimeout(setupClickHandlers, 200);
        return;
      }

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Check if click is on or inside a signature area
        // For participants, check for participant signature areas (id format: participant-signature-{id})
        const signatureArea = target.closest('#client-signature-area, #owner-signature-area, [id^="participant-signature-"]') as HTMLElement;
        
        if (signatureArea) {
          e.preventDefault();
          e.stopPropagation();

          const signerType = signatureArea.getAttribute('data-signer-type') as 'client' | 'owner' | 'participant';
          const participantId = signatureArea.getAttribute('data-participant-id');
          
          // For participants, check if they've already signed
          const hasSignature = signerType === 'client' 
            ? !!signatureData 
            : signerType === 'owner'
            ? !!ownerSignatureData
            : participantData?.signature_data;

          console.log('[sign-contract] Signature area clicked:', {
            signerType,
            participantId,
            hasSignature,
            signatureAreaId: signatureArea.id,
            targetTag: target.tagName,
            targetClass: target.className,
            isParticipantSigning
          });

          // For participant signing, only allow if this is the correct participant
          if (signerType === 'participant') {
            if (isParticipantSigning && participantData && participantData.id === participantId && !hasSignature) {
              setSigningFor('participant');
              setSignatureModalOpen(true);
            }
            return;
          }

          // SECURITY: Prevent clients from signing as owner
          // Only allow owner signatures if user is an admin
          if (signerType === 'owner') {
            if (!isAdmin) {
              alert('Only authorized administrators can sign as the owner. Please sign as the client.');
              return;
            }
            // Admin can sign as owner - proceed
            console.log('[sign-contract] Admin signing as owner');
          }

          if (!hasSignature) {
            setSigningFor(signerType);
            setSignatureModalOpen(true);
          }
          return;
        }

        // Handle calculated field clicks in edit mode
        if (isAdmin && isEditMode) {
          const fieldKey = getFieldKeyFromClick(target, contractData);
          
          if (fieldKey) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[sign-contract] Calculated field clicked:', { 
              clickedText: target.textContent?.trim(), 
              fieldKey,
              parentText: target.parentElement?.textContent?.substring(0, 50)
            });
            setFocusedField(fieldKey);
          }
        }
      };

      // Remove any existing listener first
      contractContent.removeEventListener('click', handleClick, true);
      // Use capture phase to catch clicks early
      contractContent.addEventListener('click', handleClick, true);
      
      // Also ensure signature areas have pointer cursor and are clickable
      const updateSignatureAreas = () => {
        const clientArea = contractContent.querySelector('#client-signature-area') as HTMLElement;
        const ownerArea = contractContent.querySelector('#owner-signature-area') as HTMLElement;
        
        if (clientArea && !signatureData) {
          clientArea.style.cursor = 'pointer';
          clientArea.style.userSelect = 'none';
          // Make all children non-interactive for pointer events so clicks bubble to parent
          const children = clientArea.querySelectorAll('*');
          children.forEach((child) => {
            (child as HTMLElement).style.pointerEvents = 'none';
          });
        }
        
        // SECURITY: Only allow owner signature if user is admin
        if (ownerArea) {
          if (!ownerSignatureData && isAdmin) {
            // Admin can sign as owner
            ownerArea.style.cursor = 'pointer';
            ownerArea.style.userSelect = 'none';
            ownerArea.style.opacity = '1';
            ownerArea.style.pointerEvents = 'auto';
            // Remove any disabled styling
            ownerArea.classList.remove('signature-disabled');
            // Make all children non-interactive for pointer events so clicks bubble to parent
            const children = ownerArea.querySelectorAll('*');
            children.forEach((child) => {
              (child as HTMLElement).style.pointerEvents = 'none';
            });
          } else if (!isAdmin) {
            // Client cannot sign as owner - disable and visually indicate
            ownerArea.style.cursor = 'not-allowed';
            ownerArea.style.opacity = '0.5';
            ownerArea.style.pointerEvents = 'none';
            ownerArea.classList.add('signature-disabled');
            // Add a visual indicator
            const placeholder = ownerArea.querySelector('.signature-placeholder-text');
            if (placeholder) {
              (placeholder as HTMLElement).textContent = 'Owner signature only';
              (placeholder as HTMLElement).style.color = '#999';
            }
          }
        }

        // Update participant signature areas
        if (isParticipantSigning && participantData) {
          const participantArea = contractContent.querySelector(`#participant-signature-${participantData.id}`) as HTMLElement;
          if (participantArea && !participantData.signature_data) {
            participantArea.style.cursor = 'pointer';
            participantArea.style.userSelect = 'none';
            const children = participantArea.querySelectorAll('*');
            children.forEach((child) => {
              (child as HTMLElement).style.pointerEvents = 'none';
            });
          }
        }

        // Add visual indicator for calculated fields in edit mode
        if (isAdmin && isEditMode) {
          const allTextNodes = contractContent.querySelectorAll('p, span, div, li, td, th, strong');
          allTextNodes.forEach((node) => {
            const fieldKey = getFieldKeyFromClick(node as HTMLElement, contractData);
            if (fieldKey) {
              (node as HTMLElement).style.cursor = 'pointer';
              (node as HTMLElement).style.transition = 'background-color 0.2s';
              (node as HTMLElement).setAttribute('data-field-key', fieldKey);
              (node as HTMLElement).addEventListener('mouseenter', function() {
                (this as HTMLElement).style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                (this as HTMLElement).style.borderRadius = '4px';
              });
              (node as HTMLElement).addEventListener('mouseleave', function() {
                (this as HTMLElement).style.backgroundColor = '';
              });
            }
          });
        }
      };

      // Wait a bit for HTML to render, then set up
      setTimeout(updateSignatureAreas, 100);

      return () => {
        contractContent.removeEventListener('click', handleClick, true);
      };
    };

    const cleanup = setupClickHandlers();
    return cleanup;
  }, [contractHtmlWithSignatures, contractData, signatureData, ownerSignatureData, isAdmin, isEditMode]);

  // Update signature areas when admin status changes
  useEffect(() => {
    if (!contractContentRef.current || !contractData) return;

    const contractContent = contractContentRef.current;
    const ownerArea = contractContent.querySelector('#owner-signature-area') as HTMLElement;
    
    if (ownerArea) {
      if (isAdmin && !ownerSignatureData) {
        // Admin can sign as owner - enable it
        console.log('[sign-contract] Enabling owner signature area for admin');
        ownerArea.style.cursor = 'pointer';
        ownerArea.style.userSelect = 'none';
        ownerArea.style.opacity = '1';
        ownerArea.style.pointerEvents = 'auto';
        ownerArea.classList.remove('signature-disabled');
        // Make all children non-interactive for pointer events so clicks bubble to parent
        const children = ownerArea.querySelectorAll('*');
        children.forEach((child) => {
          (child as HTMLElement).style.pointerEvents = 'none';
        });
        // Update placeholder text for admin
        const placeholder = ownerArea.querySelector('.signature-placeholder-text');
        if (placeholder) {
          (placeholder as HTMLElement).textContent = 'Click to sign as owner';
          (placeholder as HTMLElement).style.color = '#666';
        }
      } else if (!isAdmin) {
        // Client cannot sign as owner - disable it
        console.log('[sign-contract] Disabling owner signature area for non-admin');
        ownerArea.style.cursor = 'not-allowed';
        ownerArea.style.opacity = '0.5';
        ownerArea.style.pointerEvents = 'none';
        ownerArea.classList.add('signature-disabled');
        // Update placeholder text
        const placeholder = ownerArea.querySelector('.signature-placeholder-text');
        if (placeholder) {
          (placeholder as HTMLElement).textContent = 'Owner signature only';
          (placeholder as HTMLElement).style.color = '#999';
        }
      }
    }
  }, [isAdmin, ownerSignatureData, contractData]);

  const validateToken = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/contracts/validate-token?token=${token}`);
      const data = await res.json();

      console.log('[sign-contract] API response:', {
        ok: res.ok,
        has_contract: !!data.contract,
        contract_status: data.contract?.status,
        has_contract_html: !!data.contract?.contract_html,
        contract_html_length: data.contract?.contract_html?.length || 0
      });

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired contract link');
      }

        // Handle participant signing flow
      if (data.isParticipant) {
        setIsParticipantSigning(true);
        setParticipantData(data.participant);
        
        if (!data.contract) {
          throw new Error('Contract data not found');
        }

        if (data.alreadySigned) {
          setContractData(data.contract);
          setSigned(true);
          setLoading(false);
          return;
        }

        setContractData(data.contract);
        setSignatureName(data.participant.name || '');
        
        // Initialize contract HTML with participant signature area
        if (data.contract.contract_html) {
          let html = data.contract.contract_html;
          
          // Add participant signature area if not already present
          const participantSignatureId = `participant-signature-${data.participant.id}`;
          if (!html.includes(participantSignatureId)) {
            // Find the signature section and add participant signature area
            // Look for the owner signature area and add participant after it
            const ownerSignatureEnd = html.indexOf('</div>', html.indexOf('id="owner-signature-area"'));
            if (ownerSignatureEnd !== -1) {
              const participantSignatureHtml = `
<div class="signature-box">
<h3>${data.participant.role || 'ADDITIONAL SIGNER'}${data.participant.title ? ` - ${data.participant.title}` : ''}</h3>
<div id="${participantSignatureId}" class="signature-line-area" data-signer-type="participant" data-participant-id="${data.participant.id}" style="cursor: pointer; position: relative;">
  <div class="signature-line" style="border-bottom: 1px solid #000; height: 50px; margin: 20px 0; position: relative;">
    <span class="signature-placeholder-text" style="position: absolute; bottom: 5px; left: 0; color: #999; font-style: italic; font-size: 10pt;">Click to sign</span>
  </div>
</div>
<p>Name: <span id="participant-signature-name-${data.participant.id}">${data.participant.name}</span></p>
<p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>`;
              html = html.slice(0, ownerSignatureEnd + 6) + participantSignatureHtml + html.slice(ownerSignatureEnd + 6);
            }
          }
          
          // If participant already signed, show their signature
          if (data.participant.signature_data) {
            const signatureImg = `<img src="${data.participant.signature_data}" alt="Participant Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
            const replacement = `<div id="${participantSignatureId}" class="signature-line-area" data-signer-type="participant" data-participant-id="${data.participant.id}" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
            html = html.replace(new RegExp(`<div id="${participantSignatureId}"[^>]*>[\\s\\S]*?</div>`, 'g'), replacement);
          }
          
          setContractHtmlWithSignatures(html);
          setOriginalHtml(html);
        }
        
        setLoading(false);
        return;
      }

      // Regular client/vendor signing flow
      if (!data.contract) {
        throw new Error('Contract data not found');
      }

      if (data.contract.status === 'expired') {
        setError('This contract link has expired. Please contact us for a new link.');
        return;
      }

      // Check if contract_html is missing
      if (!data.contract.contract_html) {
        console.warn('[sign-contract] Contract HTML is missing after API call');
        // Try refreshing once more - the API might have regenerated it
        console.log('[sign-contract] Attempting to refresh contract data...');
        setTimeout(async () => {
          const retryRes = await fetch(`/api/contracts/validate-token?token=${token}`);
          const retryData = await retryRes.json();
          if (retryData.contract?.contract_html) {
            setContractData(retryData.contract);
            setLoading(false);
          } else {
            setError('Contract content is not available. Please contact us for assistance.');
            setLoading(false);
          }
        }, 1000);
        return;
      }

      // If contract is already signed, show it in view-only mode
      if (data.contract.status === 'signed') {
        setContractData(data.contract);
        setSigned(true); // Show signed view
        
        // Check if payment info is provided in the response
        if (data.needs_payment && data.payment_token) {
          // Redirect to success page with payment token
          router.push(`/pay/success?payment_token=${data.payment_token}&contract_signed=true`);
          return;
        }
        
        setLoading(false);
        return;
      }

      setContractData(data.contract);
      const clientName = `${data.contract.contact?.first_name || ''} ${data.contract.contact?.last_name || ''}`.trim() || 'Client';
      setSignatureName(clientName);
      
      // Load existing signatures if they exist
      if (data.contract.client_signature_data) {
        setSignatureData(data.contract.client_signature_data);
      }
      if (data.contract.vendor_signature_data) {
        setOwnerSignatureData(data.contract.vendor_signature_data);
      }
      
      // Initialize contract HTML with signature areas
      if (data.contract.contract_html) {
        let html = data.contract.contract_html;
        
        // Inject existing signatures into HTML if they exist
        console.log('[sign-contract] Loading contract HTML, has signatures:', {
          hasClientSignature: !!data.contract.client_signature_data,
          hasVendorSignature: !!data.contract.vendor_signature_data,
          clientSignatureLength: data.contract.client_signature_data?.length || 0,
          vendorSignatureLength: data.contract.vendor_signature_data?.length || 0,
          htmlLength: html.length,
          hasClientArea: html.includes('id="client-signature-area"'),
          hasOwnerArea: html.includes('id="owner-signature-area"'),
          htmlAlreadyHasClientImg: html.includes('data:image/png;base64') && html.includes('client-signature-area'),
          htmlAlreadyHasOwnerImg: html.includes('data:image/png;base64') && html.includes('owner-signature-area')
        });
        
        if (data.contract.client_signature_data) {
          const signatureImg = `<img src="${data.contract.client_signature_data}" alt="Client Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
          const replacement = `<div id="client-signature-area" class="signature-line-area" data-signer-type="client" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
          
          // Find the signature area and replace it, handling nested divs correctly
          const startMarker = 'id="client-signature-area"';
          const startIndex = html.indexOf(startMarker);
          if (startIndex !== -1) {
            // Find the opening <div> tag
            let divStart = startIndex;
            while (divStart > 0 && html[divStart] !== '<') {
              divStart--;
            }
            
            // Find the matching closing </div> by counting nested divs
            let depth = 0;
            let inTag = false;
            let divEnd = divStart;
            for (let i = divStart; i < html.length; i++) {
              if (html[i] === '<') {
                if (html.substr(i, 4) === '<div') {
                  depth++;
                  inTag = true;
                } else if (html.substr(i, 5) === '</div') {
                  depth--;
                  if (depth === 0) {
                    divEnd = i + 6; // Include </div>
                    break;
                  }
                }
              }
            }
            
            if (divEnd > divStart) {
              html = html.substring(0, divStart) + replacement + html.substring(divEnd);
              console.log('[sign-contract] Client signature injected successfully');
            } else {
              console.warn('[sign-contract] Client signature replacement failed, could not find matching closing tag');
            }
          } else {
            console.warn('[sign-contract] Client signature replacement failed, signature area not found in HTML');
          }
        }
        
        if (data.contract.vendor_signature_data) {
          const signatureImg = `<img src="${data.contract.vendor_signature_data}" alt="Owner Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
          const replacement = `<div id="owner-signature-area" class="signature-line-area" data-signer-type="owner" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
          
          // Find the signature area and replace it, handling nested divs correctly
          const startMarker = 'id="owner-signature-area"';
          const startIndex = html.indexOf(startMarker);
          if (startIndex !== -1) {
            // Find the opening <div> tag
            let divStart = startIndex;
            while (divStart > 0 && html[divStart] !== '<') {
              divStart--;
            }
            
            // Find the matching closing </div> by counting nested divs
            let depth = 0;
            let inTag = false;
            let divEnd = divStart;
            for (let i = divStart; i < html.length; i++) {
              if (html[i] === '<') {
                if (html.substr(i, 4) === '<div') {
                  depth++;
                  inTag = true;
                } else if (html.substr(i, 5) === '</div') {
                  depth--;
                  if (depth === 0) {
                    divEnd = i + 6; // Include </div>
                    break;
                  }
                }
              }
            }
            
            if (divEnd > divStart) {
              html = html.substring(0, divStart) + replacement + html.substring(divEnd);
              console.log('[sign-contract] Owner signature injected successfully', {
                divStart,
                divEnd,
                replacementLength: replacement.length,
                htmlLengthAfter: html.length
              });
            } else {
              console.warn('[sign-contract] Owner signature replacement failed, could not find matching closing tag', {
                divStart,
                divEnd
              });
            }
          } else {
            console.warn('[sign-contract] Owner signature replacement failed, signature area not found in HTML');
          }
        }
        
        setContractHtmlWithSignatures(html);
        setOriginalHtml(html); // Store original for comparison
      } else {
        // If no contract_html, set empty string to avoid errors
        setContractHtmlWithSignatures('');
        setOriginalHtml('');
      }

      // Mark as viewed
      await fetch('/api/contracts/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err: any) {
      console.error('[sign-contract] Error loading contract:', err);
      setError(err.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to submit with signature data directly (avoids React state timing issues)
  // Defined before handleSignatureChange since it's called within it
  const handleSubmitWithData = async (signatureDataToSubmit: string, signatureMethodToSubmit: 'draw' | 'type' = 'type') => {
    const currentSignatureName = signingFor === 'owner' ? 'Ben Murray' : signatureName;

    if (!signatureDataToSubmit) {
      alert('Please provide your signature');
      return;
    }

    // Only require terms agreement for client signatures
    if (signingFor === 'client' && !agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);

    try {
      // Handle participant signatures differently
      if (isParticipantSigning && participantData) {
        const res = await fetch(`/api/contracts/participants/${participantData.id}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature_name: currentSignatureName,
            signature_data: signatureDataToSubmit,
            signature_method: signatureMethodToSubmit,
            signing_token: token,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to sign contract');
        }

        setSigned(true);
        setSignatureModalOpen(false);
        return;
      }

      // Regular client/vendor signing
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_name: currentSignatureName,
          signature_data: signatureDataToSubmit,
          signature_method: signatureMethodToSubmit,
          signer_type: signingFor, // 'client' or 'owner'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign contract');
      }

      // If owner signed, just close modal and update UI - don't mark as fully signed
      if (signingFor === 'owner') {
        setSignatureModalOpen(false);
        // Refresh contract data to show updated signature
        if (token) {
          validateToken();
        }
        return;
      }

      // Redirect to success page if payment is needed
      if (data.needs_payment && data.payment_token) {
        router.push(`/pay/success?payment_token=${data.payment_token}&contract_signed=true`);
        return;
      }

      setSigned(true);
    } catch (err: any) {
      alert(err.message || 'Failed to sign contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignatureChange = (data: string, method: 'draw' | 'type', isComplete: boolean = false) => {
    if (signingFor === 'owner') {
      setOwnerSignatureData(data);
    } else {
    setSignatureData(data);
    setSignatureMethod(method);
    }
    
    // Update contract HTML to show signature in the signature area
    if (data) {
      const signatureId = signingFor === 'owner' ? 'owner-signature-area' : 'client-signature-area';
      const currentHtml = contractHtmlWithSignatures || contractData?.contract_html || '';
      
      if (currentHtml) {
        const signatureImg = `<img src="${data}" alt="Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
        const replacement = `<div id="${signatureId}" class="signature-line-area" data-signer-type="${signingFor}" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
        
        // Use a more robust regex that handles both original and already-replaced signature areas
        // Escape special characters in signatureId for regex
        const escapedId = signatureId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`<div id="${escapedId}"[^>]*>[\\s\\S]*?</div>`, 'g');
        
        let updatedHtml = currentHtml.replace(regex, replacement);
        
        // If replacement didn't work, try a more permissive approach
        if (updatedHtml === currentHtml && currentHtml.includes(`id="${signatureId}"`)) {
          console.warn('[sign-contract] Regex replacement failed, trying fallback approach');
          // Find the position of the signature area and replace manually
          const startIndex = currentHtml.indexOf(`id="${signatureId}"`);
          if (startIndex !== -1) {
            // Find the closing div tag
            let depth = 0;
            let endIndex = startIndex;
            let inTag = true;
            for (let i = startIndex; i < currentHtml.length; i++) {
              if (currentHtml[i] === '>') {
                inTag = false;
                depth = 1;
              } else if (!inTag) {
                if (currentHtml.substr(i, 4) === '<div') {
                  depth++;
                } else if (currentHtml.substr(i, 5) === '</div') {
                  depth--;
                  if (depth === 0) {
                    endIndex = i + 6; // Include </div>
                    break;
                  }
                }
              }
            }
            if (endIndex > startIndex) {
              // Find the start of the div tag
              let divStart = startIndex;
              while (divStart > 0 && currentHtml[divStart] !== '<') {
                divStart--;
              }
              updatedHtml = currentHtml.substring(0, divStart) + replacement + currentHtml.substring(endIndex);
            }
          }
        }
        
        setContractHtmlWithSignatures(updatedHtml);
      }
      
      // Only close modal when signature is complete (user finished drawing or clicked confirm)
      if (isComplete) {
        setSignatureModalOpen(false);
        
        // Auto-submit contract to save signature to database
        // For client: require terms agreement
        // For owner: no terms agreement needed
        // Pass the signature data directly to avoid state timing issues
        if (signingFor === 'client' && agreeToTerms && !submitting && !signed && data) {
          // Small delay to ensure modal closes smoothly and state is updated
          setTimeout(() => {
            handleSubmitWithData(data, method);
          }, 300);
        } else if (signingFor === 'owner' && !submitting && data) {
          // Owner signature - save immediately without terms agreement
          setTimeout(() => {
            handleSubmitWithData(data, method);
          }, 300);
        }
      }
      
      // Handlers will be re-attached automatically via useEffect when contractHtmlWithSignatures changes
    }
  };

  const handleUpdateContractFields = async (updatedFields: any) => {
    if (!contractData?.id) return;
    
    try {
      const res = await fetch(`/api/contracts/${contractData.id}/update-fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update contract fields');
      }

      const data = await res.json();
      
      // Update local contract data
      setContractData(prev => prev ? { ...prev, ...data.contract } : null);
      
      // If contract HTML was regenerated in the response, use it immediately
      if (data.contract?.contract_html) {
        setContractHtmlWithSignatures(data.contract.contract_html);
        // Also update contractData with the new HTML
        setContractData(prev => prev ? { ...prev, contract_html: data.contract.contract_html } : null);
      } else if (token) {
        // Otherwise, refresh contract HTML by calling validateToken again
        await validateToken();
      }
    } catch (error) {
      console.error('Error updating contract fields:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Determine which signature we're submitting
    const currentSignatureData = signingFor === 'owner' ? ownerSignatureData : signatureData;
    const currentSignatureName = signingFor === 'owner' ? 'Ben Murray' : signatureName; // TODO: Get owner name dynamically

    if (!currentSignatureData) {
      alert('Please provide your signature');
      return;
    }

    // Only require terms agreement for client signatures
    if (signingFor === 'client' && !agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_name: currentSignatureName,
          signature_data: currentSignatureData,
          signature_method: signingFor === 'owner' ? 'type' : signatureMethod,
          signer_type: signingFor, // 'client' or 'owner'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign contract');
      }

      // If owner signed, just close modal and update UI - don't mark as fully signed
      if (signingFor === 'owner') {
        setSignatureModalOpen(false);
        // Refresh contract data to show updated signature
        if (token) {
          validateToken();
        }
        return;
      }

      // Redirect to success page if payment is needed
      if (data.needs_payment && data.payment_token) {
        router.push(`/pay/success?payment_token=${data.payment_token}&contract_signed=true`);
        return;
      }

      setSigned(true);
    } catch (err: any) {
      alert(err.message || 'Failed to sign contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentChange = () => {
    if (!contractContentRef.current || !isEditMode) return;
    const newHtml = contractContentRef.current.innerHTML;
    setContractHtmlWithSignatures(newHtml);
    setHasUnsavedChanges(newHtml !== originalHtml);
  };

  const handleSaveContractHtml = async () => {
    if (!contractData?.id || !contractContentRef.current) return;
    
    setIsSaving(true);
    try {
      const updatedHtml = contractContentRef.current.innerHTML;
      
      const res = await fetch(`/api/contracts/${contractData.id}/update-html`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_html: updatedHtml }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save contract');
      }

      setOriginalHtml(updatedHtml);
      setHasUnsavedChanges(false);
      setIsEditMode(false);
      
      // Show success feedback
      const saveButton = document.getElementById('save-contract-btn');
      if (saveButton) {
        const originalContent = saveButton.innerHTML;
        saveButton.innerHTML = '<span class="text-green-600">✓ Saved!</span>';
        setTimeout(() => {
          if (saveButton) {
            saveButton.innerHTML = originalContent;
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving contract HTML:', error);
      alert('Failed to save contract. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    // Restore original HTML
    if (contractContentRef.current && originalHtml) {
      contractContentRef.current.innerHTML = originalHtml;
      setContractHtmlWithSignatures(originalHtml);
      setHasUnsavedChanges(false);
    }
    setIsEditMode(false);
  };

  const handleFormatText = (command: string) => {
    document.execCommand(command, false);
    handleContentChange();
  };

  // Trigger confetti when signed page loads
  useEffect(() => {
    if (signed && !confettiTriggered && !isParticipantSigning) {
      triggerConfetti({
        duration: 3000,
        particleCount: 100,
      });
      setConfettiTriggered(true);
    }
  }, [signed, confettiTriggered, isParticipantSigning]);

  // Trigger confetti when signed page loads (must be before early returns)
  useEffect(() => {
    if (signed && !confettiTriggered && !isParticipantSigning) {
      triggerConfetti({
        duration: 3000,
        particleCount: 100,
      });
      setConfettiTriggered(true);
    }
  }, [signed, confettiTriggered, isParticipantSigning]);

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!contractData?.id || !token) return;
    
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/contracts/download-pdf-by-token?token=${token}`);
      
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contractData.contract_number || 'contract'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF download error:', err);
      alert(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Build default metadata for loading/error states
  const defaultBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const defaultUrl = token ? `${defaultBaseUrl}/sign-contract/${token}` : `${defaultBaseUrl}/sign-contract`;
  const defaultTitle = 'Sign Contract - M10 DJ Company';
  const defaultDescription = 'Review and sign your event contract securely online.';
  const defaultOgImage = `${defaultBaseUrl}/assets/contract-og-image.png`;
  const defaultFallbackOgImage = `${defaultBaseUrl}/logo-static.jpg`;

  if (loading || redirectingToPayment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Head>
          <title>{defaultTitle}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={defaultUrl} />
          <meta property="og:title" content={defaultTitle} />
          <meta property="og:description" content={defaultDescription} />
          <meta property="og:image" content={defaultOgImage} />
          <meta property="og:image:secure_url" content={defaultOgImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="M10 DJ Company Contract" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:site_name" content="M10 DJ Company" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={defaultUrl} />
          <meta name="twitter:title" content={defaultTitle} />
          <meta name="twitter:description" content={defaultDescription} />
          <meta name="twitter:image" content={defaultOgImage} />
          <meta name="twitter:image:alt" content="M10 DJ Company Contract" />
          <meta name="twitter:creator" content="@m10djcompany" />
          <meta name="twitter:site" content="@m10djcompany" />
          
          <meta name="description" content={defaultDescription} />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="text-center max-w-sm w-full">
          <Loader className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-black mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">
            {redirectingToPayment ? 'Redirecting to payment page...' : 'Loading contract...'}
          </p>
          {redirectingToPayment && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Please complete your payment to finalize your booking.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Head>
          <title>Contract Error - M10 DJ Company</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={defaultUrl} />
          <meta property="og:title" content="Contract Error - M10 DJ Company" />
          <meta property="og:description" content="Unable to load contract. Please contact us for assistance." />
          <meta property="og:image" content={defaultOgImage} />
          <meta property="og:image:secure_url" content={defaultOgImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="M10 DJ Company" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:site_name" content="M10 DJ Company" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={defaultUrl} />
          <meta name="twitter:title" content="Contract Error - M10 DJ Company" />
          <meta name="twitter:description" content="Unable to load contract. Please contact us for assistance." />
          <meta name="twitter:image" content={defaultOgImage} />
          <meta name="twitter:image:alt" content="M10 DJ Company" />
          <meta name="twitter:creator" content="@m10djcompany" />
          <meta name="twitter:site" content="@m10djcompany" />
          
          <meta name="description" content="Unable to load contract. Please contact us for assistance." />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="max-w-md w-full bg-white border border-gray-300 p-6 sm:p-8 text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-black mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-black mb-2">Unable to Load Contract</h1>
          <p className="text-sm sm:text-base text-gray-700 mb-6">{error}</p>
          <a
            href="mailto:m10djcompany@gmail.com"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </a>
        </div>
      </div>
    );
  }

  // Build signed page metadata
  const signedBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const signedUrl = `${signedBaseUrl}/sign-contract/${token}`;
  const signedTitle = contractData 
    ? `Contract Signed: ${contractData.event_name || 'Event Contract'} - M10 DJ Company`
    : 'Contract Signed - M10 DJ Company';
  const signedDescription = contractData
    ? `Contract #${contractData.contract_number || ''} has been signed${contractData.event_date ? ` for ${new Date(contractData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}${contractData.venue_name ? ` at ${contractData.venue_name}` : ''}.`
    : 'Your contract has been signed successfully.';
  const signedOgImage = `${signedBaseUrl}/assets/contract-og-image.png`;
  const signedFallbackOgImage = `${signedBaseUrl}/logo-static.jpg`;

  if (signed) {
    return (
      <div className="min-h-screen bg-white py-4 sm:py-8 px-4">
        <Head>
          <title>{signedTitle}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={signedUrl} />
          <meta property="og:title" content={signedTitle} />
          <meta property="og:description" content={signedDescription} />
          <meta property="og:image" content={signedOgImage} />
          <meta property="og:image:secure_url" content={signedOgImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={contractData?.event_name ? `Signed contract for ${contractData.event_name}` : 'M10 DJ Company Contract'} />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:site_name" content="M10 DJ Company" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={signedUrl} />
          <meta name="twitter:title" content={signedTitle} />
          <meta name="twitter:description" content={signedDescription} />
          <meta name="twitter:image" content={signedOgImage} />
          <meta name="twitter:image:alt" content={contractData?.event_name ? `Signed contract for ${contractData.event_name}` : 'M10 DJ Company Contract'} />
          <meta name="twitter:creator" content="@m10djcompany" />
          <meta name="twitter:site" content="@m10djcompany" />
          
          {/* Additional Meta Tags */}
          <meta name="description" content={signedDescription} />
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white border border-gray-300 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-black mb-1 flex items-center gap-2">
                    {isParticipantSigning ? 'Signature Submitted ✓' : 'Contract Signed ✓'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-700 break-words">
                    {contractData?.event_name} - {contractData?.event_date ? new Date(contractData.event_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                    Contract #{contractData?.contract_number}
                    {isParticipantSigning && participantData && (
                      <span className="ml-2">• {participantData.role || 'Additional Signer'}</span>
                    )}
                  </p>
                </div>
              </div>
              {!isParticipantSigning && (
                <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                  <div className="text-xl sm:text-2xl font-bold text-black">
                    ${contractData?.total_amount.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Amount</div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Content */}
          <div className="bg-white border border-gray-300 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="mb-4 sm:mb-6">
              <div className="bg-gray-50 border border-gray-300 p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-black mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <p className="font-semibold text-sm sm:text-base">
                    {isParticipantSigning 
                      ? 'Your signature has been submitted successfully'
                      : 'This contract has been signed'}
                  </p>
                </div>
                {isParticipantSigning && participantData ? (
                  <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
                    <p>Signed by: <strong>{participantData.signed_by || participantData.name}</strong></p>
                    {participantData.signed_at && (
                      <p>Signed on: <strong>{new Date(participantData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                    )}
                    <p className="mt-2 text-gray-600">
                      Thank you for signing. The contract administrator has been notified.
                    </p>
                  </div>
                ) : contractData && (
                  <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
                    {contractData.signed_by_client && (
                      <p>Signed by: <strong>{contractData.signed_by_client}</strong></p>
                    )}
                    {contractData.signed_at && (
                      <p>Signed on: <strong>{new Date(contractData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contract HTML Content */}
            <div className="max-h-[50vh] sm:max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 bg-gray-50">
              <div 
                className="prose prose-sm sm:prose-base max-w-none text-xs sm:text-sm"
                dangerouslySetInnerHTML={{ __html: contractData?.contract_html || '' }}
              />
            </div>

            {/* Signature Display (if available) */}
            {(isParticipantSigning && participantData?.signature_data) ? (
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Your Signature</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <img 
                    src={participantData.signature_data} 
                    alt="Participant Signature" 
                    className="max-w-full sm:max-w-xs h-auto border border-gray-300 bg-white p-2 rounded"
                  />
                </div>
              </div>
            ) : contractData?.client_signature_data && (
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Signature</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <img 
                    src={contractData.client_signature_data} 
                    alt="Contract Signature" 
                    className="max-w-full sm:max-w-xs h-auto border border-gray-300 bg-white p-2 rounded"
                  />
                </div>
              </div>
            )}

            {/* Download/Print Options */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                {isParticipantSigning 
                  ? 'The contract administrator has been notified of your signature.'
                  : 'A copy of this signed contract has been sent to your email.'}
              </p>
              <div className="flex gap-3 justify-center sm:justify-end">
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Download className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Payment Section - Show if payment is needed */}
          {needsPayment && paymentToken && !isParticipantSigning && (
            <div className="bg-white border border-gray-300 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 border border-yellow-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black">Complete Your Payment</h2>
                  <p className="text-sm sm:text-base text-gray-600">Secure payment via Stripe</p>
                </div>
              </div>
              <div className="mt-6">
                <a
                  href={`/pay/${paymentToken}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  <CreditCard className="w-5 h-5" />
                  Pay Now
                </a>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gray-50 border border-gray-300 p-6">
            <h3 className="font-semibold text-black mb-3">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
                <span>A signed copy of the contract has been sent to your email</span>
              </li>
              {needsPayment ? (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
                  <span>Complete your payment using the secure payment form above</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
                  <span>You will receive an invoice for the deposit payment</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
                <span>We&apos;ll be in touch to finalize event details</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Build Open Graph metadata
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const contractUrl = `${baseUrl}/sign-contract/${token}`;
  const ogTitle = contractData 
    ? `Sign Contract: ${contractData.event_name || 'Event Contract'} - M10 DJ Company`
    : 'Sign Contract - M10 DJ Company';
  const ogDescription = contractData
    ? `Please review and sign your event contract${contractData.event_date ? ` for ${new Date(contractData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}${contractData.venue_name ? ` at ${contractData.venue_name}` : ''}. Contract #${contractData.contract_number || ''}.`
    : 'Review and sign your event contract securely online.';
  const ogImage = `${baseUrl}/assets/contract-og-image.png`;
  const fallbackOgImage = `${baseUrl}/logo-static.jpg`;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Sign Contract - {contractData?.event_name || 'Event Contract'} - M10 DJ Company</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={contractUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={contractData?.event_name ? `Contract for ${contractData.event_name}` : 'M10 DJ Company Contract'} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:site_name" content="M10 DJ Company" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={contractUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={contractData?.event_name ? `Contract for ${contractData.event_name}` : 'M10 DJ Company Contract'} />
        <meta name="twitter:creator" content="@m10djcompany" />
        <meta name="twitter:site" content="@m10djcompany" />
        
        {/* Additional Meta Tags */}
        <meta name="description" content={ogDescription} />
        <meta name="robots" content="noindex, nofollow" />
        
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap"
          rel="stylesheet"
        />
        <style jsx global>{`
          /* Google Doc-like styling */
          body {
            font-family: 'Times New Roman', Times, serif !important;
            background: white !important;
          }
          
          .contract-container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            background: white;
            min-height: 100vh;
          }
          
          .contract-content {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
          }
          
          .contract-content h1 {
            font-family: 'Times New Roman', Times, serif;
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20pt;
            border-bottom: 2px solid #000;
            padding-bottom: 10pt;
          }
          
          .contract-content h2 {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14pt;
            font-weight: bold;
            margin-top: 18pt;
            margin-bottom: 12pt;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4pt;
          }
          
          .contract-content p {
            margin: 6pt 0;
            text-align: justify;
          }
          
          .contract-content ul, .contract-content ol {
            margin: 6pt 0;
            padding-left: 30pt;
          }
          
          .contract-content li {
            margin: 3pt 0;
          }
          
          .signature-section {
            margin-top: 30pt;
            padding-top: 15pt;
            border-top: 2px solid #000;
          }
          
          .signature-box {
            margin: 15pt 0;
            padding: 12pt;
            border: 1px solid #ddd;
            background-color: #fafafa;
          }
          
          .signature-capture-area {
            min-height: 60pt;
            margin: 8pt 0;
            padding: 8pt;
            border: 1px dashed #ccc;
            background-color: #fafafa;
          }
          
          /* Make signature areas clearly clickable */
          #client-signature-area {
            cursor: pointer !important;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
          
          #client-signature-area:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
          
          #client-signature-area * {
            pointer-events: none !important;
          }

          /* Owner signature area - only clickable for admins */
          #owner-signature-area:not(.signature-disabled) {
            cursor: pointer !important;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
          
          #owner-signature-area:not(.signature-disabled):hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
          
          #owner-signature-area:not(.signature-disabled) * {
            pointer-events: none !important;
          }

          /* Disabled owner signature for clients */
          #owner-signature-area.signature-disabled {
            cursor: not-allowed !important;
            opacity: 0.5;
            pointer-events: none !important;
          }
          
          #owner-signature-area.signature-disabled * {
            pointer-events: none !important;
          }
          
          /* Editable contract styling (Google Docs-like) */
          .editable-contract {
            outline: none;
            min-height: 100vh;
            padding: 20px;
            border: 1px solid transparent;
            transition: border-color 0.2s;
          }
          
          .editable-contract:hover {
            border-color: #e5e7eb;
          }
          
          .editable-contract:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          /* Prevent editing signature areas */
          .editable-contract #client-signature-area,
          .editable-contract #owner-signature-area {
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            opacity: 0.8;
            position: relative;
          }
          
          .editable-contract #client-signature-area::before,
          .editable-contract #owner-signature-area::before {
            content: '🔒 Signature (Protected)';
            position: absolute;
            top: -20px;
            left: 0;
            font-size: 10px;
            color: #666;
            background: #fff;
            padding: 2px 4px;
            border-radius: 2px;
          }
          
          /* Show cursor in editable areas */
          .editable-contract *:not(#client-signature-area):not(#owner-signature-area):not(#client-signature-area *):not(#owner-signature-area *) {
            cursor: text;
          }
          
          /* Blur effect when modal is open (desktop only) */
          @media (min-width: 769px) {
            .contract-container.modal-open {
              filter: blur(4px);
              transition: filter 0.2s ease-in-out;
              pointer-events: none;
            }
            
            .contract-container.modal-open .contract-content {
              pointer-events: none;
            }
          }
          
          /* Mobile adjustments */
          @media (max-width: 768px) {
            .contract-container {
              padding: 20px;
            }
            
            .contract-content {
              font-size: 11pt;
            }
          }
        `}</style>
      </Head>

      <div className={`contract-container ${signatureModalOpen ? 'modal-open' : ''}`}>
        {/* Admin Edit Mode Toolbar - Mobile Optimized */}
        {isAdmin && isEditMode && (
          <div className="sticky top-0 z-50 bg-white border-b border-gray-300 shadow-sm mb-4">
            {/* Mobile: Compact toolbar */}
            <div className="sm:hidden p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Edit</span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Formatting Buttons - Smaller on mobile */}
                <button
                  onClick={() => handleFormatText('bold')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5 text-black" />
                </button>
                <button
                  onClick={() => handleFormatText('italic')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5 text-black" />
                </button>
                <button
                  onClick={() => handleFormatText('underline')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
              <button
                onClick={handleCancelEdit}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5 touch-manipulation"
                disabled={isSaving}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                id="save-contract-btn"
                onClick={handleSaveContractHtml}
                className="px-2.5 py-1.5 text-xs bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-w-[44px] justify-center"
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            {/* Desktop: Full toolbar */}
            <div className="hidden sm:flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Edit Mode</span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Formatting Buttons */}
                <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
                  <button
                    onClick={() => handleFormatText('bold')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={() => handleFormatText('italic')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={() => handleFormatText('underline')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4 text-black" />
                  </button>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  id="save-contract-btn"
                  onClick={handleSaveContractHtml}
                  className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Edit Toggle Button and Unsign Button - Mobile Optimized */}
        {isAdmin && !isEditMode && (
          <div className="fixed bottom-4 right-4 sm:top-4 sm:bottom-auto z-50 flex flex-col gap-2 sm:gap-2">
            {/* Mobile: Compact icon-only buttons */}
            <div className="sm:hidden flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsEditMode(true);
                  setOriginalHtml(contractHtmlWithSignatures || contractData?.contract_html || '');
                  setTimeout(() => {
                    if (contractContentRef.current) {
                      contractContentRef.current.innerHTML = contractHtmlWithSignatures || contractData?.contract_html || '';
                    }
                  }, 100);
                }}
                className="w-12 h-12 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 active:bg-gray-900 transition-colors flex items-center justify-center touch-manipulation"
                title="Edit Contract (Admin Only)"
              >
                <Edit className="w-5 h-5" />
              </button>
              {/* Unsign Button - Only show if vendor has signed but client hasn't */}
              {(contractData?.vendor_signature_data || contractData?.signed_by_vendor) && !contractData?.client_signature_data && (
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to remove your signature from this contract?')) {
                      return;
                    }
                    
                    try {
                      const res = await fetch(`/api/contracts/${contractData.id}/unsign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        throw new Error(data.error || 'Failed to unsign contract');
                      }

                      await validateToken();
                    } catch (error: any) {
                      alert(error.message || 'Failed to unsign contract');
                    }
                  }}
                  className="w-12 h-12 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center touch-manipulation"
                  title="Remove Your Signature (Admin Only)"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Desktop: Full buttons with text */}
            <div className="hidden sm:flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsEditMode(true);
                  setOriginalHtml(contractHtmlWithSignatures || contractData?.contract_html || '');
                  setTimeout(() => {
                    if (contractContentRef.current) {
                      contractContentRef.current.innerHTML = contractHtmlWithSignatures || contractData?.contract_html || '';
                    }
                  }, 100);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                title="Edit Contract (Admin Only)"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Contract</span>
              </button>
              {/* Unsign Button - Only show if vendor has signed but client hasn't */}
              {(contractData?.vendor_signature_data || contractData?.signed_by_vendor) && !contractData?.client_signature_data && (
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to remove your signature from this contract?')) {
                      return;
                    }
                    
                    try {
                      const res = await fetch(`/api/contracts/${contractData.id}/unsign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        throw new Error(data.error || 'Failed to unsign contract');
                      }

                      await validateToken();
                    } catch (error: any) {
                      alert(error.message || 'Failed to unsign contract');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  title="Remove Your Signature (Admin Only)"
                >
                  <X className="w-4 h-4" />
                  <span>Unsign Contract</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contract Content - Full Screen Document Style */}
        <div 
          ref={contractContentRef}
          id="contract-content"
          className={`contract-content ${isAdmin && isEditMode ? 'editable-contract' : ''}`}
          contentEditable={isAdmin && isEditMode}
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onBlur={handleContentChange}
          dangerouslySetInnerHTML={!isEditMode ? { __html: contractHtmlWithSignatures || contractData?.contract_html || '' } : undefined}
        />

        {/* Signature Modal */}
        <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {signingFor === 'client' 
                  ? 'Sign Contract' 
                  : signingFor === 'participant'
                  ? `${participantData?.role || 'Additional Signer'} Signature`
                  : 'Authorized Representative Signature'}
              </DialogTitle>
              <DialogDescription>
                {signingFor === 'client' 
                  ? 'Please provide your signature to complete the contract.'
                  : signingFor === 'participant'
                  ? `Please provide your signature as ${participantData?.role || 'an additional signer'}${participantData?.title ? ` (${participantData.title})` : ''}.`
                  : 'Please provide the authorized representative signature.'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 pb-2">
              <SignatureCapture
                onSignatureChange={(data, method, isComplete) => handleSignatureChange(data, method, isComplete)}
                defaultMethod="type"
                initialName="" // Client must type their name
                label={signingFor === 'client' ? 'Your Signature' : 'Signature'}
                requireAgreement={signingFor === 'client'}
                agreedToTerms={agreeToTerms}
                onAgreementChange={(agreed) => setAgreeToTerms(agreed)}
              />
            </div>
            {/* Full Agreement Text - Show below signature capture for client */}
            {signingFor === 'client' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  By signing, you acknowledge that you have read, understood, and agree to the terms and conditions outlined in this contract. 
                  You understand that this electronic signature is legally binding and has the same effect as a handwritten signature.
                </p>
            </div>
            )}
          </DialogContent>
        </Dialog>


        {/* Security Notice */}
        <div className="text-center mb-4" style={{ fontSize: '9pt', color: '#999', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <p>🔒 This is a secure signing page. Your signature is encrypted and legally binding.</p>
          <p className="mt-1">Questions? Contact us at m10djcompany@gmail.com</p>
        </div>
      </div>

      {/* Admin Contract Fields Editor Sidebar */}
      {contractData && (
        <ContractFieldsEditor
          contractId={contractData.id}
          contractData={{
            event_name: contractData.event_name || '',
            event_date: contractData.event_date || '',
            event_type: contractData.event_type || '',
            event_time: contractData.event_time || '',
            end_time: contractData.end_time || '',
            venue_name: contractData.venue_name || '',
            venue_address: contractData.venue_address || '',
            guest_count: contractData.guest_count ?? null,
            total_amount: contractData.total_amount || null,
            deposit_amount: contractData.deposit_amount ?? null,
            contract_number: contractData.contract_number || '',
          }}
          onUpdate={handleUpdateContractFields}
          focusedField={focusedField}
          onFieldClick={(fieldKey) => {
            setFocusedField(fieldKey);
          }}
        />
      )}
    </div>
  );
}

