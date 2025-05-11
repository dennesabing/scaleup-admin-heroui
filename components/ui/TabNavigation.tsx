import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabNavigationProps) {
  return (
    <div className={`border-b border-default-200 ${className}`}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap
                ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-default-500 hover:text-default-700 hover:border-default-300"
                }
              `}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
