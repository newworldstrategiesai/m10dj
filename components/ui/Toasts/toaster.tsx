'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from '@/components/ui/Toasts/toast';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getUserFriendlyError } from '@/utils/user-friendly-errors';

export function Toaster() {
  const { toast, toasts } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Track which status/error messages we've already shown to prevent infinite loops
  const processedRef = useRef<Set<string>>(new Set());
  // Track if component is mounted to prevent state updates after unmount
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!searchParams || !isMounted) return;
    
    const status = searchParams.get('status');
    const status_description = searchParams.get('status_description');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    
    // Create a unique key for this toast to prevent showing duplicates
    const toastKey = `${status || error}-${status_description || error_description}-${pathname}`;
    
    // Skip if we've already processed this exact toast
    if (processedRef.current.has(toastKey)) {
      return;
    }
    
    if (error || status) {
      // Mark as processed BEFORE showing toast to prevent race conditions
      processedRef.current.add(toastKey);
      
      if (error) {
        const friendlyError = getUserFriendlyError(error_description || error);
        toast({
          title: friendlyError.message,
          description: friendlyError.suggestion,
          variant: 'destructive'
        });
      } else {
        toast({
          title: status ?? 'Success!',
          description: status_description,
        });
      }
      
      // Clear any 'error', 'status', 'status_description', and 'error_description' search params
      // so that the toast doesn't show up again on refresh, but leave any other search params
      // intact. Use setTimeout to avoid blocking the current render cycle.
      setTimeout(() => {
        if (!isMounted || !pathname) return;
        
        const newSearchParams = new URLSearchParams(searchParams.toString());
        const paramsToRemove = [
          'error',
          'status',
          'status_description',
          'error_description'
        ];
        paramsToRemove.forEach((param) => newSearchParams.delete(param));
        const newParamsString = newSearchParams.toString();
        const redirectPath: string = newParamsString ? `${pathname}?${newParamsString}` : pathname;
        router.replace(redirectPath, { scroll: false });
      }, 100);
    }
  }, [searchParams, pathname, isMounted, toast, router]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
