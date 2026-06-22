// src/features/pos/pages/ReturnDetailsPage.tsx
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useGetReturnByIdQuery } from "../../../services/posApi";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import ReturnReceiptModal from "../components/ReturnReceiptModal";

import arrow_back_icon from "../../../assets/icons/arrow_back_icon.svg";
import print_icon from "../../../assets/icons/print_svg.png";

const STATUS_COLORS: Record<string, string> = {
    Approved: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Rejected: "bg-red-100 text-red-800",
};

export default function ReturnDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [showRefundReceipt, setShowRefundReceipt] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const isSuperAdmin = user?.role?.role_name === "Super Admin";
    const basePath = isSuperAdmin ? "/admin" : "";

    const { data: returnResponse, isLoading } = useGetReturnByIdQuery(Number(id), {
        skip: !id,
    });

    const returnData = returnResponse?.data;

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
        setShowRefundReceipt(true);
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

    if (!returnData) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-40">
                    <p className="text-red-500 font-medium">Return not found</p>
                    <button
                        onClick={() => navigate(`${basePath}/pos/returns`)}
                        className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                        Back to Returns
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const returnItems = returnData.items || [];
    const totalRefund = returnItems.reduce(
        (sum: number, item: any) => sum + parseFloat(item.refund_amount || 0),
        0
    );

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate(`${basePath}/pos/returns`)}
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
                                    Return #{returnData.return_number}
                                </h1>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[returnData.status] || "bg-gray-100 text-gray-700"}`}
                                >
                                    {returnData.status}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                                {formatDate(returnData.return_date)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handlePrintReceipt}
                            className="flex items-center gap-2 px-3 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                        >
                            <img src={print_icon} alt="Print" className="w-4 h-4" />
                            Print Refund Receipt
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - 2/3 width */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Return Items */}
                        <div className="bg-white rounded-xl p-4 sm:p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Returned Items
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50 border-y border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Refund Amount</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {returnItems.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-sm">
                                                            {item.product?.product_name || item.product_name}
                                                        </div>
                                                        {item.variant && (
                                                            <div className="text-xs text-gray-500">
                                                                {item.variant}
                                                            </div>
                                                        )}
                                                        {item.product?.sku && (
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {item.product.sku}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-900">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                                                    {formatCurrency(item.refund_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                        {item.condition || "Good"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Reason */}
                        {returnData.reason && (
                            <div className="bg-white rounded-xl p-4 sm:p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-2">
                                    Return Reason
                                </h2>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                    {returnData.reason}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - 1/3 width */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Return Summary */}
                        <div className="bg-white rounded-xl p-4 sm:p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Return Summary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Return #</span>
                                    <span className="font-medium text-gray-900">
                                        {returnData.return_number}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Original Sale</span>
                                    <span className="font-medium text-blue-600">
                                        {returnData.sale?.sale_number}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Refund Method</span>
                                    <span className="font-medium">{returnData.refund_method}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Items Returned</span>
                                    <span className="font-medium">{returnItems.length} item(s)</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-sm font-semibold">Total Refund</span>
                                    <span className="text-base font-bold text-red-600">
                                        {formatCurrency(totalRefund)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Processed By */}
                        <div className="bg-white rounded-xl p-4 sm:p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Processed By
                            </h2>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                        {returnData.processed_by?.name || "—"}
                                    </p>
                                </div>
                                {returnData.processed_by?.email && (
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {returnData.processed_by.email}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-gray-500">Processed Date</p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        {formatDate(returnData.return_date)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Branch Info */}
                        {returnData.branch && (
                            <div className="bg-white rounded-xl p-4 sm:p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">
                                    Branch Information
                                </h2>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Branch</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            {returnData.branch.branch_name}
                                        </p>
                                    </div>
                                    {returnData.branch.address && (
                                        <div>
                                            <p className="text-xs text-gray-500">Address</p>
                                            <p className="text-sm text-gray-700 mt-1">
                                                {returnData.branch.address}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Original Sale Info */}
                        {returnData.sale && (
                            <div className="bg-white rounded-xl p-4 sm:p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">
                                    Original Sale
                                </h2>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Sale #</p>
                                        <p className="text-sm font-medium text-blue-600 mt-1">
                                            {returnData.sale.sale_number}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Sale Date</p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {formatDate(returnData.sale.sale_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Total Amount</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            {formatCurrency(returnData.sale.total_amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Refund Receipt Modal */}
            <ReturnReceiptModal
                isOpen={showRefundReceipt}
                onClose={() => setShowRefundReceipt(false)}
                returnId={Number(id)}
                onNewReturn={() => setShowRefundReceipt(false)}
            />
        </DashboardLayout>
    );
}