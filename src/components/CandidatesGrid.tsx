import React from 'react';
import { CANDIDATES, SCHOOL_INFO } from '../data/initialData';
import { Vote, ArrowLeft, CheckCircle2, Target, HeartHandshake, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface CandidatesGridProps {
  onBack: () => void;
  onGoToQueue: () => void;
  onGoToBooth: () => void;
}

export const CandidatesGrid: React.FC<CandidatesGridProps> = ({
  onBack,
  onGoToQueue,
  onGoToBooth,
}) => {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={onBack}
              id="back-to-home-btn"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-900 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
              Profil Calon Ketua OSIS
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              SMP Negeri 3 Parang • Masa Bakti {SCHOOL_INFO.periode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToQueue}
              id="candidates-to-queue-btn"
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-900 hover:bg-blue-950 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Vote className="w-4 h-4 text-blue-200" />
              <span>Daftar Pemilih & Antrean</span>
            </button>
            <button
              onClick={onGoToBooth}
              id="candidates-to-booth-btn"
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-100" />
              <span>Bilik Suara</span>
            </button>
          </div>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {CANDIDATES.map((candidate, idx) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
              id={`candidate-card-${candidate.id}`}
            >
              <div>
                {/* Card Top Banner with Number */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-xs">
                      0{candidate.id}
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                        Nomor Urut 0{candidate.id}
                      </span>
                      <h3 className="text-base font-bold leading-tight">
                        Kandidat Ketua OSIS
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full border border-white/20">
                    Calon {candidate.id}
                  </span>
                </div>

                {/* Candidate Photo - Full Body Visible, No Cropping */}
                <div className="p-5 pb-2">
                  <div className="relative h-[380px] sm:h-[420px] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 border-2 border-slate-200 shadow-inner flex items-center justify-center p-2">
                    <img
                      src={candidate.photo}
                      alt={`Foto Lengkap Calon ${candidate.id}: ${candidate.name}`}
                      className="w-full h-full object-contain object-center drop-shadow-md hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      Foto Lengkap
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-blue-900/90 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      SMPN 3 Parang
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-4">
                    {candidate.name}
                  </h2>
                  <p className="text-xs font-bold text-blue-700 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {candidate.slogan}
                  </p>
                </div>

                {/* Visi and Misi Details */}
                <div className="p-6 pt-2 space-y-4">
                  {/* Visi */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider mb-1.5">
                      <Target className="w-4 h-4 text-blue-700" />
                      <span>Visi :</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed italic">
                      &ldquo;{candidate.visi}&rdquo;
                    </p>
                  </div>

                  {/* Misi */}
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wider mb-1.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-700" />
                      <span>Misi :</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-800 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{candidate.misi}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-2">
                <button
                  onClick={onGoToBooth}
                  id={`vote-direct-candidate-${candidate.id}-btn`}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-900 hover:bg-blue-950 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Vote className="w-4 h-4 text-amber-300" />
                  <span>Pilih Calon No. 0{candidate.id} di Bilik Suara</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informational Footer */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-600 max-w-3xl mx-auto">
          <p className="font-semibold text-slate-900 text-sm mb-1">
            Gunakan Hak Suara Anda Secara Cerdas & Bijak
          </p>
          Setiap siswa dan guru memiliki 1 (satu) hak suara yang sah dan dilindungi asas kerahasiaan pemilihan. Pilihan Anda menentukan kemajuan OSIS SMP Negeri 3 Parang periode 2026/2027.
        </div>
      </div>
    </div>
  );
};
