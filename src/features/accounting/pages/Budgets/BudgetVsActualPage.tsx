// src/features/accounting/pages/budgets/BudgetVsActualPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import { useAppSelector } from '../../../../app/hooks';
import type { RootState } from '../../../../app/store';
import { useGetBudgetVsActualQuery } from '../../../../services/accountingApi';
import ReportHeader from '../../components/ReportHeader';
import ReportActions from '../../components/ReportActions';

import arrow_back_icon from '../../../../assets/icons/arrow_back_icon.svg';

const num = (v: any) => parseFloat(v) || 0;

export default function BudgetVsActualPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);

  const isSuperAdmin = user?.role?.role_name === 'Super Admin';
  const basePath = isSuperAdmin ? '/admin' : '';

  const budgetId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, refetch } = useGetBudgetVsActualQuery(budgetId);
  console.log('budget lines:', data)

  const report = (data as any)?.data;

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting budget vs actual as ${format}`);
  };

  const handlePrint = () => {
    window.print();
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

  if (!report) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-500 font-medium">Report not found</p>
          <button
            onClick={() => navigate(`${basePath}/accounting/budgets/${budgetId}`)}
            className="mt-4 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Back to Budget
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`${basePath}/accounting/budgets/${budgetId}`)}>
              <img src={arrow_back_icon} alt="" className="w-8 h-8" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budget vs Actual</h1>
              <p className="text-sm text-gray-500 mt-1">{report.budget_name} · {report.fiscal_year}</p>
            </div>
          </div>
          <ReportActions
            onExport={handleExport}
            onPrint={handlePrint}
            onRefresh={refetch}
          />
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <ReportHeader
            title={`Budget vs Actual: ${report.budget_name}`}
            subtitle={`Period: ${report.period}`}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Total Budget</p>
              <p className="text-xl font-bold text-gray-900">
                KWD {num(report.total_budget).toFixed(3)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Total Actual</p>
              <p className="text-xl font-bold text-blue-600">
                KWD {num(report.total_actual).toFixed(3)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Variance</p>
              <p className={`text-xl font-bold ${
                num(report.total_variance) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {num(report.total_variance) >= 0 ? '+' : ''}{num(report.total_variance).toFixed(3)}
              </p>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Utilization</span>
              <span className="text-sm font-medium text-gray-900">
                {report.utilization_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  report.utilization_percentage > 100 ? 'bg-red-500' :
                  report.utilization_percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(report.utilization_percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Details Table */}
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Budget</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actual</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Variance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Variance %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.lines.map((line: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{line.account_name}</div>
                    <div className="text-xs text-gray-500">{line.account_code} · {line.account_type}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-900">
                    KWD {num(line.budgeted_amount).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-blue-600">
                    KWD {num(line.actual_amount).toFixed(3)}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-mono font-medium ${
                    line.variance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {line.variance >= 0 ? '+' : ''}{num(line.variance).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                    {line.variance_percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            line.utilization_percentage > 100 ? 'bg-red-500' :
                            line.utilization_percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(line.utilization_percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">
                        {line.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-sm font-mono font-bold text-gray-900">
                  KWD {num(report.total_budget).toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-600">
                  KWD {num(report.total_actual).toFixed(3)}
                </td>
                <td className={`px-4 py-3 text-right text-sm font-mono font-bold ${
                  num(report.total_variance) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {num(report.total_variance) >= 0 ? '+' : ''}{num(report.total_variance).toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono font-bold text-gray-900">
                  {report.total_budget > 0 
                    ? ((num(report.total_variance) / num(report.total_budget)) * 100).toFixed(1)
                    : '0'}%
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}