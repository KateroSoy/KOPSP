import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Plus, Edit2, Trash2, User, Wallet, CreditCard } from 'lucide-react';

interface AdminMasterDataScreenProps {
  onBack: () => void;
}

export const AdminMasterDataScreen: React.FC<AdminMasterDataScreenProps> = ({ onBack }) => {
  const {
    currentData: mockData,
    addMember,
    updateMember,
    deleteMember,
    addSavingsProduct,
    updateSavingsProduct,
    deleteSavingsProduct,
    addLoanProduct,
    updateLoanProduct,
    deleteLoanProduct,
  } = useData();
  const { confirm, notifyError, notifySuccess } = useUiFeedback();

  const { masterData, members } = mockData as any;
  const [activeTab, setActiveTab] = useState('Anggota');
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<'anggota' | 'simpanan' | 'pinjaman' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const tabs = ['Anggota', 'Simpanan', 'Pinjaman'];

  const closeEditor = () => {
    setIsEditing(false);
    setEditType(null);
    setFormData({});
  };

  const run = async (successTitle: string, successDescription: string, work: () => Promise<void>) => {
    try {
      await work();
      closeEditor();
      notifySuccess(successTitle, successDescription);
    } catch (error) {
      notifyError('Gagal menyimpan data', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  const handleDeleteMember = async (member: { id: string; name: string }) => {
    const approved = await confirm({
      title: 'Hapus anggota ini?',
      description: `${member.name} akan dihapus dari master data anggota.`,
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!approved) {
      return;
    }

    try {
      await deleteMember(member.id);
      notifySuccess('Anggota berhasil dihapus', `${member.name} telah dihapus dari daftar.`);
    } catch (error) {
      notifyError('Gagal menghapus anggota', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  const handleDeleteSavings = async (item: { id: string; name: string }) => {
    const approved = await confirm({
      title: 'Hapus jenis simpanan ini?',
      description: `${item.name} akan dihapus dari master data simpanan.`,
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!approved) {
      return;
    }

    try {
      await deleteSavingsProduct(item.id);
      notifySuccess('Jenis simpanan berhasil dihapus', `${item.name} sudah dihapus.`);
    } catch (error) {
      notifyError('Gagal menghapus jenis simpanan', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  const handleDeleteLoan = async (item: { id: string; name: string }) => {
    const approved = await confirm({
      title: 'Hapus jenis pinjaman ini?',
      description: `${item.name} akan dihapus dari master data pinjaman.`,
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!approved) {
      return;
    }

    try {
      await deleteLoanProduct(item.id);
      notifySuccess('Jenis pinjaman berhasil dihapus', `${item.name} sudah dihapus.`);
    } catch (error) {
      notifyError('Gagal menghapus jenis pinjaman', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  const renderEditForm = () => {
    if (editType === 'anggota') {
      const isNew = !formData.id;
      return (
        <div className="space-y-4">
          <Input label="Nama Lengkap" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Nomor HP" type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          {isNew && (
            <Input label="Kata Sandi Awal" type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} helperText="Gunakan kata sandi sementara untuk anggota baru." />
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="w-full h-11 px-3 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.status || 'Aktif'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
          <div className="pt-4 flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={closeEditor}>Batal</Button>
            <Button
              className="flex-1"
              onClick={() =>
                run(
                  isNew ? 'Anggota berhasil ditambahkan' : 'Anggota berhasil diperbarui',
                  isNew ? `${formData.name} sudah masuk ke master data.` : `Data ${formData.name} sudah diperbarui.`,
                  async () => {
                  if (isNew) {
                    await addMember({
                      name: formData.name,
                      phone: formData.phone,
                      password: formData.password,
                      status: formData.status || 'Aktif',
                    });
                    return;
                  }

                  await updateMember({
                    id: formData.id,
                    name: formData.name,
                    phone: formData.phone,
                    status: formData.status || 'Aktif',
                  });
                  },
                )
              }
            >
              Simpan
            </Button>
          </div>
        </div>
      );
    }

    if (editType === 'simpanan') {
      const isNew = !formData.id;
      return (
        <div className="space-y-4">
          <Input label="Nama Simpanan" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Nominal Default (Rp)" type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })} />
          <div className="flex items-center space-x-2 pt-2">
            <input type="checkbox" id="isMandatory" checked={formData.isMandatory || false} onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <label htmlFor="isMandatory" className="text-sm text-gray-700">Wajib dibayar setiap bulan</label>
          </div>
          <div className="pt-4 flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={closeEditor}>Batal</Button>
            <Button
              className="flex-1"
              onClick={() =>
                run(
                  isNew ? 'Jenis simpanan berhasil ditambahkan' : 'Jenis simpanan berhasil diperbarui',
                  `${formData.name} telah tersimpan di master data.`,
                  async () => {
                  if (isNew) {
                    await addSavingsProduct(formData);
                    return;
                  }
                  await updateSavingsProduct(formData);
                  },
                )
              }
            >
              Simpan
            </Button>
          </div>
        </div>
      );
    }

    if (editType === 'pinjaman') {
      const isNew = !formData.id;
      return (
        <div className="space-y-4">
          <Input label="Nama Pinjaman" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Maksimal Pinjaman (Rp)" type="number" value={formData.maxAmount || ''} onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) || 0 })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bunga (%/bln)" type="number" value={formData.interestRate || ''} onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })} />
            <Input label="Biaya Admin (%)" type="number" value={formData.adminFeeRate || ''} onChange={(e) => setFormData({ ...formData, adminFeeRate: parseFloat(e.target.value) || 0 })} />
          </div>
          <Input label="Maks Tenor (bln)" type="number" value={formData.maxTenor || ''} onChange={(e) => setFormData({ ...formData, maxTenor: parseInt(e.target.value) || 0 })} />
          <div className="pt-4 flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={closeEditor}>Batal</Button>
            <Button
              className="flex-1"
              onClick={() =>
                run(
                  isNew ? 'Jenis pinjaman berhasil ditambahkan' : 'Jenis pinjaman berhasil diperbarui',
                  `${formData.name} telah tersimpan di master data.`,
                  async () => {
                  if (isNew) {
                    await addLoanProduct({ ...formData, adminFeeRate: formData.adminFeeRate || 1 });
                    return;
                  }
                  await updateLoanProduct({ ...formData, adminFeeRate: formData.adminFeeRate || 1 });
                  },
                )
              }
            >
              Simpan
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title={`Form ${editType === 'anggota' ? 'Anggota' : editType === 'simpanan' ? 'Simpanan' : 'Pinjaman'}`} showBack onBack={closeEditor} />
        <div className="p-4 max-w-md mx-auto">
          <Card>
            <CardContent className="p-4">
              {renderEditForm()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Master Data" showBack onBack={onBack} />

      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Anggota' && (
          <div className="space-y-3 animate-in fade-in">
            <Button fullWidth className="flex items-center justify-center mb-4" onClick={() => { setEditType('anggota'); setFormData({ status: 'Aktif', password: '' }); setIsEditing(true); }}>
              <Plus size={20} className="mr-2" /> Tambah Anggota
            </Button>
            {members.map((member: any) => (
              <Card key={member.id}>
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
                  <div className="flex space-x-2">
                    <button onClick={() => { setEditType('anggota'); setFormData(member); setIsEditing(true); }} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { void handleDeleteMember(member); }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'Simpanan' && (
          <div className="space-y-3 animate-in fade-in">
            <Button fullWidth className="flex items-center justify-center mb-4" onClick={() => { setEditType('simpanan'); setFormData({ isMandatory: false, amount: 0 }); setIsEditing(true); }}>
              <Plus size={20} className="mr-2" /> Tambah Jenis Simpanan
            </Button>
            {masterData.jenisSimpanan.map((item: any) => (
              <Card key={item.id}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.amount > 0 ? formatRupiah(item.amount) : 'Bebas'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={item.isMandatory ? 'warning' : 'default'}>{item.isMandatory ? 'Wajib' : 'Opsional'}</Badge>
                    <div className="flex space-x-1">
                      <button onClick={() => { setEditType('simpanan'); setFormData(item); setIsEditing(true); }} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { void handleDeleteSavings(item); }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'Pinjaman' && (
          <div className="space-y-3 animate-in fade-in">
            <Button fullWidth className="flex items-center justify-center mb-4" onClick={() => { setEditType('pinjaman'); setFormData({ adminFeeRate: 1 }); setIsEditing(true); }}>
              <Plus size={20} className="mr-2" /> Tambah Jenis Pinjaman
            </Button>
            {masterData.jenisPinjaman.map((item: any) => (
              <Card key={item.id}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Maks: {formatRupiah(item.maxAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emerald-600">{item.interestRate}% / bln</p>
                      <p className="text-[10px] text-gray-500">Tenor {item.maxTenor} bln</p>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => { setEditType('pinjaman'); setFormData(item); setIsEditing(true); }} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { void handleDeleteLoan(item); }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
