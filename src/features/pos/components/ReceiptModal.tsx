// src/features/pos/components/ReceiptModal.tsx
import { useRef } from "react";
import { useGetSaleReceiptQuery } from "../../../services/posApi";
import { useGetSystemSettingsQuery } from "../../../services/systemApi";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number;
  onNewSale: () => void;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  saleId,
  onNewSale,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: receiptResponse, isLoading } = useGetSaleReceiptQuery(saleId, {
    skip: !isOpen || !saleId,
  });
  const { data: settingsData } = useGetSystemSettingsQuery();

  const receipt = receiptResponse?.data;
  console.log("receipt data:", receipt);
  const settings = settingsData?.data;

  const companyLogo = settings?.logo
    ? `${import.meta.env.VITE_API_URL?.replace("/api", "")}/storage/${settings.logo}`
    : null;
  const companyName = settings?.company_name || "ERP System";
  // const companyAddress = settings?.company_address || "";
  // const companyPhone = settings?.phone || "";
  // const companyEmail = settings?.email || "";

  // Get barcode from backend response
  const barcodeValue = receipt?.barcode || receipt?.sale_number || "";
  const barcodeImageUrl = receipt?.barcode_image_url || null;

  if (!isOpen) return null;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) {
      console.error("Receipt content not found");
      return;
    }

    const cloneContent = content.cloneNode(true) as HTMLElement;

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHTML = "";
    styles.forEach((style) => {
      if (style.tagName === "STYLE") {
        stylesHTML += style.outerHTML;
      } else if (style.tagName === "LINK") {
        stylesHTML += style.outerHTML;
      }
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the receipt");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt?.sale_number || "Print"}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${stylesHTML}
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', 'Lucida Sans Typewriter', monospace;
              font-size: 11px;
              line-height: 1.4;
              background: white;
              padding: 20px;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              background: white;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
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
            .logo {
              max-width: 80px;
              max-height: 60px;
              margin: 0 auto 8px auto;
              display: block;
              object-fit: contain;
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
            .items-table {
              width: 100%;
              margin: 5px 0;
            }
            .item-name {
              width: 55%;
            }
            .item-qty {
              width: 20%;
              text-align: center;
            }
            .item-price {
              width: 25%;
              text-align: right;
            }
            .totals {
              margin-top: 5px;
            }
            .barcode {
              text-align: center;
              margin: 10px 0;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
            }
            .barcode-text {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              letter-spacing: 3px;
              padding: 8px;
              background: #f5f5f5;
              display: inline-block;
              font-weight: bold;
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
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .receipt {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${cloneContent.innerHTML}
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sale Complete!</h2>
              <p className="text-blue-100 text-xs">Payment successful</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : receipt ? (
            <div
              ref={receiptRef}
              className="receipt bg-white p-4 rounded-lg shadow-sm"
            >
              {/* Company Logo */}
              <div className="text-center mb-3">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="mx-auto max-h-14 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 10h18M6 14h6m-6-4h12M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Company Header */}
              <div className="text-center">
                <div className="company-name text-base font-bold text-gray-800">
                  {companyName}
                </div>
                {receipt.branch && (
                  <div className="company-details text-xs text-gray-500">
                    {receipt.branch}
                  </div>
                )}
                {receipt.branch_address && (
                  <div className="company-details text-xs text-gray-500">
                    {receipt.branch_address}
                  </div>
                )}
                {receipt.branch_phone && (
                  <div className="company-details text-xs text-gray-500">
                    Tel: {receipt.branch_phone}
                  </div>
                )}
                <div className="receipt-title text-[10px] text-gray-400 tracking-wider mt-1">
                  OFFICIAL RECEIPT
                </div>
              </div>

              <div className="divider my-3" />

              {/* Transaction Details - ALL FIELDS from backend */}
              <div className="space-y-2">
                <div className="row text-xs">
                  <span className="text-gray-500">Receipt No: </span>
                  <span className="font-semibold text-gray-800">
                    {receipt.sale_number}
                  </span>
                </div>
                <div className="row text-xs">
                  <span className="text-gray-500">Barcode: </span>
                  <span className="font-mono text-gray-700 text-[10px]">
                    {barcodeValue}
                  </span>
                </div>
                <div className="row text-xs">
                  <span className="text-gray-500">Date & Time: </span>
                  <span className="text-gray-700">{receipt.date}</span>
                </div>
                <div className="row text-xs">
                  <span className="text-gray-500">Cashier: </span>
                  <span className="text-gray-700">{receipt.cashier}</span>
                </div>
                {receipt.cashier_id && (
                  <div className="row text-xs">
                    <span className="text-gray-500">Cashier ID: </span>
                    <span className="text-gray-700">{receipt.cashier_id}</span>
                  </div>
                )}
                {receipt.sales_staff && (
                  <div className="row text-xs">
                    <span className="text-gray-500">Sales Staff: </span>
                    <span className="text-gray-700">{receipt.sales_staff}</span>
                  </div>
                )}
                {receipt.sales_staff_id && (
                  <div className="row text-xs">
                    <span className="text-gray-500">Staff ID: </span>
                    <span className="text-gray-700">{receipt.sales_staff_id}</span>
                  </div>
                )}
                {receipt.is_gift && (
                  <div className="flex justify-center mt-2">
                    <span className="bg-pink-100 text-pink-700 text-[10px] px-3 py-1 rounded-full font-medium">
                      🎁 GIFT RECEIPT
                    </span>
                  </div>
                )}
              </div>

              <div className="divider my-3" />

              {/* Items Header */}
              <div className="row text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                <span className="item-name">ITEM</span>
                <span className="item-qty text-center">QTY</span>
                <span className="item-price text-right">AMOUNT</span>
              </div>

              {/* Items List */}
              <div className="items-table space-y-2">
                {receipt.items?.map((item: any, index: number) => (
                  <div key={index} className="text-xs">
                    <div className="row">
                      <span className="item-name text-gray-800">
                        {item.product_name}
                        {item.variant && (
                          <span className="text-gray-400 text-[10px]">
                            {" "}({item.variant})
                          </span>
                        )}
                      </span>
                      <span className="item-qty text-center text-gray-600">
                        {item.quantity}
                      </span>
                      {!receipt.is_gift && (
                        <span className="item-price text-right font-semibold text-gray-800">
                          KWD {parseFloat(item.total || "0").toFixed(3)}
                        </span>
                      )}
                    </div>
                    {!receipt.is_gift && parseFloat(item.unit_price) > 0 && (
                      <div className="row text-[10px] text-gray-400">
                        <span className="item-name">
                          @ {parseFloat(item.unit_price).toFixed(3)} KWD
                        </span>
                        {parseFloat(item.discount) > 0 && (
                          <span className="item-price text-right text-red-500">
                            -{item.discount_percentage || 0}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="divider my-3" />

              {/* Totals - ALL fields */}
              {!receipt.is_gift && (
                <div className="totals space-y-1">
                  <div className="row text-xs">
                    <span className="text-gray-500">Subtotal: </span>
                    <span className="text-gray-800">
                      KWD {parseFloat(receipt.subtotal || "0").toFixed(3)}
                    </span>
                  </div>
                  {parseFloat(receipt.discount) > 0 && (
                    <div className="row text-xs text-red-600">
                      <span>Discount:</span>
                      <span>- KWD {parseFloat(receipt.discount).toFixed(3)}</span>
                    </div>
                  )}
                  {parseFloat(receipt.coupon_discount) > 0 && (
                    <div className="row text-xs text-green-600">
                      <span>Coupon:</span>
                      <span>- KWD {parseFloat(receipt.coupon_discount).toFixed(3)}</span>
                    </div>
                  )}
                  {parseFloat(receipt.employee_discount) > 0 && (
                    <div className="row text-xs text-purple-600">
                      <span>Employee Disc.:</span>
                      <span>- KWD {parseFloat(receipt.employee_discount).toFixed(3)}</span>
                    </div>
                  )}
                  {parseFloat(receipt.tax) > 0 && (
                    <div className="row text-xs text-orange-600">
                      <span>Tax:</span>
                      <span>+ KWD {parseFloat(receipt.tax).toFixed(3)}</span>
                    </div>
                  )}
                  {parseFloat(receipt.tax) > 0 && (
                    <div className="row text-xs text-orange-600">
                      <span>Tax:</span>
                      <span>+ KWD {parseFloat(receipt.tax).toFixed(3)}</span>
                    </div>
                  )}
                  <div className="divider-dotted my-2" />
                  <div className="row text-sm font-bold">
                    <span>TOTAL: </span>
                    <span className="text-blue-600">
                      KWD {parseFloat(receipt.total || "0").toFixed(3)}
                    </span>
                  </div>
                  <div className="row text-xs">
                    <span className="text-gray-500">Payment Method: </span>
                    <span className="text-gray-700 font-medium">
                      {receipt.payment_method}
                    </span>
                  </div>
                  {receipt.cash_received && parseFloat(receipt.cash_received) > 0 && (
                    <div className="row text-xs">
                      <span className="text-gray-500">Cash Received: </span>
                      <span className="text-gray-700">
                        KWD {parseFloat(receipt.cash_received).toFixed(3)}
                      </span>
                    </div>
                  )}
                  {parseFloat(receipt.change_given) > 0 && (
                    <div className="row text-xs text-green-600 font-semibold">
                      <span>Change Given: </span>
                      <span>KWD {parseFloat(receipt.change_given).toFixed(3)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="divider my-3" />

              {/* BARCODE SECTION - Using actual backend barcode */}
              <div className="barcode">
                {barcodeImageUrl ? (
                  // Show actual barcode image from backend
                  <img
                    src={barcodeImageUrl}
                    alt="Barcode"
                    className="mx-auto"
                    style={{ maxWidth: "100%", height: "auto" }}
                    onError={(e) => {
                      // If image fails to load, show text barcode
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const textBarcode = document.createElement("div");
                        textBarcode.className = "text-center";
                        textBarcode.innerHTML = `
                          <div class="barcode-text">${barcodeValue}</div>
                          <div class="text-[9px] text-gray-400 mt-1">Scan this code</div>
                        `;
                        parent.appendChild(textBarcode);
                      }
                    }}
                  />
                ) : (
                  // Fallback: Show text barcode
                  <div className="text-center">
                    <div className="barcode-text">{barcodeValue}</div>
                    <div className="text-[9px] text-gray-400 mt-1">Scan this code for returns</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="footer">
                <div className="thankyou text-center text-gray-700 text-xs font-semibold">
                  Thank You For Your Purchase!
                </div>
                <div className="text-center text-gray-400 text-[9px] mt-2">
                  {companyName}
                </div>
                <div className="text-center text-gray-400 text-[8px] mt-1">
                  This is a computer generated receipt
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg
                className="w-12 h-12 mx-auto text-gray-300 mb-3"
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
              <p>Receipt not available</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2 bg-white border-t border-gray-100 pt-4">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Receipt
          </button>
          <button
            onClick={() => {
              onNewSale();
              onClose();
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}