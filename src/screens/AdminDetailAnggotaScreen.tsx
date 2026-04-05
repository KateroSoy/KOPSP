import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { User, Phone, Wallet, CreditCard, History } from 'lucide-react';

interface AdminDetailAnggotaScreenProps {
  memberId: string;
  onBack: () => void;
}

export const AdminDetailAnggotaScreen: React.FC<AdminDetailAnggotaScreenProps> = ({ memberId, onBack }) => {
  const { currentData: mockData } = useData();
  const { members, activeLoans, transactions } = mockData;

  const member = members.find((m: any) => m.id === memberId);
  const activeLoan = activeLoans.find((l: any) => l.memberId === memberId);
  const memberTransactions = transactions.filter((t: any) => t.memberName === member?.name);

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title="Detail Anggota" showBack onBack={onBack} />
        <div className="p-8 text-center text-gray-500">Anggota tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Detail Anggota" showBack onBack={onBack} />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <User size={28} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{member.name}</h2>
                    <p className="text-sm text-gray-500">{member.id}</p>
                  </div>
                  <Badge variant={member.status === 'Aktif' ? 'success' : 'default'}>
                    {member.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <Phone size={14} className="mr-2 text-gray-400" />
                  {member.phone}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 px-1">Ringkasan Simpanan</h3>
          <Card className="bg-emerald-600 border-none text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <CardContent className="p-5 relative z-10 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Wallet size={24} className="text-white" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm mb-1">Total Simpanan</p>
                <h3 className="text-2xl font-bold">{formatRupiah(member.totalSavings)}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Loan Details */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 px-1">Pinjaman Aktif</h3>
          {activeLoan ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard size={18} className="text-orange-600" />
                    <span className="font-semibold text-gray-900">Pinjaman Aktif</span>
                  </div>
                  <Badge variant={activeLoan.status === 'Lancar' ? 'success' : activeLoan.status === 'Menunggak' ? 'danger' : 'warning'}>
                    {activeLoan.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Pinjaman</span>
                    <span className="font-medium text-gray-900">{formatRupiah(activeLoan.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sisa Pinjaman</span>
                    <span className="font-medium text-gray-900">{formatRupiah(activeLoan.remaining)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Angsuran/Bulan</span>
                    <span className="font-medium text-gray-900">{formatRupiah(activeLoan.installment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tenor</span>
                    <span className="font-medium text-gray-900">{activeLoan.paidMonths} / {activeLoan.tenor} Bulan</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jatuh Tempo Berikutnya</span>
                    <span className="font-medium text-gray-900">{formatDate(activeLoan.nextDueDate)}</span>
                  </div>
                  {activeLoan.status === 'Menunggak' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 font-medium">⚠️ Status Menunggak - Hubungi Anggota</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <CreditCard size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Tidak ada pinjaman aktif</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 px-1">Riwayat Transaksi</h3>
          <Card>
            <div className="divide-y divide-gray-100">
              {memberTransactions.length > 0 ? (
                memberTransactions.map((trx: any) => (
                  <div key={trx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trx.category === 'simpanan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {trx.category === 'simpanan' ? <Wallet size={18} /> : <CreditCard size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{trx.type}</p>
                        <p className="text-xs text-gray-500">{formatDate(trx.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${trx.category === 'simpanan' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {trx.category === 'simpanan' ? '+' : '-'}{formatRupiah(trx.amount)}
                      </p>
                      <Badge variant="success" className="mt-1 scale-90 origin-right">{trx.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <History size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
