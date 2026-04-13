import { useDispatch, useSelector } from 'react-redux';
import { BarChart2, FileText, Target, ChevronDown } from 'lucide-react';
import { setActiveTab } from '../reportsSlice';
import { useState } from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import type { RootState } from '../../../app/store';
import { OverviewTab } from '../components/tabs/Overviewtab';
import { SavedReportsTab } from '../components/tabs/Savedreportstab';
import { KpiTab } from '../components/tabs/Kpitab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'saved', label: 'Saved Reports', icon: FileText },
  { id: 'kpis', label: 'KPI Metrics', icon: Target },
] as const;

export const ReportsDashboard = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector((s: RootState) => s.reports.activeTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTabLabel = TABS.find(t => t.id === activeTab)?.label || 'Overview';

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto px-2 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-4">
          
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Pre-built reports, saved reports and KPI metrics</p>
          </div>

          {/* Mobile Tab Selector */}
          <div className="sm:hidden mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = TABS.find(t => t.id === activeTab)?.icon || BarChart2;
                  return <Icon className="h-4 w-4 text-blue-600" />;
                })()}
                <span className="text-sm font-medium text-gray-900">{activeTabLabel}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        dispatch(setActiveTab(id));
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                        ${activeTab === id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                        ${id !== TABS[TABS.length - 1].id ? 'border-b border-gray-100' : ''}
                      `}
                    >
                      <Icon className={`h-4 w-4 ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium">{label}</span>
                      {activeTab === id && (
                        <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:block mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-6 md:space-x-8">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => dispatch(setActiveTab(id))}
                    className={`
                      flex items-center gap-2 px-1 py-3 border-b-2 text-sm font-medium transition-all duration-200
                      ${activeTab === id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'saved' && <SavedReportsTab />}
            {activeTab === 'kpis' && <KpiTab />}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};