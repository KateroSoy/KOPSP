import React from 'react';
import { Home, Wallet, CreditCard, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onChange, className }) => {
  const { logout } = useData();
  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'simpanan', label: 'Simpanan', icon: Wallet },
    { id: 'pinjaman', label: 'Pinjaman', icon: CreditCard },
    { id: 'akun', label: 'Akun', icon: User },
  ];

  return (
    <div id="tour-nav" className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full", className)}>
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-emerald-600">SimpanPinjam</h1>
      </div>
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center w-full px-4 py-3 rounded-xl transition-colors space-x-3",
                isActive 
                  ? "bg-emerald-50 text-emerald-600 font-medium" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => logout()}
          className="flex items-center w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors space-x-3 font-medium"
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};
