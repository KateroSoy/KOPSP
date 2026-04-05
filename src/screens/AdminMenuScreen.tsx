import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useData } from '@/context/DataContext';
import { CreditCard, History, Megaphone, Settings, LogOut, ChevronRight, User } from 'lucide-react';

interface AdminMenuScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export const AdminMenuScreen: React.FC<AdminMenuScreenProps> = ({ onNavigate, onLogout }) => {
  const { currentData: mockData } = useData();
  const { user } = mockData;

  const menuItems = [
    { id: 'admin_master_data', label: 'Master Data', icon: Settings, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'admin_pinjaman_aktif', label: 'Pinjaman Aktif', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'admin_transaksi', label: 'Semua Transaksi', icon: History, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'admin_pengumuman', label: 'Kelola Pengumuman', icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'admin_pengaturan', label: 'Pengaturan Admin', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Menu Lainnya" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.role.toUpperCase()} • {user.memberId}</p>
          </div>
        </div>

        {/* Menu List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 px-1">Operasional</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-gray-100">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                        <Icon size={20} />
                      </div>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="text-gray-400" size={20} />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="pt-6">
          <Button variant="danger" fullWidth onClick={onLogout} className="flex items-center justify-center">
            <LogOut size={20} className="mr-2" />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
};
