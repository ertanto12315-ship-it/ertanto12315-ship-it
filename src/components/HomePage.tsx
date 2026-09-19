import React from 'react';
import { SCHOOL_INFO, CANDIDATES } from '../data/initialData';
import {
  Users,
  Vote,
  Monitor,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Award,
  Sparkles,
  Smartphone,
  Share2,
  Lock,
  Radio,
  ExternalLink,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

interface HomePageProps {
  onGoToCandidates: () => void;
  onGoToQueue: () => void;
  onGoToBooth: () => void;
  onGoToAdmin: () => void;
  onOpenShareModal: () => void;
  totalVoted: number;
  totalVoters: number;
  turnoutPercentage: number;
  connectedDevicesCount?: number;
  userRole: 'admin' | 'pemilih';
  onSwitchToAdmin?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onGoToCandidates,
  onGoToQueue,
  onGoToBooth,
  onGoToAdmin,
  onOpenShareModal,
  totalVoted,
  totalVoters,
  turnoutPercentage,
  connectedDevicesCount = 0,
  userRole,
  onSwitchToAdmin,
}) => {
  return (
    <div className="w-full bg-slate-50">
      {/* ================= SECTION 1: HALAMAN PENUH (FULL-PAGE HERO VIEWPORT) ================= */}
      <section
        id="full-screen-hero"
        className="min-h-[calc(100vh-7rem)] flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden"
      >
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Tagline with User Role & Sync State */}
        <div className="text-center pt-1">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white border border-slate-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-900" />
            <span className="text-slate-800">PEMILIHAN KETUA OSIS SMP NEGERI 3 PARANG TAHUN PELAJARAN 2026/2027</span>
            <span className="text-slate-300">•</span>
            {userRole === 'admin' ? (
              <span className="text-amber-700 font-black flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mode Admin
              </span>
            ) : (
              <span className="text-emerald-700 font-black flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                Mode Pemilih (Bilik Suara)
              </span>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              Sinkron Real-time
            </span>
          </div>
        </div>

        {/* Centerpiece: Full-Screen School Identity & Actions */}
        <div className="my-auto py-4 sm:py-6 text-center max-w-4xl mx-auto">
          {/* School Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-5"
          >
            <div className="relative group">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white p-3 border-4 border-blue-900 shadow-xl flex items-center justify-center transition-transform hover:scale-105 duration-300">
                <img
                  src={SCHOOL_INFO.logoUrl}
                  alt="Logo Resmi SMP Negeri 3 Parang"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-xs font-black px-4 py-1 rounded-full shadow-md whitespace-nowrap tracking-wide">
                SMPN 3 PARANG
              </span>
            </div>
          </motion.div>

          {/* School Identity Headlines */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight uppercase font-['Space_Grotesk',sans-serif]">
              PEMILIHAN KETUA OSIS
            </h1>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-blue-900 mt-2 tracking-tight">
              SMP NEGERI 3 PARANG
            </h2>
            <div className="inline-block mt-2 px-4 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-950 font-black text-sm sm:text-base tracking-wider uppercase">
              TAHUN PELAJARAN 2026/2027
            </div>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed">
              Mewujudkan demokrasi sekolah berasaskan <strong className="text-slate-900 font-bold">LUBER JURDIL</strong> (Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil) dengan sistem bilik suara digital terkoneksi dan terintegrasi otomatis ke akun admin.
            </p>
          </motion.div>

          {/* Role Status Note */}
          <div className="mt-4 max-w-xl mx-auto">
            {userRole === 'admin' ? (
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Portal Admin Aktif:</strong> Anda dapat mengontrol antrean 85 pemilih, monitor 3 bilik suara, membagikan link/QR, melihat rekapan hasil, dan mereset data.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Bilik Suara Pemilih:</strong> Silakan cek calon ketua OSIS, verifikasi NISN/NIP, dan berikan hak suara Anda. Suara otomatis terkirim langsung ke portal admin secara rahasia.
                </span>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto"
          >
            {/* Tombol Calon Ketua OSIS */}
            <button
              onClick={onGoToCandidates}
              id="hero-candidates-btn"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl font-black text-sm sm:text-base bg-blue-900 hover:bg-blue-950 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Users className="w-5 h-5 text-blue-200" />
              <span>Calon Ketua OSIS</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Tombol Mulai Pemilihan */}
            <button
              onClick={onGoToQueue}
              id="hero-start-election-btn"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Vote className="w-5 h-5 text-emerald-100" />
              <span>Mulai Pemilihan (Daftar Pemilih)</span>
            </button>
          </motion.div>

          {/* Secondary Quick Access Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs"
          >
            <button
              onClick={onGoToBooth}
              id="hero-open-booth-link"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
            >
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>Buka Bilik Suara Digital</span>
            </button>

            {userRole === 'admin' ? (
              <>
                {/* Sharing Device Button (Khusus Admin) */}
                <button
                  onClick={onOpenShareModal}
                  id="hero-share-devices-btn"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-4 h-4 text-amber-700" />
                  <span>Integrasi 3 Laptop (Admin)</span>
                </button>

                <button
                  onClick={onGoToAdmin}
                  id="hero-open-admin-link"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-800 border border-slate-300 font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Rekapan Hasil (Admin)</span>
                </button>
              </>
            ) : (
              <button
                onClick={onSwitchToAdmin || onGoToAdmin}
                id="hero-switch-admin-link"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Masuk Mode Admin (Perlu PIN)</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Bottom Metrics Bar (Pinned to the bottom of the full screen view) */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total DPT
                </span>
                <span className="text-xl font-black text-slate-900">{totalVoters} Pemilih</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Suara Masuk
                </span>
                <span className="text-xl font-black text-emerald-600">{totalVoted} Suara</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="grow">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Partisipasi
                </span>
                <span className="text-xl font-black text-amber-700">{turnoutPercentage}%</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-indigo-700 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Sinkronisasi
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Real-Time ke Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: CANDIDATES GRID PREVIEW ================= */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Pilihan Masa Depan Sekolah
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight font-['Space_Grotesk',sans-serif]">
                Daftar Calon Ketua OSIS SMPN 3 Parang
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Kenali visi dan misi setiap calon sebelum menentukan pilihan Anda di bilik suara.
              </p>
            </div>

            <button
              onClick={onGoToCandidates}
              id="view-full-candidates-grid-btn"
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-900 hover:bg-blue-950 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Lihat Detail Grid Calon</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CANDIDATES.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-slate-50 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
                id={`home-candidate-card-${candidate.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-9 h-9 rounded-xl bg-blue-900 text-white font-black text-sm flex items-center justify-center shadow-xs font-mono">
                      0{candidate.id}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Kandidat Ketua
                    </span>
                  </div>

                  <div className="w-full h-56 rounded-2xl overflow-hidden bg-white border border-slate-200 mb-4 flex items-center justify-center p-2">
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {candidate.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <strong className="text-blue-900 block font-bold mb-0.5">Visi:</strong>
                      <p className="text-slate-600 italic">"{candidate.visi}"</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <strong className="text-emerald-800 block font-bold mb-0.5">Misi:</strong>
                      <p className="text-slate-600">{candidate.misi}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/60">
                  <button
                    onClick={onGoToBooth}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Vote className="w-3.5 h-3.5" />
                    <span>Pilih di Bilik Suara</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
