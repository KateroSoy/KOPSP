import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useData } from '@/context/DataContext';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Search, Printer, FileText, ChevronLeft, Calendar, Download, PiggyBank } from 'lucide-react';

interface AdminCetakMutasiScreenProps {
  onBack: () => void;
}

export const AdminCetakMutasiScreen: React.FC<AdminCetakMutasiScreenProps> = ({ onBack }) => {
  const { currentData: mockData } = useData();
  const { members, transactions } = mockData as any;
  
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredMembers = (members || []).filter((m: any) => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const memberTransactions = selectedMember ? (transactions || [])
    .filter((t: any) => t.memberId === selectedMember.id && t.category === 'simpanan')
    .filter((t: any) => t.date >= startDate && t.date <= endDate)
    .sort((a: any, b: any) => a.date.localeCompare(b.date)) : [];

  // Calculate balance progression
  let runningBalance = 0;
  const transactionsWithBalance = memberTransactions.map((t: any) => {
    runningBalance += t.amount;
    return { ...t, balance: runningBalance };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="print:hidden">
        <TopBar title="Cetak Mutasi Tabungan" />
      </div>

      <div className="p-4 max-w-md md:max-w-5xl mx-auto space-y-6 print:p-0 print:max-w-none print:bg-white">
        
        {/* Member Selection (Hidden on Print) */}
        {!selectedMember ? (
          <div className="space-y-4 print:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Cari nama atau ID anggota..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              {filteredMembers.map((member: any) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="w-full text-left p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-emerald-500 transition-all"
                >
                  <p className="font-bold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.id} • {formatRupiah(member.totalSavings)}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Header (Hidden on Print) */}
            <Card className="print:hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedMember.name}</p>
                      <p className="text-xs text-gray-500">{selectedMember.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMember(null)}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Ganti Anggota
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Dari Tanggal</label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Sampai Tanggal</label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                    />
                  </div>
                </div>

                <Button fullWidth onClick={handlePrint} className="gap-2">
                  <Printer size={18} /> Cetak Mutasi
                </Button>
              </CardContent>
            </Card>

            {/* Printable Statement Area */}
            <div id="mutasi-print-area" className="bg-white p-8 border border-gray-200 rounded-2xl shadow-sm print:shadow-none print:border-none print:p-0">
              {/* Bank Style Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-700 font-black text-2xl">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded flex items-center justify-center">
                      <PiggyBank size={20} />
                    </div>
                    <span>KSP</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Koperasi Simpan Pinjam</p>
                </div>
                <div className="text-right">
                  <h1 className="text-lg font-black uppercase tracking-tighter">Mutasi Rekening</h1>
                  <p className="text-[10px] text-gray-500 italic">Periode: {formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
              </div>

              {/* Member Info Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-gray-100 py-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Nama Anggota</p>
                  <p className="font-bold text-gray-900">{selectedMember.name}</p>
                  <p className="text-[10px] text-gray-500">{selectedMember.address || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex justify-end space-x-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">No. Rekening</p>
                      <p className="font-bold text-gray-900">{selectedMember.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Mata Uang</p>
                      <p className="font-bold text-gray-900">IDR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead className="border-b-2 border-gray-900">
                    <tr>
                      <th className="py-2 text-left w-20">TANGGAL</th>
                      <th className="py-2 text-left">KETERANGAN</th>
                      <th className="py-2 text-right">MUTASI</th>
                      <th className="py-2 text-right">SALDO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactionsWithBalance.length > 0 ? (
                      transactionsWithBalance.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 text-gray-500 font-bold">{t.date.split('-').slice(1).reverse().join('/')}</td>
                          <td className="py-3 pr-4">
                            <p className="font-bold uppercase text-[10px]">{t.type}</p>
                            <p className="text-[9px] text-gray-400 italic leading-tight">{t.note || 'Transaksi Simpanan'}</p>
                          </td>
                          <td className="py-3 text-right font-bold text-emerald-600">
                            {formatRupiah(t.amount).replace('Rp', '').trim()} CR
                          </td>
                          <td className="py-3 text-right font-bold">
                            {formatRupiah(t.balance).replace('Rp', '').trim()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">Tidak ada mutasi pada periode ini</td>
                      </tr>
                    )}
                  </tbody>
                  {transactionsWithBalance.length > 0 && (
                    <tfoot className="border-t-2 border-gray-900">
                      <tr>
                        <td colSpan={3} className="py-3 font-bold uppercase">Saldo Akhir</td>
                        <td className="py-3 text-right font-black text-emerald-700">
                          {formatRupiah(transactionsWithBalance[transactionsWithBalance.length - 1].balance)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Print Footer */}
              <div className="mt-12 text-[10px] text-gray-400 italic text-center space-y-1">
                <p>Dokumen ini adalah bukti sah mutasi rekening simpanan Anda.</p>
                <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #mutasi-print-area, #mutasi-print-area * {
            visibility: visible;
          }
          #mutasi-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      ` }} />
    </div>
  );
};
