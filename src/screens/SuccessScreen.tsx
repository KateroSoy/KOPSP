import React from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface SuccessScreenProps {
  onDone: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onDone }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 max-w-md mx-auto text-center">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
        <CheckCircle2 size={48} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Pengajuan Berhasil Dikirim!</h1>
      <p className="text-gray-500 mb-8">
        Terima kasih. Pengajuan pinjaman Anda sedang dalam proses peninjauan. Kami akan memberitahu Anda melalui notifikasi setelah proses selesai.
      </p>
      <Button fullWidth size="lg" onClick={onDone}>
        Kembali ke Beranda
      </Button>
    </div>
  );
};
