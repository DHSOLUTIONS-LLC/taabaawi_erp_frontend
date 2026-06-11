// src/features/sales/pages/OrderDetailPage.tsx
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useGetChartOfAccountsQuery } from "../../../../services/accountingApi";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";
import { useRecordARReceiptMutation } from '../../../../services/accountingApi';

import {
  useGetOrderByIdQuery,
  useConfirmOrderMutation,
  useProcessOrderMutation,
  usePackOrderMutation,
  useShipOrderMutation,
  useDeliverOrderMutation,
  useCancelOrderMutation,
  useReturnOrderMutation,
  useMarkOrderAsPaidMutation,
  useGetOrderStatusHistoryQuery,
  useRecordSalePaymentMutation,
} from "../../../../services/salesApi";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import print_icon from "../../../../assets/icons/print_svg.png";
import export_pdf_icon from "../../../../assets/icons/export_pdf.svg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Processing: "bg-indigo-100 text-indigo-800",
  Packed: "bg-purple-100 text-purple-800",
  Shipped: "bg-cyan-100 text-cyan-800",
  "Out for Delivery": "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Returned: "bg-gray-100 text-gray-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  "Partially Paid": "bg-blue-100 text-blue-700",
  Refunded: "bg-purple-100 text-purple-700",
  Failed: "bg-red-100 text-red-700",
};

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Credit Card", "Online Payment"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = parseInt(id!);
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"details" | "items" | "history">(
    "details",
  );

  // Action modals
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingProvider, setShippingProvider] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");


  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const { data: accountsData } = useGetChartOfAccountsQuery({
    is_active: 1 as any,
    per_page: 1000,
  });

  const accounts = accountsData?.data?.data || accountsData?.data || [];
  const paymentAccounts = accounts.filter((account: any) =>
    account.account_type === 'Asset' && account.is_active === true
  );


const [recordPayment, { isLoading: isRecordingPayment }] = useRecordARReceiptMutation();

  const { data: orderResponse, isLoading } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });
  const { data: historyResponse } = useGetOrderStatusHistoryQuery(orderId, {
    skip: !orderId,
  });

  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [processOrder, { isLoading: isProcessing }] = useProcessOrderMutation();
  const [packOrder, { isLoading: isPacking }] = usePackOrderMutation();
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation();
  const [deliverOrder, { isLoading: isDelivering }] = useDeliverOrderMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [returnOrder, { isLoading: isReturning }] = useReturnOrderMutation();
  const [markAsPaid, { isLoading: isMarkingPaid }] =
    useMarkOrderAsPaidMutation();

  const order = orderResponse?.data;
  console.log("Order items:", order?.items);

  const history = historyResponse?.data || [];

  const handleAction = async (action: () => Promise<any>, errorMsg: string) => {
    try {
      await action();
    } catch (err: any) {
      alert(err?.data?.message || errorMsg);
    }
  };

  const handleShip = async () => {
    if (!trackingNumber.trim() || !shippingProvider.trim()) {
      alert("Please enter tracking number and shipping provider");
      return;
    }
    try {
      await shipOrder({
        id: orderId,
        tracking_number: trackingNumber,
        shipping_provider: shippingProvider,
      }).unwrap();
      setShowShipModal(false);
      setTrackingNumber("");
      setShippingProvider("");
    } catch (err: any) {
      alert(err?.data?.message || "Failed to ship order");
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter cancellation reason");
      return;
    }
    try {
      await cancelOrder({ id: orderId, reason: cancelReason }).unwrap();
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err: any) {
      alert(err?.data?.message || "Failed to cancel order");
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      alert("Please enter return reason");
      return;
    }
    try {
      await returnOrder({ id: orderId, reason: returnReason }).unwrap();
      setShowReturnModal(false);
      setReturnReason("");
    } catch (err: any) {
      alert(err?.data?.message || "Failed to return order");
    }
  };

const handleRecordPayment = async () => {
  const amount = parseFloat(paymentAmount);
  
  if (!amount || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const outstanding = order.total_amount - (order.total_paid || 0);
  if (amount > outstanding) {
    alert(`Amount cannot exceed outstanding balance (${outstanding.toFixed(3)})`);
    return;
  }

  if (!paymentMethod) {
    alert("Please select a payment method");
    return;
  }

  if (!selectedAccountId) {
    alert("Please select a receipt account");
    return;
  }

  try {
    // Call AR receipt API with same format as Accounts Receivable
    await recordPayment({ 
      id: orderId, 
      receipt_amount: amount,
      receipt_account_id: parseInt(selectedAccountId),
      payment_method: paymentMethod,
      reference_number: paymentReference || undefined,
    }).unwrap();

    setShowPaymentModal(false);
    setPaymentAmount("");
    setPaymentMethod("");
    setSelectedAccountId("");
    setPaymentReference("");

    refetch();
    alert("Payment recorded successfully!");
  } catch (err: any) {
    console.error("Payment error:", err);
    alert(err?.data?.message || "Failed to record payment");
  }
};

  const getProductImage = (item: any) => {
    const primaryImage = item.product?.images?.find(
      (img: any) => img.is_primary,
    );
    if (primaryImage?.image_path) {
      const baseUrl =
        import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "https://erp.petlovekw.com/public";
      return `${baseUrl}/storage/${primaryImage.image_path}`;
    }
    return "https://via.placeholder.com/80?text=No+Image";
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `Invoice_${order?.order_number || "order"}`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${order?.order_number || ""}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .header h1 {
              margin: 0;
              color: #1773CF;
            }
            .order-info {
              margin-bottom: 20px;
            }
            .order-info table {
              width: 100%;
              border-collapse: collapse;
            }
            .order-info td {
              padding: 5px;
              vertical-align: top;
            }
            .order-info td:first-child {
              font-weight: bold;
              width: 120px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .items-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .totals table {
              width: 300px;
              margin-left: auto;
              border-collapse: collapse;
            }
            .totals td {
              padding: 5px;
            }
            .totals .grand-total {
              font-weight: bold;
              font-size: 16px;
              color: #1773CF;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>ORDER INVOICE</h1>
              <p>${order?.order_number || ""}</p>
            </div>
            
            <div class="order-info">
              <table>
                <tr><td>Order Date:</td><td>${new Date(
      order?.created_at || new Date(),
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}</td></tr>
                <tr><td>Status:</td><td>${order?.order_status || ""}</td></tr>
                <tr><td>Payment Status:</td><td>${order?.payment_status || ""}</td></tr>
                <tr><td>Payment Method:</td><td>${order?.payment_method || ""}</td></tr>
                <tr><td>Channel:</td><td>${order?.channel || ""}</td></tr>
              </table>
            </div>

            <div class="order-info">
              <h3>Customer Information</h3>
              <table>
                <tr><td>Name:</td><td>${order?.customer_name || ""}</td></tr>
                <tr><td>Email:</td><td>${order?.customer_email || ""}</td></tr>
                <tr><td>Phone:</td><td>${order?.customer_phone || ""}</td></tr>
              </table>
            </div>

            <div class="order-info">
              <h3>Shipping Information</h3>
              <table>
                <tr><td>Address:</td><td>${order?.shipping_address || ""}</td></tr>
                <tr><td>City:</td><td>${order?.shipping_city || "—"}</td></tr>
                <tr><td>Country:</td><td>${order?.shipping_country || ""}</td></tr>
                <tr><td>Tracking:</td><td>${order?.tracking_number || "—"}</td></tr>
              </table>
            </div>

            <h3>Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${(order?.items || [])
        .map(
          (item: any) => `
                  <tr>
                  <td class="border border-gray-300 p-2">
  <div class="flex items-center gap-2">
   <img src="${getProductImage(item)}" alt="${item.product_name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.src='fallback-image-url'" />
  </div>
</td>
                    <td>${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td>
                    <td>${item.sku || "—"}</td>
                    <td>${item.quantity}</td>
                    <td>KWD ${parseFloat(item.unit_price).toFixed(3)}</td>
                    <td>KWD ${parseFloat(item.discount_amount).toFixed(3)}</td>
                    <td>KWD ${parseFloat(item.total).toFixed(3)}</td>
                  </tr>
                `,
        )
        .join("") || ""
      }
              </tbody>
            </table>

            <div class="totals">
              <table>
                <tr><td>Subtotal:</td><td>KWD ${Number(order?.subtotal).toFixed(3)}</td></tr>
                ${(order?.discount_amount || 0) > 0 ? `<tr><td>Discount:</td><td>-KWD ${Number(order?.discount_amount).toFixed(3)}</td></tr>` : ""}
                ${(order?.discount_amount || 0) > 0 ? `<tr><td>Coupon:</td><td>-KWD ${Number(order?.coupon_discount).toFixed(3)}</td></tr>` : ""}
                <tr><td>Tax:</td><td>KWD ${Number(order?.tax_amount).toFixed(3)}</td></tr>
                <tr><td>Shipping:</td><td>KWD ${Number(order?.shipping_fee).toFixed(3)}</td></tr>
                <tr class="grand-total"><td>Total:</td><td>KWD ${Number(order?.total_amount).toFixed(3)}</td></tr>
              </table>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
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
    document.title = originalTitle;
  };

  const handleExportPDF = async () => {
    try {
      // Create a temporary div with the invoice content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1773CF; margin: 0;">ORDER INVOICE</h1>
          <p style="color: #666;">${order?.order_number || ""}</p>
        </div>

        <!-- Order Info -->
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="font-weight: bold; width: 120px; padding: 4px;">Order Date:</td><td>${new Date(order?.created_at || new Date()).toLocaleDateString()}</td></tr>
            <tr><td style="font-weight: bold; width: 120px; padding: 4px;">Status:</td><td>${order?.order_status || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px; padding: 4px;">Payment Status:</td><td>${order?.payment_status || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px; padding: 4px;">Payment Method:</td><td>${order?.payment_method || ""}</td></tr>
          </table>
        </div>

        <!-- Customer Info -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0;">Customer Information</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="font-weight: bold; width: 120px;">Name:</td><td>${order?.customer_name || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px;">Email:</td><td>${order?.customer_email || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px;">Phone:</td><td>${order?.customer_phone || ""}</td></tr>
          </table>
        </div>

        <!-- Shipping Info -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0;">Shipping Information</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="font-weight: bold; width: 120px;">Address:</td><td>${order?.shipping_address || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px;">City:</td><td>${order?.shipping_city || "—"}</td></tr>
            <tr><td style="font-weight: bold; width: 120px;">Country:</td><td>${order?.shipping_country || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px;">Tracking #:</td><td>${order?.tracking_number || ""}</td></tr>
            <tr><td style="font-weight: bold; width: 120px;">Provider:</td><td>${order?.shipping_provider || ""}</td></tr>
          </table>
        </div>

        <!-- Items Table -->
        <h3 style="margin: 20px 0 10px 0;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Image</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">SKU</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order?.items
          ?.map(
            (item: any) => `
              <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <img src="${getProductImage(item)}" alt="${item.product_name}" 
     style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" 
     crossorigin="anonymous"
     onerror="this.style.display='none'" />
  </div>
</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.sku || "—"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">KWD ${parseFloat(item.unit_price).toFixed(3)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">KWD ${parseFloat(item.total).toFixed(3)}</td>
              </tr>
            `,
          )
          .join("") || ""
        }
          </tbody>
        </table>

        <!-- Totals -->
        <div style="text-align: right; margin-top: 20px;">
          <table style="width: 250px; margin-left: auto;">
            <tr><td style="padding: 4px;">Subtotal:</td><td style="text-align: right;">KWD ${Number(order?.subtotal).toFixed(3)}</td></tr>
            ${(order?.discount_amount || 0) > 0 ? `<tr><td style="padding: 4px;">Discount:</td><td style="text-align: right; color: red;">-KWD ${Number(order?.discount_amount).toFixed(3)}</td></tr>` : ""}
            ${(order?.discount_amount || 0) > 0 ? `<tr><td style="padding: 4px;">Coupon:</td><td style="text-align: right; color: red;">-KWD ${Number(order?.coupon_discount).toFixed(3)}</td></tr>` : ""}
            <tr><td style="padding: 4px;">Tax:</td><td style="text-align: right;">KWD ${Number(order?.tax_amount).toFixed(3)}</td></tr>
            <tr><td style="padding: 4px;">Shipping:</td><td style="text-align: right;">KWD ${Number(order?.shipping_fee).toFixed(3)}</td></tr>
            <tr style="font-weight: bold; color: #1773CF;"><td style="padding-top: 8px;">Total:</td><td style="text-align: right; padding-top: 8px;">KWD ${Number(order?.total_amount).toFixed(3)}</td></tr>
          </table>
        </div>

        <div style="text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px;">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`Invoice_${order?.order_number || "order"}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  if (isLoading)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );

  if (!order)
    return (
      <DashboardLayout>
        <div className="text-center py-24 text-gray-500">Order not found.</div>
      </DashboardLayout>
    );

  const status = order.order_status;
  const canConfirm = status === "Pending";
  const canProcess = ["Pending", "Confirmed"].includes(status);
  const canPack = status === "Processing";
  const canShip = ["Packed", "Processing"].includes(status);
  const canDeliver = ["Shipped", "Out for Delivery"].includes(status);
  const canCancel = ["Pending", "Confirmed", "Processing"].includes(status);
  const canReturn = status === "Delivered";
  const canMarkPaid = order.payment_status !== "Paid";

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 xl:p-4 sm:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate(-1)} className="flex-shrink-0">
              <img
                src={arrow_back_icon}
                alt=""
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-all sm:break-normal">
                {order.order_number}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {new Date(order.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {order.channel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <img src={print_icon} alt="" className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <img src={export_pdf_icon} alt="" className="w-4 h-4" />
              Export PDF
            </button>
            <span className="text-xs sm:text-sm text-gray-600">Status:</span>
            <span
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}
            >
              {status}
            </span>
            <span className="text-xs sm:text-sm text-gray-600">Payment:</span>
            <span
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full ${PAYMENT_COLORS[order.payment_status] || "bg-gray-100 text-gray-700"}`}
            >
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Hidden Print Template */}
        <div ref={printRef} className="hidden" />

        {/* Action Buttons */}
        <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3">
          {canConfirm && (
            <button
              onClick={() =>
                handleAction(
                  () => confirmOrder(orderId).unwrap(),
                  "Failed to confirm",
                )
              }
              disabled={isConfirming}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isConfirming ? "Confirming..." : "Confirm Order"}
            </button>
          )}
          {canProcess && (
            <button
              onClick={() =>
                handleAction(
                  () => processOrder(orderId).unwrap(),
                  "Failed to process",
                )
              }
              disabled={isProcessing}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? "Processing..." : "Start Processing"}
            </button>
          )}
          {canPack && (
            <button
              onClick={() =>
                handleAction(
                  () => packOrder(orderId).unwrap(),
                  "Failed to pack",
                )
              }
              disabled={isPacking}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isPacking ? "Packing..." : "Mark as Packed"}
            </button>
          )}
          {canShip && (
            <button
              onClick={() => setShowShipModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-cyan-700 transition-colors"
            >
              Ship Order
            </button>
          )}
          {canDeliver && (
            <button
              onClick={() =>
                handleAction(
                  () => deliverOrder(orderId).unwrap(),
                  "Failed to deliver",
                )
              }
              disabled={isDelivering}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isDelivering ? "Updating..." : "Mark as Delivered"}
            </button>
          )}
          {canMarkPaid && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              Record Payment
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-200 transition-colors"
            >
              Cancel Order
            </button>
          )}
          {canReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Return Order
            </button>
          )}
        </div>

        {/* Tabs - Horizontal Scroll on Mobile */}
        <div className="border-b border-gray-300 overflow-x-auto">
          <div className="flex min-w-max sm:min-w-0">
            {(["details", "items", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                  ? "border-[#1773CF] text-[#1773CF]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab === "history"
                  ? "Status History"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                Customer Information
              </h3>
              <div className="space-y-2 sm:space-y-3 text-sm">
                {[
                  { label: "Name", value: order.customer_name },
                  { label: "Email", value: order.customer_email },
                  { label: "Phone", value: order.customer_phone },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0"
                  >
                    <span className="text-gray-500 text-xs sm:text-sm">
                      {label}
                    </span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm break-all">
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                Shipping Information
              </h3>
              <div className="space-y-2 sm:space-y-3 text-sm">
                {[
                  { label: "Address", value: order.shipping_address },
                  { label: "City", value: order.shipping_city || "—" },
                  { label: "Country", value: order.shipping_country },
                  { label: "Tracking #", value: order.tracking_number || "—" },
                  { label: "Provider", value: order.shipping_provider || "—" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0"
                  >
                    <span className="text-gray-500 text-xs sm:text-sm">
                      {label}
                    </span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm text-left sm:text-right break-all sm:max-w-[200px]">
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Subtotal", value: Number(order.subtotal) },
                  { label: "Discount", value: -Number(order.discount_amount) },
                  { label: "Coupon", value: -Number(order.coupon_discount) },
                  { label: "Tax", value: Number(order.tax_amount) },
                  { label: "Shipping", value: Number(order.shipping_fee) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      {label}
                    </span>
                    <span
                      className={`font-medium text-xs sm:text-sm ${value < 0 ? "text-red-600" : "text-gray-900"}`}
                    >
                      {value < 0 ? "-" : ""}KWD {Math.abs(value).toFixed(3)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-sm sm:text-base">
                  <span>Total</span>
                  <span className="text-[#1773CF]">
                    KWD {Number(order.total_amount).toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Method
                  </span>
                  <span className="font-medium text-xs sm:text-sm">
                    {order.payment_method}
                  </span>
                </div>
                {order.coupon_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Coupon
                    </span>
                    <span className="font-medium text-green-600 text-xs sm:text-sm">
                      {order.coupon_code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(order.customer_notes || order.internal_notes) && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                  Notes
                </h3>
                {order.customer_notes && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Customer Notes
                    </p>
                    <p className="text-xs sm:text-sm text-gray-800 bg-gray-50 rounded-lg p-2 sm:p-3 break-words">
                      {order.customer_notes}
                    </p>
                  </div>
                )}
                {order.internal_notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Internal Notes
                    </p>
                    <p className="text-xs sm:text-sm text-gray-800 bg-amber-50 rounded-lg p-2 sm:p-3 break-words">
                      {order.internal_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "items" && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
              <div className="xl:col-span-4 overflow-x-auto">
                <div className="min-w-[640px] md:min-w-full">
                  <table className="w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "Product",
                          "SKU",
                          "Qty",
                          "Unit Price",
                          "Discount",
                          "Tax",
                          "Total",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="font-medium text-gray-900 text-xs sm:text-sm break-words">
                              {item.product_name}
                            </div>
                            {item.variant_name && (
                              <div className="text-xs text-gray-500">
                                {item.variant_name}
                              </div>
                            )}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            {item.sku || "—"}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                            KWD {parseFloat(item.unit_price).toFixed(3)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-red-600 whitespace-nowrap">
                            KWD {parseFloat(item.discount_amount).toFixed(3)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            KWD {parseFloat(item.tax_amount).toFixed(3)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                            KWD {parseFloat(item.total).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 sm:px-5 py-2 sm:py-3 font-bold text-gray-700 text-xs sm:text-sm"
                        >
                          Grand Total
                        </td>
                        <td className="px-3 sm:px-5 py-2 sm:py-3 font-bold text-[#1773CF] text-xs sm:text-sm whitespace-nowrap">
                          KWD {Number(order.total_amount).toFixed(3)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-xl p-4 sm:p-6">
            {history.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No status history available.
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((h: any, i: number) => (
                  <div key={h.id} className="flex gap-3 sm:gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-1 ${i === 0 ? "bg-[#1773CF]" : "bg-gray-300"
                          }`}
                      />
                      {i < history.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[h.new_status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {h.new_status}
                        </span>
                        {h.old_status && (
                          <span className="text-xs text-gray-400">
                            from {h.old_status}
                          </span>
                        )}
                      </div>
                      {h.notes && (
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {h.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {h.changedBy?.name && `By ${h.changedBy.name} · `}
                        {new Date(h.changed_at).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base sm:text-lg font-bold mb-4">Ship Order</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Tracking Number *
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Shipping Provider *
                </label>
                <input
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  placeholder="e.g. Aramex, DHL, FedEx"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShipModal(false)}
                className="flex-1 py-2 sm:py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShip}
                disabled={isShipping}
                className="flex-1 py-2 sm:py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 disabled:opacity-50 text-sm transition-colors"
              >
                {isShipping ? "Shipping..." : "Confirm Ship"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base sm:text-lg font-bold mb-4">
              Cancel Order
            </h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Enter cancellation reason *"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 sm:py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 text-sm transition-colors"
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base sm:text-lg font-bold mb-4">
              Return Order
            </h3>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
              placeholder="Enter return reason *"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2 sm:py-2.5 border rounded-xl font-medium text-gray-700 hover:bg-gray-50 text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleReturn}
                disabled={isReturning}
                className="flex-1 py-2 sm:py-2.5 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 text-sm transition-colors"
              >
                {isReturning ? "Processing..." : "Return Order"}
              </button>
            </div>


          </div>
        </div>
      )}

      {/* Payment Modal */}
    {/* Payment Modal */}
{showPaymentModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md mx-4 sm:mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
        <button
          onClick={() => setShowPaymentModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-gray-500">Outstanding Amount</p>
          <p className="text-lg sm:text-xl font-bold text-orange-600 break-words">
            KWD {(order.total_amount - (order?.total_paid || 0)).toFixed(3)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Payment Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Enter amount in KWD"
            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            autoFocus
          />
          {(order.total_amount - (order.total_paid || 0)) > 0 && (
            <button
              type="button"
              onClick={() => setPaymentAmount((order.total_amount - (order.total_paid || 0)).toString())}
              className="mt-1.5 text-xs text-blue-600 hover:underline"
            >
              Pay full outstanding (KWD {(order.total_amount - (order.total_paid || 0)).toFixed(3)})
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="">Select Payment Method</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Payment Account <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="">Select Payment Account</option>
              {paymentAccounts.map((account: any) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <img src={dropdown_arrow_icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Select the bank/cash account receiving this payment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Reference Number (Optional)
          </label>
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Cheque #, Transaction ID, etc."
            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
          <button
            onClick={() => setShowPaymentModal(false)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleRecordPayment}
            disabled={isRecordingPayment || !paymentAmount || !paymentMethod || !selectedAccountId}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
          >
            {isRecordingPayment ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </DashboardLayout>
  );
}