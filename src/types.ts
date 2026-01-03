export type Platform = 'SNAPCHAT' | 'INSTAGRAM' | 'FACEBOOK';
export type AccountStatus = 'PUBLIC' | 'PRIVATE' | 'SUSPENDED';
export type EncryptionLevel = 'AES-256' | 'NONE';
export type MeoContainerState = 'LOCKED' | 'EXPOSED';

export interface TargetProfile {
  id: string;
  username: string;
  platform: Platform;
  status: AccountStatus;
  metadata: {
    realName: string | null;
    accountCreated: string;
    lastActive: string;
    score?: number;
    avatarUrl?: string;
  };
  security: {
    encryptionLevel: EncryptionLevel;
    meoContainer: MeoContainerState;
    twoFactorAuth: boolean;
  };
}

export type ReconStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'FETCHING_HEADERS'
  | 'PARSING_JSON'
  | 'COMPLETE'
  | 'ERROR';

export interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'sys' | 'success' | 'warn' | 'error';
}

export type ServiceStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export interface StackService {
  name: string;
  role: string;
  status: ServiceStatus;
  notes?: string;
}

export interface Connector {
  id: string;
  label: string;
  domain: string;
  mode: 'API' | 'UPLOAD' | 'CRAWL';
  compliant: boolean;
}

export interface JobRecord {
  id: string;
  source: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'ERRORED';
  artifacts: number;
  updatedAt: string;
}
