// src/features/sales/pages/InvoiceDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useDeleteInvoiceMutation,
  useGetInvoiceByIdQuery,
  useCreateInstallmentPlanMutation,
  usePayInstallmentMutation,
} from "../../../../services/invoiceApi";
import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import { useState } from "react";
import CreateInstallmentModal from "../../components/CreateInstallmentModal";
import { useCreateInvoiceMutation } from "../../../../services/invoiceApi";

const STATUS_COLORS: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Unpaid: "bg-red-100 text-red-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
};

const TYPE_LABELS: Record<string, string> = {
  b2c: "B2C Sales Invoice",
  b2b: "B2B Sales Invoice",
  quotation: "Quotation",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation();

  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [createInstallmentPlan, { isLoading: isCreatingPlan }] =
    useCreateInstallmentPlanMutation();
  const [payInstallment, { isLoading: isPayingInstallment }] =
    usePayInstallmentMutation();
  const [createInvoice, { isLoading: isConverting }] =
    useCreateInvoiceMutation();

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const invoiceId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, error } = useGetInvoiceByIdQuery(invoiceId, {
    skip: !invoiceId,
  });
  const invoice = data?.data;

  const handleCreateInstallmentPlan = async (installments: any[]) => {
    try {
      await createInstallmentPlan({
        id: invoiceId,
        installments: installments.map((inst) => ({
          due_date: inst.due_date,
          amount: inst.amount,
          notes: inst.notes || null,
        })),
      }).unwrap();

      setShowInstallmentModal(false);
    } catch (error) {
      console.error("Failed to create installment plan:", error);
      alert("Failed to create installment plan");
    }
  };

  const handlePayInstallment = async (installmentId: number) => {
    if (!confirm("Mark this installment as paid?")) return;

    try {
      await payInstallment({
        invoiceId,
        installmentId,
      }).unwrap();
    } catch (error) {
      console.error("Failed to mark installment as paid:", error);
      alert("Failed to mark installment as paid");
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      await deleteInvoice(invoiceId).unwrap();
      alert("invoice deleted succesfully!");
    } catch (error) {
      console.error("Failed to delete invoice", error);
      alert("failed to delete invoice ");
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm("Convert this quotation to a sales invoice?")) return;

    try {
      const payload: any = {
        invoice_type: invoice.invoice_type === "b2b" ? "b2b" : "b2c",
        source: invoice.source || "Manual",
        branch_id: invoice.branch_id,
        customer_name: invoice.customer_name,
        customer_phone: invoice.customer_phone || "",
        payment_method: "CASH",
        payment_status: "Unpaid",
        items: invoice.items?.map((item: any) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          discount_percentage: item.discount_percentage || 0,
          tax_percentage: 5,
        })),
      };

      if (invoice.invoice_type === "b2b") {
        payload.company_name = invoice.company_name;
        payload.contact_person = invoice.contact_person;
        payload.company_phone = invoice.company_phone;
        payload.company_address = invoice.company_address;
      }

      const result = await createInvoice(payload).unwrap();

      alert("Quotation converted to invoice successfully!");
      navigate(`${basePath}/sales/invoices/${result.data.id}`);
    } catch (error: any) {
      console.error("Failed to convert:", error);
      alert(error?.data?.message || "Failed to convert quotation to invoice");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-gray-500 text-sm">Loading invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-green-500 font-medium">
            Invoice Deleted Successfully
          </p>
          <button
            onClick={() => navigate(`${basePath}/sales/invoices`)}
            className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const TAX_RATE = 0.05;
  const items = invoice.items || [];
  const subtotal = items.reduce(
    (sum: number, item: any) =>
      sum + parseFloat(item.unit_price || 0) * (item.quantity || 1),
    0,
  );
  const taxAmount = subtotal * TAX_RATE;
  const grandTotal = parseFloat(invoice.grand_total || 0);

  const formattedDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : "—";

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 sm:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/sales/invoices`)}
              className="flex-shrink-0"
            >
              <img
                src={arrow_back_icon}
                alt=""
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 break-all">
                  {invoice.invoice_number}
                </h1>
                <span
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.payment_status] || "bg-gray-100 text-gray-600"}`}
                >
                  {invoice.payment_status}
                </span>
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {TYPE_LABELS[invoice.invoice_type] || invoice.invoice_type}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {invoice.payment_status === "Unpaid" && (
              <button
                onClick={() =>
                  navigate(`${basePath}/sales/edit_invoice/${invoice.id}`)
                }
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}

            {invoice.invoice_type === `quotation` && (
              <button
                onClick={handleConvertToInvoice}
                disabled={isConverting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isConverting ? "Converting..." : "Convert to Invoice"}
              </button>
            )}

            {invoice.payment_status === "Unpaid" && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Delete
              </button>
            )}

            {invoice.invoice_type === "b2b" &&
              invoice.payment_status === "Unpaid" &&
              !invoice.has_installment_plan && (
                <button
                  onClick={() => setShowInstallmentModal(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Installment Plan
                </button>
              )}

            {/* <button
              onClick={() => window.print()}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Print
            </button> */}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column — 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Invoice Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Invoice Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Invoice Number
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1 break-all">
                    {invoice.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Invoice Type
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {TYPE_LABELS[invoice.invoice_type]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Source
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {invoice.source || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Branch
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {invoice.branch?.branch_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Payment Method
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {invoice.payment_method || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Products
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({items.length} items)
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <div className="min-w-[768px] lg:min-w-full">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Tax
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item: any) => {
                          const unitPrice = parseFloat(item.unit_price || 0);
                          const qty = item.quantity || 1;
                          const itemSubtotal = unitPrice * qty;
                          const itemTax = itemSubtotal * TAX_RATE;
                          const itemTotal = itemSubtotal + itemTax;
                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {item.image_url && (
                                    <img
                                      src={item.image_url}
                                      alt={item.product_name}
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  )}
                                  <div>
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                      {item.product_name}
                                    </div>
                                    {item.variant_name && (
                                      <div className="text-xs text-gray-500">
                                        Variant: {item.variant_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {item.sku || "—"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                <span className="text-xs sm:text-sm font-medium text-gray-900">
                                  {qty}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                <span className="text-xs sm:text-sm text-gray-900">
                                  KWD {unitPrice.toFixed(3)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right hidden sm:table-cell">
                                <span className="text-xs sm:text-sm text-gray-500">
                                  KWD {itemTax.toFixed(3)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                  KWD {itemTotal.toFixed(3)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B Installments */}
            {invoice.invoice_type === "b2b" &&
              invoice.installments &&
              invoice.installments.length > 0 && (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">
                      Installment Plan
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[640px] lg:min-w-full">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {invoice.installments.map(
                            (inst: any, idx: number) => (
                              <tr key={inst.id} className="hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                                  {idx + 1}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                                  {inst.due_date
                                    ? new Date(
                                      inst.due_date,
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                    : "—"}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-medium text-gray-900">
                                  KWD {parseFloat(inst.amount || 0).toFixed(3)}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                  <span
                                    className={`inline-block px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium ${inst.status === "Paid"
                                        ? "bg-green-100 text-green-700"
                                        : inst.status === "Overdue"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                  >
                                    {inst.status}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                  {inst.status === "Pending" && (
                                    <button
                                      onClick={() =>
                                        handlePayInstallment(inst.id)
                                      }
                                      disabled={isPayingInstallment}
                                      className="px-2 sm:px-3 py-1 text-xs font-medium text-green-600 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50 whitespace-nowrap"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                  {inst.status === "Paid" && inst.paid_at && (
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                      Paid on{" "}
                                      {new Date(
                                        inst.paid_at,
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Right Column — 1/3 width on desktop */}
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {invoice.invoice_type === "b2b"
                  ? "Company Info"
                  : "Customer Info"}
              </h2>
              <div className="space-y-3">
                {invoice.invoice_type === "b2b" ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">
                        {invoice.company_name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact Person</p>
                      <p className="text-sm text-gray-900 mt-0.5 break-words">
                        {invoice.contact_person || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 mt-0.5 break-words">
                        {invoice.company_phone || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-900 mt-0.5 break-words">
                        {invoice.company_address || "—"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">
                        {invoice.customer_name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 mt-0.5 break-words">
                        {invoice.customer_phone || "—"}
                      </p>
                    </div>
                    {invoice.customer_type && (
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm text-gray-900 mt-0.5">
                          {invoice.customer_type}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {invoice.invoice_type === "quotation" && (
                  <div>
                    <p className="text-xs text-gray-500">Valid Till</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {invoice.valid_till
                        ? new Date(invoice.valid_till).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                        : "—"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Subtotal
                  </span>
                  <span className="text-gray-900 font-medium text-xs sm:text-sm">
                    KWD {subtotal.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Tax (5%)
                  </span>
                  <span className="text-gray-900 font-medium text-xs sm:text-sm">
                    KWD {taxAmount.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Discount
                  </span>
                  <span className="text-gray-900 font-medium text-xs sm:text-sm">
                    KWD {parseFloat(invoice.discount_amount || 0).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">
                    Grand Total
                  </span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    KWD {grandTotal.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Payment
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Method
                  </span>
                  <span className="text-gray-900 font-medium text-xs sm:text-sm">
                    {invoice.payment_method || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Status
                  </span>
                  <span
                    className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.payment_status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {invoice.payment_status}
                  </span>
                </div>
                {invoice.paid_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Amount Paid
                    </span>
                    <span className="text-green-600 font-medium text-xs sm:text-sm">
                      KWD {parseFloat(invoice.paid_amount).toFixed(3)}
                    </span>
                  </div>
                )}
                {invoice.remaining_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Remaining
                    </span>
                    <span className="text-red-500 font-medium text-xs sm:text-sm">
                      KWD {parseFloat(invoice.remaining_amount).toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Delete Invoice
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Are you sure you want to delete invoice {invoice.invoice_number}
                ? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInvoice}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <CreateInstallmentModal
          isOpen={showInstallmentModal}
          onClose={() => setShowInstallmentModal(false)}
          onSubmit={handleCreateInstallmentPlan}
          grandTotal={grandTotal}
          invoiceNumber={invoice.invoice_number}
          isSubmitting={isCreatingPlan}
        />
      </div>
    </DashboardLayout>
  );
}
