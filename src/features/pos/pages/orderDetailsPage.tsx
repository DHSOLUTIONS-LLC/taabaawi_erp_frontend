// src/features/pos/pages/OrderDetailsPage.tsx
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetSaleByIdQuery } from "../../../services/posApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import CreateReturnModal from "../components/CreateReturnModal";
import JsBarcode from "jsbarcode";

import arrow_back_icon from "../../../assets/icons/arrow_back_icon.svg";
import print_icon from "../../../assets/icons/print_svg.png";
import returns from "../../../assets/icons/returns.png";

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-100 text-green-800",
  Refunded: "bg-red-100 text-red-800",
  "Partially Refunded": "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-gray-100 text-gray-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  Cash: "bg-green-100 text-green-800",
  Card: "bg-blue-100 text-blue-800",
  "K-Net": "bg-purple-100 text-purple-800",
  "Mobile Payment": "bg-orange-100 text-orange-800",
  Mixed: "bg-gray-100 text-gray-800",
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  const { data: saleResponse, isLoading } = useGetSaleByIdQuery(Number(id), {
    skip: !id,
  });

  const sale = saleResponse?.data;

  // Generate barcode for sale number
  const generateBarcode = (saleNumber: string) => {
    try {
      // Create a temporary canvas element
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, saleNumber, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 12,
        margin: 10,
      });
      return canvas.toDataURL();
    } catch (error) {
      console.error("Barcode generation failed:", error);
      return null;
    }
  };

  const formatCurrency = (value: string | number) => {
    return `KWD ${parseFloat(value?.toString() || "0").toFixed(3)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrintReceipt = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Generate barcode image for the receipt
    const barcodeImage = generateBarcode(sale?.sale_number || `SALE-${sale?.id}`);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale?.sale_number || "Print"}</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', 'Lucida Sans Typewriter', monospace;
              font-size: 12px;
              line-height: 1.4;
              background: white;
              padding: 20px;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              background: white;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .text-left {
              text-align: left;
            }
            .bold {
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #333;
              margin: 8px 0;
            }
            .divider-dotted {
              border-top: 1px dotted #999;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .company-details {
              font-size: 9px;
              color: #555;
              margin-bottom: 2px;
            }
            .receipt-title {
              font-size: 10px;
              letter-spacing: 2px;
              margin: 5px 0;
            }
            .item-name {
              width: 55%;
            }
            .item-qty {
              width: 15%;
              text-align: center;
            }
            .item-price {
              width: 30%;
              text-align: right;
            }
            .items-table {
              width: 100%;
              margin: 5px 0;
            }
            .totals {
              margin-top: 5px;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 9px;
              color: #777;
            }
            .thankyou {
              font-size: 10px;
              font-weight: bold;
              margin-top: 8px;
            }
            .barcode-container {
              text-align: center;
              margin: 10px 0;
              padding: 8px 0;
            }
            .barcode-image {
              max-width: 100%;
              height: auto;
            }
            .dummy-barcode {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              letter-spacing: 2px;
              background: #f5f5f5;
              padding: 8px;
              margin: 5px 0;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${printContent.innerHTML}
            
            <!-- Barcode Section -->
            <div class="barcode-container">
              <div class="divider"></div>
              ${barcodeImage ? 
                `<img src="${barcodeImage}" alt="Barcode" class="barcode-image" />` : 
                `<div class="dummy-barcode">
                   <div>✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦</div>
                   <div style="font-size: 10px; margin-top: 5px;">${sale?.sale_number || `SALE-${sale?.id}`}</div>
                   <div style="font-size: 8px; margin-top: 3px;">SCAN FOR RETURNS</div>
                 </div>`
              }
              <div style="font-size: 9px; margin-top: 5px; color: #666;">
                ${sale?.sale_number || `Order #${sale?.id}`}
              </div>
              <div class="divider"></div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
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

  if (!sale) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Sale not found</p>
          <button
            onClick={() => navigate(`${basePath}/pos/orders`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const canReturn =
    sale.status === "Completed" &&
    sale.returns?.length === 0 &&
    parseFloat(sale.total_amount) > 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`${basePath}/pos/orders`)}
              className="flex-shrink-0 mt-1"
            >
              <img
                src={arrow_back_icon}
                alt=""
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {sale.sale_number}
                </h1>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[sale.status] || "bg-gray-100 text-gray-700"}`}
                >
                  {sale.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                {formatDate(sale.sale_date)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <img src={print_icon} alt="Print" className="w-4 h-4" />
              Print
            </button>
            {canReturn && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <img src={returns} alt="Return" className="w-4 h-4" />
                Return Order
              </button>
            )}
          </div>
        </div>

        {/* Hidden Print Template */}
        <div ref={printRef} className="hidden">
          {/* Receipt Content */}
          <div className="text-center">
            <div className="company-name text-base font-bold">
              {sale.branch?.branch_name || "Store"}
            </div>
            {sale.branch?.address && (
              <div className="company-details text-xs">
                {sale.branch.address}
              </div>
            )}
            {sale.branch?.phone && (
              <div className="company-details text-xs">
                Tel: {sale.branch.phone}
              </div>
            )}
            <div className="receipt-title text-[10px] tracking-wider mt-1">
              OFFICIAL RECEIPT
            </div>
          </div>

          <div className="divider my-3" />

          {/* Transaction Details */}
          <div className="space-y-2">
            <div className="row text-xs">
              <span>Receipt #</span>
              <span className="font-semibold">{sale.sale_number}</span>
            </div>
            <div className="row text-xs">
              <span>Date & Time</span>
              <span>{formatDate(sale.sale_date)}</span>
            </div>
            <div className="row text-xs">
              <span>Cashier</span>
              <span>{sale.cashier?.name}</span>
            </div>
            {sale.sales_staff && (
              <div className="row text-xs">
                <span>Sales Staff</span>
                <span>{sale.sales_staff?.name}</span>
              </div>
            )}
            {/* Customer Info - Show if available */}
            {(sale.customer || sale.customer_details) && (
              <div className="row text-xs">
                <span>Customer</span>
                <span>{sale.customer?.full_name || sale.customer_details?.name || "—"}</span>
              </div>
            )}
          </div>

          <div className="divider my-3" />

          {/* Items Header */}
          <div className="row text-[10px] font-bold uppercase tracking-wide">
            <span className="item-name">ITEM</span>
            <span className="item-qty text-center">QTY</span>
            <span className="item-price text-right">AMOUNT</span>
          </div>

          {/* Items List */}
          <div className="items-table space-y-2">
            {sale.items?.map((item: any) => (
              <div key={item.id} className="text-xs">
                <div className="row">
                  <span className="item-name">
                    {item.product?.product_name}
                    {item.variant && (
                      <span className="text-gray-400 text-[10px]">
                        {" "}
                        ({item.variant})
                      </span>
                    )}
                  </span>
                  <span className="item-qty text-center">{item.quantity}</span>
                  <span className="item-price text-right font-semibold">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                {parseFloat(item.unit_price) > 0 && (
                  <div className="row text-[10px] text-gray-400">
                    <span className="item-name">
                      @ {formatCurrency(item.unit_price)}
                    </span>
                    {parseFloat(item.discount_amount) > 0 && (
                      <span className="item-price text-right text-red-500">
                        -{item.discount_percentage}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="divider my-3" />

          {/* Totals */}
          <div className="totals space-y-1">
            <div className="row text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {parseFloat(sale.discount_amount) > 0 && (
              <div className="row text-xs text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            {parseFloat(sale.coupon_discount) > 0 && (
              <div className="row text-xs text-green-600">
                <span>Coupon</span>
                <span>-{formatCurrency(sale.coupon_discount)}</span>
              </div>
            )}
            {parseFloat(sale.employee_discount_amount) > 0 && (
              <div className="row text-xs text-purple-600">
                <span>Employee Disc.</span>
                <span>-{formatCurrency(sale.employee_discount_amount)}</span>
              </div>
            )}
            <div className="divider-dotted my-2" />
            <div className="row text-sm font-bold">
              <span>TOTAL</span>
              <span className="text-blue-600">
                {formatCurrency(sale.total_amount)}
              </span>
            </div>
            <div className="row text-xs">
              <span>Payment Method</span>
              <span className="font-medium">{sale.payment_method}</span>
            </div>
            {sale.cash_received && (
              <div className="row text-xs">
                <span>Cash Received</span>
                <span>{formatCurrency(sale.cash_received)}</span>
              </div>
            )}
            {parseFloat(sale.change_given) > 0 && (
              <div className="row text-xs text-green-600 font-semibold">
                <span>Change Given</span>
                <span>{formatCurrency(sale.change_given)}</span>
              </div>
            )}
          </div>

          <div className="divider my-3" />

          {/* Footer */}
          <div className="footer">
            <div className="thankyou text-center text-xs font-semibold">
              Thank You For Your Purchase!
            </div>
            <div className="text-center text-[9px] mt-2">
              {sale.branch?.branch_name || "Store"}
            </div>
            <div className="text-center text-[8px] mt-1">
              This is a computer generated receipt
            </div>
          </div>

          {/* Barcode will be added dynamically in print function */}
        </div>

        {/* Rest of the page content remains the same */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Items Table */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.product?.images?.[0]?.image_path && (
                              <img
                                src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}/storage/${item.product.images[0].image_path}`}
                                alt={item.product?.product_name}
                                className="w-10 h-10 rounded-lg object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {item.product?.product_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                SKU: {item.product?.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-red-500">
                          {parseFloat(item.discount_amount) > 0
                            ? `-${formatCurrency(item.discount_amount)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Notes
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {sale.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-4 sm:space-y-6">
            {/* Amount Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Amount Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>
                {parseFloat(sale.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(sale.discount_amount)}</span>
                  </div>
                )}
                {parseFloat(sale.coupon_discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon</span>
                    <span>-{formatCurrency(sale.coupon_discount)}</span>
                  </div>
                )}
                {parseFloat(sale.employee_discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Employee Discount</span>
                    <span>
                      -{formatCurrency(sale.employee_discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-base font-bold text-blue-600">
                    {formatCurrency(sale.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Payment Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_METHOD_COLORS[sale.payment_method] || "bg-gray-100 text-gray-700"}`}
                  >
                    {sale.payment_method}
                  </span>
                </div>
                {sale.cash_received && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cash Received</span>
                    <span className="font-medium">
                      {formatCurrency(sale.cash_received)}
                    </span>
                  </div>
                )}
                {sale.change_given && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Change Given</span>
                    <span>{formatCurrency(sale.change_given)}</span>
                  </div>
                )}
                {sale.card_reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Card Reference</span>
                    <span className="font-mono text-xs">
                      {sale.card_reference}
                    </span>
                  </div>
                )}
                {sale.coupon_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coupon Code</span>
                    <span className="font-medium text-green-600">
                      {sale.coupon_code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Store Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {sale.branch?.branch_name}
                  </p>
                  {sale.branch?.address && (
                    <p className="text-xs text-gray-500 mt-1">
                      {sale.branch.address}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cashier</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {sale.cashier?.name}
                  </p>
                </div>
                {sale.sales_staff && (
                  <div>
                    <p className="text-xs text-gray-500">Sales Staff</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {sale.sales_staff?.name}
                    </p>
                  </div>
                )}
                {sale.cash_register && (
                  <div>
                    <p className="text-xs text-gray-500">Register</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {sale.cash_register.register_number}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Gift Receipt Info */}
            {sale.is_gift && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-pink-700">
                  🎁 Gift Receipt
                </p>
                <p className="text-xs text-pink-600 mt-1">
                  This sale was marked as a gift receipt
                </p>
              </div>
            )}

            {/* Employee Purchase Info */}
            {sale.is_employee_purchase && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-purple-700">
                  👤 Employee Purchase
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Employee discount applied
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Modal */}
      <CreateReturnModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
        }}
        onSuccess={() => {
          setShowReturnModal(false);
        }}
        saleId={sale.id}
      />
    </DashboardLayout>
  );
}