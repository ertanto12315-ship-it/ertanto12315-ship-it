import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ConnectedDevice, BoothSession } from '../types';
import { SCHOOL_INFO } from '../data/initialData';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  Monitor,
  Volume2,
  X,
  Share2,
  Radio,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  ShieldAlert,
  Send,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { playChime } from '../utils/audio';

interface ShareDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedDevices: ConnectedDevice[];
  booths: Record<string, BoothSession>;
  isAdminAuthenticated?: boolean;
  onAdminLoginSuccess?: () => void;
}

export const ShareDeviceModal: React.FC<ShareDeviceModalProps> = ({
  isOpen,
  onClose,
  connectedDevices,
  booths,
  isAdminAuthenticated = false,
  onAdminLoginSuccess,
}) => {
  const [internalAdminAuth, setInternalAdminAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const [selectedRole, setSelectedRole] = useState<'booth-1' | 'booth-2' | 'booth-3' | 'queue' | 'vote'>('booth-1');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isRinging, setIsRinging] = useState(false);

  const effectiveIsAdmin = isAdminAuthenticated || internalAdminAuth;

  // Generate target URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  let targetPath = '';
  let roleTitle = 'Bilik Suara 1';
  if (selectedRole === 'booth-1') {
    targetPath = '?mode=booth&boothId=bilik-1';
    roleTitle = 'Bilik Suara 1';
  } else if (selectedRole === 'booth-2') {
    targetPath = '?mode=booth&boothId=bilik-2';
    roleTitle = 'Bilik Suara 2';
  } else if (selectedRole === 'booth-3') {
    targetPath = '?mode=booth&boothId=bilik-3';
    roleTitle = 'Bilik Suara 3';
  } else if (selectedRole === 'queue') {
    targetPath = '?mode=queue';
    roleTitle = 'Meja Petugas Registrasi';
  } else if (selectedRole === 'vote') {
    targetPath = '?mode=vote';
    roleTitle = 'Bilik Voting Digital Mandiri';
  }

  const fullShareUrl = `${baseUrl}${targetPath}`;

  // Generate QR Code when URL changes
  useEffect(() => {
    if (!isOpen || !effectiveIsAdmin) return;
    QRCode.toDataURL(fullShareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR', err));
  }, [fullShareUrl, isOpen, effectiveIsAdmin]);

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    setIsVerifyingPin(true);
    setPinError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setInternalAdminAuth(true);
        setPinError('');
        playChime('success');
        if (onAdminLoginSuccess) onAdminLoginSuccess();
      } else {
        setPinError(data.message || 'PIN Admin tidak valid. Hanya admin yang berhak sharing perangkat.');
        playChime('alert');
      }
    } catch {
      // Fallback check
      const p = pinInput.trim();
      if (p === 'admin123' || p === '123456' || p === 'smpn3parang') {
        setInternalAdminAuth(true);
        setPinError('');
        playChime('success');
        if (onAdminLoginSuccess) onAdminLoginSuccess();
      } else {
        setPinError('Gagal memverifikasi PIN Admin.');
        playChime('alert');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      playChime('click');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenNewWindow = () => {
    window.open(fullShareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*PORTAL PEMILIHAN OSIS DIGITAL SMP NEGERI 3 PARANG*\n\n` +
      `Admin telah membagikan tautan akses untuk *${roleTitle}*:\n` +
      `🔗 ${fullShareUrl}\n\n` +
      `✅ *Hasil pencoblosan dari tautan ini langsung terintegrasi secara otomatis ke Akun Admin & Rekapan.*`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Pemilihan OSIS SMPN 3 Parang - ${roleTitle}`,
          text: `Akses ${roleTitle} Pemilihan OSIS SMP Negeri 3 Parang. Hasil suara terintegrasi langsung ke Akun Admin:`,
          url: fullShareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleTestChime = async (boothId: string) => {
    setIsRinging(true);
    try {
      await fetch('/api/booth/chime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boothId }),
      });
      playChime('chime');
    } catch {
      // silent
    } finally {
      setTimeout(() => setIsRinging(false), 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-share-modal-btn"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                Sistem Sharing Perangkat (Khusus Admin / Operator)
              </span>
              <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                3 Bilik Suara
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Koneksi & QR Code Bilik Suara Digital
            </h2>
          </div>
        </div>

        {/* ADMIN AUTH GATE */}
        {!effectiveIsAdmin ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Akses Terbatas: Hanya Admin / Operator
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6">
              Sesuai ketentuan keamanan pemilihan OSIS SMP Negeri 3 Parang, pembagian link/QR Code dan koneksi ke bilik suara hanya dapat dilakukan oleh Admin atau Operator resmi.
            </p>

            <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-3">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Masukkan PIN Admin..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-base tracking-widest focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  id="admin-share-pin-input"
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingPin || !pinInput.trim()}
                id="submit-admin-share-pin-btn"
                className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isVerifyingPin ? 'Memverifikasi...' : 'Buka Akses Sharing'}</span>
              </button>

              <p className="text-[11px] text-slate-400">
                PIN default panitia: <strong className="font-mono text-slate-600">admin123</strong> atau <strong className="font-mono text-slate-600">123456</strong>
              </p>
            </form>
          </div>
        ) : (
          <div>
            {/* Admin Verified Banner */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Otoritas Admin Terverifikasi • Sistem Sinkronisasi Antar-Perangkat Aktif</span>
              </div>
              <button
                type="button"
                onClick={() => setInternalAdminAuth(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Kunci Akses
              </button>
            </div>

            {/* 3-LAPTOP SPOTLIGHT BOX */}
            <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white shadow-md border border-blue-700/50">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Laptop className="w-6 h-6 text-amber-300" />
                </div>
                <div className="grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase font-['Space_Grotesk',sans-serif]">
                      Panduan Resmi Sinkronisasi 3 Laptop (SMPN 3 Parang)
                    </h3>
                    <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                      Sistem 3 Perangkat
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                    Sistem pemilihan OSIS digital dirancang bekerja sinkron secara paralel pada 3 laptop di TPS:
                  </p>
                  
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="font-black text-amber-300 block mb-0.5">LAPTOP 1 (Admin/Panitia)</span>
                      <p className="text-[11px] text-slate-200">
                        Meja Presensi: Verifikasi NISN/NIP 85 pemilih, panggil ke Bilik 1 / Bilik 2, & pantau hasil suara live.
                      </p>
                    </div>

                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="font-black text-emerald-300 block mb-0.5">LAPTOP 2 (Bilik Suara 1)</span>
                      <p className="text-[11px] text-slate-200">
                        Bilik 1: Tampilan surat suara pemilih. Begitu dicoblos, suara langsung masuk seketika ke Laptop 1.
                      </p>
                    </div>

                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="font-black text-cyan-300 block mb-0.5">LAPTOP 3 (Bilik Suara 2)</span>
                      <p className="text-[11px] text-slate-200">
                        Bilik 2: Berjalan berbarengan dengan Bilik 1 agar antrean 85 orang selesai 2x lebih cepat!
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedRole('booth-1');
                        navigator.clipboard.writeText(`${window.location.origin}/?mode=booth&boothId=bilik-1&role=pemilih`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-950" />
                      <span>Salin Link Laptop 2 (Bilik 1)</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedRole('booth-2');
                        navigator.clipboard.writeText(`${window.location.origin}/?mode=booth&boothId=bilik-2&role=pemilih`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-950" />
                      <span>Salin Link Laptop 3 (Bilik 2)</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedRole('booth-1');
                      }}
                      className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-300" />
                      <span>Lihat QR Code Bilik</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Mode Selector (3 Bilik + 1 Meja Registrasi + Link Mandiri) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4">
              <button
                onClick={() => setSelectedRole('booth-1')}
                id="select-share-booth-1-btn"
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'booth-1'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Bilik 1</span>
              </button>

              <button
                onClick={() => setSelectedRole('booth-2')}
                id="select-share-booth-2-btn"
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'booth-2'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Bilik 2</span>
              </button>

              <button
                onClick={() => setSelectedRole('booth-3')}
                id="select-share-booth-3-btn"
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'booth-3'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Bilik 3</span>
              </button>

              <button
                onClick={() => setSelectedRole('queue')}
                id="select-share-queue-btn"
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'queue'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Meja Petugas</span>
              </button>

              <button
                onClick={() => setSelectedRole('vote')}
                id="select-share-vote-btn"
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'vote'
                    ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Voting Mandiri</span>
              </button>
            </div>

            {/* Integration Banner */}
            <div className="mb-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Terintegrasi Otomatis ke Akun Admin:</strong>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Semua hasil pilihan atau pencoblosan dari link yang dikirimkan admin langsung tersimpan di server dan otomatis terkirim ke portal rekapan admin secara real-time.
                </p>
              </div>
            </div>

            {/* Main Content: QR & Link */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Sharing Bilik Suara"
                    className="w-44 h-44 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-900" />
                  Scan Kamera HP/Tablet
                </span>
              </div>

              {/* Details & Actions */}
              <div className="grow w-full space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Link Akses ({roleTitle}) :
                  </span>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-300 font-mono text-xs text-slate-700 break-all select-all flex items-center justify-between gap-2">
                    <span>{fullShareUrl}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyUrl}
                    id="copy-share-url-btn"
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    id="share-whatsapp-btn"
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Bagikan WhatsApp</span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    id="share-native-device-btn"
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Bagikan ke Perangkat</span>
                  </button>

                  <button
                    onClick={handleOpenNewWindow}
                    id="open-share-tab-btn"
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka Tab Baru / Chrome</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() =>
                      handleTestChime(
                        selectedRole === 'queue'
                          ? 'bilik-1'
                          : selectedRole === 'booth-1'
                          ? 'bilik-1'
                          : selectedRole === 'booth-2'
                          ? 'bilik-2'
                          : selectedRole === 'booth-3'
                          ? 'bilik-3'
                          : 'bilik-1'
                      )
                    }
                    disabled={isRinging}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Volume2 className={`w-4 h-4 ${isRinging ? 'animate-bounce text-amber-600' : ''}`} />
                    <span>
                      {isRinging
                        ? 'Mengirim Bunyi Bel...'
                        : `Kirim Tes Bunyi Bel ke ${roleTitle}`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 BOOTHS STATUS MONITOR GRID */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Monitoring Real-time 3 Bilik Suara</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['bilik-1', 'bilik-2', 'bilik-3'] as const).map((bId, idx) => {
                  const bSession = booths[bId];
                  const isBusy = bSession && bSession.status === 'authorized';
                  const isVoted = bSession && bSession.status === 'voted_success';

                  return (
                    <div
                      key={bId}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isBusy
                          ? 'bg-amber-50 border-amber-300'
                          : isVoted
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-xs text-slate-900">
                          Bilik Suara {idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isBusy
                              ? 'bg-amber-200 text-amber-900'
                              : isVoted
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isBusy ? 'Aktif Digunakan' : isVoted ? 'Baru Selesai' : 'Siap / Standby'}
                        </span>
                      </div>

                      {bSession?.activeVoter ? (
                        <p className="text-xs font-bold text-slate-800 truncate">
                          👤 {bSession.activeVoter.name}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500">Menunggu antrean dari meja verifikasi</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Connected Devices Monitor */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">
                  Perangkat Terhubung via Jaringan ({connectedDevices.length})
                </span>
                <span className="text-[11px] text-slate-400">Sinkronisasi otomatis aktif</span>
              </div>

              {connectedDevices.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Belum ada perangkat bilik yang tersambung. Silakan scan QR code di atas menggunakan HP/Tablet di masing-masing bilik suara.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {connectedDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                        <div>
                          <p className="font-bold text-slate-900">{dev.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Peran: {dev.role.toUpperCase()} • {dev.boothId ? dev.boothId.toUpperCase() : 'MEJA ANTRIAN'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Online
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
              <div>
                <strong>Petunjuk Penataan 3 Bilik Suara (SMPN 3 Parang):</strong>
                <p className="mt-0.5 text-blue-900 leading-relaxed text-[11px]">
                  1. Sediakan 3 perangkat (Tablet / Laptop / HP) untuk <strong>Bilik 1</strong>, <strong>Bilik 2</strong>, dan <strong>Bilik 3</strong>.
                  <br />
                  2. Pilih tab masing-masing bilik di atas, lalu scan QR Code dengan perangkat bilik tersebut.
                  <br />
                  3. Saat petugas verifikasi memanggil pemilih di Meja Antrean, pilih bilik yang sedang kosong (Bilik 1, 2, atau 3) untuk mengirim sesi pencoblosan secara otomatis.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
