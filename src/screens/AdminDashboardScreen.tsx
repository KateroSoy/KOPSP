import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Users, Wallet, CreditCard, FileText, ArrowRight, Activity, Megaphone } from 'lucide-react';

interface AdminDashboardScreenProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onNavigate }) => {
  const { currentData: mockData } = useData();
  const { user, stats, loanApplications, transactions } = mockData;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Admin KSP" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-500">Login sebagai Admin</p>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        </div>

        {/* Shortcut Actions */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => onNavigate('admin_pengajuan')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 relative">
              <FileText size={24} />
              {stats.pendingApplications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {stats.pendingApplications}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">Review<br/>Pengajuan</span>
          </button>
          <button onClick={() => onNavigate('admin_input_pembayaran')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <CreditCard size={24} />
            </div>
            <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">Input<br/>Pembayaran</span>
          </button>
          <button onClick={() => onNavigate('admin_anggota')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">Data<br/>Anggota</span>
          </button>
          <button onClick={() => onNavigate('admin_pengumuman')} className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <Megaphone size={24} />
            </div>
            <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">Buat<br/>Pengumuman</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <Users size={20} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Total Anggota</p>
              <p className="font-bold text-gray-900">{stats.totalMembers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <Activity size={20} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Pinjaman Aktif</p>
              <p className="font-bold text-gray-900">{stats.activeLoansCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-emerald-600 border-none text-white">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3 mb-4">
              <Wallet size={24} className="text-emerald-200" />
              <h3 className="font-semibold">Ringkasan Finansial</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-emerald-200 text-xs">Total Simpanan Anggota</p>
                <p className="font-bold text-lg">{formatRupiah(stats.totalSavings)}</p>
              </div>
              <div>
                <p className="text-emerald-200 text-xs">Total Pinjaman Disalurkan</p>
                <p className="font-bold text-lg">{formatRupiah(stats.totalLoans)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Pengajuan Terbaru</h3>
            <button onClick={() => onNavigate('admin_pengajuan')} className="text-sm text-emerald-600 font-medium flex items-center">
              Lihat Semua <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <Card>
            <div className="divide-y divide-gray-100">
              {loanApplications.slice(0, 2).map((loan: any) => (
                <div key={loan.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{loan.name}</p>
                    <p className="text-xs text-gray-500">{formatRupiah(loan.amount)} • {loan.tenor} bln</p>
                  </div>
                  <Badge variant={loan.status === 'Baru' ? 'warning' : 'info'}>{loan.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Aktivitas Terakhir</h3>
            <button onClick={() => onNavigate('admin_transaksi')} className="text-sm text-emerald-600 font-medium flex items-center">
              Lihat Semua <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <Card>
            <div className="divide-y divide-gray-100">
              {transactions.slice(0, 3).map((trx: any) => (
                <div key={trx.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{trx.type}</p>
                    <p className="text-xs text-gray-500">{trx.memberName}</p>
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
