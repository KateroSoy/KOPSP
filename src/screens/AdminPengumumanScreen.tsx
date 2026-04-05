import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatDate } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Megaphone, Plus, Edit2, Trash2 } from 'lucide-react';

export const AdminPengumumanScreen: React.FC = () => {
  const { currentData: mockData, addAnnouncement, editAnnouncement, deleteAnnouncement } = useData();
  const { confirm, notifyError, notifySuccess, notifyWarning } = useUiFeedback();
  const { announcements } = mockData;
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      notifyWarning('Judul dan isi pengumuman tidak boleh kosong');
      return;
    }
    try {
      if (editingId) {
        await editAnnouncement({
          id: editingId,
          title,
          content,
          isActive
        });
        notifySuccess('Pengumuman berhasil diperbarui', 'Perubahan sudah tampil di dashboard admin.');
      } else {
        await addAnnouncement({
          title,
          content,
          isActive
        });
        notifySuccess('Pengumuman berhasil dibuat', 'Pengumuman baru sudah tersimpan.');
      }
    } catch (error) {
      notifyError('Gagal menyimpan pengumuman', error instanceof Error ? error.message : 'Silakan coba lagi.');
      return;
    }
    setIsCreating(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setIsActive(true);
  };

  const handleEdit = (ann: any) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setIsActive(ann.isActive);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    const approved = await confirm({
      title: 'Hapus pengumuman ini?',
      description: 'Pengumuman yang dihapus tidak bisa dikembalikan lagi.',
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!approved) {
      return;
    }

    try {
      await deleteAnnouncement(id);
      notifySuccess('Pengumuman berhasil dihapus');
    } catch (error) {
      notifyError('Gagal menghapus pengumuman', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title={editingId ? 'Edit Pengumuman' : 'Buat Pengumuman'} showBack onBack={() => {
          setIsCreating(false);
          setEditingId(null);
          setTitle('');
          setContent('');
          setIsActive(true);
        }} />
        <div className="p-4 max-w-md mx-auto space-y-4">
          <Input 
            label="Judul Pengumuman" 
            placeholder="Contoh: Rapat Anggota" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Isi Pengumuman</label>
            <textarea 
              className="w-full h-32 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Tulis isi pengumuman di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
            <div>
              <p className="font-medium text-sm text-gray-900">Status Aktif</p>
              <p className="text-xs text-gray-500">Tampilkan di aplikasi anggota</p>
            </div>
            <div 
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isActive ? 'bg-emerald-600' : 'bg-gray-300'}`}
              onClick={() => setIsActive(!isActive)}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </div>
          <div className="pt-4 flex space-x-3">
            <Button variant="outline" fullWidth onClick={() => {
              setIsCreating(false);
              setEditingId(null);
              setTitle('');
              setContent('');
              setIsActive(true);
            }}>Batal</Button>
            <Button fullWidth onClick={handleSave}>{editingId ? 'Perbarui' : 'Simpan'} Pengumuman</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Kelola Pengumuman" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        <Button fullWidth className="flex items-center justify-center" onClick={() => setIsCreating(true)}>
          <Plus size={20} className="mr-2" /> Buat Pengumuman Baru
        </Button>

        <div className="space-y-3 mt-6">
          {announcements?.map((ann: any) => (
            <Card key={ann.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Megaphone size={16} className="text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                  </div>
                  <Badge variant={ann.isActive ? 'success' : 'default'}>
                    {ann.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ann.content}</p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{formatDate(ann.date)}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(ann)} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(ann.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {(!announcements || announcements.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Megaphone size={32} className="mx-auto mb-3 text-gray-300" />
              <p>Belum ada pengumuman</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
