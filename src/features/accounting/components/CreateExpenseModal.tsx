// src/features/accounting/components/CreateExpenseModal.tsx
import { useState } from "react";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from "../../../services/accountingApi";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";

interface CreateExpenseModalProps {
  onClose: () => void;
  onSuccess: () => void;
  expense?: any;
  categories: any[];
  branches: any[];
}

export default function CreateExpenseModal({
  onClose,
  onSuccess,
  expense,
  categories,
  branches,
}: CreateExpenseModalProps) {
  const isEditing = !!expense;
  const [formData, setFormData] = useState({
    expense_category_id: expense?.expense_category_id || "",
    branch_id: expense?.branch_id || "",
    amount: expense?.amount || "",
    currency: expense?.currency || "KWD",
    exchange_rate: expense?.exchange_rate || 1,
    expense_date:
      expense?.expense_date?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    vendor_name: expense?.vendor_name || "",
    invoice_number: expense?.invoice_number || "",
    payment_method: expense?.payment_method || "Cash",
    description: expense?.description || "",
    is_recurring: expense?.is_recurring || false,
    recurring_period: expense?.recurring_period || "Monthly",
    next_recurrence_date: expense?.next_recurrence_date?.split("T")[0] || "",
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();

  const handleChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setReceipt(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (
      !formData.expense_category_id ||
      !formData.branch_id ||
      !formData.amount ||
      !formData.expense_date
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, val]) =>
        submitData.append(key, String(val)),
      );
      if (receipt) submitData.append("receipt", receipt);
      if (isEditing)
        await updateExpense({ id: expense.id, data: submitData }).unwrap();
      else await createExpense(submitData).unwrap();
      onSuccess();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = ["Cash", "Bank Transfer", "Card", "Cheque", "Other"];
  const recurringPeriods = [
    "Daily",
    "Weekly",
    "Monthly",
    "Quarterly",
    "Yearly",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Expense" : "New Expense"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.expense_category_id}
                  onChange={(e) =>
                    handleChange("expense_category_id", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => handleChange("branch_id", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="KWD"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Rate
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.exchange_rate}
                  onChange={(e) =>
                    handleChange("exchange_rate", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Date *
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleChange("expense_date", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="relative">
  <select
    value={formData.payment_method}
    onChange={(e) => handleChange('payment_method', e.target.value)}
    className="w-full px-4 py-2 border rounded-lg appearance-none bg-white pr-8"
  >
    {paymentMethods.map(m => (<option key={m} value={m}>{m}</option>))}
  </select>
  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
    <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
  </div>
</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => handleChange("vendor_name", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) =>
                    handleChange("invoice_number", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Invoice #"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Expense description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, PDF up to 2MB
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) =>
                    handleChange("is_recurring", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Recurring Expense
                </label>
              </div>
              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurring Period
                    </label>
                    <select
                      value={formData.recurring_period}
                      onChange={(e) =>
                        handleChange("recurring_period", e.target.value)
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {recurringPeriods.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Recurrence
                    </label>
                    <input
                      type="date"
                      value={formData.next_recurrence_date}
                      onChange={(e) =>
                        handleChange("next_recurrence_date", e.target.value)
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
