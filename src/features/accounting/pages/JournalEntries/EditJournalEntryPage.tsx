// src/features/accounting/pages/journal-entries/EditJournalEntryPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useGetJournalEntryByIdQuery,
  useUpdateJournalEntryMutation,
} from "../../../../services/accountingApi";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";

export default function EditJournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    entry_date: "",
    description: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const journalId = id ? parseInt(id, 10) : 0;
  const { data, isLoading } = useGetJournalEntryByIdQuery(journalId);
  const [updateJournal, { isLoading: isUpdating }] =
    useUpdateJournalEntryMutation();

  const journal = (data as any)?.data;

  useEffect(() => {
    if (journal) {
      setFormData({
        entry_date: journal.entry_date.split("T")[0],
        description: journal.description,
        notes: journal.notes || "",
      });
    }
  }, [journal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateJournal({
        id: journalId,
        data: formData,
      }).unwrap();
      navigate(`${basePath}/accounting/journal-entries/${journalId}`);
    } catch (err: any) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || "Failed to update journal entry");
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!journal) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 px-4">
          <p className="text-red-500 font-medium">Journal entry not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/journal-entries`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Journal Entries
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (journal.status !== "Draft") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
          <p className="text-red-500 font-medium">
            Only draft entries can be edited
          </p>
          <button
            onClick={() =>
              navigate(`${basePath}/accounting/journal-entries/${journalId}`)
            }
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Journal Entry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-4 sm:space-y-6 ">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() =>
              navigate(`${basePath}/accounting/journal-entries/${journalId}`)
            }
            className="flex-shrink-0 mt-1"
          >
            <img
              src={arrow_back_icon}
              alt=""
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Edit Journal Entry
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 break-words">
              {journal.journal_number}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="entry_date"
                value={formData.entry_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
              {errors.entry_date && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.entry_date[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.description[0]}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() =>
                navigate(`${basePath}/accounting/journal-entries/${journalId}`)
              }
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isUpdating && (
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {isUpdating ? "Updating..." : "Update Entry"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
