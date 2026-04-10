// src/features/accounting/components/DateRangePicker.tsx
import { useState } from 'react';
import date_icon from '../../../assets/icons/date_icon.svg';
import dropdown_arrow_icon from '../../../assets/icons/dropdown_arrow_icon.svg';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  asOfDate: string;
  onChange: (range: { start_date: string; end_date: string; as_of_date: string }) => void;
}

const PRESET_RANGES = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: -1 },
  { label: 'Last 7 Days', days: -7 },
  { label: 'Last 30 Days', days: -30 },
  { label: 'This Month', custom: 'this-month' },
  { label: 'Last Month', custom: 'last-month' },
  { label: 'This Quarter', custom: 'this-quarter' },
  { label: 'Last Quarter', custom: 'last-quarter' },
  { label: 'This Year', custom: 'this-year' },
  { label: 'Last Year', custom: 'last-year' },
];

export default function DateRangePicker({ startDate, endDate, asOfDate, onChange }: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [mode, setMode] = useState<'range' | 'asof'>('range');

  const applyPreset = (preset: typeof PRESET_RANGES[0]) => {
    const today = new Date();
    let newStartDate = new Date();
    let newEndDate = new Date();

    if (preset.custom) {
      const year = today.getFullYear();
      const month = today.getMonth();
      
      switch (preset.custom) {
        case 'this-month':
          newStartDate = new Date(year, month, 1);
          newEndDate = new Date(year, month + 1, 0);
          break;
        case 'last-month':
          newStartDate = new Date(year, month - 1, 1);
          newEndDate = new Date(year, month, 0);
          break;
        case 'this-quarter':
          const quarter = Math.floor(month / 3);
          newStartDate = new Date(year, quarter * 3, 1);
          newEndDate = new Date(year, quarter * 3 + 3, 0);
          break;
        case 'last-quarter':
          const lastQuarter = Math.floor(month / 3) - 1;
          newStartDate = new Date(year, lastQuarter * 3, 1);
          newEndDate = new Date(year, lastQuarter * 3 + 3, 0);
          break;
        case 'this-year':
          newStartDate = new Date(year, 0, 1);
          newEndDate = new Date(year, 11, 31);
          break;
        case 'last-year':
          newStartDate = new Date(year - 1, 0, 1);
          newEndDate = new Date(year - 1, 11, 31);
          break;
      }
    } else if (preset.days !== undefined) {
      if (preset.days === 0) {
        newStartDate = today;
        newEndDate = today;
      } else if (preset.days === -1) {
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 1);
        newEndDate = new Date(today);
        newEndDate.setDate(today.getDate() - 1);
      } else {
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() + preset.days);
        newEndDate = today;
      }
    }

    onChange({
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate.toISOString().split('T')[0],
      as_of_date: today.toISOString().split('T')[0],
    });
    setShowPresets(false);
  };

  // Desktop Layout (md and above)
  return (
    <>
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-4">
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('range')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Date Range
          </button>
          <button
            onClick={() => setMode('asof')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'asof' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            As of Date
          </button>
        </div>

        {/* Date Inputs */}
        {mode === 'range' ? (
          <>
            <div className="relative">
              <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChange({ start_date: e.target.value, end_date: endDate, as_of_date: asOfDate })}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative">
              <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onChange({ start_date: startDate, end_date: e.target.value, as_of_date: asOfDate })}
                min={startDate}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        ) : (
          <div className="relative">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => onChange({ start_date: startDate, end_date: endDate, as_of_date: e.target.value })}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Preset Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>Quick Select</span>
            <img src={dropdown_arrow_icon} alt="" className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
          </button>

          {showPresets && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-1">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile View - Visible only below md, stacked layout */}
      <div className="md:hidden w-full">
        {/* Mode Toggle - Full width */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
          <button
            onClick={() => setMode('range')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Date Range
          </button>
          <button
            onClick={() => setMode('asof')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'asof' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            As of Date
          </button>
        </div>

        {/* Date Inputs - Stacked vertically */}
        {mode === 'range' ? (
          <div className="space-y-3 mb-3">
            <div className="relative w-full">
              <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChange({ start_date: e.target.value, end_date: endDate, as_of_date: asOfDate })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative w-full">
              <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onChange({ start_date: startDate, end_date: e.target.value, as_of_date: asOfDate })}
                min={startDate}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="relative w-full mb-3">
            <img src={date_icon} alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => onChange({ start_date: startDate, end_date: endDate, as_of_date: e.target.value })}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Preset Dropdown - Full width */}
        <div className="relative w-full">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>Quick Select</span>
            <img src={dropdown_arrow_icon} alt="" className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
          </button>

          {showPresets && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}