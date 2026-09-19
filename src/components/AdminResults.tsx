import React, { useState, useEffect } from 'react';
import { CANDIDATES, SCHOOL_INFO } from '../data/initialData';
import { Voter, ElectionSummary } from '../types';
import { Lock, Unlock, BarChart3, Users, Award, Printer, RotateCcw, Sparkles, CheckCircle2, ShieldCheck, PieChart, AlertTriangle, FileText, ChevronRight, Download } from 'lucide-react';
import { playChime } from '../utils/audio';

interface AdminResultsProps {
  onBackToHome: () => void;
  onOpenShareModal?: () => void;
  isAdminAuthenticated?: boolean;
  onAdminAuthChange?: (auth: boolean) => void;
}

export const AdminResults: React.FC<AdminResultsProps> = ({
  onBackToHome,
  onOpenShareModal,
  isAdminAuthenticated = false,
  onAdminAuthChange,
}) => {
  const [pin, setPin] = useState(isAdminAuthenticated ? 'admin123' : '');
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'charts' | 'attendance' | 'report'>('charts');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // If already authenticated from parent, fetch results immediately
  useEffect(() => {
    if (isAdminAuthenticated) {
      setIsAuthenticated(true);
      fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 'admin123' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setResults(data);
        })
        .catch(() => {});
    }
  }, [isAdminAuthenticated]);

  // Real-time SSE listener for instant sync when vote is cast on Booth laptop
  useEffect(() => {
    if (!isAuthenticated) return;
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream');
      eventSource.addEventListener('vote_cast', () => {
        handleRefreshResults();
      });
      eventSource.addEventListener('reset', () => {
        handleRefreshResults();
      });
    } catch {
      // ignore
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isAuthenticated, pin]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data);
        setIsAuthenticated(true);
        if (onAdminAuthChange) onAdminAuthChange(true);
        playChime('success');
      } else {
        setErrorMsg(data.message || 'PIN Admin tidak sesuai.');
        playChime('alert');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server.');
      playChime('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshResults = async () => {
    if (!pin) return;
    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data);
      }
    } catch {
      // silent
    }
  };

  const handleConfirmResetData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setIsResetModalOpen(false);
        setResetNotice('Seluruh data suara berhasil di-reset ke 0 dan status seluruh 85 pemilih kembali ke belum memilih.');
        playChime('success');
        handleRefreshResults();
        setTimeout(() => setResetNotice(null), 5000);
      } else {
        setErrorMsg(data.message || 'Gagal mereset data.');
        playChime('alert');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat mereset data.');
      playChime('alert');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      const res = await fetch('/api/admin/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), count: 35 }),
      });
      const data = await res.json();
      if (data.success) {
        handleRefreshResults();
      }
    } catch {
      // silent
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // If not authenticated, show PIN form
  if (!isAuthenticated || !results) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 max-w-md w-full shadow-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Akses Terbatas Panitia
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
            Rekapan Hasil Pemilihan
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Sesuai ketentuan, data rekapan persentase dan perolehan suara hanya dapat dibuka oleh Admin / Ketua Panitia Pemilihan OSIS SMPN 3 Parang.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Masukkan Kode Akses / PIN Admin :
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ketik PIN Admin..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-mono text-base focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
                id="admin-pin-input"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default PIN: <strong className="font-mono text-slate-600">admin123</strong>, <strong className="font-mono text-slate-600">123456</strong>, atau <strong className="font-mono text-slate-600">smpn3parang</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !pin.trim()}
              id="admin-login-submit-btn"
              className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{isLoading ? 'Membuka Rekapan...' : 'Buka Rekapan Hasil'}</span>
            </button>
          </form>

          <button
            onClick={onBackToHome}
            className="mt-6 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Calculate vote metrics
  const candidateVotes: Record<number, number> = results.candidateVotes || {};
  const totalVotesCast: number = results.totalVoted || 0;
  const totalDpt: number = results.totalVoters || 85;

  // Find leading candidate
  let leaderId = 1;
  let maxVotes = -1;
  Object.entries(candidateVotes).forEach(([id, count]) => {
    if ((count as number) > maxVotes) {
      maxVotes = count as number;
      leaderId = Number(id);
    }
  });

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-12 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-full print:p-0">
        {/* Admin Header Bar (hidden in print) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Rekapan Terbuka (Admin Terotentikasi)
                </span>
                <span className="text-xs text-slate-500">
                  Update: {results.lastUpdated}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
                Rekapan Hasil Pemilihan OSIS Digital
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                SMP Negeri 3 Parang • Periode {SCHOOL_INFO.periode}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                id="print-report-btn"
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Berita Acara</span>
              </button>

              <button
                onClick={handleSeedDemo}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Isi suara otomatis untuk simulasi atau pengujian sistem"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulasi Suara</span>
              </button>

              <button
                onClick={() => setIsResetModalOpen(true)}
                id="admin-reset-data-btn"
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>

              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  if (onAdminAuthChange) onAdminAuthChange(false);
                }}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Kunci Kembali
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setActiveSubTab('charts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeSubTab === 'charts'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Diagram & Persentase Suara</span>
            </button>
            <button
              onClick={() => setActiveSubTab('attendance')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeSubTab === 'attendance'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Audit Kehadiran Pemilih ({results.totalVoted}/{results.totalVoters})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('report')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeSubTab === 'report'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Format Berita Acara Resmi</span>
            </button>
          </div>
        </div>

        {/* Reset Success Notice */}
        {resetNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs print:hidden animate-fade-in">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{resetNotice}</span>
            </div>
            <button
              onClick={() => setResetNotice(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-lg cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* ================= TAB 1: CHARTS & PERCENTAGES ================= */}
        {activeSubTab === 'charts' && (
          <div className="space-y-8">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total DPT
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {totalDpt}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">67 Siswa + 18 Guru</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Suara Masuk
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                  {totalVotesCast}
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Tercatat di Kotak Suara
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Belum Menggunakan Hak
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                  {totalDpt - totalVotesCast}
                </div>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  Menunggu Giliran
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Partisipasi Suara
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
                  {totalDpt > 0 ? ((totalVotesCast / totalDpt) * 100).toFixed(1) : 0}%
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalDpt > 0 ? (totalVotesCast / totalDpt) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Candidate Result Cards with Interactive Percentage Progress */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Perolehan Suara Calon Ketua OSIS
                  </h2>
                  <p className="text-xs text-slate-600">
                    Persentase dihitung dari total {totalVotesCast} suara sah yang telah masuk
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-900 rounded-full border border-blue-200">
                  Sistem Real-Time
                </span>
              </div>

              <div className="space-y-6">
                {CANDIDATES.map((candidate) => {
                  const votes = candidateVotes[candidate.id] || 0;
                  const percentOfTotalCast = totalVotesCast > 0 ? ((votes / totalVotesCast) * 100).toFixed(1) : '0.0';
                  const percentOfDpt = totalDpt > 0 ? ((votes / totalDpt) * 100).toFixed(1) : '0.0';
                  const isLeader = totalVotesCast > 0 && candidate.id === leaderId && votes > 0;

                  return (
                    <div
                      key={candidate.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isLeader
                          ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                          : 'border-slate-200 bg-white'
                      }`}
                      id={`result-candidate-${candidate.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-4">
                          {/* Number Badge */}
                          <span className="w-11 h-11 rounded-xl bg-blue-900 text-white font-black text-lg flex items-center justify-center shrink-0">
                            0{candidate.id}
                          </span>

                          {/* Candidate Avatar */}
                          <div className="w-13 h-13 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={candidate.photo}
                              alt={candidate.name}
                              className="w-full h-full object-cover object-top"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-black text-slate-900">
                                {candidate.name}
                              </h3>
                              {isLeader && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                                  <Award className="w-3 h-3 text-amber-700" />
                                  Unggul Sementara
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 italic">
                              &ldquo;{candidate.visi}&rdquo;
                            </p>
                          </div>
                        </div>

                        {/* Votes and Percentage Numbers */}
                        <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">
                              {percentOfTotalCast}%
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              ({votes} Suara)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {percentOfDpt}% dari seluruh DPT
                          </span>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            candidate.id === 1
                              ? 'bg-blue-600'
                              : candidate.id === 2
                              ? 'bg-indigo-600'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.max(1, Number(percentOfTotalCast))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demographic Participation Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Siswa vs Guru */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  <span>Partisipasi Berdasarkan Status Pemilih</span>
                </h3>

                <div className="space-y-4">
                  {/* Siswa */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Siswa (DPT 67)</span>
                      <span className="text-blue-900">
                        {results.roleBreakdown?.siswa?.voted || 0} / {results.roleBreakdown?.siswa?.total || 67}{' '}
                        ({(
                          ((results.roleBreakdown?.siswa?.voted || 0) /
                            (results.roleBreakdown?.siswa?.total || 67)) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-900 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(
                            ((results.roleBreakdown?.siswa?.voted || 0) /
                              (results.roleBreakdown?.siswa?.total || 67)) *
                            100
                          ).toFixed(1)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Guru & Staf */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Guru & Tenaga Kependidikan (DPT 18)</span>
                      <span className="text-indigo-900">
                        {results.roleBreakdown?.guru?.voted || 0} / {results.roleBreakdown?.guru?.total || 18}{' '}
                        ({(
                          ((results.roleBreakdown?.guru?.voted || 0) /
                            (results.roleBreakdown?.guru?.total || 18)) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(
                            ((results.roleBreakdown?.guru?.voted || 0) /
                              (results.roleBreakdown?.guru?.total || 18)) *
                            100
                          ).toFixed(1)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gender Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <span>Partisipasi Berdasarkan Jenis Kelamin</span>
                </h3>

                <div className="space-y-4">
                  {/* Laki-laki */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Laki-laki (L)</span>
                      <span className="text-blue-900">
                        {results.genderBreakdown?.L?.voted || 0} / {results.genderBreakdown?.L?.total || 0}{' '}
                        ({results.genderBreakdown?.L?.total > 0
                          ? ((results.genderBreakdown.L.voted / results.genderBreakdown.L.total) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            results.genderBreakdown?.L?.total > 0
                              ? (results.genderBreakdown.L.voted / results.genderBreakdown.L.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Perempuan */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Perempuan (P)</span>
                      <span className="text-rose-700">
                        {results.genderBreakdown?.P?.voted || 0} / {results.genderBreakdown?.P?.total || 0}{' '}
                        ({results.genderBreakdown?.P?.total > 0
                          ? ((results.genderBreakdown.P.voted / results.genderBreakdown.P.total) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            results.genderBreakdown?.P?.total > 0
                              ? (results.genderBreakdown.P.voted / results.genderBreakdown.P.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ATTENDANCE AUDIT LOG ================= */}
        {activeSubTab === 'attendance' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Daftar Audit Kehadiran Pemilih (DPT)
                </h3>
                <p className="text-xs text-slate-500">
                  Menampilkan status partisipasi seluruh 85 pemilih tanpa membocorkan pilihan calon (Asas Rahasia).
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
                {results.totalVoted} Telah Hadir • {results.totalRemaining} Belum Hadir
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4 text-center w-14">No</th>
                    <th className="py-3 px-4">Nama Pemilih</th>
                    <th className="py-3 px-3 text-center">JK</th>
                    <th className="py-3 px-4">Kelas / Jabatan</th>
                    <th className="py-3 px-4">NISN / NIP</th>
                    <th className="py-3 px-4">Waktu Hadir</th>
                    <th className="py-3 px-4 text-center">Status Suara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.voters?.map((voter: Voter) => (
                    <tr key={voter.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {voter.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {voter.name}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-600">{voter.gender}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {voter.className}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {voter.code}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">
                        {voter.votedAt || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {voter.hasVoted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sudah Memilih
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Belum Memilih
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: OFFICIAL REPORT (BERITA ACARA) ================= */}
        {activeSubTab === 'report' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Letterhead */}
            <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img
                  src={SCHOOL_INFO.logoUrl}
                  alt="Logo SMPN 3 Parang"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Pemerintah Kabupaten Magetan • Dinas Pendidikan
                  </h3>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 font-['Space_Grotesk',sans-serif]">
                    SMP NEGERI 3 PARANG
                  </h2>
                  <p className="text-xs text-slate-600">
                    {SCHOOL_INFO.address} • Portal Pemilihan OSIS Digital
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-base sm:text-lg font-black uppercase underline tracking-wider text-slate-900">
                BERITA ACARA HASIL PEMILIHAN KETUA OSIS
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Nomor: 421.3 / OSIS / SMPN3PRG / {new Date().getFullYear()}
              </p>
            </div>

            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 mb-8">
              <p>
                Pada hari ini, tanggal <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, telah diselenggarakan Pemilihan Ketua OSIS SMP Negeri 3 Parang Masa Bakti {SCHOOL_INFO.periode} dengan menggunakan <strong>Sistem Bilik Suara Digital Terintegrasi</strong>.
              </p>

              <p>
                Berdasarkan data rekapitulasi digital, diperoleh rincian pelaksanaan pemungutan suara sebagai berikut:
              </p>

              {/* Data Summary Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden my-4">
                <table className="w-full text-xs sm:text-sm">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-4 bg-slate-50 font-semibold w-1/2">Jumlah Hak Pilih Terdaftar (DPT)</td>
                      <td className="py-2 px-4 font-bold">{totalDpt} Orang (67 Siswa, 18 Guru)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 bg-slate-50 font-semibold">Jumlah Suara Sah Masuk</td>
                      <td className="py-2 px-4 font-bold text-emerald-700">{totalVotesCast} Suara</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 bg-slate-50 font-semibold">Tingkat Partisipasi Pemilih</td>
                      <td className="py-2 px-4 font-bold text-blue-900">
                        {totalDpt > 0 ? ((totalVotesCast / totalDpt) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="font-bold text-slate-900">
                Hasil Perolehan Suara Calon Ketua OSIS:
              </p>

              {/* Results Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden my-4">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-4 text-center w-14">No</th>
                      <th className="py-2.5 px-4">Nama Calon Ketua OSIS</th>
                      <th className="py-2.5 px-4 text-right">Perolehan Suara</th>
                      <th className="py-2.5 px-4 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {CANDIDATES.map((c) => {
                      const votes = candidateVotes[c.id] || 0;
                      const pct = totalVotesCast > 0 ? ((votes / totalVotesCast) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={c.id}>
                          <td className="py-2.5 px-4 text-center font-bold">0{c.id}</td>
                          <td className="py-2.5 px-4 font-bold">{c.name}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">{votes} Suara</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p>
                Demikian Berita Acara ini dibuat dengan sebenarnya dan disahkan berdasarkan rekaman suara sah pada Kotak Suara Digital Pemilihan OSIS SMP Negeri 3 Parang.
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs sm:text-sm">
              <div>
                <p className="font-semibold text-slate-600">Mengetahui,</p>
                <p className="font-bold text-slate-900 mt-1">Kepala SMPN 3 Parang</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">(...........................................)</p>
                <p className="text-[11px] text-slate-500">NIP. ....................................</p>
              </div>

              <div>
                <p className="font-semibold text-slate-600">Disetujui,</p>
                <p className="font-bold text-slate-900 mt-1">Pembina OSIS</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">(...........................................)</p>
                <p className="text-[11px] text-slate-500">NIP. ....................................</p>
              </div>

              <div>
                <p className="font-semibold text-slate-600">Parang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-900 mt-1">Ketua Panitia Pemilihan</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">(...........................................)</p>
                <p className="text-[11px] text-slate-500">Ketua Panitia E-Pilketos</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Reset Data */}
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black text-slate-900 text-center tracking-tight">
                Reset Data Pemilihan?
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 text-center mt-2 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh perolehan suara menjadi <strong>0</strong>, mengembalikan status seluruh <strong>85 pemilih (67 siswa & 18 guru)</strong> menjadi belum memilih, dan mereset status bilik suara.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Data yang telah direset tidak dapat dikembalikan lagi.</span>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmResetData}
                  id="confirm-reset-data-btn"
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Mereset...' : 'Ya, Reset Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
