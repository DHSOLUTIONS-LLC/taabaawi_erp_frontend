// src/features/accounting/pages/financial-reports/BalanceSheetPage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetBalanceSheetQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';


const num = (v: any) => parseFloat(v) || 0;

export default function BalanceSheetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state: RootState) => state.auth);
  
  const [asOfDate, setAsOfDate] = useState(
    searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]
  );

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const { data, isLoading, refetch } = useGetBalanceSheetQuery({
    as_of_date: asOfDate,
  });

  const report = (data as any)?.data;

  const handleDateChange = (newDate: string) => {
    setAsOfDate(newDate);
    navigate(`?as_of_date=${newDate}`, { replace: true });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting balance sheet as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group assets by sub type
  const assetsByType = report?.assets.details.reduce((acc: any, item: any) => {
    const type = item.account_sub_type || 'Other Asset';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  // Group liabilities by sub type
  const liabilitiesByType = report?.liabilities.details.reduce((acc: any, item: any) => {
    const type = item.account_sub_type || 'Other Liability';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`${basePath}/accounting/financial-reports`)}>
              <img src={arrow_back_icon} alt="" className="w-8 h-8" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
              <p className="text-sm text-gray-500 mt-1">As of {new Date(asOfDate).toLocaleDateString()}</p>
            </div>
          </div>
          <ReportActions
            onExport={handleExport}
            onPrint={handlePrint}
            onRefresh={refetch}
          />
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">As of Date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => handleDateChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-4 print:p-0">
          <ReportHeader
            title="Balance Sheet"
            subtitle={`As of ${new Date(asOfDate).toLocaleDateString()}`}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !report ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for this period</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Assets */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  ASSETS
                </h3>
                
                {Object.entries(assetsByType || {}).map(([type, items]: [string, any]) => (
                  <div key={type} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{type}</h4>
                    <div className="space-y-1">
                      {(items as any[]).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.account_name}</span>
                          <span className="font-mono text-gray-900">
                            KWD {num(item.amount).toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-2 border-t-2 border-gray-200">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Assets</span>
                    <span className="text-blue-600">
                      KWD {num(report?.assets.total).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Liabilities & Equity */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                  LIABILITIES
                </h3>
                
                {Object.entries(liabilitiesByType || {}).map(([type, items]: [string, any]) => (
                  <div key={type} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{type}</h4>
                    <div className="space-y-1">
                      {(items as any[]).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.account_name}</span>
                          <span className="font-mono text-gray-900">
                            KWD {num(item.amount).toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-2 border-t-2 border-gray-200">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Liabilities</span>
                    <span className="text-orange-600">
                      KWD {num(report?.liabilities.total).toFixed(3)}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-gray-200">
                  EQUITY
                </h3>

                {report?.equity.details.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{item.account_name}</span>
                    <span className="font-mono text-gray-900">
                      KWD {num(item.amount).toFixed(3)}
                    </span>
                  </div>
                ))}

                <div className="mt-4 pt-2 border-t-2 border-gray-200">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Equity</span>
                    <span className="text-green-600">
                      KWD {num(report?.equity.total).toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-4 border-gray-300">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Liabilities & Equity</span>
                    <span className="text-purple-600">
                      KWD {num(report?.total_liabilities_and_equity).toFixed(3)}
                    </span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      report?.is_balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {report?.is_balanced ? (
                        <>✓ Balance Sheet is Balanced</>
                      ) : (
                        <>✗ Balance Sheet is NOT Balanced</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}