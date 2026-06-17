// src/features/purchase/components/CreateSupplierModal.tsx
import { useState } from "react";
import { useCreateSupplierMutation } from "../../../../services/purchaseApi";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useGetChartOfAccountsQuery } from "../../../../services/accountingApi";

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateSupplierModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSupplierModalProps) {
  // Fetch Chart of Accounts
  const { data: accountsData, isLoading: accountsLoading } = useGetChartOfAccountsQuery({
    is_active: 1,
    per_page: 1000,
  });
  
  const accounts = accountsData?.data?.data || accountsData?.data || [];

  // Filter active accounts
  const activeAccounts = accounts.filter((acc: any) => acc.is_active === true || acc.is_active === 1);

  const [formData, setFormData] = useState({
    supplier_name: "",
    company_name: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    address: "",
    city: "",
    country: "Kuwait",
    contact_person_name: "",
    contact_person_phone: "",
    contact_person_email: "",
    tax_number: "",
    bank_name: "",
    bank_account_number: "",
    iban: "",
    credit_limit: 0,
    payment_terms_days: 30,
    default_currency: "KWD",
    rating: "Good" as "Excellent" | "Good" | "Average" | "Poor",
    is_active: true,
    notes: "",
    chart_of_account_id: "",
  });

  const [createSupplier, { isLoading }] = useCreateSupplierMutation();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate chart of account is selected
    if (!formData.chart_of_account_id) {
      alert("Please select a Chart of Account");
      return;
    }

    try {
      // Prepare payload
      const payload = {
        supplier_name: formData.supplier_name,
        company_name: formData.company_name || null,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country,
        contact_person_name: formData.contact_person_name || null,
        contact_person_phone: formData.contact_person_phone || null,
        contact_person_email: formData.contact_person_email || null,
        tax_number: formData.tax_number || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        iban: formData.iban || null,
        credit_limit: parseFloat(formData.credit_limit.toString()) || 0,
        payment_terms_days: parseInt(formData.payment_terms_days.toString()) || 30,
        default_currency: formData.default_currency,
        rating: formData.rating,
        is_active: formData.is_active ? 1 : 0,
        notes: formData.notes || null,
        chart_of_account_id: parseInt(formData.chart_of_account_id),
      };

      console.log("Create Supplier Payload:", JSON.stringify(payload, null, 2));

      await createSupplier(payload).unwrap();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Create supplier error:", err);
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || "Failed to create supplier");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-y-auto my-auto mx-3 sm:mx-4">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Add New Supplier
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Basic Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                {errors.supplier_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.supplier_name[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Chart of Account Section - SINGLE DROPDOWN */}
          <div className="space-y-3 sm:space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Chart of Account Configuration
              <span className="text-xs text-red-500 ml-2">*Required</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Select the Chart of Account for this supplier. This account will be automatically used in all Purchase Orders.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Chart of Account <span className="text-red-500">*</span>
              </label>
              <select
                name="chart_of_account_id"
                value={formData.chart_of_account_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
                disabled={accountsLoading}
              >
                <option value="">Select Chart of Account</option>
                {activeAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code} - {acc.account_name} ({acc.account_type})
                  </option>
                ))}
              </select>
              {errors.chart_of_account_id && (
                <p className="text-xs text-red-500 mt-1">{errors.chart_of_account_id[0]}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                This account will be used for all transactions with this supplier
              </p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg mt-2">
              <p className="text-xs text-yellow-700">
                <strong>📌 Note:</strong> Once selected, this Chart of Account will be automatically applied to all Purchase Orders for this supplier and cannot be changed at the PO level.
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                >
                  <option value="Kuwait">Kuwait</option>
                  <option value="UAE">UAE</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Oman">Oman</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Contact Person
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  name="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="contact_person_email"
                  value={formData.contact_person_email}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Financial Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Tax Number
                </label>
                <input
                  type="text"
                  name="tax_number"
                  value={formData.tax_number}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Bank Account
                </label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Credit Limit (KWD)
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="credit_limit"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  name="payment_terms_days"
                  value={formData.payment_terms_days}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Default Currency
                </label>
                <select
                  name="default_currency"
                  value={formData.default_currency}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                >
                  <option value="KWD">KWD - Kuwaiti Dinar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
                  Rating
                </label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
              placeholder="Additional notes about the supplier..."
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="sm:flex-1 lg:flex-none px-4 sm:px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || accountsLoading}
              className="sm:flex-1 lg:flex-none px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              {isLoading ? "Creating..." : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}