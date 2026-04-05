import React, { useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Bell, CheckCircle2, Info } from 'lucide-react';

interface NotificationScreenProps {
  onBack: () => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({ onBack }) => {
  const { currentData: mockData, markNotificationRead } = useData();
  const { notifications } = mockData;

  // Mark all as read when opening screen
  useEffect(() => {
    notifications?.forEach((n: any) => {
      if (!n.read) {
        markNotificationRead(n.id);
      }
    });
  }, [notifications, markNotificationRead]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Notifikasi" showBack onBack={onBack} />

      <div className="p-4 max-w-md mx-auto space-y-3">
        {notifications?.length > 0 ? (
          notifications.map((notif: any) => (
            <Card key={notif.id} className={notif.read ? 'opacity-70' : ''}>
              <div className="p-4 flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  notif.title.includes('Berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {notif.title.includes('Berhasil') ? <CheckCircle2 size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                  <p className="text-xs text-gray-400">{formatDate(notif.date)}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Bell size={24} />
            </div>
            <p className="text-gray-500">Belum ada notifikasi</p>
          </div>
        )}
      </div>
    </div>
  );
};
