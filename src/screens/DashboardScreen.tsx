import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Wallet, CreditCard, History, User, ArrowRight } from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
  onNotification: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, onNotification }) => {
  const { currentData: mockData } = useData();
  const { user, savings, activeLoan, recentTransactions, notifications } = mockData;
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar 
        title="Koperasi Simpan Pinjam" 
        showNotification 
        onNotification={onNotification}
        unreadCount={unreadCount}
      />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-sm text-gray-500">Halo, selamat datang</p>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        </div>

        {/* Total Savings Card */}
        <Card className="bg-emerald-600 border-none text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-emerald-100 text-sm mb-1">Total Simpanan</p>
            <h3 className="text-3xl font-bold mb-4">{formatRupiah(savings.total)}</h3>
            <div className="flex items-center text-sm text-emerald-50">
              <span>No. Anggota: {user.memberId}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => onNavigate('simpanan')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <Wallet size={24} />
            </div>
            <span className="text-xs font-medium text-gray-700">Simpanan</span>
          </button>
          <button onClick={() => onNavigate('pinjaman')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <CreditCard size={24} />
            </div>
            <span className="text-xs font-medium text-gray-700">Pinjaman</span>
          </button>
          <button onClick={() => onNavigate('riwayat')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <History size={24} />
            </div>
            <span className="text-xs font-medium text-gray-700">Riwayat</span>
          </button>
          <button onClick={() => onNavigate('akun')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <User size={24} />
            </div>
            <span className="text-xs font-medium text-gray-700">Profil</span>
          </button>
        </div>

        {/* Active Loan Summary */}
        {activeLoan && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Pinjaman Aktif</h3>
              <button onClick={() => onNavigate('pinjaman')} className="text-sm text-emerald-600 font-medium flex items-center">
                Detail <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sisa Pinjaman</p>
                  <p className="font-bold text-gray-900">{formatRupiah(activeLoan.remaining)}</p>
                </div>
                <div className="text-right">
                  <Badge variant="info" className="mb-1">{activeLoan.status}</Badge>
                  <p className="text-xs text-gray-500">Jatuh tempo: {activeLoan.nextDueDate}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Transaksi Terakhir</h3>
            <button onClick={() => onNavigate('riwayat')} className="text-sm text-emerald-600 font-medium flex items-center">
              Lihat Semua <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <Card>
            <div className="divide-y divide-gray-100">
              {recentTransactions.slice(0, 3).map((trx: any) => (
                <div key={trx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.category === 'simpanan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {trx.category === 'simpanan' ? <Wallet size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{trx.type}</p>
                      <p className="text-xs text-gray-500">{trx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${trx.category === 'simpanan' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {trx.category === 'simpanan' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
