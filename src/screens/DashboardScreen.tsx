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

      <div className="p-4 md:p-8 max-w-md md:max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-sm text-gray-500">Halo, selamat datang</p>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          {/* Total Savings Card */}
          <Card id="tour-saldo" className="bg-emerald-600 border-none text-white overflow-hidden relative h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
              <p className="text-emerald-100 text-sm md:text-base mb-1">Total Simpanan</p>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">{formatRupiah(savings.total)}</h3>
              <div className="flex items-center text-sm text-emerald-50 mt-auto">
                <span>No. Anggota: {user.memberId}</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Loan Summary */}
          {activeLoan ? (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 md:text-lg">Pinjaman Aktif</h3>
                <button onClick={() => onNavigate('pinjaman')} className="text-sm text-emerald-600 font-medium flex items-center hover:text-emerald-700 transition-colors">
                  Detail <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
              <Card className="flex-1">
                <CardContent className="p-4 md:p-6 flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm md:text-base text-gray-500 mb-1">Sisa Pinjaman</p>
                    <p className="font-bold text-gray-900 text-lg md:text-2xl">{formatRupiah(activeLoan.remaining)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" className="mb-2 md:mb-3">{activeLoan.status}</Badge>
                    <p className="text-xs md:text-sm text-gray-500">Jatuh tempo:<br className="md:hidden" /> {activeLoan.nextDueDate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}
        </div>

        {/* Quick Actions */}
        <div id="tour-quick-actions" className="grid grid-cols-4 gap-3 md:gap-6">
          <button onClick={() => onNavigate('simpanan')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <Wallet className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">Simpanan</span>
          </button>
          <button onClick={() => onNavigate('pinjaman')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">Pinjaman</span>
          </button>
          <button onClick={() => onNavigate('riwayat')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <History className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">Riwayat</span>
          </button>
          <button onClick={() => onNavigate('akun')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <User className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700">Profil</span>
          </button>
        </div>

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
