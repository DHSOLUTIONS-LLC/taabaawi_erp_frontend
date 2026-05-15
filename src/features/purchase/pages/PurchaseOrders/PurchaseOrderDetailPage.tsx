// src/features/purchase/pages/purchase-orders/PurchaseOrderDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  useGetPurchaseOrderByIdQuery,
  useSubmitPurchaseOrderForApprovalMutation,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useMarkPurchaseOrderAsOrderedMutation,
  useCancelPurchaseOrderMutation,
  useGetSupplierPaymentsQuery,
  useDeleteSupplierPaymentMutation,
} from "../../../../services/purchaseApi";
import POStatusBadge from "../../components/POStatusBadge";
import CreatePaymentModal from "../SupplierPayments/CreatePaymentModal";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import edit_icon from "../../../../assets/icons/edit_icon.svg";
import check_icon from "../../../../assets/icons/check_icon.png";
import close_icon from "../../../../assets/icons/cross_icon.svg";
import send_icon from "../../../../assets/icons/send_icon.png";
import delete_icon from "../../../../assets/icons/delete-icon.png";
import print_icon from "../../../../assets/icons/print_icon.png";
import export_pdf_icon from "../../../../assets/icons/export_pdf.svg";

const METHOD_COLORS: Record<string, string> = {
  Cash: "bg-green-100 text-green-700",
  "Bank Transfer": "bg-blue-100 text-blue-700",
  Cheque: "bg-purple-100 text-purple-700",
  "Credit Card": "bg-orange-100 text-orange-700",
  "Online Payment": "bg-indigo-100 text-indigo-700",
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const poId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetPurchaseOrderByIdQuery(poId);
  const [submitForApproval] = useSubmitPurchaseOrderForApprovalMutation();
  const [approvePO] = useApprovePurchaseOrderMutation();
  const [rejectPO] = useRejectPurchaseOrderMutation();
  const [markOrdered] = useMarkPurchaseOrderAsOrderedMutation();
  const [cancelPO] = useCancelPurchaseOrderMutation();
  const [deletePayment] = useDeleteSupplierPaymentMutation();

  const { data: paymentsData, refetch: refetchPayments } =
    useGetSupplierPaymentsQuery({ purchase_order_id: poId }, { skip: !poId });
  const payments =
    (paymentsData as any)?.data?.data || (paymentsData as any)?.data || [];
  console.log("payments", payments);
  const po = data?.data;

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval(poId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to submit for approval");
    }
  };
  const handleApprove = async () => {
    try {
      await approvePO(poId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to approve PO");
    }
  };
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter rejection reason");
      return;
    }
    try {
      await rejectPO({ id: poId, reason: rejectReason }).unwrap();
      setShowRejectModal(false);
      setRejectReason("");
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to reject PO");
    }
  };
  const handleMarkOrdered = async () => {
    try {
      await markOrdered(poId).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to mark as ordered");
    }
  };
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter cancellation reason");
      return;
    }
    try {
      await cancelPO({ id: poId, reason: cancelReason }).unwrap();
      setShowCancelModal(false);
      setCancelReason("");
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to cancel PO");
    }
  };
  const handleDeletePayment = async (paymentId: number) => {
    if (
      !confirm(
        "Delete this payment? The payment status will update accordingly.",
      )
    )
      return;
    try {
      await deletePayment(paymentId).unwrap();
      refetch();
      refetchPayments();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to delete payment");
    }
  };

  const num = (v: any) => (typeof v === "number" ? v : parseFloat(v) || 0);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    const getProductImage = (item: any) => {
      const baseUrl =
        import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "https://erp-backend.ttexpresskw.com";
      if (item.product?.images && Array.isArray(item.product.images)) {
        const primaryImage = item.product.images.find(
          (img: any) => img.is_primary === true,
        );
        if (primaryImage?.image_path) {
          return `${baseUrl}/storage/${primaryImage.image_path}`;
        }
      }
      if (item.image_url) return item.image_url;
      return "";
    };

    const itemsHtml = po?.items
      ?.map((item: any) => {
        const imageUrl = getProductImage(item);
        const qty = item.quantity_ordered ?? item.quantity;
        const unitPrice = parseFloat(item.unit_price);
        const total = unitPrice * qty;
        return `
      <tr>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; vertical-align: middle;">
          ${imageUrl ? `<img src="${imageUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.style.display='none'" />` : "—"}
        </td>
        <td style="border: 1px solid #d1d5db; padding: 8px; vertical-align: middle;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; vertical-align: middle;">${item.sku || "—"}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; vertical-align: middle;">${qty}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; vertical-align: middle;">${po.currency} ${unitPrice.toFixed(3)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; vertical-align: middle;">${po.currency} ${total.toFixed(3)}</td>
      </tr>
    `;
      })
      .join("");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PO-${po?.po_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: white;
            padding: 20px;
          }
          .excel-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
          }
          .header h1 {
            color: #2563eb;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            color: #6b7280;
            font-size: 14px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 25px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .info-section h3 {
            font-size: 14px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #d1d5db;
          }
          .info-row {
            display: flex;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .info-label {
            width: 120px;
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            flex: 1;
            color: #111827;
          }
          .shipping-terms {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
          }
          .shipping-terms h3 {
            font-size: 13px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
          }
          .shipping-terms p {
            font-size: 12px;
            color: #78350f;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 13px;
          }
          th {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 10px 8px;
            font-weight: bold;
            color: #374151;
            text-align: center;
          }
          td {
            border: 1px solid #d1d5db;
            padding: 8px;
          }
          .totals-table {
            width: 350px;
            margin-left: auto;
            margin-bottom: 20px;
          }
          .totals-table td {
            border: none;
            padding: 6px 8px;
          }
          .totals-table tr:last-child td {
            border-top: 2px solid #d1d5db;
            font-weight: bold;
            font-size: 15px;
            color: #2563eb;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; margin: 0; }
            .shipping-terms { break-inside: avoid; }
            table { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="excel-container">
          <!-- Header -->
          <div class="header">
            <h1>PURCHASE ORDER</h1>
            <p>${po?.po_number}</p>
          </div>

          <!-- Information Grid -->
          <div class="info-grid">
            <div class="info-section">
              <h3>SUPPLIER INFORMATION</h3>
              <div class="info-row"><div class="info-label">Supplier Name:</div><div class="info-value">${po?.supplier?.supplier_name || "N/A"}</div></div>
              <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${po?.supplier?.email || "—"}</div></div>
              <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${po?.supplier?.phone || "—"}</div></div>
            </div>
            <div class="info-section">
              <h3>ORDER DETAILS</h3>
              <div class="info-row"><div class="info-label">Order Date:</div><div class="info-value">${new Date(po?.order_date).toLocaleDateString()}</div></div>
              <div class="info-row"><div class="info-label">Expected Delivery:</div><div class="info-value">${po?.expected_delivery_date ? new Date(po?.expected_delivery_date).toLocaleDateString() : "—"}</div></div>
              <div class="info-row"><div class="info-label">Status:</div><div class="info-value">${po?.status}</div></div>
              <div class="info-row"><div class="info-label">Currency:</div><div class="info-value">${po?.currency}</div></div>
            </div>
          </div>

          <!-- Shipping Terms -->
          ${
            po?.shipping_terms || po?.terms_and_conditions
              ? `
            <div class="shipping-terms">
              <h3>📦 SHIPPING TERMS & CONDITIONS</h3>
              <p>${po?.shipping_terms || po?.terms_and_conditions || "Standard shipping terms apply"}</p>
            </div>
          `
              : ""
          }

          <!-- Products Table (Excel Style) -->
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">Image</th>
                <th style="text-align: left;">Product Name</th>
                <th style="width: 120px;">SKU</th>
                <th style="width: 60px;">Qty</th>
                <th style="width: 100px;">Unit Price</th>
                <th style="width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${
                po.items?.length === 0
                  ? `
                <tr><td colspan="6" style="text-align: center; padding: 40px;">No items found</td></tr>
              `
                  : ""
              }
            </tbody>
          </table>

          <!-- Totals Section -->
          <table class="totals-table">
            <tr><td style="text-align: right;">Subtotal:</td><td style="text-align: right; width: 120px;">${po.currency} ${(po.subtotal || 0).toFixed(3)}</td></tr>
            <tr><td style="text-align: right;">Discount:</td><td style="text-align: right;">- ${po.currency} ${(po.discount_amount || 0).toFixed(3)}</td></tr>
            <tr><td style="text-align: right;">Tax:</td><td style="text-align: right;">${po.currency} ${(po.tax_amount || 0).toFixed(3)}</td></tr>
            <tr><td style="text-align: right;">Shipping Cost:</td><td style="text-align: right;">${po.currency} ${(po.shipping_cost || 0).toFixed(3)}</td></tr>
            <tr><td style="text-align: right; font-size: 14px;">GRAND TOTAL:</td><td style="text-align: right; font-size: 14px; font-weight: bold; color: #2563eb;">${po.currency} ${(po.total_amount || 0).toFixed(3)}</td></tr>
          </table>

          <!-- Additional Notes -->
          ${
            po?.notes
              ? `
            <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 12px; margin-top: 15px;">
              <h3 style="font-size: 12px; font-weight: bold; color: #166534; margin-bottom: 5px;">📝 NOTES</h3>
              <p style="font-size: 12px; color: #14532d;">${po?.notes}</p>
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | ERP System</p>
            <p>This is a computer-generated document. No signature required.</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
  };
  const handleExportPDF = async () => {
    try {
      const getProductImage = (item: any) => {
        const baseUrl =
          import.meta.env.VITE_API_URL?.replace("/api", "") ||
          "https://erp-backend.ttexpresskw.com";
        if (item.product?.images && Array.isArray(item.product.images)) {
          const primaryImage = item.product.images.find(
            (img: any) => img.is_primary === true,
          );
          if (primaryImage?.image_path) {
            return `${baseUrl}/storage/${primaryImage.image_path}`;
          }
        }
        if (item.image_url) return item.image_url;
        return "";
      };

      // Convert images to base64 for PDF
      const itemsWithImages = await Promise.all(
        (po.items || []).map(async (item: any) => {
          const imageUrl = getProductImage(item);
          let base64Image = "";
          if (imageUrl) {
            try {
              const img = new Image();
              img.crossOrigin = "Anonymous";
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  const canvas = document.createElement("canvas");
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(img, 0, 0);
                  base64Image = canvas.toDataURL("image/png");
                  resolve(base64Image);
                };
                img.onerror = reject;
                img.src = imageUrl;
              });
            } catch {
              base64Image = "";
            }
          }
          return { ...item, base64Image };
        }),
      );

      const itemsHtml = itemsWithImages
        .map((item: any) => {
          const qty = item.quantity_ordered ?? item.quantity;
          const unitPrice = parseFloat(item.unit_price);
          const total = unitPrice * qty;
          return `
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.base64Image ? `<img src="${item.base64Image}" style="width: 50px; height: 50px; object-fit: cover;" />` : "—"}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.sku || "—"}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${qty}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${po.currency} ${unitPrice.toFixed(3)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${po.currency} ${total.toFixed(3)}</td>
        </tr>
      `;
        })
        .join("");

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = `
      <div style="padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; max-width: 1200px; margin: 0 auto;">
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #2563eb;">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 5px;">PURCHASE ORDER</h1>
          <p style="color: #6b7280; font-size: 14px;">${po?.po_number}</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px; background: #f9fafb; padding: 15px; border-radius: 8px;">
          <div>
            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">SUPPLIER INFORMATION</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${po?.supplier?.supplier_name || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${po?.supplier?.email || "—"}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${po?.supplier?.phone || "—"}</p>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">ORDER DETAILS</h3>
            <p style="margin: 4px 0;"><strong>Order Date:</strong> ${new Date(po?.order_date).toLocaleDateString()}</p>
            <p style="margin: 4px 0;"><strong>Expected Delivery:</strong> ${po?.expected_delivery_date ? new Date(po?.expected_delivery_date).toLocaleDateString() : "—"}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${po?.status}</p>
            <p style="margin: 4px 0;"><strong>Currency:</strong> ${po?.currency}</p>
          </div>
        </div>

        ${
          po?.shipping_terms || po?.terms_and_conditions
            ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
            <h3 style="font-size: 13px; font-weight: bold; color: #92400e;">📦 SHIPPING TERMS & CONDITIONS</h3>
            <p style="font-size: 12px; color: #78350f;">${po?.shipping_terms || po?.terms_and_conditions}</p>
          </div>
        `
            : ""
        }

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px; width: 80px;">Image</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; width: 100px;">SKU</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; width: 60px;">Qty</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; width: 100px;">Unit Price</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <table style="width: 350px; margin-left: auto; margin-bottom: 20px;">
          <tr><td style="text-align: right; padding: 4px;">Subtotal:</td><td style="text-align: right;">${po?.currency} ${(po?.subtotal || 0).toFixed(3)}</td></tr>
          <tr><td style="text-align: right; padding: 4px;">Discount:</td><td style="text-align: right;">- ${po?.currency} ${(po?.discount_amount || 0).toFixed(3)}</td></tr>
          <tr><td style="text-align: right; padding: 4px;">Tax:</td><td style="text-align: right;">${po?.currency} ${(po?.tax_amount || 0).toFixed(3)}</td></tr>
          <tr><td style="text-align: right; padding: 4px;">Shipping:</td><td style="text-align: right;">${po?.currency} ${(po?.shipping_cost || 0).toFixed(3)}</td></tr>
          <tr style="border-top: 2px solid #d1d5db;"><td style="text-align: right; padding-top: 8px; font-weight: bold;">GRAND TOTAL:</td><td style="text-align: right; padding-top: 8px; font-weight: bold; color: #2563eb;">${po.currency} ${(po.total_amount || 0).toFixed(3)}</td></tr>
        </table>

        ${po?.notes ? `<div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 12px;"><h3 style="font-size: 12px; font-weight: bold;">📝 NOTES</h3><p style="font-size: 12px;">${po.notes}</p></div>` : ""}

        <div style="text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 15px;">
          <p>Generated on ${new Date().toLocaleString()} | ERP System</p>
        </div>
      </div>
    `;

      document.body.appendChild(tempDiv);
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });
      document.body.removeChild(tempDiv);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`PO_${po.po_number}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
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

  if (!po) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500">Purchase Order not found</p>
          <button
            onClick={() => navigate(`${basePath}/purchase/orders`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const canSubmit = po.status === "Draft";
  const canApprove = po.status === "Pending Approval";
  const canOrder = po.status === "Approved";
  const canCancel = ["Draft", "Pending Approval", "Approved"].includes(
    po.status,
  );
  const canEdit = po.status === "Draft";
  const canPay =
    ["Approved", "Ordered", "Partially Received", "Received"].includes(
      po.status,
    ) && po.payment_status !== "Paid";

  const handlePrintPR = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = po.items
      ?.map(
        (item: any) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">
        <img src="${item.image_url || ""}" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.style.display='none'" />
      </td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.product_name}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity_ordered}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${po.currency} ${parseFloat(item.unit_price).toFixed(3)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${po.currency} ${(parseFloat(item.unit_price) * item.quantity_ordered).toFixed(3)}</td>
    </tr>
  `,
      )
      .join("");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PR-${po.po_number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .section-title { font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .info-item { font-size: 12px; }
        .info-label { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">PURCHASE REQUEST / ORDER</div>
        <div class="subtitle">${po.po_number}</div>
      </div>

      <div class="info-grid">
        <div class="info-item"><span class="info-label">Supplier:</span> ${po.supplier?.supplier_name || "N/A"}</div>
        <div class="info-item"><span class="info-label">Order Date:</span> ${new Date(po.order_date).toLocaleDateString()}</div>
        <div class="info-item"><span class="info-label">Currency:</span> ${po.currency}</div>
        <div class="info-item"><span class="info-label">Exchange Rate:</span> ${po.exchange_rate || 1}</div>
        <div class="info-item"><span class="info-label">Expected Delivery:</span> ${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "N/A"}</div>
        <div class="info-item"><span class="info-label">Status:</span> ${po.status}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Image</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="total-row"><td colspan="4" style="text-align: right;">Subtotal:</td><td style="text-align: right;">${po.currency} ${po.subtotal.toFixed(3)}</td></tr>
          <tr><td colspan="4" style="text-align: right;">Discount:</td><td style="text-align: right;">- ${po.currency} ${po.discount_amount.toFixed(3)}</td></tr>
          <tr><td colspan="4" style="text-align: right;">Tax:</td><td style="text-align: right;">${po.currency} ${po.tax_amount.toFixed(3)}</td></tr>
          <tr><td colspan="4" style="text-align: right;">Shipping:</td><td style="text-align: right;">${po.currency} ${po.shipping_cost.toFixed(3)}</td></tr>
          <tr class="total-row"><td colspan="4" style="text-align: right;">GRAND TOTAL:</td><td style="text-align: right;">${po.currency} ${po.total_amount.toFixed(3)}</td></tr>
        </tfoot>
      </table>

      ${po.terms_and_conditions ? `<div class="section-title">Terms & Conditions</div><div>${po.terms_and_conditions}</div>` : ""}
      ${po.notes ? `<div class="section-title">Notes</div><div>${po.notes}</div>` : ""}

      <div class="footer">Generated on ${new Date().toLocaleString()} | ERP System</div>
    </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate(`${basePath}/purchase/orders`)}
              className="shrink-0"
            >
              <img
                src={arrow_back_icon}
                alt=""
                className="w-6 h-6 md:w-8 md:h-8"
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-all">
                  {po.po_number}
                </h1>
                <POStatusBadge status={po.status} />
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    po.payment_status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : po.payment_status === "Partially Paid"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {po.payment_status}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Created on {new Date(po.created_at).toLocaleDateString()} by{" "}
                {po.createdBy?.name}
              </p>
            </div>
          </div>

          {/* Action Buttons - Responsive grid */}
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            {canEdit && (
              <button
                onClick={() =>
                  navigate(`${basePath}/purchase/orders/edit/${po.id}`)
                }
                className="flex items-center gap-2 px-3 py-2 md:px-4 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm md:text-base"
              >
                <img src={edit_icon} alt="" className="w-4 h-4" /> Edit
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 md:px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              <img src={print_icon} alt="" className="w-4 h-4" /> Print
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 md:px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              <img src={export_pdf_icon} alt="" className="w-4 h-4" /> Export
              PDF
            </button>
            {/* <button
          onClick={handlePrintPR}
          className="flex items-center gap-2 px-3 py-2 md:px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print PR
        </button> */}

            {canPay && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-3 py-2 md:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Record Payment
              </button>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmitForApproval}
                className="flex items-center gap-2 px-3 py-2 md:px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm md:text-base cursor-pointer"
              >
                <img src={send_icon} alt="" className="w-4 h-4" />
                Submit for Approval
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-3 py-2 md:px-4 border-1 border-green-600 text-green-600 rounded-lg hover:bg-green-700 hover:text-white transition-colors text-sm md:text-base cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-2 px-3 py-2 md:px-4 border-1 border-red-600 text-red-600 rounded-lg hover:bg-red-700 hover:text-white transition-colors text-sm md:text-base cursor-pointer"
                >
                  Reject
                </button>
              </>
            )}
            {canOrder && (
              <button
                onClick={handleMarkOrdered}
                className="flex items-center gap-2 px-3 py-2 md:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base cursor-pointer"
              >
                Mark as Ordered
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-3 py-2 md:px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base cursor-pointer"
              >
                Cancel PO
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left (2/3 on desktop, full width on mobile) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Items - Responsive Table */}
            <div className="bg-white rounded-xl p-4 md:p-6 overflow-x-auto">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Items
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Product
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                          Qty
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Unit Price
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Discount
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Tax
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {po.items?.map((item: any) => {
                        const qty = num(item.quantity_ordered ?? item.quantity);
                        const price = num(item.unit_price);
                        const disc = num(item.discount_amount);
                        const tax = num(item.tax_amount);
                        const rowTotal = qty * price - disc + tax;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {item.product_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.sku}
                              </div>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-center text-sm">
                              {qty}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm">
                              {po.currency} {price.toFixed(3)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm text-red-600">
                              {po.currency} {disc.toFixed(3)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm">
                              {po.currency} {tax.toFixed(3)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm font-semibold">
                              {po.currency} {rowTotal.toFixed(3)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payment History - Responsive */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Payment History
                  {payments.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({payments.length})
                    </span>
                  )}
                </h2>
                {canPay && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="text-sm text-green-600 hover:underline font-medium text-left sm:text-right"
                  >
                    + Record Payment
                  </button>
                )}
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400 text-sm">
                    No payments recorded yet
                  </p>
                  {canPay && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="mt-2 text-sm text-green-600 hover:underline"
                    >
                      Record first payment
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                  <div className="xl:col-span-4 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Payment #
                          </th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Date
                          </th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Method
                          </th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                            Reference
                          </th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                            Amount
                          </th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                            Del
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <button
                                onClick={() =>
                                  navigate(
                                    `${basePath}/purchase/payments/${payment.id}`,
                                  )
                                }
                                className="text-sm font-medium text-blue-600 hover:underline break-words text-left"
                              >
                                {payment.payment_number}
                              </button>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-sm text-gray-700 whitespace-nowrap">
                              {new Date(
                                payment.payment_date,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${METHOD_COLORS[payment.payment_method] ?? "bg-gray-100 text-gray-700"}`}
                              >
                                {payment.payment_method}
                              </span>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-sm text-gray-500 break-words">
                              {payment.reference_number ?? "N/A"}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm font-semibold text-green-700 whitespace-nowrap">
                              {payment.currency}{" "}
                              {num(payment.amount).toFixed(3)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <img
                                  src={delete_icon}
                                  alt="Delete"
                                  className="w-4 h-4"
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {po.internal_notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6">
                <h2 className="text-base font-semibold text-yellow-800 mb-2">
                  Internal Notes
                </h2>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap break-words">
                  {po.internal_notes}
                </p>
              </div>
            )}
          </div>

          {/* Right (1/3 on desktop, full width on mobile) */}
          <div className="space-y-4 md:space-y-6">
            {/* Supplier */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Supplier
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <button
                    onClick={() =>
                      navigate(
                        `${basePath}/purchase/suppliers/${po.supplier_id}`,
                      )
                    }
                    className="text-sm font-medium text-blue-600 hover:underline break-words text-left"
                  >
                    {po.supplier?.supplier_name}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 break-words">
                    {po.supplier?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900 break-words">
                    {po.supplier?.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm flex-wrap gap-2">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium break-words">
                    {po.currency} {num(po.subtotal).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm flex-wrap gap-2">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-red-600 break-words">
                    - {po.currency} {num(po.discount_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm flex-wrap gap-2">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium break-words">
                    {po.currency} {num(po.tax_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm flex-wrap gap-2">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium break-words">
                    {po.currency} {num(po.shipping_cost).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 flex-wrap gap-2">
                  <span className="text-sm font-semibold">Grand Total</span>
                  <span className="text-base md:text-lg font-bold text-blue-600 break-words">
                    {po.currency} {num(po.total_amount).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 flex-wrap gap-2">
                  <span>KWD Equivalent</span>
                  <span>KWD {num(po.total_amount_kwd).toFixed(3)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm flex-wrap gap-2">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium text-green-600 break-words">
                      {po.currency} {num(po.total_paid).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm flex-wrap gap-2">
                    <span className="text-gray-500">Outstanding</span>
                    <span
                      className={`font-semibold break-words ${num(po.outstanding_amount) > 0 ? "text-orange-600" : "text-green-600"}`}
                    >
                      {po.currency} {num(po.outstanding_amount).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl p-4 md:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Dates
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Order Date</span>
                  <span className="text-sm break-words">
                    {new Date(po.order_date).toLocaleDateString()}
                  </span>
                </div>
                {po.expected_delivery_date && (
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500">
                      Expected Delivery
                    </span>
                    <span className="text-sm break-words">
                      {new Date(po.expected_delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {po.actual_delivery_date && (
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500">
                      Actual Delivery
                    </span>
                    <span className="text-sm break-words">
                      {new Date(po.actual_delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {po.approvedBy && (
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Approved By</span>
                    <span className="text-sm break-words">
                      {po.approvedBy?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {po.terms_and_conditions && (
              <div className="bg-white rounded-xl p-4 md:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Terms & Conditions
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {po.terms_and_conditions}
                </p>
              </div>
            )}
            {po.notes && (
              <div className="bg-white rounded-xl p-4 md:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Notes
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {po.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Reject Purchase Order
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Cancel Purchase Order
            </h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-gray-500"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel PO
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && po && (
        <CreatePaymentModal
          po={po}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            refetch();
            refetchPayments();
          }}
        />
      )}
    </DashboardLayout>
  );
}
