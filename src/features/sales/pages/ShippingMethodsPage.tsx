// src/features/sales/pages/ShippingMethodsPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  useGetShippingMethodsQuery,
  useCreateShippingMethodMutation,
  useUpdateShippingMethodMutation,
  useDeleteShippingMethodMutation,
} from "../../../services/salesApi";
import type { ShippingMethod } from "../../../types/sales";

import search_icon from "../../../assets/icons/search_icon.svg";

const emptyForm = {
  method_name: "",
  provider: "",
  description: "",
  base_cost: "",
  cost_per_kg: "0",
  estimated_days_min: "",
  estimated_days_max: "",
  is_active: true,
};

export default function ShippingMethodsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);

  const { data: methodsResponse, isLoading } = useGetShippingMethodsQuery({
    search: search || undefined,
  });
  const [createMethod, { isLoading: isCreating }] =
    useCreateShippingMethodMutation();
  const [updateMethod, { isLoading: isUpdating }] =
    useUpdateShippingMethodMutation();
  const [deleteMethod] = useDeleteShippingMethodMutation();

  const methods: ShippingMethod[] =
    methodsResponse?.data?.data || methodsResponse?.data || [];

  const openCreate = () => {
    setEditingMethod(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (method: ShippingMethod) => {
    setEditingMethod(method);
    setForm({
      method_name: method.method_name,
      provider: method.provider || "",
      description: method.description || "",
      base_cost: method.base_cost.toString(),
      cost_per_kg: method.cost_per_kg.toString(),
      estimated_days_min: method.estimated_days_min?.toString() || "",
      estimated_days_max: method.estimated_days_max?.toString() || "",
      is_active: method.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.method_name || !form.base_cost) {
      alert("Method name and base cost are required");
      return;
    }
    const payload = {
      method_name: form.method_name,
      provider: form.provider || undefined,
      description: form.description || undefined,
      base_cost: parseFloat(form.base_cost),
      cost_per_kg: parseFloat(form.cost_per_kg) || 0,
      estimated_days_min: form.estimated_days_min
        ? parseInt(form.estimated_days_min)
        : undefined,
      estimated_days_max: form.estimated_days_max
        ? parseInt(form.estimated_days_max)
        : undefined,
      is_active: form.is_active,
    };
    try {
      if (editingMethod) {
        await updateMethod({ id: editingMethod.id, data: payload }).unwrap();
      } else {
        await createMethod(payload).unwrap();
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err?.data?.message || "Failed to save shipping method");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this shipping method?")) return;
    try {
      await deleteMethod(id).unwrap();
    } catch (err: any) {
      alert(
        err?.data?.message ||
        "Failed to delete. It may be used in existing orders.",
      );
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    try {
      await updateMethod({
        id: method.id,
        data: { is_active: !method.is_active },
      }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center justify-between gap-3 sm:gap-4 lg:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Shipping Methods
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Manage shipping options for orders
            </p>
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3
     bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm sm:text-base">Add Method</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <div className="relative w-full sm:w-80 md:w-96 lg:w-80 xl:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <img
                src={search_icon}
                alt=""
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shipping methods..."
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {/* Table */}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          <div className="xl:col-span-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Method",
                    "Provider",
                    "Base Cost",
                    "Per KG",
                    "Est. Delivery",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-[#37638F] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : methods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      No shipping methods found.
                    </td>
                  </tr>
                ) : (
                  methods.map((method) => (
                    <tr
                      key={method.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {method.method_name}
                        </div>
                        {method.description && (
                          <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                            {method.description}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {method.provider || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        KWD {parseFloat(method.base_cost as any).toFixed(3)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        KWD {parseFloat(method.cost_per_kg as any).toFixed(3)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {method.estimated_days_min && method.estimated_days_max
                          ? `${method.estimated_days_min}–${method.estimated_days_max} days`
                          : method.estimated_delivery_text || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(method)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${method.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${method.is_active ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(method)}
                            className="px-3 py-1.5 text-xs bg-[#1773CF] text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(method.id)}
                            className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 bg-black/50">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden mx-2 sm:mx-0">
            {/* Header */}
            <div className=" px-4 sm:px-6 py-4 sm:py-5">
              <h2 className="text-base sm:text-lg font-bold text-black">
                {editingMethod ? "Edit Shipping Method" : "New Shipping Method"}
              </h2>
            </div>

            {/* Form Body */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {/* Method Name */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Method Name *
                </label>
                <input
                  value={form.method_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, method_name: e.target.value }))
                  }
                  placeholder="e.g. Standard Delivery"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Provider */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Provider
                </label>
                <input
                  value={form.provider}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, provider: e.target.value }))
                  }
                  placeholder="e.g. Aramex, DHL"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Short description"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cost Fields - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                    Base Cost (KWD) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.base_cost}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, base_cost: e.target.value }))
                    }
                    placeholder="0.000"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                    Cost per KG (KWD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.cost_per_kg}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cost_per_kg: e.target.value }))
                    }
                    placeholder="0.000"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Estimated Days - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                    Min Days
                  </label>
                  <input
                    type="number"
                    value={form.estimated_days_min}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimated_days_min: e.target.value,
                      }))
                    }
                    placeholder="1"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                    Max Days
                  </label>
                  <input
                    type="number"
                    value={form.estimated_days_max}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimated_days_max: e.target.value,
                      }))
                    }
                    placeholder="5"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() =>
                    setForm((f) => ({ ...f, is_active: !f.is_active }))
                  }
                  className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${form.is_active
                        ? "translate-x-5 sm:translate-x-6"
                        : "translate-x-1"
                      }`}
                  />
                </button>
                <span className="text-xs sm:text-sm text-gray-700">
                  {form.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-300 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:flex-1 py-2 sm:py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating}
                className="w-full sm:flex-1 py-2 sm:py-2.5 bg-[#1773CF] text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingMethod
                    ? "Update Method"
                    : "Create Method"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
