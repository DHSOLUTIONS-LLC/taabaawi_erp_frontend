// src/features/hr/pages/DocumentManagementPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import {
  useGetExpiringDocumentsQuery,
  useGetExpiredDocumentsQuery,
  useGetEmployeeDocumentsQuery,
  useUploadEmployeeDocumentMutation,
  useDeleteEmployeeDocumentMutation,
} from "../../../services/hrApi";
import { useGetEmployeesQuery } from "../../../services/hrApi";

import search_icon from "../../../assets/icons/search_icon.svg";
import add_icon from "../../../assets/icons/add.svg";
import delete_icon from "../../../assets/icons/delete-icon.png";
import download_icon from "../../../assets/icons/download_icon.png";
import refresh_icon from "../../../assets/icons/refresh_icon.png";
import dropdown_arrow_icon from "../../../assets/icons/dropdown_arrow_icon.svg";

type DocumentTab = "all" | "expiring" | "expired";

export default function DocumentManagementPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const [activeTab, setActiveTab] = useState<DocumentTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocForDelete, setSelectedDocForDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch data
  const { data: employeesData } = useGetEmployeesQuery();
  const { data: expiringData, refetch: refetchExpiring } =
    useGetExpiringDocumentsQuery();
  const { data: expiredData, refetch: refetchExpired } =
    useGetExpiredDocumentsQuery();
  const { data: employeeDocsData, refetch: refetchEmployeeDocs } =
    useGetEmployeeDocumentsQuery(
      selectedEmployee ? parseInt(selectedEmployee) : 0,
      { skip: !selectedEmployee || activeTab !== "all" },
    );
  const [uploadDocument, { isLoading: isUploading }] =
    useUploadEmployeeDocumentMutation();
  const [deleteDocument] = useDeleteEmployeeDocumentMutation();

  const employees = employeesData?.data?.data || employeesData?.data || [];
  const expiringDocs = expiringData?.data?.data || expiringData?.data || [];
  const expiredDocs = expiredData?.data?.data || expiredData?.data || [];
  const employeeDocs =
    employeeDocsData?.data?.data || employeeDocsData?.data || [];

  // Get documents based on active tab
  const getDocuments = () => {
    if (activeTab === "expiring") return expiringDocs;
    if (activeTab === "expired") return expiredDocs;
    if (activeTab === "all") {
      if (selectedEmployee) return employeeDocs;
      const allDocs = [...expiringDocs, ...expiredDocs];
      const uniqueDocs = allDocs.filter(
        (doc, index, self) => index === self.findIndex((d) => d.id === doc.id),
      );
      return uniqueDocs;
    }
    return [];
  };

  const documents = getDocuments();

  // Filter documents by search
  const filteredDocuments = documents.filter((doc: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.document_name?.toLowerCase().includes(query) ||
      doc.user?.name?.toLowerCase().includes(query) ||
      doc.document_type?.toLowerCase().includes(query)
    );
  });

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Contract: "bg-blue-100 text-blue-700",
      "ID Copy": "bg-gray-100 text-gray-700",
      Passport: "bg-purple-100 text-purple-700",
      "Work Permit": "bg-green-100 text-green-700",
      Visa: "bg-yellow-100 text-yellow-700",
      Certificate: "bg-indigo-100 text-indigo-700",
      Other: "bg-gray-100 text-gray-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate)
      return {
        text: "No expiry",
        color: "bg-gray-100 text-gray-600",
        daysLeft: null,
      };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24),
    );

    if (daysLeft < 0)
      return { text: "Expired", color: "bg-red-100 text-red-700", daysLeft };
    if (daysLeft <= 30)
      return {
        text: `${daysLeft} days left`,
        color: "bg-yellow-100 text-yellow-700",
        daysLeft,
      };
    return {
      text: `${daysLeft} days left`,
      color: "bg-green-100 text-green-700",
      daysLeft,
    };
  };

  const handleDelete = async (doc: any) => {
    if (
      !confirm(`Delete "${doc.document_name}"? This action cannot be undone.`)
    )
      return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id).unwrap();
      refetchExpiring();
      refetchExpired();
      if (selectedEmployee) refetchEmployeeDocs();
      alert("Document deleted successfully");
    } catch (error) {
      alert("Failed to delete document");
    } finally {
      setDeletingId(null);
      setSelectedDocForDelete(null);
    }
  };

  const handleRefresh = () => {
    refetchExpiring();
    refetchExpired();
    if (selectedEmployee) refetchEmployeeDocs();
  };

  const documentTypes = [
    { value: "", label: "All Types" },
    { value: "Contract", label: "Contract" },
    { value: "ID Copy", label: "ID Copy" },
    { value: "Passport", label: "Passport" },
    { value: "Work Permit", label: "Work Permit" },
    { value: "Visa", label: "Visa" },
    { value: "Certificate", label: "Certificate" },
    { value: "Other", label: "Other" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Document Management
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage employee contracts, IDs, passports, and other documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <img
                src={refresh_icon}
                alt=""
                className="w-4 h-4 md:w-5 md:h-5"
              />
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <img src={add_icon} alt="" className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {expiringDocs.length +
                    expiredDocs.length +
                    employeeDocs.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer transition-all ${activeTab === "expiring" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 hover:border-yellow-300"}`}
            onClick={() => setActiveTab("expiring")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {expiringDocs.length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Within 30 days</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer transition-all ${activeTab === "expired" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"}`}
            onClick={() => setActiveTab("expired")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired Documents</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {expiredDocs.length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Requires action</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Employee Filter - Only for All Documents tab */}
            {activeTab === "all" && (
              <div className="relative flex-1">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Document Type Filter */}
            <div className="relative flex-1">
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <img
                  src={search_icon}
                  alt=""
                  className="w-4 h-4 text-gray-400"
                />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by document name, employee..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedDocumentType || selectedEmployee) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDocumentType("");
                  setSelectedEmployee("");
                }}
                className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            <button
              onClick={() => {
                setActiveTab("all");
                setSelectedEmployee("");
              }}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setActiveTab("expiring")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "expiring"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "expired"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Expired
            </button>
          </nav>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No documents found</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === "all"
                  ? "Upload documents to get started"
                  : "No documents in this category"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Uploaded On
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc: any) => {
                    const expiryStatus = getExpiryStatus(doc.expiry_date);
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.document_name}
                            </p>
                            {doc.notes && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {doc.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              navigate(
                                `${basePath}/hr/employees/${doc.user_id}`,
                              )
                            }
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {doc.user?.name || `Employee #${doc.user_id}`}
                          </button>
                          <p className="text-xs text-gray-400">
                            {doc.user?.employee_id}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDocumentTypeColor(doc.document_type)}`}
                          >
                            {doc.document_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {doc.expiry_date ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${expiryStatus.color}`}
                              >
                                {expiryStatus.text}
                              </span>
                              <p className="text-xs text-gray-400">
                                Expires:{" "}
                                {new Date(doc.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No expiry date
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {doc.uploaded_by?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* <button
                              onClick={() => {
                                // Download functionality - requires backend endpoint
                                alert("Download feature coming soon");
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <img
                                src={download_icon}
                                alt=""
                                className="w-4 h-4"
                              />
                            </button> */}
                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={deletingId === doc.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === doc.id ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <img
                                  src={delete_icon}
                                  alt=""
                                  className="w-4 h-4"
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={async (formData) => {
            await uploadDocument({
              employeeId: parseInt(formData.get("user_id") as string),
              data: formData,
            }).unwrap();
            setShowUploadModal(false);
            handleRefresh();
            alert("Document uploaded successfully");
          }}
          isUploading={isUploading}
          employees={employees}
        />
      )}
    </DashboardLayout>
  );
}

// Document Upload Modal Component
interface DocumentUploadModalProps {
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
  isUploading: boolean;
  employees: any[];
}

function DocumentUploadModal({
  onClose,
  onUpload,
  isUploading,
  employees,
}: DocumentUploadModalProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [documentType, setDocumentType] = useState("Contract");
  const [documentName, setDocumentName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const documentTypes = [
    "Contract",
    "ID Copy",
    "Passport",
    "Work Permit",
    "Visa",
    "Certificate",
    "Other",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!employeeId) {
      setError("Please select an employee");
      return;
    }
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!documentName.trim()) {
      setError("Please enter document name");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", employeeId);
    formData.append("document_type", documentType);
    formData.append("document_name", documentName);
    formData.append("document", file);
    if (issueDate) formData.append("issue_date", issueDate);
    if (expiryDate) formData.append("expiry_date", expiryDate);
    if (notes) formData.append("notes", notes);

    await onUpload(formData);
    resetForm();
  };

  const resetForm = () => {
    setEmployeeId("");
    setDocumentType("Contract");
    setDocumentName("");
    setFile(null);
    setIssueDate("");
    setExpiryDate("");
    setNotes("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Employment Contract 2026"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-4 py-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG, DOC up to 10MB
              </p>
            </div>

            {/* Issue Date & Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
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
              disabled={isUploading || !employeeId || !file || !documentName}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
