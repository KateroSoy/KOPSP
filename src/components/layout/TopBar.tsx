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
      <div className="flex items-center justify-between h-14 md:h-20 px-4 md:px-8 max-w-md md:max-w-7xl mx-auto">
        <div className="w-10 md:w-auto flex items-center justify-start md:mr-4">
          {showBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="md:w-7 md:h-7" />
            </button>
          )}
        </div>
        
        <h1 className="text-lg md:text-2xl font-semibold text-gray-900 flex-1 text-center md:text-left truncate">
          {title}
        </h1>
        
        <div className="w-10 md:w-auto flex items-center justify-end">
          {showNotification && (
            <button onClick={onNotification} className="p-2 -mr-2 md:mr-0 text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={22} className="md:w-6 md:h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 md:top-1 right-1.5 md:right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
