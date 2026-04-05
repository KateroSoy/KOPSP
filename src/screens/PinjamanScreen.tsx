import React from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Calendar, AlertCircle, CreditCard } from 'lucide-react';

interface PinjamanScreenProps {
  onAjukan: () => void;
}

export const PinjamanScreen: React.FC<PinjamanScreenProps> = ({ onAjukan }) => {
  const { currentData: mockData } = useData();
  const { activeLoan } = mockData;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Pinjaman Saya" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {activeLoan ? (
          <>
            <Card className="overflow-hidden">
              <div className="bg-emerald-600 p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-emerald-100 text-sm mb-1">Sisa Pinjaman</p>
                    <h3 className="text-3xl font-bold">{formatRupiah(activeLoan.remaining)}</h3>
                  </div>
                  <Badge variant="info" className="bg-white/20 text-white border-none">
                    {activeLoan.status}
                  </Badge>
                </div>
                <div className="w-full bg-emerald-800/50 rounded-full h-2 mb-2">
                  <div 
                    className="bg-white h-2 rounded-full" 
                    style={{ width: `${(activeLoan.paidMonths / activeLoan.tenor) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-emerald-100">
                  Telah dibayar {activeLoan.paidMonths} dari {activeLoan.tenor} bulan
                </p>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Pinjaman</p>
                    <p className="font-semibold text-gray-900">{formatRupiah(activeLoan.amount)}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Angsuran per Bulan</p>
                    <p className="font-semibold text-gray-900">{formatRupiah(activeLoan.installment)}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center space-x-3 bg-orange-50/50">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Jatuh Tempo Berikutnya</p>
                    <p className="font-semibold text-gray-900">12 Mei 2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-800">
                Anda memiliki pinjaman aktif. Pengajuan pinjaman baru hanya dapat dilakukan setelah pinjaman saat ini lunas.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <CreditCard size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Pinjaman</h3>
            <p className="text-gray-500 text-sm mb-8 px-4">
              Anda belum memiliki pinjaman aktif saat ini. Ajukan pinjaman dengan mudah dan cepat.
            </p>
            <Button onClick={onAjukan}>Ajukan Pinjaman</Button>
          </div>
        )}
      </div>
    </div>
  );
};
