import React, { useState } from 'react';
import { Lock, Unlock, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { playChime } from '../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playChime('success');
        setPin('');
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.message || 'Kode akses / PIN Admin tidak valid.');
        playChime('alert');
      }
    } catch {
      // Fallback check if server offline
      if (cleanPin === 'admin123' || cleanPin === '123456' || cleanPin === 'smpn3parang') {
        playChime('success');
        setPin('');
        onSuccess();
        onClose();
      } else {
        setErrorMsg('PIN salah. Harap periksa kembali.');
        playChime('alert');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          id="close-admin-login-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Otoritas Khusus Admin
          </span>

          <h3 className="text-xl font-black text-slate-900 mt-2.5 tracking-tight">
            Masuk ke Mode Admin
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Hanya Admin / Operator yang berhak mengakses rekapan hasil, kontrol 3 bilik suara, pembagian tautan, dan reset data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Masukkan PIN Admin / Panitia:
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ketik PIN Admin..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 transition-all"
              id="admin-login-pin-field"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Default PIN Panitia: <strong className="font-mono text-slate-600">admin123</strong>, <strong className="font-mono text-slate-600">123456</strong>, atau <strong className="font-mono text-slate-600">smpn3parang</strong>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !pin.trim()}
              id="confirm-admin-pin-btn"
              className="w-2/3 py-3 rounded-xl text-xs sm:text-sm font-bold bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi...' : 'Buka Akses Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
