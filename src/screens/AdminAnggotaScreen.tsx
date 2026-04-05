import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Search, User, ChevronRight, Plus } from 'lucide-react';

interface AdminAnggotaScreenProps {
  onMemberSelect?: (id: string) => void;
}

export const AdminAnggotaScreen: React.FC<AdminAnggotaScreenProps> = ({ onMemberSelect }) => {
  const { currentData: mockData, addMember } = useData();
  const { notifyError, notifySuccess, notifyWarning } = useUiFeedback();
  const { members } = mockData;
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });

  const filteredMembers = members.filter((m: any) => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  const handleSaveMember = async () => {
    if (!formData.name.trim()) {
      notifyWarning('Nama anggota tidak boleh kosong');
      return;
    }
    if (!formData.phone.trim()) {
      notifyWarning('Nomor telepon tidak boleh kosong');
      return;
    }
    if (formData.phone.length < 10) {
      notifyWarning('Nomor telepon minimal 10 digit');
      return;
    }
    if (!formData.password.trim()) {
      notifyWarning('Kata sandi awal tidak boleh kosong');
      return;
    }

    try {
      await addMember({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        status: formData.status,
      });
      setFormData({ name: '', phone: '', password: '', status: 'Aktif' });
      setIsAddingMember(false);
      notifySuccess('Anggota berhasil ditambahkan', `${formData.name} sudah siap memakai akun barunya.`);
    } catch (error) {
      notifyError('Gagal menambahkan anggota', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  if (isAddingMember) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title="Tambah Anggota" showBack onBack={() => {
          setIsAddingMember(false);
          setFormData({ name: '', phone: '', password: '', status: 'Aktif' });
        }} />

        <div className="p-4 max-w-md mx-auto space-y-4">
          <Card>
            <div className="p-5 space-y-4">
              <Input 
                label="Nama Lengkap" 
                placeholder="Contoh: Budi Santoso" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input 
                label="Nomor Telepon" 
                type="tel"
                placeholder="Contoh: 08211234567" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input 
                label="Kata Sandi Awal" 
                type="password"
                placeholder="Buat kata sandi awal anggota" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Status Awal</label>
                <select 
                  className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setIsAddingMember(false);
                    setFormData({ name: '', phone: '', password: '', status: 'Aktif' });
                  }}
                >
                  Batal
                </Button>
                <Button fullWidth onClick={handleSaveMember}>
                  Tambah Anggota
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Data Anggota" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        <Button 
          fullWidth 
          className="flex items-center justify-center" 
          onClick={() => setIsAddingMember(true)}
        >
          <Plus size={20} className="mr-2" /> Tambah Anggota
        </Button>

        <Input
          placeholder="Cari nama, no. anggota, atau HP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={20} />}
        />

        <div className="space-y-3">
          {filteredMembers.map((member: any) => (
            <Card 
              key={member.id} 
              className="hover:border-emerald-200 transition-colors cursor-pointer"
              onClick={() => onMemberSelect && onMemberSelect(member.id)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.id} • {member.phone}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total Simpanan</p>
                  <p className="font-semibold text-sm text-gray-900">{formatRupiah(member.totalSavings)}</p>
                </div>
                <div className="text-right">
                  <Badge variant={member.status === 'Aktif' ? 'success' : 'default'} className="mb-1">
                    {member.status}
                  </Badge>
                  {member.hasActiveLoan && (
                    <p className="text-[10px] text-orange-600 font-medium">Ada Pinjaman</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User size={32} className="mx-auto mb-3 text-gray-300" />
              <p>Anggota tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
