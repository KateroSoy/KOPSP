import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { WaveBackground } from '@/components/ui/WaveBackground';
import { Phone, Lock } from 'lucide-react';
import { getUserFacingError, useData } from '@/context/DataContext';

interface LoginScreenProps {
  onLogin: (role: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useData();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Nomor HP dan kata sandi harus diisi');
      return;
    }

    try {
      setError('');
      const role = await login(phone, password);
      onLogin(role);
    } catch (error) {
      setError(getUserFacingError(error));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-50 flex flex-col justify-center px-6 max-w-md mx-auto py-12 relative overflow-hidden">
      <WaveBackground className="pointer-events-none" />
      
      <div className="relative z-10 mb-10 text-center">
        <div className="w-16 h-16 relative flex items-center justify-center mx-auto mb-6">
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-md"></div>
          
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-md"></div>
          
          <span className="text-lg font-medium tracking-tighter text-emerald-800">
            KSP
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
        <p className="text-gray-600">Masuk ke akun Koperasi Anda</p>
      </div>

      <form onSubmit={handleLogin} className="relative z-10 space-y-5">
        <Input
          label="Nomor HP"
          type="tel"
          placeholder="Contoh: 081234567890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone size={20} />}
        />
        
        <div className="space-y-1.5">
          <Input
            label="Kata Sandi"
            type="password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={20} />}
          />
          <p className="text-right text-sm text-gray-500">
            Hubungi admin koperasi untuk reset kata sandi.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">
            Masuk
          </Button>
        </div>
      </form>


    </div>
  );
};
