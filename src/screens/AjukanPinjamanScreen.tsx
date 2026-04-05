import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { CheckCircle2 } from 'lucide-react';

interface AjukanPinjamanScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AjukanPinjamanScreen: React.FC<AjukanPinjamanScreenProps> = ({ onBack, onSuccess }) => {
  const { currentData: mockData, addLoanApplication } = useData();
  const { notifyError } = useUiFeedback();
  const { user } = mockData;
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState(6);
  const [purpose, setPurpose] = useState('');

  const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;
  const adminFee = numericAmount * 0.01; // 1% admin fee
  const installment = numericAmount > 0 ? Math.ceil((numericAmount + (numericAmount * 0.02 * tenor)) / tenor) : 0; // 2% flat interest per month

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      try {
        await addLoanApplication({
          amount: numericAmount,
          tenor: tenor,
          purpose: purpose,
        });
        onSuccess();
      } catch (error) {
        notifyError('Pengajuan pinjaman gagal dikirim', error instanceof Error ? error.message : 'Silakan coba lagi.');
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val) {
      setAmount(formatRupiah(parseInt(val)).replace('Rp', '').trim());
    } else {
      setAmount('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Ajukan Pinjaman" showBack onBack={step === 1 ? onBack : () => setStep(step - 1)} />

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= i ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i ? <CheckCircle2 size={16} /> : i}
              </div>
              {i < 4 && (
                <div className={`flex-1 h-1 mx-2 rounded-full ${
                  step > i ? 'bg-emerald-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Berapa nominal yang Anda butuhkan?</h2>
              <p className="text-sm text-gray-500">Maksimal pinjaman Anda saat ini adalah Rp10.000.000</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-900">Rp</span>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="w-full h-16 pl-12 pr-4 text-2xl font-bold text-gray-900 bg-white border-2 border-emerald-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1000000, 2000000, 5000000, 10000000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(formatRupiah(val).replace('Rp', '').trim())}
                  className="py-3 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-emerald-600 hover:text-emerald-600 transition-colors"
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pilih jangka waktu (tenor)</h2>
              <p className="text-sm text-gray-500">Pilih tenor yang sesuai dengan kemampuan Anda</p>
            </div>
            <div className="space-y-3">
              {[3, 6, 12, 24].map((t) => (
                <button
                  key={t}
                  onClick={() => setTenor(t)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-colors flex justify-between items-center ${
                    tenor === t ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-emerald-200'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{t} Bulan</p>
                    <p className="text-sm text-gray-500">Bunga flat 2%/bulan</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Estimasi Angsuran</p>
                    <p className="font-bold text-emerald-600">
                      {formatRupiah(Math.ceil((numericAmount + (numericAmount * 0.02 * t)) / t))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Apa tujuan pinjaman ini?</h2>
              <p className="text-sm text-gray-500">Pilih atau tuliskan tujuan penggunaan dana</p>
            </div>
            <div className="space-y-3">
              {['Modal Usaha', 'Pendidikan', 'Renovasi Rumah', 'Kesehatan'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                    purpose === p ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800' : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-200'
                  }`}
                >
                  <span className="font-medium">{p}</span>
                </button>
              ))}
            </div>
            <Input
              label="Tujuan Lainnya (Opsional)"
              placeholder="Tuliskan tujuan lainnya..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ringkasan Pengajuan</h2>
              <p className="text-sm text-gray-500">Periksa kembali detail pengajuan Anda</p>
            </div>
            
            <Card>
              <CardContent className="p-0 divide-y divide-gray-100">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-500">Nominal Pinjaman</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(numericAmount)}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-500">Tenor</span>
                  <span className="font-semibold text-gray-900">{tenor} Bulan</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-500">Tujuan</span>
                  <span className="font-semibold text-gray-900">{purpose || '-'}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-500">Biaya Admin (1%)</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(adminFee)}</span>
                </div>
                <div className="p-4 flex justify-between items-center bg-emerald-50/50">
                  <span className="text-emerald-800 font-medium">Estimasi Angsuran</span>
                  <span className="font-bold text-emerald-600 text-lg">{formatRupiah(installment)}<span className="text-sm font-normal text-emerald-600/70">/bln</span></span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
              Pengajuan Anda akan ditinjau oleh tim Koperasi. Proses persetujuan biasanya memakan waktu 1-2 hari kerja.
            </div>
          </div>
        )}

        <div className="pt-8 pb-safe">
          <Button 
            fullWidth 
            size="lg" 
            onClick={handleNext}
            disabled={
              (step === 1 && numericAmount < 500000) ||
              (step === 3 && !purpose)
            }
          >
            {step === 4 ? 'Kirim Pengajuan' : 'Lanjut'}
          </Button>
        </div>
      </div>
    </div>
  );
};
