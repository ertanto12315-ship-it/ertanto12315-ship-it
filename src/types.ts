export type UserRole = 'siswa' | 'guru';

export interface Voter {
  id: number;
  name: string;
  gender: 'L' | 'P';
  code: string; // NISN untuk siswa, NIP/ID untuk guru
  pob: string;  // Tempat Lahir
  dob: string;  // Tanggal Lahir
  role: UserRole;
  className: string;
  hasVoted: boolean;
  votedAt?: string;
}

export interface Candidate {
  id: number;
  name: string;
  photo: string;
  visi: string;
  misi: string;
  slogan?: string;
}

export interface BoothSession {
  boothId: string;
  activeVoter: Voter | null;
  status: 'idle' | 'authorized' | 'voted_success';
  updatedAt: number;
  message?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  role: 'booth' | 'operator' | 'projector';
  lastSeen: number;
  isOnline: boolean;
  boothId?: string;
  activeVoterName?: string;
}

export interface ElectionSummary {
  totalVoters: number;
  totalVoted: number;
  totalRemaining: number;
  percentageTurnout: number;
  candidateVotes: Record<number, number>; // candidateId -> count (hanya admin yang dapat data detail pilihan)
  roleBreakdown: {
    siswa: { total: number; voted: number };
    guru: { total: number; voted: number };
  };
  genderBreakdown: {
    L: { total: number; voted: number };
    P: { total: number; voted: number };
  };
  lastUpdated: string;
}
