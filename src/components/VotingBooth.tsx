import React, { useState, useEffect } from 'react';
import { Candidate, Voter, BoothSession } from '../types';
import { CANDIDATES, SCHOOL_INFO } from '../data/initialData';
import {
  Vote,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Sparkles,
  LogOut,
  ArrowRight,
  Lock,
  KeyRound,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChime } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface VotingBoothProps {
  boothSession: BoothSession;
  booths?: Record<string, BoothSession>;
  activeBoothId?: string;
  setActiveBoothId?: (id: string) => void;
  localActiveVoter: Voter | null;
  onClearLocalActiveVoter: () => void;
  onCastVote: (voterId: number, candidateId: number, boothId?: string) => Promise<{ success: boolean; message: string }>;
  onBackToQueue: () => void;
  allVoters: Voter[];
  onDirectSelfVerify: (code: string) => Promise<{ success: boolean; message: string; voter?: Voter }>;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  boothSession,
  booths,
  activeBoothId = 'bilik-1',
  setActiveBoothId,
  localActiveVoter,
  onClearLocalActiveVoter,
  onCastVote,
  onBackToQueue,
  allVoters,
  onDirectSelfVerify,
}) => {
  // Current active booth session
  const currentSession = booths && booths[activeBoothId] ? booths[activeBoothId] : boothSession;

  // Active voter is either localActiveVoter (voting on this machine) or currentSession.activeVoter (pushed over network)
  const activeVoter = localActiveVoter || currentSession.activeVoter;

  // Selected candidate to confirm
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedSuccess, setVotedSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Self-verification state in booth (if voter inputs directly on booth tablet)
  const [selfCode, setSelfCode] = useState('');
  const [selfError, setSelfError] = useState('');
  const [isSelfVerifying, setIsSelfVerifying] = useState(false);

  // Heartbeat ping so admin knows this booth device is online
  useEffect(() => {
    const deviceId = `booth-device-${activeBoothId}`;
    const pingServer = () => {
      fetch('/api/devices/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          name: `Tablet ${activeBoothId.toUpperCase()}`,
          role: 'booth',
          boothId: activeBoothId,
        }),
      }).catch(() => {});
    };

    pingServer();
    const interval = setInterval(pingServer, 15000);
    return () => clearInterval(interval);
  }, [activeBoothId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Play confetti when vote succeeds
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    playChime('success');
  };

  // Countdown timer after voting
  useEffect(() => {
    let timer: any;
    if (votedSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (votedSuccess && countdown === 0) {
      setVotedSuccess(false);
      setSelectedCandidate(null);
      onClearLocalActiveVoter();
      setCountdown(4);
    }
    return () => clearTimeout(timer);
  }, [votedSuccess, countdown, onClearLocalActiveVoter]);

  const handleConfirmVote = async () => {
    if (!activeVoter || !selectedCandidate) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await onCastVote(activeVoter.id, selectedCandidate.id, activeBoothId);
      if (res.success) {
        setVotedSuccess(true);
        triggerConfetti();
      } else {
        setErrorMessage(res.message || 'Gagal menyimpan suara.');
        playChime('alert');
      }
    } catch {
      setErrorMessage('Terjadi kendala saat mengirim suara ke server.');
      playChime('alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelfVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfCode.trim()) return;
    setIsSelfVerifying(true);
    setSelfError('');

    try {
      const res = await onDirectSelfVerify(selfCode.trim());
      if (res.success && res.voter) {
        playChime('success');
        setSelfCode('');
      } else {
        setSelfError(res.message || 'NISN / NIP tidak valid atau sudah memilih.');
        playChime('alert');
      }
    } catch {
      setSelfError('Gagal memverifikasi pemilih.');
    } finally {
      setIsSelfVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-900 text-white py-8 sm:py-12 relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Booth Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Bilik Suara Digital ({activeBoothId === 'bilik-1' ? 'Bilik 1' : activeBoothId === 'bilik-2' ? 'Bilik 2' : 'Bilik 3'})
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {SCHOOL_INFO.name}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Surat Suara Elektronik OSIS {SCHOOL_INFO.periode}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Booth Switcher (useful if testing or switching booths) */}
            {setActiveBoothId && (
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setActiveBoothId('bilik-1')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeBoothId === 'bilik-1' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bilik 1
                </button>
                <button
                  onClick={() => setActiveBoothId('bilik-2')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeBoothId === 'bilik-2' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bilik 2
                </button>
                <button
                  onClick={() => setActiveBoothId('bilik-3')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeBoothId === 'bilik-3' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bilik 3
                </button>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              id="booth-fullscreen-toggle-btn"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Layar Penuh Kiosk"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onBackToQueue}
              id="booth-back-to-queue-btn"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Meja Registrasi</span>
            </button>
          </div>
        </div>

        {/* ================= CONDITION 1: SUCCESS VOTED SCREEN ================= */}
        {votedSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-2xl mx-auto text-center py-12 px-6 bg-slate-800/80 backdrop-blur-md rounded-3xl border border-emerald-500/40 shadow-2xl"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
              Suara Berhasil Disimpan
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 tracking-tight">
              Terima Kasih Atas Partisipasi Anda!
            </h2>

            <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-lg mx-auto leading-relaxed">
              Hak suara Anda telah tersimpan secara rahasia dan aman, serta <strong className="text-emerald-300 font-bold">langsung terkirim dan terintegrasi otomatis ke Akun & Portal Admin SMPN 3 Parang</strong>.
            </p>

            <div className="mt-8 p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Layar bilik otomatis kembali siap untuk pemilih selanjutnya dalam{' '}
                <strong className="text-amber-400 text-sm">{countdown} detik</strong>
              </span>
            </div>

            <button
              onClick={() => {
                setVotedSuccess(false);
                setSelectedCandidate(null);
                onClearLocalActiveVoter();
              }}
              id="finish-vote-now-btn"
              className="mt-6 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Selesai & Siapkan Pemilih Berikutnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : activeVoter ? (
          /* ================= CONDITION 2: VOTER IS AUTHORIZED -> SHOW BALLOT ================= */
          <div>
            {/* Active Voter Banner */}
            <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-700/50 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400 text-blue-300 flex items-center justify-center font-bold">
                  {activeVoter.id}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                    Pemilih Terverifikasi ({activeVoter.role === 'siswa' ? 'Siswa' : 'Guru / Staf'}):
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {activeVoter.name}
                  </h2>
                  <p className="text-xs text-blue-200">
                    {activeVoter.className} • NISN/NIP: {activeVoter.code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span>Bilik Suara Terkunci Rahasia</span>
              </div>
            </div>

            {/* Instruction Headline */}
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Pilihlah 1 (Satu) Pasangan Calon Ketua OSIS Pilihan Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Sentuh atau klik tombol <strong className="text-emerald-400">&quot;Coblos / Pilih Calon&quot;</strong> pada salah satu kartu kandidat di bawah ini.
              </p>
            </div>

            {/* The 3 Ballot Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CANDIDATES.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-slate-800/90 rounded-3xl border-2 border-slate-700 hover:border-emerald-500/80 transition-all shadow-xl p-6 flex flex-col justify-between group hover:-translate-y-1 duration-200"
                  id={`ballot-card-${candidate.id}`}
                >
                  <div>
                    {/* Number Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md">
                        0{candidate.id}
                      </span>
                      <span className="text-xs font-bold text-slate-300 bg-slate-700/60 px-3 py-1 rounded-full border border-slate-600">
                        Calon No. 0{candidate.id}
                      </span>
                    </div>

                    {/* Candidate Photo - Full Body Visible, No Cropping */}
                    <div className="h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700 mb-4 flex items-center justify-center p-2 relative group-hover:border-emerald-500/50 transition-colors">
                      <img
                        src={candidate.photo}
                        alt={`Foto Calon ${candidate.id}: ${candidate.name}`}
                        className="w-full h-full object-contain object-center drop-shadow-md group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-slate-900/90 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-700 shadow-xs">
                        Calon 0{candidate.id}
                      </div>
                    </div>

                    <h4 className="text-xl font-black text-white tracking-tight">
                      {candidate.name}
                    </h4>

                    {/* Visi & Misi */}
                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-blue-300 block mb-0.5">Visi :</span>
                        <p className="line-clamp-2 italic text-slate-200">&ldquo;{candidate.visi}&rdquo;</p>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-emerald-400 block mb-0.5">Misi :</span>
                        <p className="line-clamp-2 text-slate-300">{candidate.misi}</p>
                      </div>
                    </div>
                  </div>

                  {/* Coblos Button */}
                  <div className="mt-6 pt-4 border-t border-slate-700/60">
                    <button
                      onClick={() => {
                        playChime('click');
                        setSelectedCandidate(candidate);
                      }}
                      id={`coblos-candidate-${candidate.id}-btn`}
                      className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Vote className="w-5 h-5" />
                      <span>COBLOS CALON 0{candidate.id}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mt-6 p-4 rounded-xl bg-rose-900/50 border border-rose-600 text-sm text-rose-200 font-bold text-center">
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          /* ================= CONDITION 3: WAITING FOR VOTER OR SELF VERIFY ================= */
          <div className="max-w-2xl mx-auto text-center py-10">
            {/* Waiting Radar Animation */}
            <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-500/50 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-3.5 py-1.5 rounded-full border border-emerald-800">
              {activeBoothId === 'bilik-1' ? 'Bilik Suara 1' : 'Bilik Suara 2'} Standby
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-4 tracking-tight">
              Menunggu Pemilih Dipanggil oleh Petugas
            </h2>

            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Layar ini terhubung langsung ke Meja Registrasi panitia. Begitu petugas memverifikasi siswa atau guru berikutnya, surat suara akan langsung terbuka di bilik ini.
            </p>

            {/* Alternatif: Masuk Mandiri dengan NISN / NIP langsung di bilik */}
            <div className="mt-10 bg-slate-800/80 rounded-3xl border border-slate-700 p-6 sm:p-8 text-left shadow-xl max-w-md mx-auto">
              <div className="flex items-center gap-2.5 mb-3 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>Atau Masuk Mandiri di Layar Ini</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Jika Anda berada langsung di bilik suara tanpa operator, silakan ketik NISN (siswa) atau NIP (guru):
              </p>

              <form onSubmit={handleSelfVerifySubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ketik NISN / NIP Anda..."
                  value={selfCode}
                  onChange={(e) => setSelfCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white font-mono text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  id="self-verify-input"
                />

                {selfError && (
                  <p className="text-xs text-rose-400 font-semibold">{selfError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSelfVerifying || !selfCode.trim()}
                  id="self-verify-submit-btn"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSelfVerifying ? 'Memeriksa...' : 'Buka Surat Suara Saya'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal before finalizing vote */}
        <AnimatePresence>
          {selectedCandidate && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  0{selectedCandidate.id}
                </div>

                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800">
                  Konfirmasi Pilihan Suara
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-white mt-3">
                  Apakah Anda yakin memilih {selectedCandidate.name}?
                </h3>

                {/* Candidate Full Photo Preview in Modal */}
                <div className="h-44 w-full rounded-2xl bg-slate-950/80 border border-slate-700/80 p-2 my-3 flex items-center justify-center">
                  <img
                    src={selectedCandidate.photo}
                    alt={selectedCandidate.name}
                    className="w-full h-full object-contain object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Pilihan Anda bersifat <strong>rahasia dan final</strong>. Setelah tombol ditekan, suara Anda akan langsung masuk ke kotak suara digital dan tidak dapat diubah kembali.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
                    id="cancel-vote-confirm-btn"
                  >
                    Batal / Ubah Pilihan
                  </button>
                  <button
                    onClick={handleConfirmVote}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    id="submit-vote-final-btn"
                  >
                    <Vote className="w-4 h-4" />
                    <span>{isSubmitting ? 'Merekam Suara...' : 'Ya, Masukkan Suara'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Booth Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center text-xs text-slate-500 mt-8">
        SMP NEGERI 3 PARANG • Sistem Bilik Pemilihan OSIS Digital Mandiri & Terkoneksi
      </div>
    </div>
  );
};
