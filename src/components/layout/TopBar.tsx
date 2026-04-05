import React from 'react';
import { ChevronLeft, Bell } from 'lucide-react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  onNotification?: () => void;
  unreadCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack,
  onBack,
  showNotification,
  onNotification,
  unreadCount = 0
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
        <div className="w-10 flex items-center justify-start">
          {showBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center truncate">
          {title}
        </h1>
        
        <div className="w-10 flex items-center justify-end">
          {showNotification && (
            <button onClick={onNotification} className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
