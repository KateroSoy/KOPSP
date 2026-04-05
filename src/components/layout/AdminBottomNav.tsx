import React from 'react';
import { LayoutDashboard, Users, FileText, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminBottomNavProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin_anggota', label: 'Anggota', icon: Users },
    { id: 'admin_pengajuan', label: 'Pengajuan', icon: FileText },
    { id: 'admin_menu', label: 'Lainnya', icon: Menu },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
