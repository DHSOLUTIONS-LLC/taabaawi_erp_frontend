// src/features/help/components/HelpTabs.tsx
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface HelpTabsProps {
  tabs?: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const defaultTabs: Tab[] = [
  { id: 'categories', label: 'Categories' },
  { id: 'articles', label: 'Articles' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'saved', label: 'Saved' },
];

export default function HelpTabs({ 
  tabs = defaultTabs, 
  activeTab, 
  onTabChange 
}: HelpTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`
                ml-2 py-0.5 px-2 rounded-full text-xs
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}