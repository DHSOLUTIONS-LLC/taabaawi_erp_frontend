// src/features/pos/components/ReceiptModal.tsx
import { useRef } from 'react';
import { useGetSaleReceiptQuery } from '../../../services/posApi';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    saleId: number;
    onNewSale: () => void;
}

export default function ReceiptModal({ isOpen, onClose, saleId, onNewSale }: ReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const { data: receiptResponse, isLoading } = useGetSaleReceiptQuery(saleId, { skip: !isOpen || !saleId });
    const receipt = receiptResponse?.data;

    if (!isOpen) return null;

    const handlePrint = () => {
        const content = receiptRef.current;
        if (!content) {
            console.error("Receipt content not found");
            return;
        }

        // Clone the content to avoid modifying the original
        const cloneContent = content.cloneNode(true) as HTMLElement;

        // Get all styles from the original page
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        let stylesHTML = '';
        styles.forEach((style) => {
            if (style.tagName === 'STYLE') {
                stylesHTML += style.outerHTML;
            } else if (style.tagName === 'LINK') {
                stylesHTML += style.outerHTML;
            }
        });

        // Create print window
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow pop-ups to print the receipt");
            return;
        }

        // Write the print content
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Receipt - ${receipt?.sale_number || 'Print'}</title>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    ${stylesHTML}
                    <style>
                        /* Print-specific styles */
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            margin: 0;
                            padding: 20px;
                            background: white;
                        }
                        .print-container {
                            max-width: 300px;
                            margin: 0 auto;
                        }
                        .divider {
                            border-top: 1px dashed #000;
                            margin: 8px 0;
                        }
                        .row {
                            display: flex;
                            justify-content: space-between;
                            margin: 3px 0;
                        }
                        .center {
                            text-align: center;
                        }
                        .bold {
                            font-weight: bold;
                        }
                        .large {
                            font-size: 16px;
                        }
                        .text-gray-500 { color: #6b7280; }
                        .text-gray-600 { color: #4b5563; }
                        .text-red-500 { color: #ef4444; }
                        .text-red-600 { color: #dc2626; }
                        .text-green-600 { color: #16a34a; }
                        .text-purple-600 { color: #9333ea; }
                        .text-pink-700 { color: #be185d; }
                        .font-semibold { font-weight: 600; }
                        .font-bold { font-weight: 700; }
                        .text-xs { font-size: 11px; }
                        .text-sm { font-size: 13px; }
                        .text-base { font-size: 14px; }
                        .border-t { border-top: 1px solid #e5e7eb; }
                        .border-dashed { border-style: dashed; }
                        .border-gray-200 { border-color: #e5e7eb; }
                        .border-gray-300 { border-color: #d1d5db; }
                        .bg-pink-100 { background-color: #fce7f3; }
                        .rounded-full { border-radius: 9999px; }
                        .px-3 { padding-left: 12px; padding-right: 12px; }
                        .py-1 { padding-top: 4px; padding-bottom: 4px; }
                        .mt-1 { margin-top: 4px; }
                        .mb-3 { margin-bottom: 12px; }
                        .my-2 { margin-top: 8px; margin-bottom: 8px; }
                        .space-y-0\\.5 > * + * { margin-top: 2px; }
                        .space-y-1 > * + * { margin-top: 4px; }
                        .space-y-2 > * + * { margin-top: 8px; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .justify-center { justify-content: center; }
                        .text-center { text-align: center; }
                        .flex-1 { flex: 1; }
                        .pr-2 { padding-right: 8px; }
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
                    <div class="print-container">
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

    const handlePrintAlternative = () => {
        // Alternative method using iframe
        const content = receiptRef.current;
        if (!content) return;

        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0px';
        printFrame.style.height = '0px';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentWindow?.document;
        if (!frameDoc) return;

        const cloneContent = content.cloneNode(true) as HTMLElement;

        frameDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Receipt - ${receipt?.sale_number}</title>
                    <style>
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            margin: 0;
                            padding: 20px;
                            max-width: 300px;
                            margin: 0 auto;
                        }
                        .divider { border-top: 1px dashed #000; margin: 8px 0; }
                        .row { display: flex; justify-content: space-between; margin: 3px 0; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .large { font-size: 16px; }
                        .text-gray-500 { color: #6b7280; }
                        .text-gray-600 { color: #4b5563; }
                        .text-red-600 { color: #dc2626; }
                        .text-green-600 { color: #16a34a; }
                        .border-t { border-top: 1px solid #e5e7eb; }
                        .border-dashed { border-style: dashed; }
                        .font-bold { font-weight: bold; }
                        .font-semibold { font-weight: 600; }
                        .text-xs { font-size: 11px; }
                        .mb-3 { margin-bottom: 12px; }
                        .my-2 { margin-top: 8px; margin-bottom: 8px; }
                    </style>
                </head>
                <body>${cloneContent.innerHTML}</body>
            </html>
        `);

        frameDoc.close();

        setTimeout(() => {
            printFrame.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 100);
        }, 100);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#1773CF] px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Sale Complete!</h2>
                            <p className="text-blue-100 text-xs">Payment successful</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Receipt Body */}
                <div className="p-6 max-h-[65vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : receipt ? (
                        <div ref={receiptRef} className="font-mono text-sm space-y-1">
                            {/* Store Header */}
                            <div className="text-center space-y-0.5 mb-3">
                                <p className="font-bold text-base">{receipt.branch}</p>
                                {receipt.branch_address && <p className="text-gray-600 text-xs">{receipt.branch_address}</p>}
                                {receipt.branch_phone && <p className="text-gray-600 text-xs">{receipt.branch_phone}</p>}
                            </div>

                            <div className="border-t border-dashed border-gray-300 my-2" />

                            {/* Sale Info */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Receipt #</span>
                                    <span className="font-semibold">{receipt.sale_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date</span>
                                    <span>{receipt.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cashier</span>
                                    <span>{receipt.cashier}</span>
                                </div>
                                {receipt.sales_staff && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Sales Staff</span>
                                        <span>{receipt.sales_staff}</span>
                                    </div>
                                )}
                                {receipt.is_gift && (
                                    <div className="flex justify-center mt-1">
                                        <span className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full font-medium">🎁 Gift Receipt</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-gray-300 my-2" />

                            {/* Items */}
                            <div className="space-y-2">
                                {receipt.items?.map((item: any, index: number) => (
                                    <div key={index} className="text-xs">
                                        <div className="flex justify-between">
                                            <span className="font-medium flex-1 pr-2">
                                                {item.product_name}
                                                {item.variant && <span className="text-gray-500"> ({item.variant})</span>}
                                            </span>
                                            {!receipt.is_gift && (
                                                <span className="font-semibold">KD {parseFloat(item.total ?? '0')?.toFixed(3)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>x{item.quantity}</span>
                                            {!receipt.is_gift && (
                                                <span>@ KD {parseFloat(item.unit_price ?? '0')?.toFixed(3)}</span>
                                            )}
                                        </div>
                                        {!receipt.is_gift && item.discount > 0 && (
                                            <div className="flex justify-between text-red-500">
                                                <span>Discount</span>
                                                <span>-KD {parseFloat(item.discount ?? '0')?.toFixed(3)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Totals - hide if gift */}
                            {!receipt.is_gift && (
                                <>
                                    <div className="border-t border-dashed border-gray-300 my-2" />
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span>KD {parseFloat(receipt.subtotal).toFixed(3)}</span>
                                        </div>
                                        {parseFloat(receipt.discount) > 0 && (
                                            <div className="flex justify-between text-red-600">
                                                <span>Discount</span>
                                                <span>-KD {parseFloat(receipt.discount).toFixed(3)}</span>
                                            </div>
                                        )}
                                        {parseFloat(receipt.coupon_discount) > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Coupon</span>
                                                <span>-KD {parseFloat(receipt.coupon_discount).toFixed(3)}</span>
                                            </div>
                                        )}
                                        {parseFloat(receipt.employee_discount) > 0 && (
                                            <div className="flex justify-between text-purple-600">
                                                <span>Employee Disc.</span>
                                                <span>-KD {parseFloat(receipt.employee_discount).toFixed(3)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-sm border-t border-gray-200 pt-1">
                                            <span>TOTAL</span>
                                            <span>KD {parseFloat(receipt.total).toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>{receipt.payment_method}</span>
                                            {receipt.cash_received && <span>KD {parseFloat(receipt.cash_received).toFixed(3)}</span>}
                                        </div>
                                        {parseFloat(receipt.change_given) > 0 && (
                                            <div className="flex justify-between font-semibold text-green-600">
                                                <span>Change</span>
                                                <span>KD {parseFloat(receipt.change_given).toFixed(3)}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="border-t border-dashed border-gray-300 my-2" />
                            <p className="text-center text-gray-400 text-xs">Thank you for your purchase!</p>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Receipt not available</p>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-2">
                    <button
                        onClick={handlePrint}
                        className="w-full py-3 border-2 border-[#1773CF] text-[#1773CF] rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Receipt
                    </button>
                    <button
                        onClick={() => { onNewSale(); onClose(); }}
                        className="w-full py-3 bg-[#1773CF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        New Sale
                    </button>
                </div>
            </div>
        </div>
    );
}