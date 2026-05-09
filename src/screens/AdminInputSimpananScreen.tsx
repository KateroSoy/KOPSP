import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Search, CheckCircle2, Wallet } from 'lucide-react';

interface AdminInputSimpananScreenProps {
  onBack: () => void;
}

export const AdminInputSimpananScreen: React.FC<AdminInputSimpananScreenProps> = ({ onBack }) => {
  const { currentData, addSavingsDeposit } = useData();
  const { notifyError, notifySuccess, notifyWarning } = useUiFeedback();
  
  const members = currentData && 'members' in currentData ? currentData.members : [];
  const savingsProducts = currentData && 'masterData' in currentData ? currentData.masterData.jenisSimpanan : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setIsSuccess(false);
    setSelectedMember(null);
    setSelectedProductId('');
    setAmount('');
    setNote('');
    setSearchQuery('');
  };

  const filteredMembers = [...members]
    .filter((member: any) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.joinedDate || '').localeCompare(a.joinedDate || ''));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val) {
      setAmount(formatRupiah(parseInt(val, 10)).replace('Rp', '').trim());
      return;
    }
    setAmount('');
  };

  const handlePickMember = (member: any) => {
    setSelectedMember(member);
    if (savingsProducts.length > 0) {
      setSelectedProductId(savingsProducts[0].id);
      // Default amount if it's a fixed product
      if (savingsProducts[0].amount > 0) {
        setAmount(formatRupiah(savingsProducts[0].amount).replace('Rp', '').trim());
      }
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = savingsProducts.find(p => p.id === productId);
    if (product && product.amount > 0) {
      setAmount(formatRupiah(product.amount).replace('Rp', '').trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      notifyWarning('Pilih anggota terlebih dahulu');
      return;
    }
    if (!selectedProductId) {
      notifyWarning('Pilih jenis simpanan');
      return;
    }
    if (!amount) {
      notifyWarning('Masukkan nominal simpanan');
      return;
    }

    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    if (numericAmount <= 0) {
      notifyWarning('Nominal simpanan harus lebih dari 0');
      return;
    }

    try {
      await addSavingsDeposit({
        memberId: selectedMember.id,
        savingsProductId: selectedProductId,
        amount: numericAmount,
        note: note || null,
      });
      setIsSuccess(true);
      notifySuccess('Simpanan berhasil dicatat', `Setoran ${selectedMember.name} sudah masuk ke sistem.`);
    } catch (error) {
      notifyError('Gagal mencatat simpanan', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center px-6 max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Setoran Berhasil!</h1>
        <p className="text-gray-500 mb-8">
          Simpanan untuk {selectedMember?.name} sebesar Rp{amount} telah berhasil dicatat.
        </p>
        <Button fullWidth size="lg" onClick={resetForm}>
          Input Setoran Lain
        </Button>
        <Button variant="ghost" fullWidth className="mt-2" onClick={onBack}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Input Simpanan" showBack onBack={onBack} />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {!selectedMember ? (
          <div className="space-y-4 animate-in fade-in">
            <Input
              placeholder="Cari nama atau no. anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={20} />}
            />

            <div className="space-y-3">
              {filteredMembers.map((member: any) => (
                <Card
                  key={member.id}
                  className="cursor-pointer hover:border-emerald-500 transition-colors"
                  onClick={() => handlePickMember(member)}
                >
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.id}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-center text-gray-500 py-8">Anggota tidak ditemukan.</p>
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
                    onClick={() => setSelectedMember(null)}
                    className="text-xs text-emerald-600 font-medium underline"
                  >
                    Ganti
                  </button>
                </div>
                <p className="font-bold text-gray-900">{selectedMember.name}</p>
                <p className="text-sm text-gray-600">{selectedMember.id}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Jenis Simpanan</label>
                <select
                  className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih Jenis Simpanan</option>
                  {savingsProducts.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.amount > 0 ? `(${formatRupiah(product.amount)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal Setoran</label>
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

              <Input
                label="Catatan (Opsional)"
                placeholder="Keterangan setoran"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button type="submit" fullWidth size="lg">
              Simpan Setoran
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
