import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { useData } from '@/context/DataContext';
import { User, LogOut } from 'lucide-react';

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { currentData: mockData, updateProfile, changePassword, logout } = useData();
  const { notifyError, notifySuccess } = useUiFeedback();
  const { user } = mockData as any;
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone,
    address: user.address || '',
    email: user.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    setProfileForm({
      name: user.name,
      phone: user.phone,
      address: user.address || '',
      email: user.email || '',
    });
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileForm);
      notifySuccess('Profil berhasil diperbarui');
    } catch (error) {
      notifyError('Gagal memperbarui profil', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      notifySuccess('Kata sandi berhasil diperbarui');
    } catch (error) {
      notifyError('Gagal memperbarui kata sandi', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Profil Saya" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <User size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500">No. Anggota: {user.memberId}</p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <Input label="Nama Lengkap" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Input label="Nomor HP" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <Input label="Alamat" value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} />
            <Input label="Email" type="email" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
            <Button fullWidth onClick={handleSaveProfile}>Simpan Profil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <Input
              label="Kata Sandi Saat Ini"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
            <Input
              label="Kata Sandi Baru"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
            <Button fullWidth variant="outline" onClick={handleChangePassword}>Perbarui Kata Sandi</Button>
          </CardContent>
        </Card>

        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            logout();
            onLogout();
          }}
          className="flex items-center justify-center"
        >
          <LogOut size={20} className="mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
};
