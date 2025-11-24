import { CheckCircle } from 'lucide-react';
import ReceiptRequestButton from './ReceiptRequestButton';

export default function PaymentSuccessScreen({ requestId, amount }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center animate-fade-in-up">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg shadow-green-500/30">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Request Submitted!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
        Payment processed successfully!
      </p>
      <ReceiptRequestButton requestId={requestId} amount={amount} />
    </div>
  );
}

