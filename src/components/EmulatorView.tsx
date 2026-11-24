import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  Lock,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { WindowsAppConfig } from '../lib/windowsProjectGenerator';

interface TargetCheckResult {
  reachable: boolean;
  status: number;
  finalUrl: string;
  latencyMs: number;
  xFrameOptions: string | null;
  frameBlockedInBrowser: boolean;
  error?: string;
}

interface EmulatorViewProps {
  config: WindowsAppConfig;
  onUpdateConfig: (patch: Partial<WindowsAppConfig>) => void;
  onDownloadZip: () => void;
}

type SimulatedUpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installed';

const APP_ICON_SRC = '/src/assets/images/elytra_app_icon_1795549229003.jpg';

export function EmulatorView({
  config,
  onUpdateConfig,
  onDownloadZip,
}: EmulatorViewProps) {
  const [osStyle, setOsStyle] = useState<'win11' | 'win10'>('win11');
  const [pureFullscreen, setPureFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iconFailed, setIconFailed] = useState(false);
  const [targetCheck, setTargetCheck] = useState<TargetCheckResult | null>(null);
  const [isCheckingTarget, setIsCheckingTarget] = useState(true);
  const [updatePhase, setUpdatePhase] = useState<SimulatedUpdatePhase>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let active = true;
    setIsCheckingTarget(true);

    fetch(`/api/check-target?url=${encodeURIComponent(config.targetUrl)}`)
      .then((res) => res.json())
      .then((data: TargetCheckResult) => {
        if (active) {
          setTargetCheck(data);
        }
      })
      .catch(() => {
        if (active) {
          setTargetCheck({
            reachable: false,
            status: 0,
            finalUrl: config.targetUrl,
            latencyMs: 0,
            xFrameOptions: null,
            frameBlockedInBrowser: false,
            error: 'Verbindungsprüfung nicht verfügbar',
          });
        }
      })
      .finally(() => {
        if (active) setIsCheckingTarget(false);
      });

    return () => {
      active = false;
    };
  }, [config.targetUrl]);

  useEffect(() => {
    if (updatePhase !== 'downloading') return;
    const timer = window.setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(timer);
          setUpdatePhase('installed');
          return 100;
        }
        return prev + 20;
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [updatePhase]);

  const handleTestUpdater = () => {
    setDownloadProgress(0);
    setUpdatePhase('checking');
    window.setTimeout(() => {
      if (config.updateMode === 'auto') {
        setUpdatePhase('downloading');
      } else {
        setUpdatePhase('available');
      }
    }, 600);
  };

  const handleManualInstall = () => {
    setDownloadProgress(0);
    setUpdatePhase('downloading');
  };

  const nextVersion = (() => {
    const parts = config.version.split('.').map((n) => Number(n) || 0);
    if (parts.length === 3) {
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
    return '1.0.1';
  })();

  const windowWrapperClass = pureFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-[#0B0F17]'
    : `flex flex-col overflow-hidden border border-slate-700/80 bg-[#0B0F17] shadow-2xl transition-all duration-200 ${
        osStyle === 'win11' ? 'rounded-xl' : 'rounded-none'
      }`;

  return (
    <div className="space-y-6">
      {!pureFullscreen && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-medium text-slate-400">
              Windows 11 & Windows 10 Desktop-Emulator · Direkte App-Ausführung
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
              {config.appName} als native Windows-App ausführen
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Windows-Designstil"
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#111827] p-1"
            >
              <button
                type="button"
                onClick={() => setOsStyle('win11')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  osStyle === 'win11'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Windows 11
              </button>
              <button
                type="button"
                onClick={() => setOsStyle('win10')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  osStyle === 'win10'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Windows 10
              </button>
            </div>

            <div
              role="group"
              aria-label="Update-Verhalten"
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#111827] p-1"
            >
              <button
                type="button"
                onClick={() => onUpdateConfig({ updateMode: 'auto' })}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  config.updateMode === 'auto'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto-Update
              </button>
              <button
                type="button"
                onClick={() => onUpdateConfig({ updateMode: 'manual' })}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  config.updateMode === 'manual'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Manuell
              </button>
            </div>

            <button
              type="button"
              onClick={handleTestUpdater}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Update-Ablauf testen</span>
            </button>

            <button
              type="button"
              onClick={() => setPureFullscreen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reiner Vollbildmodus</span>
            </button>
          </div>
        </div>
      )}

      <div className={windowWrapperClass}>
        <div
          className={`flex h-9 items-center justify-between border-b border-slate-800/90 px-3 select-none ${
            osStyle === 'win11' ? 'bg-[#101622]' : 'bg-[#0D131F]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {!iconFailed ? (
              <img
                src={APP_ICON_SRC}
                alt={`${config.appName} App-Symbol`}
                referrerPolicy="no-referrer"
                onError={() => setIconFailed(true)}
                className="h-4 w-4 rounded-sm object-cover shrink-0"
              />
            ) : (
              <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate text-xs font-medium text-slate-200">
              {config.appName}
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-500 whitespace-nowrap">
              <Lock className="mr-1 inline h-3 w-3 text-emerald-500" aria-hidden="true" />
              {new URL(config.targetUrl).hostname}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              title="Seite neu laden"
              className="flex h-7 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPureFullscreen((v) => !v)}
              title={pureFullscreen ? 'Fenstermodus wiederherstellen' : 'Vollbild'}
              className="flex h-7 w-9 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              {pureFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
            {pureFullscreen && (
              <button
                type="button"
                onClick={() => setPureFullscreen(false)}
                title="Vollbild schließen"
                className="flex h-7 w-9 items-center justify-center rounded text-slate-400 hover:bg-rose-600 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className={`relative w-full bg-[#090D14] ${pureFullscreen ? 'flex-1' : 'h-[640px]'}`}>
          {targetCheck?.frameBlockedInBrowser ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="max-w-lg space-y-4">
                <ShieldCheck className="mx-auto h-10 w-10 text-sky-400" aria-hidden="true" />
                <h2 className="font-display text-xl font-semibold text-white">
                  Zielseite blockiert Browser-iFrames per Header
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  Der Server von <span className="font-mono text-slate-200">{config.targetUrl}</span> sendet{' '}
                  <span className="font-mono text-slate-300">
                    {targetCheck.xFrameOptions || 'CSP frame-ancestors'}
                  </span>
                  , weshalb normale Browser die Einbettung im Vorschaufenster sperren. Die
                  herunterladbare Windows-App (Electron) nutzt ein natives{' '}
                  <span className="font-mono text-slate-200">BrowserWindow</span> und lädt die
                  Website direkt ohne iFrame-Einschränkung.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={config.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500 transition-colors"
                  >
                    <span>Website direkt öffnen</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={onDownloadZip}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Native Windows-App laden</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              key={`${config.targetUrl}-${iframeKey}`}
              src={config.targetUrl}
              title={config.appName}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              referrerPolicy="no-referrer"
              className="h-full w-full border-0 bg-[#090D14]"
            />
          )}

          {updatePhase !== 'idle' && (
            <div className="absolute bottom-4 right-4 z-20 w-80 rounded-lg border border-slate-700 bg-[#111827]/95 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white">
                    {updatePhase === 'checking' && 'GitHub-Release wird geprüft…'}
                    {updatePhase === 'available' && `Update v${nextVersion} verfügbar`}
                    {updatePhase === 'downloading' && `Update v${nextVersion} wird geladen`}
                    {updatePhase === 'installed' && `v${nextVersion} verifiziert & installiert`}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {updatePhase === 'checking' &&
                      `Abgleich mit ${config.githubOwner}/${config.githubRepo} (latest.yml)`}
                    {updatePhase === 'available' &&
                      'Manueller Modus aktiv: Signatur & SHA-512 bereit zur Installation.'}
                    {updatePhase === 'downloading' &&
                      `Authenticode-Zertifikat geprüft · ${downloadProgress}%`}
                    {updatePhase === 'installed' &&
                      'Eingebettetes Zertifikat bestätigt. App startet nahtlos neu.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUpdatePhase('idle')}
                  aria-label="Update-Hinweis schließen"
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {updatePhase === 'downloading' && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-sky-400 transition-all duration-200"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}

              {updatePhase === 'available' && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualInstall}
                    className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    Jetzt installieren
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdatePhase('idle')}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Später
                  </button>
                </div>
              )}

              {updatePhase === 'installed' && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Signatur & SHA-512 gültig</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!pureFullscreen && (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-[#111827] p-4">
            <p className="text-xs text-slate-400">Ziel-Endpunkt</p>
            <p className="mt-1 truncate font-mono text-sm font-medium text-slate-100">
              {new URL(config.targetUrl).hostname}
            </p>
            <p className="mt-1 text-xs text-slate-400 tabular-nums">
              {isCheckingTarget
                ? 'Prüfe HTTPS-Verbindung…'
                : targetCheck?.reachable
                  ? `HTTP ${targetCheck.status} · ${targetCheck.latencyMs} ms`
                  : 'Offline oder blockiert'}
            </p>
          </div>

          <div className="bg-[#111827] p-4">
            <p className="text-xs text-slate-400">Zielplattformen</p>
            <p className="mt-1 font-display text-sm font-semibold text-slate-100">
              Windows 11 & Windows 10
            </p>
            <p className="mt-1 text-xs text-slate-400">
              NSIS-Installer & Portable (.exe) · x64 / ARM64
            </p>
          </div>

          <div className="bg-[#111827] p-4">
            <p className="text-xs text-slate-400">Signatur & Defender</p>
            <p className="mt-1 font-display text-sm font-semibold text-slate-100">
              SHA-256 Authenticode
            </p>
            <p className="mt-1 text-xs text-slate-400 truncate">
              Herausgeber: {config.publisherName}
            </p>
          </div>

          <div className="bg-[#111827] p-4">
            <p className="text-xs text-slate-400">GitHub Auto-Updater</p>
            <p className="mt-1 font-mono text-sm font-medium text-slate-100 truncate">
              {config.githubOwner}/{config.githubRepo}
            </p>
            <p className="mt-1 text-xs text-slate-400 tabular-nums">
              {config.updateMode === 'auto' ? 'Automatische Installation' : 'Manuelle Bestätigung'} · alle {config.checkIntervalMinutes} Min.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
