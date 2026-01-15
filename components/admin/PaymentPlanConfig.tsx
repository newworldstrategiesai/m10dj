/**
 * Payment Plan Configuration Component
 * Allows admins to configure custom payment plans for invoices
 * Features preset options for common payment schedules
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Percent, Check } from 'lucide-react';

interface PaymentInstallment {
  name: string;
  amount: number | null;
  percentage: number | null;
  due_date_type: 'upon_signing' | 'days_before_event' | 'specific_date' | 'invoice_due_date';
  days_before_event: number | null;
  specific_date: string | null;
  description: string;
}

interface PaymentPlan {
  type: 'pay_in_full' | 'preset_50_50' | 'preset_3_way' | 'preset_4_way' | 'custom';
  installments: PaymentInstallment[];
}

interface PaymentPlanConfigProps {
  totalAmount: number;
  value: PaymentPlan | null;
  onChange: (plan: PaymentPlan) => void;
  eventDate?: string | null;
  invoiceDueDate?: string | null;
}

export default function PaymentPlanConfig({
  totalAmount,
  value,
  onChange,
  eventDate,
  invoiceDueDate
}: PaymentPlanConfigProps) {
  const [planType, setPlanType] = useState<'pay_in_full' | 'preset_50_50' | 'preset_3_way' | 'preset_4_way' | 'custom'>(
    value?.type || 'preset_50_50'
  );
  const [installments, setInstallments] = useState<PaymentInstallment[]>(
    value?.installments || getPresetInstallments('preset_50_50')
  );

  // Generate preset installments
  function getPresetInstallments(preset: 'pay_in_full' | 'preset_50_50' | 'preset_3_way' | 'preset_4_way'): PaymentInstallment[] {
    switch (preset) {
      case 'pay_in_full':
        return [
          {
            name: 'Full Payment',
            amount: null,
            percentage: 100,
            due_date_type: 'upon_signing',
            days_before_event: null,
            specific_date: null,
            description: 'Full payment due upon signing'
          }
        ];
      
      case 'preset_50_50':
        return [
          {
            name: 'Deposit',
            amount: null,
            percentage: 50,
            due_date_type: 'upon_signing',
            days_before_event: null,
            specific_date: null,
            description: 'Initial deposit due upon signing'
          },
          {
            name: 'Balance',
            amount: null,
            percentage: 50,
            due_date_type: 'days_before_event',
            days_before_event: 30,
            specific_date: null,
            description: 'Remaining balance due before event'
          }
        ];
      
      case 'preset_3_way':
        return [
          {
            name: 'Deposit',
            amount: null,
            percentage: 33.33,
            due_date_type: 'upon_signing',
            days_before_event: null,
            specific_date: null,
            description: 'Initial deposit due upon signing'
          },
          {
            name: 'Second Payment',
            amount: null,
            percentage: 33.33,
            due_date_type: 'days_before_event',
            days_before_event: 60,
            specific_date: null,
            description: 'Second payment due before event'
          },
          {
            name: 'Final Payment',
            amount: null,
            percentage: 33.34,
            due_date_type: 'days_before_event',
            days_before_event: 30,
            specific_date: null,
            description: 'Final payment due before event'
          }
        ];
      
      case 'preset_4_way':
        return [
          {
            name: 'Deposit',
            amount: null,
            percentage: 25,
            due_date_type: 'upon_signing',
            days_before_event: null,
            specific_date: null,
            description: 'Initial deposit due upon signing'
          },
          {
            name: 'Second Payment',
            amount: null,
            percentage: 25,
            due_date_type: 'days_before_event',
            days_before_event: 90,
            specific_date: null,
            description: 'Second payment due before event'
          },
          {
            name: 'Third Payment',
            amount: null,
            percentage: 25,
            due_date_type: 'days_before_event',
            days_before_event: 60,
            specific_date: null,
            description: 'Third payment due before event'
          },
          {
            name: 'Final Payment',
            amount: null,
            percentage: 25,
            due_date_type: 'days_before_event',
            days_before_event: 30,
            specific_date: null,
            description: 'Final payment due before event'
          }
        ];
    }
  }

  useEffect(() => {
    if (value) {
      setPlanType(value.type);
      setInstallments(value.installments || []);
    }
  }, [value]);

  useEffect(() => {
    onChange({
      type: planType,
      installments: installments
    });
  }, [planType, installments]);

  const handlePresetSelect = (preset: 'pay_in_full' | 'preset_50_50' | 'preset_3_way' | 'preset_4_way') => {
    setPlanType(preset);
    setInstallments(getPresetInstallments(preset));
  };

  const handleCustomPlan = () => {
    setPlanType('custom');
    // If switching from a preset, keep the current installments as a starting point
    if (installments.length === 0) {
      setInstallments(getPresetInstallments('preset_50_50'));
    }
  };

  const calculateAmount = (installment: PaymentInstallment): number => {
    if (installment.amount !== null && installment.amount !== undefined) {
      return installment.amount;
    }
    if (installment.percentage !== null && installment.percentage !== undefined && totalAmount > 0) {
      return (totalAmount * installment.percentage) / 100;
    }
    return 0;
  };

  const calculatePercentage = (installment: PaymentInstallment): number => {
    if (installment.percentage !== null && installment.percentage !== undefined) {
      return installment.percentage;
    }
    if (installment.amount !== null && installment.amount !== undefined && totalAmount > 0) {
      return (installment.amount / totalAmount) * 100;
    }
    return 0;
  };

  const getTotalAllocated = (): number => {
    return installments.reduce((sum, inst) => sum + calculateAmount(inst), 0);
  };

  const addInstallment = () => {
    setInstallments([
      ...installments,
      {
        name: `Payment ${installments.length + 1}`,
        amount: null,
        percentage: null,
        due_date_type: 'days_before_event',
        days_before_event: 30,
        specific_date: null,
        description: ''
      }
    ]);
  };

  const removeInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const updateInstallment = (index: number, field: keyof PaymentInstallment, value: any) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate percentage when amount changes
    if (field === 'amount' && value !== null && totalAmount > 0) {
      updated[index].percentage = (value / totalAmount) * 100;
    }
    // Auto-calculate amount when percentage changes
    if (field === 'percentage' && value !== null && totalAmount > 0) {
      updated[index].amount = (totalAmount * value) / 100;
    }
    
    // When using custom plan, update type to custom if it was a preset
    if (planType !== 'custom' && (field === 'amount' || field === 'percentage' || field === 'name' || field === 'description')) {
      setPlanType('custom');
    }
    
    setInstallments(updated);
  };

  const totalAllocated = getTotalAllocated();
  const remaining = totalAmount - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01; // Allow small rounding differences

  // Preset selection view
  if (planType !== 'custom') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Payment Plan
          </label>
          
          {/* Preset Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button
              type="button"
              onClick={() => handlePresetSelect('pay_in_full')}
              className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                planType === 'pay_in_full'
                  ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {planType === 'pay_in_full' && <Check className="w-4 h-4" />}
                <span>Pay in Full</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">100% upon signing</div>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('preset_50_50')}
              className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                planType === 'preset_50_50'
                  ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {planType === 'preset_50_50' && <Check className="w-4 h-4" />}
                <span>50/50 Split</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">50% deposit, 50% balance</div>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('preset_3_way')}
              className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                planType === 'preset_3_way'
                  ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {planType === 'preset_3_way' && <Check className="w-4 h-4" />}
                <span>3 Payments</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">33% each installment</div>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('preset_4_way')}
              className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                planType === 'preset_4_way'
                  ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {planType === 'preset_4_way' && <Check className="w-4 h-4" />}
                <span>4 Payments</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">25% each installment</div>
            </button>
          </div>

          {/* Custom Plan Button */}
          <button
            type="button"
            onClick={handleCustomPlan}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#fcba00] hover:text-[#fcba00] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Custom Plan
          </button>
        </div>

        {/* Preset Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                {planType === 'pay_in_full' && 'Pay in Full'}
                {planType === 'preset_50_50' && '50/50 Payment Plan'}
                {planType === 'preset_3_way' && '3-Payment Plan'}
                {planType === 'preset_4_way' && '4-Payment Plan'}
              </h4>
              <p className="text-sm text-gray-600">
                {planType === 'pay_in_full' && 'Full payment due upon signing contract.'}
                {planType === 'preset_50_50' && '50% deposit upon signing, 50% balance 30 days before event.'}
                {planType === 'preset_3_way' && 'Three equal payments: deposit upon signing, then 60 and 30 days before event.'}
                {planType === 'preset_4_way' && 'Four equal payments: deposit upon signing, then 90, 60, and 30 days before event.'}
              </p>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-2 pt-3 border-t border-gray-200">
            {installments.map((installment, index) => {
              const amount = calculateAmount(installment);
              const percentage = calculatePercentage(installment);
              const dueDateText = 
                installment.due_date_type === 'upon_signing' 
                  ? 'Upon signing contract'
                  : installment.due_date_type === 'days_before_event'
                  ? `${installment.days_before_event} days before event`
                  : installment.due_date_type === 'specific_date' && installment.specific_date
                  ? new Date(installment.specific_date).toLocaleDateString()
                  : 'Invoice due date';

              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{installment.name}</span>
                    {installment.description && (
                      <span className="text-gray-500 ml-2">• {installment.description}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                    </div>
                    <div className="text-xs text-gray-500">{dueDateText}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Validation */}
          {!isValid && (
            <div className="mt-3 pt-3 border-t border-yellow-200 bg-yellow-50 rounded p-2">
              <p className="text-xs text-yellow-800">
                {remaining > 0 
                  ? `Remaining: $${remaining.toFixed(2)} - Click "Create Custom Plan" to adjust`
                  : `Over-allocated: $${Math.abs(remaining).toFixed(2)} - Click "Create Custom Plan" to adjust`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Custom plan editor view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          Custom Payment Plan
        </label>
        <button
          type="button"
          onClick={() => handlePresetSelect('preset_50_50')}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          ← Use Preset
        </button>
      </div>

      <div className="space-y-3">
        {installments.map((installment, index) => {
          const amount = calculateAmount(installment);
          const percentage = calculatePercentage(installment);

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {installment.name || `Payment ${index + 1}`}
                </h4>
                {installments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstallment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Payment Name
                  </label>
                  <input
                    type="text"
                    value={installment.name}
                    onChange={(e) => updateInstallment(index, 'name', e.target.value)}
                    placeholder="e.g., Deposit, Balance, Payment 1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={installment.description}
                    onChange={(e) => updateInstallment(index, 'description', e.target.value)}
                    placeholder="e.g., Initial deposit due upon signing"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={installment.amount ?? ''}
                    onChange={(e) => updateInstallment(index, 'amount', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>

                {/* Percentage */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={installment.percentage ?? ''}
                    onChange={(e) => updateInstallment(index, 'percentage', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>

                {/* Due Date Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due Date
                  </label>
                  <select
                    value={installment.due_date_type}
                    onChange={(e) => updateInstallment(index, 'due_date_type', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  >
                    <option value="upon_signing">Upon Signing Contract</option>
                    <option value="days_before_event">Days Before Event</option>
                    <option value="specific_date">Specific Date</option>
                    <option value="invoice_due_date">Invoice Due Date</option>
                  </select>
                </div>

                {/* Days Before Event or Specific Date */}
                {installment.due_date_type === 'days_before_event' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Days Before Event
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={installment.days_before_event ?? ''}
                      onChange={(e) => updateInstallment(index, 'days_before_event', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="30"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                    />
                  </div>
                )}

                {installment.due_date_type === 'specific_date' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Specific Date
                    </label>
                    <input
                      type="date"
                      value={installment.specific_date ?? ''}
                      onChange={(e) => updateInstallment(index, 'specific_date', e.target.value || null)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                    />
                  </div>
                )}

                {installment.due_date_type === 'invoice_due_date' && (
                  <div className="flex items-end">
                    <p className="text-xs text-gray-500">
                      Will use the invoice due date: {invoiceDueDate ? new Date(invoiceDueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                )}
              </div>

              {/* Calculated Amount Display */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Calculated Amount:</span>
                  <span className="font-semibold text-gray-900">
                    ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Installment Button */}
      <button
        type="button"
        onClick={addInstallment}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#fcba00] hover:text-[#fcba00] transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Payment Installment
      </button>

      {/* Total Validation */}
      <div className={`p-3 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center justify-between text-sm">
          <span className={isValid ? 'text-green-800' : 'text-yellow-800'}>
            Total Allocated:
          </span>
          <span className={`font-semibold ${isValid ? 'text-green-900' : 'text-yellow-900'}`}>
            ${totalAllocated.toFixed(2)} / ${totalAmount.toFixed(2)}
          </span>
        </div>
        {!isValid && (
          <p className="text-xs text-yellow-700 mt-1">
            {remaining > 0 
              ? `Remaining: $${remaining.toFixed(2)} (add another payment or adjust amounts)`
              : `Over-allocated: $${Math.abs(remaining).toFixed(2)} (reduce payment amounts)`}
          </p>
        )}
      </div>
    </div>
  );
}
