import React, { useState, useMemo } from 'react';
import { Voter, BoothSession } from '../types';
import { Search, CheckCircle2, Clock, UserCheck, ShieldAlert, ArrowRight, Filter, Monitor, Laptop, AlertCircle, X, ChevronRight, Share2, Smartphone } from 'lucide-react';
import { playChime } from '../utils/audio';

interface VoterQueueProps {
  voters: Voter[];
  boothSession: BoothSession;
  booths?: Record<string, BoothSession>;
  onActivateBoothForVoter: (voter: Voter, openHere: boolean, boothId?: string) => Promise<{ success: boolean; message: string }>;
  onDirectVoteHere: (voter: Voter) => void;
  onOpenShareModal?: () => void;
}

export const VoterQueue: React.FC<VoterQueueProps> = ({
  voters,
  boothSession,
  booths,
  onActivateBoothForVoter,
  onDirectVoteHere,
  onOpenShareModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'siswa' | 'guru' | 'unvoted' | 'voted'>('all');
  const [targetBoothId, setTargetBoothId] = useState<'bilik-1' | 'bilik-2' | 'bilik-3'>('bilik-1');
  
  // Verification modal state
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Find next unvoted in sequential order
  const nextInQueue = useMemo(() => {
    return voters.find((v) => !v.hasVoted);
  }, [voters]);

  const filteredVoters = useMemo(() => {
    return voters.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.id.toString() === searchTerm.trim();

      if (!matchSearch) return false;

      if (filterRole === 'siswa') return v.role === 'siswa';
      if (filterRole === 'guru') return v.role === 'guru';
      if (filterRole === 'unvoted') return !v.hasVoted;
      if (filterRole === 'voted') return v.hasVoted;
      return true;
    });
  }, [voters, searchTerm, filterRole]);

  const totalVoted = voters.filter((v) => v.hasVoted).length;
  const totalVoters = voters.length;

  const handleOpenVerify = (voter: Voter) => {
    if (voter.hasVoted) {
      setNotification({
        text: `Pemilih ${voter.name} sudah memberikan suara pada ${voter.votedAt || 'sesi sebelumnya'}.`,
        type: 'error',
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    setSelectedVoter(voter);
    setInputCode('');
    setVerifyError('');
    setVerifySuccess(false);
  };

  const handleVerify = async (openHere: boolean, chosenBoothId?: 'bilik-1' | 'bilik-2' | 'bilik-3') => {
    if (!selectedVoter) return;
    const finalBoothId = chosenBoothId || targetBoothId;
    setIsVerifying(true);
    setVerifyError('');

    try {
      const res = await fetch('/api/voters/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: selectedVoter.id,
          code: inputCode.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setVerifyError(data.message || 'Verifikasi gagal.');
        playChime('alert');
        setIsVerifying(false);
        return;
      }

      playChime('success');
      setVerifySuccess(true);

      // Now activate booth
      const result = await onActivateBoothForVoter(selectedVoter, openHere, finalBoothId);
      if (result.success) {
        if (openHere) {
          onDirectVoteHere(selectedVoter);
        } else {
          setNotification({
            text: `Bilik Suara (${finalBoothId === 'bilik-1' ? 'Bilik 1 / Laptop 2' : finalBoothId === 'bilik-2' ? 'Bilik 2 / Laptop 3' : 'Bilik 3'}) berhasil diaktifkan untuk ${selectedVoter.name}! Pemilih dipersilakan menuju bilik suara digital.`,
            type: 'success',
          });
          setSelectedVoter(null);
          setTimeout(() => setNotification(null), 5000);
        }
      } else {
        setVerifyError(result.message);
      }
    } catch {
      setVerifyError('Terjadi kesalahan jaringan saat verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm font-semibold shadow-sm transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                  Meja Registrasi & Presensi Pemilih
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Total DPT: {totalVoters} Pemilih
                </span>
                {onOpenShareModal && (
                  <button
                    onClick={onOpenShareModal}
                    id="queue-header-share-btn"
                    className="px-3 py-1 rounded-full text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sharing QR Bilik</span>
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
                Daftar & Urutan Pemilih OSIS
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Urutan pemilih terdiri dari 67 Siswa dan 18 Guru SMP Negeri 3 Parang. Lakukan verifikasi NISN/NIP untuk membuka bilik suara digital secara berurutan.
              </p>
            </div>

            {/* Quick Next Voter Call Action */}
            {nextInQueue ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 shrink-0 max-w-sm w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Antrean Pemilih Selanjutnya:
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate">
                    <span className="text-xs font-bold text-blue-900 mr-1.5">
                      #{nextInQueue.id}
                    </span>
                    <strong className="text-base font-black text-slate-900">
                      {nextInQueue.name}
                    </strong>
                    <p className="text-xs text-slate-600 font-medium truncate">
                      {nextInQueue.className} ({nextInQueue.role === 'siswa' ? 'Siswa' : 'Guru'})
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenVerify(nextInQueue)}
                    id="call-next-queue-btn"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <span>Panggil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Semua 85 pemilih telah selesai memberikan hak suara!</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700">Kemajuan Pemilihan</span>
              <span className="text-blue-900">
                {totalVoted} dari {totalVoters} Pemilih Selesai ({((totalVoted / totalVoters) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${(totalVoted / totalVoters) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3-LAPTOP LIVE STATUS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Laptop 1: Meja Panitia */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-900 font-black text-xs">
                L1
              </div>
              <div>
                <div className="text-[11px] font-black uppercase text-amber-950 tracking-wider">LAPTOP 1: PANITIA</div>
                <div className="text-[11px] text-amber-800 font-medium">Meja Verifikasi & Live Hasil</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
              Online
            </span>
          </div>

          {/* Laptop 2: Bilik 1 */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-900 font-black text-xs">
                L2
              </div>
              <div>
                <div className="text-[11px] font-black uppercase text-emerald-950 tracking-wider">LAPTOP 2: BILIK 1</div>
                <div className="text-[11px] text-emerald-800 font-medium">
                  {booths?.['bilik-1']?.activeVoter ? `Mencoblos: ${booths['bilik-1'].activeVoter.name.split(' ')[0]}` : 'Siap / Standby'}
                </div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              booths?.['bilik-1']?.activeVoter ? 'bg-amber-100 text-amber-900 animate-pulse' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {booths?.['bilik-1']?.activeVoter ? 'Sedang Coblos' : 'Tersedia'}
            </span>
          </div>

          {/* Laptop 3: Bilik 2 */}
          <div className="p-3.5 rounded-2xl bg-cyan-50/90 border border-cyan-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-900 font-black text-xs">
                L3
              </div>
              <div>
                <div className="text-[11px] font-black uppercase text-cyan-950 tracking-wider">LAPTOP 3: BILIK 2</div>
                <div className="text-[11px] text-cyan-800 font-medium">
                  {booths?.['bilik-2']?.activeVoter ? `Mencoblos: ${booths['bilik-2'].activeVoter.name.split(' ')[0]}` : 'Siap / Standby'}
                </div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              booths?.['bilik-2']?.activeVoter ? 'bg-amber-100 text-amber-900 animate-pulse' : 'bg-cyan-200 text-cyan-900'
            }`}>
              {booths?.['bilik-2']?.activeVoter ? 'Sedang Coblos' : 'Tersedia'}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kelas, atau NISN/NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-900 transition-colors"
              id="search-voters-input"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterRole === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalVoters})
            </button>
            <button
              onClick={() => setFilterRole('siswa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterRole === 'siswa'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Siswa (67)
            </button>
            <button
              onClick={() => setFilterRole('guru')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterRole === 'guru'
                  ? 'bg-indigo-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Guru & Staf (18)
            </button>
            <button
              onClick={() => setFilterRole('unvoted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterRole === 'unvoted'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Belum ({totalVoters - totalVoted})
            </button>
            <button
              onClick={() => setFilterRole('voted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterRole === 'voted'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sudah ({totalVoted})
            </button>
          </div>
        </div>

        {/* Voter Table List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">No</th>
                  <th className="py-3.5 px-4">Nama Pemilih</th>
                  <th className="py-3.5 px-3 text-center">JK</th>
                  <th className="py-3.5 px-4">Kelas / Jabatan</th>
                  <th className="py-3.5 px-4">NISN / NIP</th>
                  <th className="py-3.5 px-4">Status Hak Suara</th>
                  <th className="py-3.5 px-4 text-right">Aksi Bilik Suara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredVoters.map((voter) => (
                  <tr
                    key={voter.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      boothSession.activeVoter?.id === voter.id ? 'bg-amber-50/60' : ''
                    }`}
                    id={`voter-row-${voter.id}`}
                  >
                    {/* Number */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                      {voter.id}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">{voter.name}</div>
                        {voter.role === 'guru' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Guru
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            Siswa
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded-full text-xs font-bold ${
                          voter.gender === 'L'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                        title={voter.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      >
                        {voter.gender}
                      </span>
                    </td>

                    {/* Class or Position */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {voter.className}
                    </td>

                    {/* NISN / NIP */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {voter.code}
                    </td>

                    {/* Voting Status */}
                    <td className="py-3.5 px-4">
                      {voter.hasVoted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah Memilih {voter.votedAt && `(${voter.votedAt})`}</span>
                        </span>
                      ) : boothSession.activeVoter?.id === voter.id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sedang di Bilik Suara</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Belum Memilih</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      {voter.hasVoted ? (
                        <span className="text-xs text-slate-400 font-medium italic">
                          Suara Tercatat
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenVerify(voter)}
                          id={`verify-voter-${voter.id}-btn`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Verifikasi & Pilih</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Modal */}
        {selectedVoter && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedVoter(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                id="close-verify-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                    Verifikasi Pemilih #{selectedVoter.id}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {selectedVoter.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {selectedVoter.className} • {selectedVoter.role === 'siswa' ? 'Siswa' : 'Guru / Staf'}
                  </p>
                </div>
              </div>

              {/* Data Detail Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5 text-xs text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
                  <span className="font-semibold">{selectedVoter.pob}, {selectedVoter.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peran:</span>
                  <span className="font-semibold uppercase">{selectedVoter.role}</span>
                </div>
              </div>

              {/* Verification Input */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Masukkan {selectedVoter.role === 'siswa' ? 'NISN Siswa' : 'NIP / ID Guru'} :
                </label>
                <input
                  type="text"
                  placeholder={`Ketik ${selectedVoter.role === 'siswa' ? 'NISN' : 'NIP'} terdaftar...`}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerify(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-mono focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  id="input-verify-code"
                  autoFocus
                />
                
                {/* Helper hint for operator */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Petunjuk terdaftar: <strong className="font-mono text-slate-700">{selectedVoter.code}</strong></span>
                  <button
                    type="button"
                    onClick={() => setInputCode(selectedVoter.code)}
                    className="text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    Salin Kode
                  </button>
                </div>

                {verifyError && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}
              </div>

              {/* Choice of how to open voting booth */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Pilih Tujuan Bilik Suara:
                </p>

                {/* Option 1: Kirim ke Laptop 2 (Bilik 1) */}
                <button
                  disabled={isVerifying || !inputCode.trim()}
                  onClick={() => handleVerify(false, 'bilik-1')}
                  id="dispatch-to-laptop-2-btn"
                  className="w-full p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      L2
                    </div>
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        <span>Kirim ke Laptop 2 (Bilik Suara 1)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-200 text-emerald-900">
                          {booths?.['bilik-1']?.activeVoter ? 'Sedang dipakai' : 'Tersedia'}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-normal">
                        Kirim data pemilih ke layar bilik suara 1 untuk dicoblos secara rahasia
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />
                </button>

                {/* Option 2: Kirim ke Laptop 3 (Bilik 2) */}
                <button
                  disabled={isVerifying || !inputCode.trim()}
                  onClick={() => handleVerify(false, 'bilik-2')}
                  id="dispatch-to-laptop-3-btn"
                  className="w-full p-3 rounded-xl border-2 border-cyan-500 bg-cyan-50/70 hover:bg-cyan-100 text-cyan-950 font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      L3
                    </div>
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        <span>Kirim ke Laptop 3 (Bilik Suara 2)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-cyan-200 text-cyan-900">
                          {booths?.['bilik-2']?.activeVoter ? 'Sedang dipakai' : 'Tersedia'}
                        </span>
                      </div>
                      <div className="text-[11px] text-cyan-700 font-normal">
                        Kirim data pemilih ke layar bilik suara 2 (antrean paralel 2x lebih cepat)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-700 shrink-0" />
                </button>

                {/* Option 3: Direct vote on this device */}
                <button
                  disabled={isVerifying || !inputCode.trim()}
                  onClick={() => handleVerify(true)}
                  id="verify-to-local-booth-btn"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Laptop className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">Coblos di Layar Ini (Stand-alone)</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Buka bilik suara langsung di laptop panitia ini
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
