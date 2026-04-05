import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Wallet, CreditCard } from 'lucide-react';

export const AdminTransaksiScreen: React.FC = () => {
  const { currentData: mockData } = useData();
  const { transactions } = mockData;
  const [filter, setFilter] = useState<'semua' | 'simpanan' | 'pinjaman'>('semua');

  const filteredTransactions = transactions?.filter((trx: any) => 
    filter === 'semua' ? true : trx.category === filter
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Semua Transaksi" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {['semua', 'simpanan', 'pinjaman'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <Card>
          <div className="divide-y divide-gray-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((trx: any) => (
                <div key={trx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trx.category === 'simpanan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {trx.category === 'simpanan' ? <Wallet size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{trx.type}</p>
                      <p className="text-xs text-gray-500">{trx.memberName} • {formatDate(trx.date)}</p>
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
              <div className="p-8 text-center text-gray-500">
                Belum ada transaksi
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
