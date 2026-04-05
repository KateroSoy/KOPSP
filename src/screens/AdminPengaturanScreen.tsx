import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { useData } from '@/context/DataContext';
import { User } from 'lucide-react';

export const AdminPengaturanScreen: React.FC = () => {
  const { currentData: mockData, updateProfile, changePassword } = useData();
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
      notifySuccess('Profil admin berhasil diperbarui');
    } catch (error) {
      notifyError('Gagal memperbarui profil admin', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      notifySuccess('Kata sandi admin berhasil diperbarui');
    } catch (error) {
      notifyError('Gagal memperbarui kata sandi admin', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Pengaturan Admin" />

      <div className="p-4 max-w-md mx-auto space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.role.toUpperCase()}</p>
              </div>
            </div>
            <div className="space-y-3">
              <Input label="Nama Lengkap" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
              <Input label="Email" type="email" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
              <Input label="No. Telepon" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <Input label="Alamat" value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} />
              <Button fullWidth onClick={handleSaveProfile}>Simpan Profil</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
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
            <Button variant="outline" fullWidth onClick={handleChangePassword}>Perbarui Kata Sandi</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
