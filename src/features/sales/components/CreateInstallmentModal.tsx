// src/features/sales/components/CreateInstallmentModal.tsx
import { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface InstallmentItem {
    due_date: string;
    amount: number;
    notes: string;
}

interface CreateInstallmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (installments: InstallmentItem[]) => void;
    grandTotal: number;
    invoiceNumber: string;
    isSubmitting?: boolean;
}

export default function CreateInstallmentModal({
    isOpen,
    onClose,
    onSubmit,
    grandTotal,
    invoiceNumber,
    isSubmitting = false
}: CreateInstallmentModalProps) {
    const [installments, setInstallments] = useState<InstallmentItem[]>([
        { due_date: '', amount: 0, notes: '' }
    ])

    const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0)
    const remainingAmount = grandTotal - totalAmount
    const isValid = totalAmount === grandTotal && installments.every(i => i.due_date && i.amount > 0)

    const addInstallment = () => {
        setInstallments([...installments, { due_date: '', amount: 0, notes: '' }]);
    }

    const removeInstallment = (index: number) => {
        if (installments.length > 1) {
            setInstallments(installments.filter((_, i) => i !== index))
        }
    }


    const updateInstallment = (index: number, field: keyof InstallmentItem, value: string | number) => {
        const updated = [...installments];
        updated[index] = { ...updated[index], [field]: value };
        setInstallments(updated)
    }

    const handleSubmit = () => {
        if (isValid) {
            onSubmit(installments)
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create Installment Plan</h2>
                        <p className="text-sm text-gray-500 mt-1">Invoice {invoiceNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-blue-600 uppercase tracking-wide">Grand Total</p>
                                <p className="text-xl font-bold text-blue-700">KWD {grandTotal.toFixed(3)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 uppercase tracking-wide">Remaining to Allocate</p>
                                <p className={`text-xl font-bold ${remainingAmount === 0 ? 'text-green-600' : 'text-orange-500'}`}>
                                    KWD {remainingAmount.toFixed(3)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Installments List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Installments</h3>
                            <button
                                onClick={addInstallment}
                                disabled={remainingAmount <= 0}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Installment
                            </button>
                        </div>

                        {installments.map((inst, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Installment #{index + 1}</span>
                                    {installments.length > 1 && (
                                        <button
                                            onClick={() => removeInstallment(index)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={inst.due_date}
                                            onChange={(e) => updateInstallment(index, 'due_date', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Amount (KWD)</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.001"
                                            max={grandTotal}
                                            value={inst.amount || ''}
                                            onChange={(e) => updateInstallment(index, 'amount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Notes (Optional)</label>
                                    <input
                                        type="text"
                                        value={inst.notes}
                                        onChange={(e) => updateInstallment(index, 'notes', e.target.value)}
                                        placeholder="e.g., First payment, Down payment..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Validation Message */}
                    {remainingAmount !== 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-700">
                                Total installment amount ({totalAmount.toFixed(3)}) must equal grand total ({grandTotal.toFixed(3)})
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Installment Plan'}
                    </button>
                </div>
            </div>
        </div>
    );
};