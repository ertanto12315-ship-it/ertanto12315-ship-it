/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { CandidatesGrid } from './components/CandidatesGrid';
import { VoterQueue } from './components/VoterQueue';
import { VotingBooth } from './components/VotingBooth';
import { AdminResults } from './components/AdminResults';
import { ShareDeviceModal } from './components/ShareDeviceModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Voter, BoothSession, ConnectedDevice } from './types';
import { INITIAL_VOTERS } from './data/initialData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'candidates' | 'queue' | 'booth' | 'admin'>('home');
  const [userRole, setUserRole] = useState<'admin' | 'pemilih'>('pemilih');
  const [activeBoothId, setActiveBoothId] = useState<string>('bilik-1');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const [voters, setVoters] = useState<Voter[]>(INITIAL_VOTERS);
  const [booths, setBooths] = useState<Record<string, BoothSession>>({
    'bilik-1': { boothId: 'bilik-1', activeVoter: null, status: 'idle', updatedAt: Date.now() },
    'bilik-2': { boothId: 'bilik-2', activeVoter: null, status: 'idle', updatedAt: Date.now() },
    'bilik-3': { boothId: 'bilik-3', activeVoter: null, status: 'idle', updatedAt: Date.now() },
  });
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);

  const [localActiveVoter, setLocalActiveVoter] = useState<Voter | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [totalVoters, setTotalVoters] = useState(85);
  const [totalVoted, setTotalVoted] = useState(0);

  // Check URL parameters for standalone booth mode, admin mode, or queue mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const role = params.get('role');
      const boothParam = params.get('boothId');

      if (boothParam) {
        setActiveBoothId(boothParam);
      }

      if (role === 'admin' || mode === 'admin') {
        setUserRole('admin');
        setCurrentTab('admin');
      } else if (mode === 'booth' || mode === 'vote' || role === 'voter' || role === 'pemilih') {
        setUserRole('pemilih');
        setCurrentTab('booth');
      } else if (mode === 'queue') {
        setUserRole('admin');
        setCurrentTab('queue');
      } else if (mode === 'candidates') {
        setCurrentTab('candidates');
      }
    }
  }, []);

  // Fetch full status from server
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.voters) setVoters(data.voters);
        if (data.booths) setBooths(data.booths);
        if (data.devices) setConnectedDevices(data.devices);
        if (typeof data.totalVoters === 'number') setTotalVoters(data.totalVoters);
        if (typeof data.totalVoted === 'number') setTotalVoted(data.totalVoted);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  // Set up real-time Server-Sent Events (SSE) for multi-device sync
  useEffect(() => {
    fetchStatus();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.addEventListener('sync', (e) => {
          const data = JSON.parse(e.data);
          if (data.booths) setBooths(data.booths);
          if (data.devices) setConnectedDevices(data.devices);
          if (typeof data.totalVoted === 'number') setTotalVoted(data.totalVoted);
          if (typeof data.totalVoters === 'number') setTotalVoters(data.totalVoters);
        });

        eventSource.addEventListener('booths_update', (e) => {
          const data = JSON.parse(e.data);
          setBooths(data);
        });

        eventSource.addEventListener('booth_update', (e) => {
          const data = JSON.parse(e.data);
          setBooths((prev) => ({
            ...prev,
            [data.boothId]: data,
          }));
        });

        eventSource.addEventListener('devices_update', (e) => {
          const data = JSON.parse(e.data);
          setConnectedDevices(data);
        });

        eventSource.addEventListener('vote_cast', (e) => {
          const data = JSON.parse(e.data);
          if (data.booths) setBooths(data.booths);
          if (typeof data.totalVoted === 'number') setTotalVoted(data.totalVoted);
          fetchStatus();
        });

        eventSource.addEventListener('reset', () => {
          fetchStatus();
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch {
        setIsConnected(false);
      }
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchStatus]);

  // Activate Booth for a voter from Queue
  const handleActivateBoothForVoter = async (voter: Voter, openHere: boolean, boothId: string = 'bilik-1') => {
    try {
      const res = await fetch('/api/booth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: voter.id, boothId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.boothSession) {
          setBooths((prev) => ({
            ...prev,
            [boothId]: data.boothSession,
          }));
        }
        if (openHere) {
          setActiveBoothId(boothId);
          setLocalActiveVoter(voter);
          setCurrentTab('booth');
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mengaktifkan bilik.' };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  };

  const handleDirectVoteHere = (voter: Voter) => {
    setLocalActiveVoter(voter);
    setCurrentTab('booth');
  };

  // Direct self-verification in the booth
  const handleDirectSelfVerify = async (code: string) => {
    try {
      const res = await fetch('/api/voters/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success && data.voter) {
        setLocalActiveVoter(data.voter);
        return { success: true, message: data.message, voter: data.voter };
      }
      return { success: false, message: data.message || 'Verifikasi gagal' };
    } catch {
      return { success: false, message: 'Koneksi ke server terganggu' };
    }
  };

  // Cast vote
  const handleCastVote = async (voterId: number, candidateId: number, boothId: string = 'bilik-1') => {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, candidateId, boothId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mencoblos.' };
    } catch {
      return { success: false, message: 'Gagal mengirim suara ke server.' };
    }
  };

  const handleClearLocalActiveVoter = () => {
    setLocalActiveVoter(null);
  };

  const handleSwitchToAdmin = () => {
    if (isAdminAuthenticated) {
      setUserRole('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleSwitchToPemilih = () => {
    setUserRole('pemilih');
    if (currentTab === 'admin' || currentTab === 'queue') {
      setCurrentTab('home');
    }
  };

  const currentBoothSession = booths[activeBoothId] || booths['bilik-1'] || {
    boothId: activeBoothId,
    activeVoter: null,
    status: 'idle',
    updatedAt: Date.now(),
  };

  const turnoutPercentage = totalVoters > 0 ? Number(((totalVoted / totalVoters) * 100).toFixed(1)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Universal Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isConnected={isConnected}
        totalVoted={totalVoted}
        totalVoters={totalVoters}
        onOpenShareModal={() => {
          if (isAdminAuthenticated) {
            setIsShareModalOpen(true);
          } else {
            setIsAdminLoginModalOpen(true);
          }
        }}
        userRole={userRole}
        onSwitchToPemilih={handleSwitchToPemilih}
        onSwitchToAdmin={handleSwitchToAdmin}
      />

      {/* Main Content Area */}
      <main className="grow">
        {currentTab === 'home' && (
          <HomePage
            onGoToCandidates={() => setCurrentTab('candidates')}
            onGoToQueue={() => {
              if (userRole === 'admin') {
                setCurrentTab('queue');
              } else {
                // In pemilih mode, going to queue is allowed for list inspection or direct booth vote
                setCurrentTab('queue');
              }
            }}
            onGoToBooth={() => setCurrentTab('booth')}
            onGoToAdmin={() => {
              if (isAdminAuthenticated) {
                setUserRole('admin');
                setCurrentTab('admin');
              } else {
                setIsAdminLoginModalOpen(true);
              }
            }}
            onOpenShareModal={() => {
              if (isAdminAuthenticated) {
                setIsShareModalOpen(true);
              } else {
                setIsAdminLoginModalOpen(true);
              }
            }}
            totalVoted={totalVoted}
            totalVoters={totalVoters}
            turnoutPercentage={turnoutPercentage}
            connectedDevicesCount={connectedDevices.length}
            userRole={userRole}
            onSwitchToAdmin={handleSwitchToAdmin}
          />
        )}

        {currentTab === 'candidates' && (
          <CandidatesGrid
            onBack={() => setCurrentTab('home')}
            onGoToQueue={() => setCurrentTab('queue')}
            onGoToBooth={() => setCurrentTab('booth')}
          />
        )}

        {currentTab === 'queue' && (
          <VoterQueue
            voters={voters}
            boothSession={currentBoothSession}
            booths={booths}
            onActivateBoothForVoter={handleActivateBoothForVoter}
            onDirectVoteHere={handleDirectVoteHere}
            onOpenShareModal={() => {
              if (isAdminAuthenticated) {
                setIsShareModalOpen(true);
              } else {
                setIsAdminLoginModalOpen(true);
              }
            }}
          />
        )}

        {currentTab === 'booth' && (
          <VotingBooth
            boothSession={currentBoothSession}
            booths={booths}
            activeBoothId={activeBoothId}
            setActiveBoothId={setActiveBoothId}
            localActiveVoter={localActiveVoter}
            onClearLocalActiveVoter={handleClearLocalActiveVoter}
            onCastVote={handleCastVote}
            onBackToQueue={() => setCurrentTab('queue')}
            allVoters={voters}
            onDirectSelfVerify={handleDirectSelfVerify}
          />
        )}

        {currentTab === 'admin' && (
          <AdminResults
            onBackToHome={() => setCurrentTab('home')}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            isAdminAuthenticated={isAdminAuthenticated}
            onAdminAuthChange={(auth) => {
              setIsAdminAuthenticated(auth);
              if (auth) setUserRole('admin');
            }}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setUserRole('admin');
        }}
      />

      {/* QR Code & Multi-Device Sharing Modal (Khusus Admin / Operator) */}
      <ShareDeviceModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        connectedDevices={connectedDevices}
        booths={booths}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLoginSuccess={() => {
          setIsAdminAuthenticated(true);
          setUserRole('admin');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} <strong>SMP NEGERI 3 PARANG</strong> • Panitia Pemilihan OSIS Digital
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Asas LUBER JURDIL</span>
            <span>•</span>
            <span>Bilik Suara Terenkripsi</span>
            <span>•</span>
            <span>Real-time Multi-Device Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
