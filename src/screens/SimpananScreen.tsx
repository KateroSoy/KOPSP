import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Wallet, TrendingUp, Shield, PiggyBank } from 'lucide-react';

export const SimpananScreen: React.FC = () => {
  const { currentData: mockData } = useData();
  const { savings } = mockData;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Simpanan Saya" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        <Card className="bg-emerald-600 border-none text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-emerald-100 text-sm mb-1">Total Simpanan</p>
            <h3 className="text-3xl font-bold">{formatRupiah(savings.total)}</h3>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 px-1">Rincian Simpanan</h3>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Shield size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Simpanan Pokok</p>
                <p className="font-bold text-gray-900">{formatRupiah(savings.pokok)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                <TrendingUp size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Simpanan Wajib</p>
                <p className="font-bold text-gray-900">{formatRupiah(savings.wajib)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                <PiggyBank size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Simpanan Sukarela</p>
                <p className="font-bold text-gray-900">{formatRupiah(savings.sukarela)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-4">
          <p className="text-xs text-center text-gray-500">
            Simpanan pokok dan wajib tidak dapat ditarik selama masih menjadi anggota koperasi.
          </p>
        </div>
      </div>
    </div>
  );
};
