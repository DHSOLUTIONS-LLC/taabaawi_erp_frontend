// src/features/accounting/components/ReportHeader.tsx
interface ReportHeaderProps {
  title: string;
  subtitle?: string;
}

export default function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  return (
    <div className="mb-6 text-center print:mb-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      <div className="border-b-2 border-gray-200 mt-3" />
    </div>
  );
}