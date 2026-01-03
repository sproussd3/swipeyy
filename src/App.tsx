import { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Info,
  Lock,
  Search,
  ShieldAlert,
  Terminal,
  UploadCloud,
  Zap,
} from 'lucide-react';
import classNames from 'classnames';
import type {
  Connector,
  JobRecord,
  LogEntry,
  ReconStatus,
  StackService,
  TargetProfile,
} from './types';

const statusOrder: ReconStatus[] = [
  'IDLE',
  'CONNECTING',
  'FETCHING_HEADERS',
  'PARSING_JSON',
  'COMPLETE',
  'ERROR',
];

const statusLabel: Record<ReconStatus, string> = {
  IDLE: 'Awaiting Input',
  CONNECTING: 'Connecting',
  FETCHING_HEADERS: 'Fetching Headers',
  PARSING_JSON: 'Parsing JSON',
  COMPLETE: 'Complete',
  ERROR: 'Error',
};

const formatTime = () => new Date().toISOString().split('T')[1].slice(0, -1);

const buildMockProfile = (username: string): TargetProfile => {
  const now = new Date();
  const created = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 365);
  const lastActive = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24);

  return {
    id: crypto.randomUUID(),
    username,
    platform: 'SNAPCHAT',
    status: 'PUBLIC',
    metadata: {
      realName: 'Unknown Subject',
      accountCreated: created.toISOString(),
      lastActive: lastActive.toISOString(),
      score: Math.floor(Math.random() * 500_000),
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`,
    },
    security: {
      encryptionLevel: 'AES-256',
      meoContainer: 'LOCKED',
      twoFactorAuth: Math.random() > 0.35,
    },
  };
};

const stackServices: StackService[] = [
  { name: 'FastAPI', role: 'API gateway + docs', status: 'ONLINE' },
  { name: 'Celery', role: 'Job orchestration', status: 'ONLINE' },
  { name: 'PostgreSQL', role: 'Metadata + provenance', status: 'ONLINE' },
  { name: 'Qdrant', role: 'Vector search', status: 'DEGRADED', notes: 'Warm index rebuild' },
  { name: 'MinIO', role: 'Object storage', status: 'ONLINE' },
];

const connectors: Connector[] = [
  { id: 'wikimedia', label: 'Wikimedia Commons', domain: 'commons.wikimedia.org', mode: 'API', compliant: true },
  { id: 'inaturalist', label: 'iNaturalist', domain: 'api.inaturalist.org', mode: 'API', compliant: true },
  { id: 'uploads', label: 'Secure Uploads', domain: 'uploads.swipeyy.internal', mode: 'UPLOAD', compliant: true },
  { id: 'custom', label: 'Custom Connector Slot', domain: 'pending', mode: 'CRAWL', compliant: false },
];

const jobQueue: JobRecord[] = [
  { id: 'JOB-2041', source: 'Wikimedia', status: 'COMPLETED', artifacts: 24, updatedAt: '08:11:20Z' },
  { id: 'JOB-2042', source: 'iNaturalist', status: 'RUNNING', artifacts: 7, updatedAt: '08:11:38Z' },
  { id: 'JOB-2043', source: 'Uploads', status: 'QUEUED', artifacts: 0, updatedAt: '08:12:03Z' },
  { id: 'JOB-2044', source: 'Custom', status: 'ERRORED', artifacts: 0, updatedAt: '08:12:30Z' },
];

const presetTargets = [
  { label: 'Field Ops', username: 'fieldwatch', note: 'Public field capture streams' },
  { label: 'Heritage', username: 'archivist', note: 'Open culture imagery' },
  { label: 'Biodiversity', username: 'flora_fauna', note: 'Species tracking references' },
];

const App = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ReconStatus>('IDLE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [targetData, setTargetData] = useState<TargetProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [encryptedDetections, setEncryptedDetections] = useState(0);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [...prev, { time: formatTime(), msg: message, type }]);
  };

  const clearSession = () => {
    setLogs([]);
    setTargetData(null);
    setErrorMessage('');
    setStatus('IDLE');
  };

  const executeRecon = async () => {
    if (!query.trim()) {
      setErrorMessage('Enter a username to start reconnaissance.');
      return;
    }

    clearSession();
    setStatus('CONNECTING');
    addLog(`Initializing network socket for ${query}...`, 'sys');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog('TLS handshake complete.');

      setStatus('FETCHING_HEADERS');
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog(`GET /api/v1/profile/${query} -> 200 OK`, 'success');

      if (query.length < 3) {
        throw new Error('Username too short (HTTP 400)');
      }

      setStatus('PARSING_JSON');
      addLog('Streaming JSON payload...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      const profile = buildMockProfile(query);
      setTargetData(profile);
      setEncryptedDetections((prev) => prev + 1);

      setStatus('COMPLETE');
      addLog('Data object materialized.', 'success');
      addLog('MEO container detected: AES-256 encrypted. No access without device key.', 'warn');
    } catch (error) {
      setStatus('ERROR');
      const reason = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(reason);
      addLog(`FATAL: ${reason}`, 'error');
    }
  };

  const progress = useMemo(() => statusOrder.indexOf(status) / (statusOrder.length - 1), [status]);

  const metrics = useMemo(
    () => [
      {
        label: 'Allowed Connectors',
        value: connectors.filter((connector) => connector.compliant).length,
        hint: 'Guardrails enforced',
      },
      {
        label: 'Active Jobs',
        value: jobQueue.filter((job) => job.status === 'RUNNING' || job.status === 'QUEUED').length,
        hint: 'Queue visibility',
      },
      { label: 'Encrypted Containers Flagged', value: encryptedDetections, hint: 'MEO stays sealed' },
      { label: 'Simulated Uptime', value: '99.97%', hint: 'All core services online' },
    ],
    [encryptedDetections]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-mono p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-blue-400" /> SWIPEYY — OSINT STACK
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="hidden sm:inline">FastAPI · Celery · Qdrant · MinIO · PostgreSQL</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-lg shadow-slate-900/50">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
            <Search size={14} /> TARGET ACQUISITION
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter username..."
              className="bg-black border border-slate-700 p-2 w-full text-white focus:border-blue-500 outline-none rounded"
              autoFocus
            />
            <button
              onClick={executeRecon}
              disabled={status === 'CONNECTING' || status === 'FETCHING_HEADERS' || status === 'PARSING_JSON'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              RUN
            </button>
          </div>
          {errorMessage && <p className="text-amber-400 text-xs mt-2">{errorMessage}</p>}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {presetTargets.map((preset) => (
              <button
                key={preset.username}
                onClick={() => setQuery(preset.username)}
                className="border border-slate-800 bg-black/50 rounded px-3 py-1 text-slate-200 hover:border-blue-600 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{preset.label}</span>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                </div>
                <div className="text-slate-500 text-[10px]">{preset.note}</div>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Status</span>
              <span className={classNames('font-semibold', status === 'ERROR' ? 'text-red-400' : 'text-blue-400')}>
                {statusLabel[status]}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={classNames('h-full transition-all duration-500', {
                  'bg-slate-700': status === 'IDLE',
                  'bg-blue-500': status !== 'ERROR',
                  'bg-red-500': status === 'ERROR',
                })}
                style={{ width: `${Math.max(progress * 100, 0)}%` }}
              />
            </div>
          </div>
        </div>

        {targetData && (
          <div className="bg-slate-900 border border-blue-900/50 p-6 rounded-lg shadow-lg shadow-slate-900/50 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
                <img
                  src={targetData.metadata.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover grayscale opacity-90"
                  loading="lazy"
                />
              </div>
              <div>
                <h1 className="text-xl text-white font-bold tracking-wider">{targetData.username.toUpperCase()}</h1>
                <p className="text-[11px] text-slate-500">PLATFORM: {targetData.platform}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-400 bg-amber-900/20 px-2 py-1 border border-amber-900/50 rounded">
                  <Lock size={12} /> AES-256 ENCRYPTED (MEO)
                </div>
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>REAL_NAME</span>
                <span className="text-slate-200">{targetData.metadata.realName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>ACCOUNT_CREATED</span>
                <span className="text-blue-400">
                  {new Date(targetData.metadata.accountCreated).toUTCString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>LAST_ACTIVE</span>
                <span className="text-blue-400">{new Date(targetData.metadata.lastActive).toUTCString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>SCORE_METRIC</span>
                <span className="text-blue-400">{targetData.metadata.score?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>SECURITY</span>
                <span className="text-slate-200 flex items-center gap-2">
                  <ShieldAlert size={12} className="text-emerald-400" />
                  {targetData.security.twoFactorAuth ? '2FA ENABLED' : '2FA DISABLED'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={12} className="text-blue-400" />
              {metric.label}
            </div>
            <div className="text-2xl text-white font-bold mt-1">{metric.value}</div>
            <div className="text-[11px] text-slate-500">{metric.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-black border border-slate-800 rounded-lg p-4 font-mono text-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 text-slate-600 border-b border-slate-900 pb-2 mb-2 text-[11px] uppercase tracking-[0.2em]">
            <Terminal size={14} /> System Kernel v4.0.1
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-2">
            {logs.length === 0 && <span className="text-slate-700 animate-pulse">_ waiting for input stream...</span>}

            {logs.map((log, idx) => (
              <div
                key={`${log.time}-${idx}`}
                className={classNames({
                  'text-red-500': log.type === 'error',
                  'text-emerald-500': log.type === 'success',
                  'text-amber-500': log.type === 'warn',
                  'text-slate-400': log.type === 'info' || log.type === 'sys',
                })}
              >
                <span className="text-slate-700 mr-2">[{log.time}]</span>
                {log.msg}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2"><Database size={12} />OSINT data ingestion only.</div>
            <div className="flex items-center gap-2"><ShieldAlert size={12} />No private data access or encryption bypass.</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-[11px] space-y-3">
          <div className="flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em] text-[10px]">
            <Database size={12} /> Stack Health
          </div>
          <div className="space-y-2">
            {stackServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2 bg-slate-950/50">
                <div>
                  <div className="text-slate-200 font-semibold">{service.name}</div>
                  <div className="text-slate-500 text-[10px]">{service.role}</div>
                </div>
                <div className="text-right">
                  <span
                    className={classNames('px-2 py-1 rounded text-[10px] font-semibold', {
                      'bg-emerald-900/50 text-emerald-300': service.status === 'ONLINE',
                      'bg-amber-900/40 text-amber-300': service.status === 'DEGRADED',
                      'bg-red-900/40 text-red-300': service.status === 'OFFLINE',
                    })}
                  >
                    {service.status}
                  </span>
                  {service.notes && <div className="text-slate-500 text-[10px] mt-1">{service.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em] text-[10px] mb-2">
            <UploadCloud size={12} /> Ingestion Jobs
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {jobQueue.map((job) => (
              <div key={job.id} className="border border-slate-800 rounded px-3 py-2 bg-black/50">
                <div className="flex items-center justify-between text-slate-200 font-semibold">
                  <span>{job.id}</span>
                  <span
                    className={classNames('px-2 py-1 rounded text-[10px] font-bold', {
                      'bg-emerald-900/50 text-emerald-300': job.status === 'COMPLETED',
                      'bg-blue-900/50 text-blue-300': job.status === 'RUNNING',
                      'bg-slate-800 text-slate-300': job.status === 'QUEUED',
                      'bg-red-900/40 text-red-300': job.status === 'ERRORED',
                    })}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="text-slate-400 flex items-center justify-between mt-1">
                  <span>Source: {job.source}</span>
                  <span>{job.artifacts} assets</span>
                </div>
                <div className="text-slate-500 text-[10px] mt-1">Updated {job.updatedAt}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-[11px]">
          <div className="flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em] text-[10px] mb-2">
            <ShieldAlert size={12} /> Connector Allowlist
          </div>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <div key={connector.id} className="border border-slate-800 rounded px-3 py-2 bg-black/40">
                <div className="flex items-center justify-between">
                  <div className="text-slate-200 font-semibold">{connector.label}</div>
                  <span
                    className={classNames('px-2 py-1 rounded text-[10px] font-bold', {
                      'bg-emerald-900/60 text-emerald-300': connector.compliant,
                      'bg-amber-900/50 text-amber-300': !connector.compliant,
                    })}
                  >
                    {connector.compliant ? 'COMPLIANT' : 'REVIEW'}
                  </span>
                </div>
                <div className="text-slate-400 text-[10px]">{connector.domain}</div>
                <div className="text-slate-500 text-[10px] mt-1">Mode: {connector.mode}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-blue-900/40 rounded-lg p-4 text-[11px] space-y-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-blue-300 uppercase tracking-[0.2em] text-[10px]">
            <Info size={12} /> Ethics & Safety Controls
          </div>
          <div className="text-slate-300">SWIPEYY operates in simulation mode for open intelligence only.</div>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>No credential prompts, exploits, or private data scraping.</li>
            <li>Only compliant connectors execute; others stay sandboxed.</li>
            <li>Encryption warnings surface in logs when MEO is detected.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
