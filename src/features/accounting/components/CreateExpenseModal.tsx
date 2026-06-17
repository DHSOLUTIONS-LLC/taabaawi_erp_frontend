import { useState, useEffect } from "react";
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

  // Function to calculate next recurrence date based on period
  const calculateNextRecurrenceDate = (
    startDate: string,
    period: string,
  ): string => {
    if (!startDate) return "";

    const date = new Date(startDate);

    switch (period) {
      case "Daily":
        date.setDate(date.getDate() + 1);
        break;
      case "Weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "Monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "Quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "Yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return "";
    }

    return date.toISOString().split("T")[0];
  };

  // Auto-calculate next recurrence date when expense_date or recurring_period changes
  useEffect(() => {
    if (
      formData.is_recurring &&
      formData.expense_date &&
      formData.recurring_period
    ) {
      const nextDate = calculateNextRecurrenceDate(
        formData.expense_date,
        formData.recurring_period,
      );
      if (nextDate) {
        setFormData((prev) => ({ ...prev, next_recurrence_date: nextDate }));
      }
    }
  }, [formData.expense_date, formData.recurring_period, formData.is_recurring]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRecurringToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_recurring: checked,
      // If turning off recurring, clear the recurrence fields
      ...(checked
        ? {}
        : {
          recurring_period: "Monthly",
          next_recurrence_date: "",
        }),
    }));
  };

  const handleRecurringPeriodChange = (period: string) => {
    setFormData((prev) => ({
      ...prev,
      recurring_period: period,
      // Auto-calculate will trigger via useEffect
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.expense_category_id ||
      !formData.branch_id ||
      !formData.amount ||
      !formData.expense_date
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Additional validation for recurring expenses
    if (formData.is_recurring && !formData.next_recurrence_date) {
      setError("Next recurrence date is required for recurring expenses");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const submitData = new FormData();

      // Append all form fields
      submitData.append(
        "expense_category_id",
        String(formData.expense_category_id),
      );
      submitData.append("branch_id", String(formData.branch_id));
      submitData.append("amount", String(formData.amount));
      submitData.append("currency", formData.currency);
      submitData.append("exchange_rate", String(formData.exchange_rate));
      submitData.append("expense_date", formData.expense_date);
      submitData.append("vendor_name", formData.vendor_name || "");
      submitData.append("invoice_number", formData.invoice_number || "");
      submitData.append("payment_method", formData.payment_method);
      submitData.append("description", formData.description || "");

      // Send is_recurring as 1/0 for Laravel boolean validation
      submitData.append("is_recurring", formData.is_recurring ? "1" : "0");

      if (formData.is_recurring) {
        submitData.append("recurring_period", formData.recurring_period);
        if (formData.next_recurrence_date) {
          submitData.append(
            "next_recurrence_date",
            formData.next_recurrence_date,
          );
        }
      }

      if (receipt) {
        submitData.append("receipt", receipt);
      }

      if (isEditing) {
        await updateExpense({ id: expense.id, data: submitData }).unwrap();
      } else {
        await createExpense(submitData).unwrap();
      }

      onSuccess();
    } catch (err: any) {
      console.error("Expense submission error:", err);

      // Handle validation errors from backend
      if (err?.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat();
        setError(errorMessages.join(", "));
      } else {
        setError(err?.data?.message || "Failed to save expense");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    // Cash
    "Cash",

    // Kuwaiti Local Payment Systems
    "KNET",
    "WAMD (Instant Transfer)",
    "Mobile Payment (Kuwait Mobile)",

    // Local Kuwaiti Banks
    "NBK (National Bank of Kuwait)",
    "KFH (Kuwait Finance House)",
    "CBK (Commercial Bank of Kuwait)",
    "GIB (Gulf Bank)",
    "ABK (Ahli United Bank)",
    "Burgan Bank",
    "KIB (Kuwait International Bank)",
    "Boubyan Bank",
    "Warba Bank",
    "Al Ahli Bank of Kuwait",

    // Kuwaiti Digital Wallets
    "My KNET Mobile",
    "Tam (Boubyan Bank)",
    "WeYak (KFH)",
    "Gulf Pay (GIB)",
    "NBK Mobile Banking",
    "KFH Go",
    "CBK Mobile",

    // International Cards
    "Visa Card",
    "Mastercard",
    "American Express",
    "Debit Card",

    // Mobile Wallets
    "Apple Pay",
    "Google Pay",
    "Samsung Pay",

    // Other Methods
    "Bank Transfer",
    "Cheque",
    "Gift Card",
    "Voucher",
    "Tabby (Buy Now Pay Later)",
    "Tamara (Buy Now Pay Later)",
    "Postal Order",
    "Government Payment",
    "Corporate Account",
    "Other",
  ];


  const recurringPeriods = [
    { value: "Daily", label: "Daily", days: "+1 day" },
    { value: "Weekly", label: "Weekly", days: "+7 days" },
    { value: "Monthly", label: "Monthly", days: "+1 month" },
    { value: "Quarterly", label: "Quarterly", days: "+3 months" },
    { value: "Yearly", label: "Yearly", days: "+1 year" },
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      handleChange("payment_method", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg appearance-none bg-white pr-8 focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              {receipt && (
                <p className="text-xs text-green-600 mt-1">
                  Selected: {receipt.name}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => handleRecurringToggle(e.target.checked)}
                  className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Recurring Expense
                </label>
              </div>

              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurring Period *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.recurring_period}
                        onChange={(e) =>
                          handleRecurringPeriodChange(e.target.value)
                        }
                        className="w-full px-4 py-2 border rounded-lg appearance-none bg-white pr-8 focus:ring-2 focus:ring-blue-500"
                      >
                        {recurringPeriods.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label} ({p.days})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <img
                          src={dropdown_arrow_icon}
                          alt=""
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Recurrence Date *
                    </label>
                    <input
                      type="date"
                      value={formData.next_recurrence_date}
                      onChange={(e) =>
                        handleChange("next_recurrence_date", e.target.value)
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-calculated based on expense date and period
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Expense"
              ) : (
                "Create Expense"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
