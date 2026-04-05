import React, { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUiFeedback } from '@/components/ui/FeedbackProvider';
import { formatRupiah, formatDate } from '@/lib/utils';
import { useData } from '@/context/DataContext';

export const AdminPengajuanScreen: React.FC = () => {
  const { currentData: mockData, updateLoanApplicationStatus } = useData();
  const { confirm, notifyError, notifySuccess } = useUiFeedback();
  const { loanApplications } = mockData;
  const [activeTab, setActiveTab] = useState('Baru');

  const tabs = ['Baru', 'Ditinjau', 'Disetujui', 'Ditolak'];
  
  const filteredApps = loanApplications?.filter((app: any) => app.status === activeTab) || [];

  const handleStatusUpdate = async (id: string, status: 'Ditinjau' | 'Disetujui' | 'Ditolak') => {
    const app = loanApplications.find((a: any) => a.id === id);
    if (!app) return;
    
    const confirmMessage = status === 'Disetujui' 
      ? `Setujui pengajuan ${app.name} sebesar ${formatRupiah(app.amount)}?`
      : `Tolak pengajuan ${app.name}?`;
    
    const approved = await confirm({
      title: status === 'Disetujui' ? 'Setujui pengajuan ini?' : 'Tolak pengajuan ini?',
      description: confirmMessage,
      confirmText: status === 'Disetujui' ? 'Ya, setujui' : 'Ya, tolak',
      cancelText: 'Batal',
      variant: status === 'Disetujui' ? 'primary' : 'danger',
    });

    if (!approved) {
      return;
    }

    try {
      await updateLoanApplicationStatus(id, status);
      notifySuccess(
        status === 'Disetujui' ? 'Pengajuan disetujui' : 'Pengajuan ditolak',
        `${app.name} telah diproses.`,
      );
    } catch (error) {
      notifyError('Gagal memperbarui status pengajuan', error instanceof Error ? error.message : 'Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Review Pengajuan" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Tabs */}
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

        <div className="space-y-3">
          {filteredApps.map((app: any) => (
            <Card key={app.id}>
              <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <p className="text-xs text-gray-500">{app.memberId} • {formatDate(app.date)}</p>
                </div>
                <Badge variant={
                  app.status === 'Baru' ? 'warning' : 
                  app.status === 'Ditinjau' ? 'info' : 
                  app.status === 'Disetujui' ? 'success' : 'danger'
                }>
                  {app.status}
                </Badge>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nominal Pengajuan</p>
                  <p className="font-semibold text-gray-900">{formatRupiah(app.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tenor</p>
                  <p className="font-semibold text-gray-900">{app.tenor} Bulan</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tujuan</p>
                  <p className="font-medium text-sm text-gray-900">{app.purpose}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimasi Angsuran</p>
                  <p className="font-medium text-sm text-emerald-600">{formatRupiah(app.estimatedInstallment)}/bln</p>
                </div>
              </div>
              
              {(app.status === 'Baru' || app.status === 'Ditinjau') && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate(app.id, 'Ditolak')}>Tolak</Button>
                  <Button className="flex-1" onClick={() => handleStatusUpdate(app.id, 'Disetujui')}>Setujui</Button>
                </div>
              )}
            </Card>
          ))}

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Tidak ada pengajuan dengan status {activeTab}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
