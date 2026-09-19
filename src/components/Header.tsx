import React, { useState, useEffect } from 'react';
import { SCHOOL_INFO } from '../data/initialData';
import {
  Vote,
  Users,
  ShieldAlert,
  Wifi,
  MonitorPlay,
  Share2,
  Lock,
  Unlock,
  UserCheck,
  ShieldCheck,
  Radio,
  Maximize2,
  Minimize2,
  Laptop,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'candidates' | 'queue' | 'booth' | 'admin';
  setCurrentTab: (tab: 'home' | 'candidates' | 'queue' | 'booth' | 'admin') => void;
  isConnected: boolean;
  totalVoted: number;
  totalVoters: number;
  onOpenShareModal: () => void;
  userRole: 'admin' | 'pemilih';
  onSwitchToPemilih: () => void;
  onSwitchToAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isConnected,
  totalVoted,
  totalVoters,
  onOpenShareModal,
  userRole,
  onSwitchToPemilih,
  onSwitchToAdmin,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Notification / Role Switcher Bar */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-8 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {userRole === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              LAPTOP 1: MODE ADMIN / OPERATOR
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              LAPTOP 2/3: BILIK SUARA (PEMILIH)
            </span>
          )}

          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">Sinkronisasi 3 Laptop Aktif (Laptop 1: Admin • Laptop 2: Bilik 1 • Laptop 3: Bilik 2)</span>
            <span className="md:hidden">Sinkron 3 Laptop (Real-time)</span>
          </span>
        </div>

        {/* Mode Switcher & Fullscreen Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            id="header-fullscreen-toggle-btn"
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Tampilan Layar Penuh (F11) agar lebih jelas"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3 h-3 text-amber-300" />
                <span className="hidden xs:inline">Keluar Layar Penuh</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden xs:inline">Layar Penuh</span>
              </>
            )}
          </button>

          {userRole === 'admin' ? (
            <button
              onClick={onSwitchToPemilih}
              id="switch-to-pemilih-mode-btn"
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Beralih ke tampilan bilik suara khusus pemilih (Laptop 2)"
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>Ganti ke Mode Pemilih</span>
            </button>
          ) : (
            <button
              onClick={onSwitchToAdmin}
              id="switch-to-admin-mode-btn"
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Masuk sebagai Admin / Panitia menggunakan PIN (Laptop 1)"
            >
              <Lock className="w-3 h-3" />
              <span>Masuk Mode Admin</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 text-left group transition-transform active:scale-95 cursor-pointer"
            id="brand-logo-btn"
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white border-2 border-blue-200 shadow-xs flex items-center justify-center shrink-0">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SMP Negeri 3 Parang"
                className="w-full h-full object-contain p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70">
                  E-Pilketos {SCHOOL_INFO.periode}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Wifi className="w-3 h-3 text-emerald-600 animate-pulse" />
                  {isConnected ? 'Sinkron Real-time' : 'Menghubungkan...'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-900 transition-colors">
                {SCHOOL_INFO.name}
              </h1>
              <p className="text-[11px] text-slate-500 hidden md:block">
                {userRole === 'admin'
                  ? 'Portal Pengendali & Rekapitulasi Pemilihan OSIS'
                  : 'Bilik Suara Digital E-Voting Siswa & Guru'}
              </p>
            </div>
          </button>

          {/* Navigation Links & Actions */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('home')}
              id="nav-home-btn"
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Beranda
            </button>

            <button
              onClick={() => setCurrentTab('candidates')}
              id="nav-candidates-btn"
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'candidates'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Calon OSIS</span>
            </button>

            {/* In Admin mode: show Queue and Booth, plus Share & Rekapan */}
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={() => setCurrentTab('queue')}
                  id="nav-queue-btn"
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all relative cursor-pointer ${
                    currentTab === 'queue'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Vote className="w-4 h-4" />
                  <span>Daftar Pemilih</span>
                  <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-extrabold bg-amber-400 text-slate-950">
                    {totalVoted}/{totalVoters}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentTab('booth')}
                  id="nav-booth-btn"
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'booth'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title="Monitor / Buka Layar Bilik Suara"
                >
                  <MonitorPlay className="w-4 h-4" />
                  <span className="hidden xs:inline">Bilik Suara</span>
                </button>

                <button
                  onClick={onOpenShareModal}
                  id="nav-share-btn"
                  className="px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Hubungkan Laptop 1 (Admin/Operator) dengan Laptop 2 & Laptop 3 (Bilik Suara)"
                >
                  <Laptop className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden md:inline">Integrasi 3 Laptop</span>
                  <span className="md:hidden">3 Laptop</span>
                </button>

                <button
                  onClick={() => setCurrentTab('admin')}
                  id="nav-admin-btn"
                  className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Rekapan Hasil Pemilihan (Khusus Admin)"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Rekapan</span>
                </button>
              </>
            ) : (
              /* In Pemilih mode: clean voting navigation only */
              <>
                <button
                  onClick={() => setCurrentTab('booth')}
                  id="nav-voter-booth-btn"
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    currentTab === 'booth'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                  }`}
                  title="Masuk ke Bilik Suara Digital untuk Mencoblos"
                >
                  <Vote className="w-4 h-4" />
                  <span>Bilik Suara (Voting)</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
