// src/features/accounting/pages/ExpenseCategoriesPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import {
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
} from "../../../../services/accountingApi";

import add_icon from "../../../../assets/icons/add.svg";
import edit_icon from "../../../../assets/icons/edit_icon.svg";
import delete_icon from "../../../../assets/icons/delete-icon.png";
import refresh_icon from "../../../../assets/icons/refresh_icon.png";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  category?: any;
  isEditing?: boolean;
}

function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  isEditing,
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState(
    category?.category_name || "",
  );
  const [categoryCode, setCategoryCode] = useState(
    category?.category_code || "",
  );
  const [description, setDescription] = useState(category?.description || "");
  const [isActive, setIsActive] = useState(category?.is_active !== false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!categoryName.trim() || !categoryCode.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    onSave({
      category_name: categoryName,
      category_code: categoryCode,
      description,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Category" : "New Category"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tea, Water, Cleaning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Code *
              </label>
              <input
                type="text"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., TEA, WTR, CLN"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label className="text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseCategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetExpenseCategoriesQuery({});
  const [createCategory] = useCreateExpenseCategoryMutation();
  const [updateCategory] = useUpdateExpenseCategoryMutation();
  const [deleteCategory] = useDeleteExpenseCategoryMutation();

  const categories = data?.data || [];

  const handleCreate = async (formData: any) => {
    await createCategory(formData).unwrap();
    setShowModal(false);
    refetch();
  };

  const handleUpdate = async (formData: any) => {
    await updateCategory({ id: editingCategory.id, data: formData }).unwrap();
    setEditingCategory(null);
    setShowModal(false);
    refetch();
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        "Delete this category? Expenses with this category will not be deleted.",
      )
    ) {
      setDeletingId(id);
      await deleteCategory(id).unwrap();
      refetch();
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Expense Categories
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage categories for tea, water, cleaning, stationery, and other
              expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <img src={refresh_icon} alt="" className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <img src={add_icon} alt="" className="w-4 h-4" />
              New Category
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No expense categories found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono">
                        {cat.category_code}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {cat.category_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {cat.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${cat.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {cat.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <img src={edit_icon} alt="" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            disabled={deletingId === cat.id}
                            className="text-red-600 hover:text-red-800"
                          >
                            <img src={delete_icon} alt="" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <CategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
        }}
        onSave={editingCategory ? handleUpdate : handleCreate}
        category={editingCategory}
        isEditing={!!editingCategory}
      />
    </DashboardLayout>
  );
}
