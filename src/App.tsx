import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SimpananScreen } from './screens/SimpananScreen';
import { PinjamanScreen } from './screens/PinjamanScreen';
import { RiwayatScreen } from './screens/RiwayatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AjukanPinjamanScreen } from './screens/AjukanPinjamanScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { NotificationScreen } from './screens/NotificationScreen';

// Admin Screens
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AdminAnggotaScreen } from './screens/AdminAnggotaScreen';
import { AdminPengajuanScreen } from './screens/AdminPengajuanScreen';
import { AdminInputPembayaranScreen } from './screens/AdminInputPembayaranScreen';
import { AdminTransaksiScreen } from './screens/AdminTransaksiScreen';
import { AdminPengumumanScreen } from './screens/AdminPengumumanScreen';
import { AdminMenuScreen } from './screens/AdminMenuScreen';
import { AdminPinjamanAktifScreen } from './screens/AdminPinjamanAktifScreen';
import { AdminPengaturanScreen } from './screens/AdminPengaturanScreen';
import { AdminDetailAnggotaScreen } from './screens/AdminDetailAnggotaScreen';
import { AdminMasterDataScreen } from './screens/AdminMasterDataScreen';
import { AdminReportsScreen } from './screens/AdminReportsScreen';

import { BottomNav } from './components/layout/BottomNav';
import { AdminBottomNav } from './components/layout/AdminBottomNav';
import { FeedbackProvider } from './components/ui/FeedbackProvider';

type Screen = 
  | 'login' 
  | 'dashboard' 
  | 'simpanan' 
  | 'pinjaman' 
  | 'riwayat' 
  | 'akun' 
  | 'ajukan_pinjaman' 
  | 'success_pinjaman'
  | 'notifikasi'
  | 'admin_dashboard'
  | 'admin_anggota'
  | 'admin_detail_anggota'
  | 'admin_master_data'
  | 'admin_pengajuan'
  | 'admin_input_pembayaran'
  | 'admin_transaksi'
  | 'admin_pengumuman'
  | 'admin_pinjaman_aktif'
  | 'admin_pengaturan'
  | 'admin_menu'
  | 'admin_laporan';

function AppContent() {
  const { authReady, isAuthenticated, role, currentData, logout } = useData();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [activeTab, setActiveTab] = useState('beranda');
  const [userRole, setUserRole] = useState<string>('member');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      setCurrentScreen('login');
      return;
    }

    if (role === 'admin') {
      setUserRole('admin');
      if (currentScreen === 'login') {
        setCurrentScreen('admin_dashboard');
        setActiveTab('admin_dashboard');
      }
      return;
    }

    setUserRole('member');
    if (currentScreen === 'login') {
      setCurrentScreen('dashboard');
      setActiveTab('beranda');
    }
  }, [authReady, isAuthenticated, role, currentScreen]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Memuat aplikasi...
      </div>
    );
  }

  if (isAuthenticated && !currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Menyiapkan data akun...
      </div>
    );
  }

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    // Member routing
    if (tab === 'beranda') setCurrentScreen('dashboard');
    else if (tab === 'simpanan') setCurrentScreen('simpanan');
    else if (tab === 'pinjaman') setCurrentScreen('pinjaman');
    else if (tab === 'akun') setCurrentScreen('akun');
    else if (tab === 'riwayat') setCurrentScreen('riwayat');
    
    // Admin routing
    else if (tab === 'admin_dashboard') setCurrentScreen('admin_dashboard');
    else if (tab === 'admin_anggota') setCurrentScreen('admin_anggota');
    else if (tab === 'admin_pengajuan') setCurrentScreen('admin_pengajuan');
    else if (tab === 'admin_menu') setCurrentScreen('admin_menu');
    else if (tab === 'admin_input_pembayaran') setCurrentScreen('admin_input_pembayaran');
    else if (tab === 'admin_transaksi') setCurrentScreen('admin_transaksi');
    else if (tab === 'admin_pengumuman') setCurrentScreen('admin_pengumuman');
    else if (tab === 'admin_pinjaman_aktif') setCurrentScreen('admin_pinjaman_aktif');
    else if (tab === 'admin_pengaturan') setCurrentScreen('admin_pengaturan');
    else if (tab === 'admin_master_data') setCurrentScreen('admin_master_data');
    else if (tab === 'admin_laporan') setCurrentScreen('admin_laporan');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen 
            onLogin={(role) => {
              setUserRole(role);
              if (role === 'admin') {
                setCurrentScreen('admin_dashboard');
                setActiveTab('admin_dashboard');
              } else {
                setCurrentScreen('dashboard');
                setActiveTab('beranda');
              }
            }} 
          />
        );
      
      // Member Screens
      case 'dashboard':
        return <DashboardScreen onNavigate={handleNavigate} onNotification={() => setCurrentScreen('notifikasi')} />;
      case 'simpanan':
        return <SimpananScreen />;
      case 'pinjaman':
        return <PinjamanScreen onAjukan={() => setCurrentScreen('ajukan_pinjaman')} />;
      case 'riwayat':
        return <RiwayatScreen />;
      case 'akun':
        return <ProfileScreen onLogout={() => setCurrentScreen('login')} />;
      case 'ajukan_pinjaman':
        return <AjukanPinjamanScreen onBack={() => { setCurrentScreen('pinjaman'); setActiveTab('pinjaman'); }} onSuccess={() => setCurrentScreen('success_pinjaman')} />;
      case 'success_pinjaman':
        return <SuccessScreen onDone={() => { setCurrentScreen('dashboard'); setActiveTab('beranda'); }} />;
      case 'notifikasi':
        return <NotificationScreen onBack={() => { setCurrentScreen('dashboard'); setActiveTab('beranda'); }} />;
      
      // Admin Screens
      case 'admin_dashboard':
        return <AdminDashboardScreen onNavigate={handleNavigate} />;
      case 'admin_anggota':
        return <AdminAnggotaScreen onMemberSelect={(id) => { setSelectedMemberId(id); setCurrentScreen('admin_detail_anggota'); }} />;
      case 'admin_detail_anggota':
        return <AdminDetailAnggotaScreen memberId={selectedMemberId!} onBack={() => setCurrentScreen('admin_anggota')} />;
      case 'admin_master_data':
        return <AdminMasterDataScreen onBack={() => { setCurrentScreen('admin_menu'); setActiveTab('admin_menu'); }} />;
      case 'admin_pengajuan':
        return <AdminPengajuanScreen />;
      case 'admin_menu':
        return <AdminMenuScreen onNavigate={handleNavigate} onLogout={() => { logout(); setCurrentScreen('login'); }} />;
      case 'admin_input_pembayaran':
        return <AdminInputPembayaranScreen onBack={() => { setCurrentScreen('admin_dashboard'); setActiveTab('admin_dashboard'); }} />;
      case 'admin_transaksi':
        return <AdminTransaksiScreen />;
      case 'admin_pengumuman':
        return <AdminPengumumanScreen />;
      case 'admin_pinjaman_aktif':
        return <AdminPinjamanAktifScreen />;
      case 'admin_pengaturan':
        return <AdminPengaturanScreen />;
      case 'admin_laporan':
        return <AdminReportsScreen />;
        
      default:
        return <LoginScreen onLogin={() => {}} />;
    }
  };

  const showMemberNav = userRole === 'member' && ['dashboard', 'simpanan', 'pinjaman', 'akun', 'riwayat', 'notifikasi'].includes(currentScreen);
  const showAdminNav = userRole === 'admin' && ['admin_dashboard', 'admin_anggota', 'admin_detail_anggota', 'admin_master_data', 'admin_pengajuan', 'admin_menu', 'admin_input_pembayaran', 'admin_transaksi', 'admin_pengumuman', 'admin_pinjaman_aktif', 'admin_pengaturan', 'admin_laporan'].includes(currentScreen);

  return (
    <div className="font-sans text-gray-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {renderScreen()}
      {showMemberNav && <BottomNav activeTab={activeTab} onChange={handleNavigate} />}
      {showAdminNav && <AdminBottomNav activeTab={activeTab} onChange={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <FeedbackProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </FeedbackProvider>
  );
}
