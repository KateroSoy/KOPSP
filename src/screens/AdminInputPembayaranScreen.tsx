import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Search, CheckCircle2 } from 'lucide-react';

interface AdminInputPembayaranScreenProps {
  onBack: () => void;
}

export const AdminInputPembayaranScreen: React.FC<AdminInputPembayaranScreenProps> = ({ onBack }) => {
  const { currentData, addPayment } = useData();
  const { notifyError, notifySuccess, notifyWarning } = useUiFeedback();
  const activeLoans = currentData && 'activeLoans' in currentData ? currentData.activeLoans : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Transfer' | 'Tunai'>('Transfer');
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setIsSuccess(false);
    setSelectedLoan(null);
    setAmount('');
    setMethod('Transfer');
    setNote('');
    setSearchQuery('');
  };

  const filteredLoans = activeLoans.filter((loan: any) =>
    loan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.memberId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val) {
      setAmount(formatRupiah(parseInt(val, 10)).replace('Rp', '').trim());
      return;
    }
    setAmount('');
  };

  const handlePickLoan = (loan: any) => {
    setSelectedLoan(loan);
    setAmount(formatRupiah(loan.installment).replace('Rp', '').trim());
    setMethod('Transfer');
    setNote('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) {
      notifyWarning('Pilih anggota terlebih dahulu');
      return;
    }
    if (!amount) {
      notifyWarning('Masukkan nominal pembayaran');
      return;
    }
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    if (numericAmount <= 0) {
      notifyWarning('Nominal pembayaran harus lebih dari 0');
      return;
    }
    if (numericAmount > selectedLoan.remaining) {
      notifyWarning('Nominal pembayaran tidak boleh melebihi sisa pinjaman');
      return;
    }

    try {
      await addPayment(selectedLoan.id, numericAmount, method, note);
      setIsSuccess(true);
      notifySuccess('Pembayaran berhasil dicatat', `Angsuran ${selectedLoan.name} sudah masuk ke sistem.`);
    } catch (error) {
      notifyError('Gagal mencatat pembayaran', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center px-6 max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Pembayaran Berhasil Dicatat!</h1>
        <p className="text-gray-500 mb-8">
          Angsuran untuk {selectedLoan?.name} sebesar Rp{amount} telah berhasil dimasukkan ke sistem.
        </p>
        <Button fullWidth size="lg" onClick={resetForm}>
          Input Pembayaran Lain
        </Button>
        <Button variant="ghost" fullWidth className="mt-2" onClick={onBack}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Input Pembayaran" showBack onBack={onBack} />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {!selectedLoan ? (
          <div className="space-y-4 animate-in fade-in">
            <Input
              placeholder="Cari nama atau no. anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={20} />}
            />

            <div className="space-y-3">
              {searchQuery && filteredLoans.map((loan: any) => (
                <Card
                  key={loan.id}
                  className="cursor-pointer hover:border-emerald-500 transition-colors"
                  onClick={() => handlePickLoan(loan)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{loan.name}</p>
                        <p className="text-xs text-gray-500">{loan.memberId}</p>
                      </div>
                      <span className="text-xs font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded-md whitespace-nowrap">
                        Angsuran: {formatRupiah(loan.installment)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Sisa Pinjaman: {formatRupiah(loan.remaining)}</p>
                  </CardContent>
                </Card>
              ))}
              {searchQuery && filteredLoans.length === 0 && (
                <p className="text-center text-gray-500 py-8">Tidak ditemukan pinjaman aktif untuk pencarian ini.</p>
              )}
              {!searchQuery && (
                <p className="text-center text-gray-500 py-8 text-sm">Ketik nama anggota untuk mencari pinjaman aktif.</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4">
            <Card className="bg-emerald-50 border-emerald-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-emerald-800">Anggota</p>
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="text-xs text-emerald-600 font-medium underline"
                  >
                    Ganti
                  </button>
                </div>
                <p className="font-bold text-gray-900">{selectedLoan.name}</p>
                <p className="text-sm text-gray-600">{selectedLoan.memberId}</p>
                <div className="mt-3 pt-3 border-t border-emerald-200/50 flex justify-between">
                  <span className="text-sm text-emerald-800">Tagihan Bulanan</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(selectedLoan.installment)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal Pembayaran</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-900">Rp</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full h-14 pl-12 pr-4 text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Transfer', 'Tunai'].map((paymentMethod) => (
                    <button
                      key={paymentMethod}
                      type="button"
                      onClick={() => setMethod(paymentMethod as 'Transfer' | 'Tunai')}
                      className={`py-3 rounded-xl border font-medium text-sm transition-colors ${
                        method === paymentMethod
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {paymentMethod}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Catatan (Opsional)"
                placeholder="Contoh: Pembayaran via BCA"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button type="submit" fullWidth size="lg">
              Simpan Pembayaran
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
