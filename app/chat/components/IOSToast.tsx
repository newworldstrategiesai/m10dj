import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { cn } from '@/utils/cn';
import { Phone } from 'lucide-react';

interface IOSToastProps {
  message: string;
  sender: string;
  onOpen?: () => void;
  onClose?: () => void;
}

export function IOSToast({ message, sender, onOpen, onClose }: IOSToastProps) {
  const { toast } = useToast();

  useEffect(() => {
    onOpen?.();
    const toastId = toast({
      className: cn(
        "bg-white dark:bg-[#1c1c1e] border-0 shadow-lg rounded-2xl p-4",
        "animate-in slide-in-from-top-4 duration-300"
      ),
      description: (
        <div className="flex items-start gap-3">
          <div className="bg-[#007aff] dark:bg-[#0a84ff] rounded-full p-2">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[#000000] dark:text-[#ffffff]">{sender}</p>
            <p className="text-sm text-[#8e8e93] dark:text-[#8e8e93] mt-0.5">{message}</p>
          </div>
        </div>
      ),
      duration: 3000,
    });

    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [message, sender, toast, onOpen, onClose]);

  return null;
} 