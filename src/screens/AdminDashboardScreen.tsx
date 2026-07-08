import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Users, Wallet, CreditCard, FileText, ArrowRight, Activity, Megaphone, BarChart3 } from 'lucide-react';

interface AdminDashboardScreenProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onNavigate }) => {
  const { currentData: mockData } = useData();
  const { user, stats, loanApplications, transactions } = mockData;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Admin KSP" />

      <div className="p-4 md:p-8 max-w-md md:max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div>
          <p className="text-sm text-gray-500">Login sebagai Admin</p>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        </div>

        {/* Shortcut Actions */}
        <div className="grid grid-cols-4 gap-3 md:gap-6">
          <button onClick={() => onNavigate('admin_pengajuan')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 relative group-hover:bg-emerald-50 transition-colors">
              <FileText className="w-6 h-6 md:w-8 md:h-8" />
              {stats.pendingApplications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {stats.pendingApplications}
                </span>
              )}
            </div>
            <span className="text-[10px] md:text-sm font-medium text-gray-700 text-center leading-tight">Review<br className="md:hidden"/>Pengajuan</span>
          </button>
          <button onClick={() => onNavigate('admin_input_pembayaran')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-[10px] md:text-sm font-medium text-gray-700 text-center leading-tight">Input<br className="md:hidden"/>Pembayaran</span>
          </button>
          <button onClick={() => onNavigate('admin_anggota')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <Users className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-[10px] md:text-sm font-medium text-gray-700 text-center leading-tight">Data<br className="md:hidden"/>Anggota</span>
          </button>
          <button onClick={() => onNavigate('admin_pengumuman')} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <Megaphone className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-[10px] md:text-sm font-medium text-gray-700 text-center leading-tight">Buat<br className="md:hidden"/>Pengumuman</span>
          </button>
        </div>

        <div className="md:grid md:grid-cols-3 md:gap-8 space-y-6 md:space-y-0">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Total Anggota</p>
                  <p className="font-bold text-gray-900 text-lg md:text-2xl">{stats.totalMembers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Pinjaman Aktif</p>
                  <p className="font-bold text-gray-900 text-lg md:text-2xl">{stats.activeLoansCount}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-emerald-600 border-none text-white">
              <CardContent className="p-5 md:p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Wallet size={28} className="text-emerald-200" />
                  <h3 className="font-semibold text-lg">Ringkasan Finansial</h3>
                </div>
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                  <div>
                    <p className="text-emerald-200 text-sm mb-1">Total Simpanan Anggota</p>
                    <p className="font-bold text-2xl md:text-3xl">{formatRupiah(stats.totalSavings)}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm mb-1">Total Pinjaman Disalurkan</p>
                    <p className="font-bold text-2xl md:text-3xl">{formatRupiah(stats.totalLoans)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 md:text-lg">Aktivitas Terakhir</h3>
                <button onClick={() => onNavigate('admin_transaksi')} className="text-sm text-emerald-600 font-medium flex items-center hover:text-emerald-700">
                  Lihat Semua <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
              <Card>
                <div className="divide-y divide-gray-100">
                  {transactions.slice(0, 5).map((trx: any) => (
                    <div key={trx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm md:text-base text-gray-900">{trx.type}</p>
                        <p className="text-xs md:text-sm text-gray-500">{trx.memberName}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium text-sm md:text-base ${trx.category === 'simpanan' ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {trx.category === 'simpanan' ? '+' : '-'}{formatRupiah(trx.amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{trx.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 md:space-y-8">
            <button
              onClick={() => onNavigate('admin_laporan')}
              className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-4 md:p-6 text-left shadow-sm transition-colors hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 md:text-lg">Modul Laporan</p>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-2">Lihat ringkasan, anggota, simpanan, pinjaman, dan kas.</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-emerald-500 shrink-0" />
              </div>
            </button>

            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 md:text-lg">Pengajuan Terbaru</h3>
                <button onClick={() => onNavigate('admin_pengajuan')} className="text-sm text-emerald-600 font-medium flex items-center hover:text-emerald-700">
                  Semua <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
              <Card>
                <div className="divide-y divide-gray-100">
                  {loanApplications.slice(0, 4).map((loan: any) => (
                    <div key={loan.id} className="p-4 md:p-5 flex flex-col space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm md:text-base text-gray-900">{loan.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {loan.memberId}</p>
                        </div>
                        <Badge variant={loan.status === 'Baru' ? 'warning' : 'info'}>{loan.status}</Badge>
                      </div>
                      <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs md:text-sm text-gray-500">{loan.tenor} Bulan</span>
                        <span className="font-semibold text-gray-900 md:text-base">{formatRupiah(loan.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
