import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Wallet, TrendingUp, PiggyBank, Users, ArrowUpRight, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminSimpananScreenProps {
  onAddSimpanan: () => void;
}

export const AdminSimpananScreen: React.FC<AdminSimpananScreenProps> = ({ onAddSimpanan }) => {
  const { currentData: mockData } = useData();
  
  if (!mockData || !('members' in mockData)) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  const { members, transactions } = mockData;

  // Calculate totals from members data
  const totalPokok = members.reduce((acc: number, m: any) => acc + (m.totalSavingsPokok || 0), 0);
  const totalWajib = members.reduce((acc: number, m: any) => acc + (m.totalSavingsWajib || 0), 0);
  const totalSukarela = members.reduce((acc: number, m: any) => acc + (m.totalSavingsSukarela || 0), 0);
  const grandTotal = members.reduce((acc: number, m: any) => acc + (m.totalSavings || 0), 0);

  const savingsTransactions = transactions.filter((t: any) => t.category === 'simpanan');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Manajemen Simpanan" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        <Button 
          fullWidth 
          className="flex items-center justify-center" 
          onClick={onAddSimpanan}
        >
          <Plus size={20} className="mr-2" /> Tambah Simpanan
        </Button>

        {/* Total Summary Card */}
        <Card className="bg-emerald-600 border-none text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-emerald-100 text-sm mb-1">Total Simpanan Anggota</p>
            <h3 className="text-3xl font-bold mb-4">{formatRupiah(grandTotal)}</h3>
            <div className="flex items-center text-sm text-emerald-50">
              <Users size={16} className="mr-2" />
              <span>Dari {members.length} Anggota</span>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-1 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Wallet size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Simpanan Pokok</p>
                <p className="font-bold text-gray-900">{formatRupiah(totalPokok)}</p>
              </div>
              <div className="text-right">
                <Badge variant="info">Awal</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                <TrendingUp size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Simpanan Wajib</p>
                <p className="font-bold text-gray-900">{formatRupiah(totalWajib)}</p>
              </div>
              <div className="text-right">
                <Badge variant="warning">Bulanan</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                <PiggyBank size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Simpanan Sukarela</p>
                <p className="font-bold text-gray-900">{formatRupiah(totalSukarela)}</p>
              </div>
              <div className="text-right">
                <Badge variant="success">Fleksibel</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Aktivitas Simpanan</h3>
            <button className="text-sm text-emerald-600 font-medium flex items-center">
              Lihat Semua <History size={16} className="ml-1" />
            </button>
          </div>
          <Card>
            <div className="divide-y divide-gray-100">
              {savingsTransactions.length > 0 ? (
                savingsTransactions.slice(0, 5).map((trx: any) => (
                  <div key={trx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <ArrowUpRight size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{trx.memberName}</p>
                        <p className="text-xs text-gray-500">{trx.type} • {trx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600">+{formatRupiah(trx.amount)}</p>
                      <Badge variant="success" className="text-[10px] py-0">{trx.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Belum ada aktivitas simpanan.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
