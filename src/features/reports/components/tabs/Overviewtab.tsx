import { PreBuiltReportViewer } from '../PreBuiltReportViewer';

export const OverviewTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Pre-Built Reports</h2>
        <PreBuiltReportViewer />
      </div>
    </div>
  );
};