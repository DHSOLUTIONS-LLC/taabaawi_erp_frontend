import { useDispatch, useSelector } from 'react-redux';
import { BarChart2, FileText, Target } from 'lucide-react';
import { setActiveTab } from '../reportsSlice';

import DashboardLayout from '../../../layouts/DashboardLayout';
import type { RootState } from '../../../app/store';
import { OverviewTab } from '../components/tabs/Overviewtab';
import { SavedReportsTab } from '../components/tabs/Savedreportstab';
import { KpiTab } from '../components/tabs/Kpitab';

const TABS = [
  { id: 'overview', label: 'Overview',       icon: BarChart2 },
  { id: 'saved',    label: 'Saved Reports',  icon: FileText  },
  { id: 'kpis',     label: 'KPI Metrics',    icon: Target    },
] as const;

export const ReportsDashboard = () => {
  const dispatch   = useDispatch();
  const activeTab  = useSelector((s: RootState) => s.reports.activeTab);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pre-built reports, saved reports and KPI metrics</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => dispatch(setActiveTab(id))}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'saved'    && <SavedReportsTab />}
        {activeTab === 'kpis'     && <KpiTab />}

      </div>
    </DashboardLayout>
  );
};