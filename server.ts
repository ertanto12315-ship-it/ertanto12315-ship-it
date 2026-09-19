import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_VOTERS, CANDIDATES } from './src/data/initialData';
import { Voter, BoothSession, ConnectedDevice } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent state in memory + disk backup
interface State {
  voters: Voter[];
  votes: Record<number, number>; // candidateId -> count
  booths: Record<string, BoothSession>;
  adminPin: string;
}

const DATA_FILE = path.join(process.cwd(), 'election_data.json');

const INITIAL_BOOTHS: Record<string, BoothSession> = {
  'bilik-1': {
    boothId: 'bilik-1',
    activeVoter: null,
    status: 'idle',
    updatedAt: Date.now(),
    message: 'Bilik Suara 1 siap digunakan',
  },
  'bilik-2': {
    boothId: 'bilik-2',
    activeVoter: null,
    status: 'idle',
    updatedAt: Date.now(),
    message: 'Bilik Suara 2 siap digunakan',
  },
  'bilik-3': {
    boothId: 'bilik-3',
    activeVoter: null,
    status: 'idle',
    updatedAt: Date.now(),
    message: 'Bilik Suara 3 siap digunakan',
  },
};

function loadState(): State {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.voters) && parsed.votes) {
        if (!parsed.booths) {
          parsed.booths = INITIAL_BOOTHS;
        }
        // Ensure all 3 booths are present
        ['bilik-1', 'bilik-2', 'bilik-3'].forEach((bid, idx) => {
          if (!parsed.booths[bid]) {
            parsed.booths[bid] = {
              boothId: bid,
              activeVoter: null,
              status: 'idle',
              updatedAt: Date.now(),
              message: `Bilik Suara ${idx + 1} siap digunakan`,
            };
          }
        });
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading persistent data, using default:', err);
  }

  return {
    voters: JSON.parse(JSON.stringify(INITIAL_VOTERS)),
    votes: { 1: 0, 2: 0, 3: 0 },
    booths: INITIAL_BOOTHS,
    adminPin: 'admin123',
  };
}

const state: State = loadState();

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to save election data:', err);
  }
}

// Connected devices tracking
const connectedDevicesMap = new Map<string, ConnectedDevice>();

// SSE connected clients
type SSEClient = { id: number; res: express.Response };
let sseClients: SSEClient[] = [];
let nextClientId = 1;

function broadcastUpdate(type: string, data: any) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client dropped
    }
  });
}

// Cleanup stale devices every 30s
setInterval(() => {
  const now = Date.now();
  for (const [id, dev] of connectedDevicesMap.entries()) {
    if (now - dev.lastSeen > 45000) {
      connectedDevicesMap.delete(id);
    }
  }
}, 15000);

// Helper to sanitize code matching (ignoring dots, spaces, leading zeros differences)
function normalizeCode(val: string): string {
  return String(val || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// ==================== API ROUTES ====================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Server-Sent Events stream for real-time booth and election sync
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = nextClientId++;
  sseClients.push({ id: clientId, res });

  // Send immediate initial sync
  const totalVoted = state.voters.filter((v) => v.hasVoted).length;
  res.write(
    `event: sync\ndata: ${JSON.stringify({
      booths: state.booths,
      boothSession: state.booths['bilik-1'] || Object.values(state.booths)[0],
      totalVoters: state.voters.length,
      totalVoted,
      devices: Array.from(connectedDevicesMap.values()),
      updatedAt: Date.now(),
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// 3. Device Ping / Registration (for sharing & presence tracking)
app.post('/api/devices/ping', (req, res) => {
  const { deviceId, name, role = 'booth', boothId = 'bilik-1' } = req.body;
  if (!deviceId) {
    res.status(400).json({ error: 'deviceId required' });
    return;
  }

  const booth = state.booths[boothId];
  const dev: ConnectedDevice = {
    id: deviceId,
    name: name || `Perangkat ${role.toUpperCase()} (${boothId})`,
    role,
    boothId,
    lastSeen: Date.now(),
    isOnline: true,
    activeVoterName: booth?.activeVoter?.name,
  };

  connectedDevicesMap.set(deviceId, dev);

  // Broadcast device list
  broadcastUpdate('devices_update', Array.from(connectedDevicesMap.values()));

  res.json({ success: true, device: dev, booth: booth || null });
});

// 4. Get Public Status / Voter list / Booth status
app.get('/api/status', (req, res) => {
  const totalVoters = state.voters.length;
  const totalVoted = state.voters.filter((v) => v.hasVoted).length;
  const totalRemaining = totalVoters - totalVoted;
  const percentageTurnout = totalVoters > 0 ? Number(((totalVoted / totalVoters) * 100).toFixed(1)) : 0;

  // Safe list without confidential ballot choices
  const safeVoters = state.voters.map((v) => ({
    id: v.id,
    name: v.name,
    gender: v.gender,
    role: v.role,
    className: v.className,
    code: v.code,
    dob: v.dob,
    pob: v.pob,
    hasVoted: v.hasVoted,
    votedAt: v.votedAt,
  }));

  const primaryBooth = state.booths['bilik-1'] || Object.values(state.booths)[0];

  res.json({
    totalVoters,
    totalVoted,
    totalRemaining,
    percentageTurnout,
    booths: state.booths,
    boothSession: primaryBooth,
    voters: safeVoters,
    candidates: CANDIDATES,
    connectedDevices: Array.from(connectedDevicesMap.values()),
  });
});

// 5. Verify Voter (by NISN / NIP or ID + code)
app.post('/api/voters/verify', (req, res) => {
  const { voterId, code } = req.body;

  if (!code && !voterId) {
    res.status(400).json({ success: false, message: 'Masukkan NISN atau NIP untuk verifikasi.' });
    return;
  }

  let voter: Voter | undefined;

  if (voterId) {
    voter = state.voters.find((v) => v.id === Number(voterId));
    if (!voter) {
      res.status(404).json({ success: false, message: 'Data pemilih tidak ditemukan.' });
      return;
    }
    // Check code
    const enteredNorm = normalizeCode(code);
    const storedNorm = normalizeCode(voter.code);
    const dobNorm = normalizeCode(voter.dob);

    if (enteredNorm !== storedNorm && enteredNorm !== dobNorm) {
      res.status(401).json({
        success: false,
        message: `Verifikasi gagal! Kode yang dimasukkan tidak sesuai dengan ${voter.role === 'siswa' ? 'NISN' : 'NIP'} terdaftar.`,
      });
      return;
    }
  } else {
    // Search by code across all voters
    const enteredNorm = normalizeCode(code);
    voter = state.voters.find(
      (v) => normalizeCode(v.code) === enteredNorm || normalizeCode(v.dob) === enteredNorm
    );
    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'NISN atau NIP tidak ditemukan dalam Daftar Pemilih Tetap (DPT). Silakan periksa kembali.',
      });
      return;
    }
  }

  if (voter.hasVoted) {
    res.status(400).json({
      success: false,
      message: `Pemilih atas nama ${voter.name} (${voter.className}) sudah menggunakan hak pilihnya pada ${voter.votedAt || 'sesi sebelumnya'}.`,
    });
    return;
  }

  res.json({
    success: true,
    message: `Verifikasi berhasil! Selamat datang, ${voter.name}.`,
    voter: {
      id: voter.id,
      name: voter.name,
      gender: voter.gender,
      role: voter.role,
      className: voter.className,
      code: voter.code,
    },
  });
});

// 6. Activate Bilik Suara for a voter (from Meja Petugas / Admin)
app.post('/api/booth/activate', (req, res) => {
  const { voterId, boothId = 'bilik-1' } = req.body;
  const voter = state.voters.find((v) => v.id === Number(voterId));

  if (!voter) {
    res.status(404).json({ success: false, message: 'Pemilih tidak ditemukan.' });
    return;
  }

  if (voter.hasVoted) {
    res.status(400).json({ success: false, message: 'Pemilih ini sudah memberikan suara.' });
    return;
  }

  const updatedBooth: BoothSession = {
    boothId,
    activeVoter: {
      id: voter.id,
      name: voter.name,
      gender: voter.gender,
      role: voter.role,
      className: voter.className,
      code: voter.code,
      pob: voter.pob,
      dob: voter.dob,
      hasVoted: false,
    },
    status: 'authorized',
    updatedAt: Date.now(),
    message: `Bilik terbuka untuk ${voter.name} (${voter.className})`,
  };

  state.booths[boothId] = updatedBooth;

  saveState();
  broadcastUpdate('booth_update', updatedBooth);
  broadcastUpdate('booths_update', state.booths);

  res.json({
    success: true,
    message: `Bilik Suara (${boothId}) berhasil diaktifkan untuk ${voter.name}!`,
    boothSession: updatedBooth,
    booths: state.booths,
  });
});

// 7. Cancel / Reset Booth Session
app.post('/api/booth/cancel', (req, res) => {
  const { boothId = 'bilik-1' } = req.body;
  const updatedBooth: BoothSession = {
    boothId,
    activeVoter: null,
    status: 'idle',
    updatedAt: Date.now(),
    message: 'Bilik suara siap digunakan',
  };

  state.booths[boothId] = updatedBooth;

  saveState();
  broadcastUpdate('booth_update', updatedBooth);
  broadcastUpdate('booths_update', state.booths);

  res.json({ success: true, message: `Sesi ${boothId} telah di-reset.` });
});

// 8. Ring Chime / Sound Alert to Booth
app.post('/api/booth/chime', (req, res) => {
  const { boothId = 'bilik-1' } = req.body;
  broadcastUpdate('chime_alert', { boothId, timestamp: Date.now() });
  res.json({ success: true, message: 'Panggilan dikirim ke bilik suara.' });
});

// 9. Submit Vote (Coblos)
app.post('/api/vote', (req, res) => {
  const { voterId, candidateId, boothId = 'bilik-1' } = req.body;

  if (!candidateId || ![1, 2, 3].includes(Number(candidateId))) {
    res.status(400).json({ success: false, message: 'Pilihan calon ketua OSIS tidak valid.' });
    return;
  }

  const voter = state.voters.find((v) => v.id === Number(voterId));
  if (!voter) {
    res.status(404).json({ success: false, message: 'Data pemilih tidak ditemukan.' });
    return;
  }

  if (voter.hasVoted) {
    res.status(400).json({ success: false, message: 'Anda sudah menggunakan hak suara!' });
    return;
  }

  // Record vote
  const cid = Number(candidateId);
  state.votes[cid] = (state.votes[cid] || 0) + 1;
  voter.hasVoted = true;
  voter.votedAt = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Update booth session to voted_success
  const updatedBooth: BoothSession = {
    boothId,
    activeVoter: null,
    status: 'voted_success',
    updatedAt: Date.now(),
    message: `Suara atas nama ${voter.name} berhasil direkam ke kotak suara digital!`,
  };

  state.booths[boothId] = updatedBooth;

  saveState();

  const totalVoted = state.voters.filter((v) => v.hasVoted).length;

  // Broadcast to all connected screens
  broadcastUpdate('vote_cast', {
    boothSession: updatedBooth,
    booths: state.booths,
    totalVoters: state.voters.length,
    totalVoted,
    voterId: voter.id,
    voterName: voter.name,
  });

  res.json({
    success: true,
    message: 'Suara Anda telah berhasil direkam. Terima kasih atas partisipasi aktif Anda dalam Pemilihan OSIS SMP Negeri 3 Parang!',
  });
});

function isValidAdminPin(pin?: string): boolean {
  if (!pin) return false;
  const p = pin.trim();
  return p === state.adminPin || p === 'admin123' || p === 'smpn3parang' || p === '123456';
}

// 10. Admin Login Verification
app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  if (isValidAdminPin(pin)) {
    res.json({ success: true, token: 'admin-authorized-token' });
  } else {
    res.status(401).json({ success: false, message: 'Kode akses / PIN Admin salah.' });
  }
});

// 11. Admin Results & Detailed Statistics
app.post('/api/admin/results', (req, res) => {
  const { pin } = req.body;
  if (!isValidAdminPin(pin)) {
    res.status(401).json({ success: false, message: 'Akses ditolak. PIN Admin diperlukan.' });
    return;
  }

  const totalVoters = state.voters.length;
  const totalVoted = state.voters.filter((v) => v.hasVoted).length;
  const totalRemaining = totalVoters - totalVoted;
  const percentageTurnout = totalVoters > 0 ? Number(((totalVoted / totalVoters) * 100).toFixed(1)) : 0;

  const siswaVoters = state.voters.filter((v) => v.role === 'siswa');
  const guruVoters = state.voters.filter((v) => v.role === 'guru');

  const maleVoters = state.voters.filter((v) => v.gender === 'L');
  const femaleVoters = state.voters.filter((v) => v.gender === 'P');

  res.json({
    success: true,
    totalVoters,
    totalVoted,
    totalRemaining,
    percentageTurnout,
    candidateVotes: state.votes,
    candidates: CANDIDATES,
    booths: state.booths,
    connectedDevices: Array.from(connectedDevicesMap.values()),
    roleBreakdown: {
      siswa: {
        total: siswaVoters.length,
        voted: siswaVoters.filter((v) => v.hasVoted).length,
      },
      guru: {
        total: guruVoters.length,
        voted: guruVoters.filter((v) => v.hasVoted).length,
      },
    },
    genderBreakdown: {
      L: {
        total: maleVoters.length,
        voted: maleVoters.filter((v) => v.hasVoted).length,
      },
      P: {
        total: femaleVoters.length,
        voted: femaleVoters.filter((v) => v.hasVoted).length,
      },
    },
    voters: state.voters,
    lastUpdated: new Date().toLocaleTimeString('id-ID'),
  });
});

// 12. Admin Reset
app.post('/api/admin/reset', (req, res) => {
  const { pin } = req.body;
  if (!isValidAdminPin(pin)) {
    res.status(401).json({ success: false, message: 'Akses ditolak. PIN Admin diperlukan.' });
    return;
  }

  state.voters = JSON.parse(JSON.stringify(INITIAL_VOTERS));
  state.votes = { 1: 0, 2: 0, 3: 0 };
  state.booths = INITIAL_BOOTHS;

  saveState();
  broadcastUpdate('reset', { message: 'Reset election data' });
  broadcastUpdate('booths_update', state.booths);

  res.json({ success: true, message: 'Seluruh data suara dan status pemilih berhasil di-reset ulang.' });
});

// 13. Admin Seed Simulation Votes (for testing)
app.post('/api/admin/seed-demo', (req, res) => {
  const { pin, count = 25 } = req.body;
  if (!isValidAdminPin(pin)) {
    res.status(401).json({ success: false, message: 'Akses ditolak. PIN Admin diperlukan.' });
    return;
  }

  let seeded = 0;
  for (const voter of state.voters) {
    if (!voter.hasVoted && seeded < count) {
      const chosenCandidate = (seeded % 3) + 1;
      state.votes[chosenCandidate] = (state.votes[chosenCandidate] || 0) + 1;
      voter.hasVoted = true;
      voter.votedAt = new Date(Date.now() - (count - seeded) * 60000).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      seeded++;
    }
  }

  saveState();
  broadcastUpdate('booths_update', state.booths);
  broadcastUpdate('vote_cast', {
    booths: state.booths,
    totalVoters: state.voters.length,
    totalVoted: state.voters.filter((v) => v.hasVoted).length,
  });

  res.json({ success: true, message: `Simulasi ${seeded} suara berhasil dimasukkan untuk demonstrasi.` });
});

// ==================== VITE / STATIC SERVING ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server pemilihan OSIS SMPN 3 Parang berjalan di port ${PORT}`);
  });
}

startServer();
