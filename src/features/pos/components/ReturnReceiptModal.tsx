// src/features/pos/components/ReturnReceiptModal.tsx
import { useRef } from 'react';
import { useGetReturnReceiptQuery } from '../../../services/posApi';

interface ReturnReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    returnId: number;
    onNewReturn: () => void;
}

export default function ReturnReceiptModal({
    isOpen,
    onClose,
    returnId,
    onNewReturn,
}: ReturnReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const { data: receiptResponse, isLoading } = useGetReturnReceiptQuery(returnId, {
        skip: !isOpen || !returnId,
    });

    const response = receiptResponse?.data;
    console.log('Return receipt response:', response);

    // Extract data from response
    const refundReceipt = response?.refund_receipt || {};
    const originalSale = response?.original_sale || {};
    const branch = response?.branch || {};
    const summary = response?.summary || {};

    if (!isOpen) return null;

    const handlePrint = () => {
        const content = receiptRef.current;
        if (!content) {
            console.error('Receipt content not found');
            return;
        }

        const cloneContent = content.cloneNode(true) as HTMLElement;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print the receipt');
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Return Receipt</title>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', 'Lucida Sans Typewriter', monospace;
              font-size: 14px;
              font-weight: 900;
              line-height: 1.8;
              background: white;
              padding: 20px;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              background: white;
            }
            .receipt * { font-weight: 900; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .divider {
              border-top: 2px dashed #333;
              margin: 10px 0;
            }
            .divider-dotted {
              border-top: 2px dotted #999;
              margin: 8px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
            }
            .company-name {
              font-size: 22px;
              font-weight: 900;
              margin-bottom: 6px;
              letter-spacing: 2px;
            }
            .company-details {
              font-size: 12px;
              color: #555;
              margin-bottom: 3px;
              font-weight: 700;
            }
            .receipt-title {
              font-size: 18px;
              letter-spacing: 3px;
              margin: 8px 0;
              font-weight: 900;
            }
            .barcode {
              text-align: center;
              margin: 15px 0;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
            }
            .barcode-text {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              letter-spacing: 4px;
              padding: 10px;
              background: #f5f5f5;
              display: inline-block;
              font-weight: 900;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 11px;
              color: #777;
            }
            .thankyou {
              font-size: 16px;
              font-weight: 900;
              margin-top: 10px;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 6px;
            }
            .item-name { font-weight: 900; font-size: 13px; }
            .item-qty { font-weight: 900; font-size: 13px; }
            .item-price { font-weight: 900; font-size: 13px; }
            .items-table .row { margin: 8px 0; }
            .row.text-xs { font-size: 13px; }
            .text-gray-500 { color: #6B7280; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1F2937; }
            .text-red-600 { color: #DC2626; }
            .text-green-600 { color: #16A34A; }
            .text-orange-600 { color: #EA580C; }
            .status-badge {
              display: inline-block;
              padding: 2px 10px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
            }
            .status-badge.completed { background: #DCFCE7; color: #166534; }
            .status-badge.partial { background: #FEF3C7; color: #92400E; }
            .status-badge.refunded { background: #FEE2E2; color: #991B1B; }
            @media print {
              body { padding: 0; margin: 0; }
              .receipt { box-shadow: none; }
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

    // Determine return status
    const getReturnStatus = () => {
        const status = refundReceipt.refund_status || originalSale.sale_status || 'Completed';
        const refundPercent = summary.refund_percentage || 0;

        if (refundPercent === 100) {
            return { label: 'FULL RETURN', class: 'refunded' };
        } else if (refundPercent > 0) {
            return { label: 'PARTIAL RETURN', class: 'partial' };
        }
        return { label: status || 'RETURN', class: 'completed' };
    };

    const returnStatus = getReturnStatus();

    // Helper to get string value from object or string
    const getStringValue = (value: any): string => {
        if (!value) return '—';
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
            return value.name || value.branch_name || value.full_name || '—';
        }
        return String(value);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Return Complete!</h2>
                            <p className="text-orange-100 text-xs">Return processed successfully</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Receipt Body */}
                <div className="p-5 max-h-[65vh] overflow-y-auto bg-gray-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : refundReceipt.return_number ? (
                        <div ref={receiptRef} className="receipt bg-white p-4 rounded-lg shadow-sm">
                            {/* Company Name */}
                            <div className="text-center">
                                <div className="company-name text-gray-800">
                                    {branch.name || 'MY ERP'}
                                </div>
                                {branch.address && (
                                    <div className="company-details">
                                        {branch.address}
                                        {branch.phone && ` | Tel: ${branch.phone}`}
                                    </div>
                                )}
                            </div>

                            <div className="divider my-3" />

                            {/* Receipt Title with Status */}
                            <div className="header-row">
                                <span className="receipt-title text-gray-700">REFUND RECEIPT</span>
                                <span className={`status-badge ${returnStatus.class}`}>
                                    {returnStatus.label}
                                </span>
                            </div>

                            <div className="divider my-3" />

                            {/* Refund Details */}
                            <div className="space-y-2">
                                <div className="row text-xs">
                                    <span className="text-gray-500">Refund #:</span>
                                    <span className="font-semibold text-gray-800">{refundReceipt.return_number}</span>
                                </div>
                                <div className="row text-xs">
                                    <span className="text-gray-500">Original Sale:</span>
                                    <span className="font-semibold text-gray-800">{originalSale.sale_number}</span>
                                </div>
                                <div className="row text-xs">
                                    <span className="text-gray-500">Refund Date:</span>
                                    <span className="text-gray-700">{refundReceipt.refund_date}</span>
                                </div>
                                <div className="row text-xs">
                                    <span className="text-gray-500">Refund Method:</span>
                                    <span className="font-medium text-gray-700">{refundReceipt.refund_method}</span>
                                </div>
                                <div className="row text-xs">
                                    <span className="text-gray-500">Status:</span>
                                    <span className="font-medium text-green-600">{refundReceipt.refund_status}</span>
                                </div>
                                {refundReceipt.refund_reason && (
                                    <div className="row text-xs">
                                        <span className="text-gray-500">Reason:</span>
                                        <span className="text-gray-700">{refundReceipt.refund_reason}</span>
                                    </div>
                                )}
                                <div className="row text-xs">
                                    <span className="text-gray-500">Items Returned:</span>
                                    <span className="font-medium text-gray-700">{summary.items_returned || 0} of {summary.items_in_original_sale || 0}</span>
                                </div>
                            </div>

                            <div className="divider-dotted my-3" />

                            {/* Original Sale Info */}
                            <div className="space-y-1">
                                <div className="row text-xs font-bold text-gray-700">
                                    <span>ORIGINAL SALE DETAILS</span>
                                </div>
                                {originalSale.cashier && (
                                    <div className="row text-xs">
                                        <span className="text-gray-500">Cashier:</span>
                                        <span className="text-gray-700">{getStringValue(originalSale.cashier)}</span>
                                    </div>
                                )}
                                {originalSale.salesman && (
                                    <div className="row text-xs">
                                        <span className="text-gray-500">Sales Staff:</span>
                                        <span className="text-gray-700">{getStringValue(originalSale.salesman)}</span>
                                    </div>
                                )}
                                <div className="row text-xs">
                                    <span className="text-gray-500">Sale Date:</span>
                                    <span className="text-gray-700">{originalSale.sale_date}</span>
                                </div>
                                <div className="row text-xs">
                                    <span className="text-gray-500">Sale Status:</span>
                                    <span className="font-medium text-orange-600">{originalSale.sale_status}</span>
                                </div>
                            </div>

                            <div className="divider-dotted my-3" />

                            {/* Refund Processed By */}
                            <div className="space-y-1">
                                <div className="row text-xs font-bold text-gray-700">
                                    <span>REFUND PROCESSED BY</span>
                                </div>
                                <div className="row text-xs">
                                    <span className="text-gray-500">Processed By:</span>
                                    <span className="text-gray-700">{getStringValue(refundReceipt.processed_by)}</span>
                                </div>
                                {refundReceipt.processed_by?.email && (
                                    <div className="row text-xs">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="text-gray-700">{refundReceipt.processed_by.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="divider my-3" />

                            {/* Items Header */}
                            <div className="row text-[13px] font-black text-gray-700 uppercase tracking-wider mb-2">
                                <span className="item-name">ITEM</span>
                                <span className="item-qty text-center">QTY</span>
                                <span className="item-price text-right">REFUND</span>
                            </div>

                            {/* Refund Items */}
                            <div className="items-table space-y-3">
                                {refundReceipt.refund_items?.map((item: any, index: number) => (
                                    <div key={index} className="text-sm">
                                        <div className="row">
                                            <span className="item-name text-gray-800 font-black text-sm" style={{ maxWidth: '55%' }}>
                                                {item.product_name}
                                                {item.product_name_ar && (
                                                    <span className="text-gray-500 text-[12px] block font-bold">
                                                        {item.product_name_ar}
                                                    </span>
                                                )}
                                                {item.variant && (
                                                    <span className="text-gray-500 text-[12px]">
                                                        {" "}({item.variant})
                                                    </span>
                                                )}
                                                {item.condition && (
                                                    <span className="text-gray-500 text-[12px] block font-bold">
                                                        Condition: {item.condition}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="item-qty text-center text-gray-700 font-black text-sm">
                                                {item.quantity}
                                            </span>
                                            <span className="item-price text-right font-black text-red-600 text-sm">
                                                KWD {parseFloat(item.refund_amount || "0").toFixed(3)}
                                            </span>
                                        </div>
                                        {parseFloat(item.unit_price) > 0 && (
                                            <div className="row text-[12px] text-gray-500 font-bold">
                                                <span className="item-name">
                                                    @ {parseFloat(item.unit_price).toFixed(3)} KWD
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="divider my-3" />

                            {/* Original Sale Items Summary */}
                            <div className="space-y-1">
                                <div className="row text-xs font-bold text-gray-700">
                                    <span>ORIGINAL SALE ITEMS</span>
                                </div>
                                {originalSale.original_items?.map((item: any, index: number) => (
                                    <div key={index} className="row text-xs text-gray-500">
                                        <span>{item.product_name} × {item.quantity}</span>
                                        <span>KWD {parseFloat(item.total || "0").toFixed(3)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="divider my-3" />

                            {/* Totals */}
                            <div className="totals space-y-2">
                                <div className="row text-sm">
                                    <span className="text-gray-500">Original Total:</span>
                                    <span className="text-gray-700">KWD {parseFloat(originalSale.sale_total || "0").toFixed(3)}</span>
                                </div>
                                <div className="row text-sm">
                                    <span className="text-gray-500">Total Refund:</span>
                                    <span className="text-red-600 font-black text-lg">
                                        KWD {parseFloat(summary.total_refund_amount || "0").toFixed(3)}
                                    </span>
                                </div>
                                <div className="row text-xs text-gray-500">
                                    <span>Refund Percentage:</span>
                                    <span>{summary.refund_percentage || 0}%</span>
                                </div>
                            </div>

                            <div className="divider my-3" />

                            {/* BARCODE SECTION */}
                            <div className="barcode">
                                {refundReceipt.barcode_image_url ? (
                                    <img
                                        src={refundReceipt.barcode_image_url}
                                        alt="Barcode"
                                        className="mx-auto"
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                const textBarcode = document.createElement('div');
                                                textBarcode.className = 'text-center';
                                                textBarcode.innerHTML = `
                          <div class="barcode-text">${refundReceipt.barcode || refundReceipt.return_number}</div>
                          <div class="text-[9px] text-gray-400 mt-1">Scan this code for refund</div>
                        `;
                                                parent.appendChild(textBarcode);
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="text-center">
                                        <div className="barcode-text">{refundReceipt.barcode || refundReceipt.return_number}</div>
                                        <div className="text-[9px] text-gray-400 mt-1">Scan this code for refund</div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="footer">
                                <div className="thankyou text-center text-gray-700 text-xs font-semibold">
                                    Thank You For Your Return!
                                </div>
                                <div className="text-center text-gray-400 text-[9px] mt-2">
                                    {branch.name || 'MY ERP'}
                                </div>
                                <div className="text-center text-gray-400 text-[8px] mt-1">
                                    This is a computer generated receipt
                                </div>
                                <div className="text-center text-gray-400 text-[8px] mt-1">
                                    {refundReceipt.return_number}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>Receipt not available</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 space-y-2 bg-white border-t border-gray-100 pt-4">
                    <button
                        onClick={handlePrint}
                        className="w-full py-2.5 border-2 border-orange-600 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Receipt
                    </button>
                    <button
                        onClick={() => {
                            onNewReturn();
                            onClose();
                        }}
                        className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}