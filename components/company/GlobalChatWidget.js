
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import ContactFormChat from './ContactFormChat';
import { MessageCircle } from 'lucide-react';

/**
 * Global Chat Widget - Always available throughout the site
 * Shows as icon button, can expand to micro or full screen
 */
export default function GlobalChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMicro, setIsMicro] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDJDashDomain, setIsDJDashDomain] = useState(false);

  // Check if we're on a quote page - use micro view there
  const isQuotePage = router.pathname?.includes('/quote/');
  
  // Don't show chat widget on DJ Dash pages (djdash.net)
  const isDJDashPage = router.pathname?.startsWith('/djdash') || router.pathname?.startsWith('/dj/');
  
  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setIsDJDashDomain(window.location.hostname.includes('djdash.net'));
    }
  }, []);
  
  // Restore chat data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const submissionId = sessionStorage.getItem('chat_submission_id');
        const formDataStr = sessionStorage.getItem('chat_form_data');
        const chatMinimized = sessionStorage.getItem('chat_minimized') === 'true';
        
        if (submissionId && formDataStr) {
          setChatData({
            formData: JSON.parse(formDataStr),
            submissionId: submissionId
          });
          setIsMinimized(chatMinimized);
          setIsMicro(isQuotePage && !chatMinimized);
          setIsOpen(true);
        }
      } catch (e) {
        console.warn('Could not restore chat from sessionStorage:', e);
      }
    }
  }, [isQuotePage]);

  // Update micro view when route changes
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setIsMicro(isQuotePage);
    }
  }, [isQuotePage, isOpen, isMinimized]);

  // Don't render if on DJ Dash pages (check after mount to avoid hydration issues)
  // IMPORTANT: This check must come AFTER all hooks to comply with Rules of Hooks
  if (!isMounted || typeof document === 'undefined' || isDJDashPage || isDJDashDomain) {
    return null;
  }

  const handleOpenChat = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // If we have existing chat data, use it
    if (chatData) {
      setIsOpen(true);
      setIsMinimized(false);
      setIsMicro(isQuotePage);
      try {
        sessionStorage.setItem('chat_minimized', 'false');
      } catch (e) {
        console.warn('Could not save chat state:', e);
      }
    } else {
      // Otherwise, create a default chat session
      const defaultFormData = {
        name: 'Guest',
        eventType: 'event',
        email: '',
        phone: '',
        eventDate: '',
        guests: '',
        venue: '',
        message: ''
      };
      setChatData({
        formData: defaultFormData,
        submissionId: null
      });
      setIsOpen(true);
      setIsMinimized(false);
      setIsMicro(isQuotePage);
      try {
        sessionStorage.setItem('chat_minimized', 'false');
      } catch (e) {
        console.warn('Could not save chat state:', e);
      }
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMicro(false);
    try {
      sessionStorage.setItem('chat_minimized', 'true');
    } catch (e) {
      console.warn('Could not save chat state:', e);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
    setIsMicro(false);
    // Don't clear sessionStorage - keep chat data for next time
  };

  return (
    <>
      {/* Always visible icon button */}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[9999]">
          <button
            onClick={handleOpenChat}
            className="flex items-center gap-2 bg-gradient-to-r from-brand to-brand-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Chat</span>
            {chatData && chatData.formData && chatData.formData.name !== 'Guest' && (
              <span className="bg-white text-brand rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>
        </div>,
        document.body
      )}

      {/* Chat widget when open */}
      {isOpen && chatData && createPortal(
        isMinimized ? null : isMicro ? (
          <ContactFormChat 
            formData={chatData.formData}
            submissionId={chatData.submissionId}
            onClose={handleClose}
            isMinimized={false}
            isMicro={true}
            onMinimize={handleMinimize}
          />
        ) : (
          <div 
            className="fixed inset-0 z-[99999] bg-white dark:bg-gray-900"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <ContactFormChat 
              formData={chatData.formData}
              submissionId={chatData.submissionId}
              onClose={handleClose}
              isMinimized={false}
              isMicro={false}
              onMinimize={() => {
                setIsMicro(isQuotePage);
                try {
                  sessionStorage.setItem('chat_minimized', 'false');
                } catch (e) {
                  console.warn('Could not save chat state:', e);
                }
              }}
            />
          </div>
        ),
        document.body
      )}
    </>
  );
}

