import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { CreditCard } from 'lucide-react';

export const AdminPinjamanAktifScreen: React.FC = () => {
  const { currentData: mockData } = useData();
  const { activeLoans } = mockData;
  const [filter, setFilter] = useState<'semua' | 'lancar' | 'menunggak'>('semua');

  const filteredLoans = activeLoans?.filter((loan: any) => {
    if (filter === 'semua') return true;
    if (filter === 'lancar') return loan.status === 'Lancar';
    if (filter === 'menunggak') return loan.status === 'Menunggak';
    return true;
  }) || [];

  const lancarCount = activeLoans?.filter((l: any) => l.status === 'Lancar').length || 0;
  const menunggakCount = activeLoans?.filter((l: any) => l.status === 'Menunggak').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Pinjaman Aktif" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'semua', label: 'Semua', count: activeLoans?.length || 0 },
            { id: 'lancar', label: 'Lancar', count: lancarCount },
            { id: 'menunggak', label: 'Menunggak', count: menunggakCount }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors relative ${
                filter === f.id 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === f.id ? 'bg-white/30' : f.id === 'menunggak' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredLoans.length > 0 ? (
            filteredLoans.map((loan: any) => (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <CreditCard size={16} className="text-emerald-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{loan.name}</h3>
                        <p className="text-xs text-gray-500">{loan.memberId}</p>
                      </div>
                    </div>
                    <Badge variant={loan.status === 'Lancar' ? 'success' : 'danger'}>
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Pinjaman</span>
                      <span className="font-medium text-gray-900">{formatRupiah(loan.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sisa Pinjaman</span>
                      <span className="font-medium text-gray-900">{formatRupiah(loan.remaining)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Angsuran/Bulan</span>
                      <span className="font-medium text-gray-900">{formatRupiah(loan.installment)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tenor</span>
                      <span className="font-medium text-gray-900">{loan.paidMonths} / {loan.tenor} Bulan</span>
                    </div>
                    {loan.status === 'Menunggak' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700 font-medium">⚠️ Menunggak - Hubungi segera</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CreditCard size={32} className="mx-auto mb-3 text-gray-300" />
              <p>Tidak ada pinjaman aktif</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
