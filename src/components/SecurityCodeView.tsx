import { useMemo, useState } from 'react';
import { Check, Copy, FileCode2, ShieldCheck } from 'lucide-react';
import {
  generateWindowsProjectFiles,
  type WindowsAppConfig,
} from '../lib/windowsProjectGenerator';

interface SecurityCodeViewProps {
  config: WindowsAppConfig;
}

const SECURITY_CONTROLS = [
  {
    title: 'Prozess-Isolation & Sandbox',
    target: 'electron/main.ts',
    detail:
      'contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: false. Die geladene Website besitzt keinen Zugriff auf Node.js, Dateisystem oder Shell.',
  },
  {
    title: 'Origin-Lock & Redirect-Schutz',
    target: 'electron/security.ts',
    detail:
      'will-navigate, will-redirect und setWindowOpenHandler blockieren jede URL außerhalb der autorisierten HTTPS-Domain sowie javascript:/data:/file:-Angriffe.',
  },
  {
    title: 'Hardware- & Sensor-Sperre',
    target: 'electron/security.ts',
    detail:
      'setPermissionRequestHandler und Permissions-Policy blockieren Kamera, Mikrofon, Standort, USB, Bluetooth, Serial, HID und Zwischenablage-Auslesen.',
  },
  {
    title: 'WebRTC IP-Leak & Telemetrie-Block',
    target: 'electron/security.ts',
    detail:
      'Deaktiviert Crash-Reporter, Background-Networking, Pings und erzwingt disable_non_proxied_udp gegen lokale IP-Leaks; entfernt Referrer-Header.',
  },
  {
    title: 'Update-Zertifikat & SHA-512 Prüfung',
    target: 'electron/updater.ts',
    detail:
      'electron-updater validiert latest.yml-Checksummen und Authenticode-Signatur des definierten Herausgebers, bevor ein Release installiert wird.',
  },
  {
    title: 'Signierte Windows-Pipeline',
    target: '.github/workflows/build-windows.yml',
    detail:
      'Erzeugt auf Windows-Runnern signierte NSIS- & Portable-Executables inkl. RFC-3161-Zeitstempel und automatischer Verifizierung via Get-AuthenticodeSignature.',
  },
];

export function SecurityCodeView({ config }: SecurityCodeViewProps) {
  const files = useMemo(() => generateWindowsProjectFiles(config), [config]);
  const [selectedPath, setSelectedPath] = useState<string>('electron/security.ts');
  const [copied, setCopied] = useState(false);

  const selectedFile =
    files.find((file) => file.path === selectedPath) ?? files[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 max-w-2xl">
        <p className="text-xs font-medium text-slate-400">
          Verifizierte Sicherheitsarchitektur · Quellcode direkt einsehbar
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
          Datenschutz- und Angriffsabwehr im Detail
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 md:grid-cols-2 lg:grid-cols-3">
        {SECURITY_CONTROLS.map((control) => (
          <button
            key={control.title}
            type="button"
            onClick={() => setSelectedPath(control.target)}
            className="flex flex-col justify-between bg-[#111827] p-5 text-left hover:bg-[#151E30] transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold text-white">
                  {control.title}
                </span>
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{control.detail}</p>
            </div>
            <p className="mt-4 font-mono text-[11px] text-sky-400">{control.target}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-800 bg-[#111827] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-800 bg-[#0E1420] lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-800 px-4 py-3">
            <p className="text-xs font-semibold text-slate-200">Enthaltene Projektdateien</p>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[520px] overflow-y-auto">
            {files.map((file) => {
              const active = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'bg-slate-800/80 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <FileCode2 className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                  <span className="truncate font-mono">{file.path}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-semibold text-white">
                {selectedFile.path}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{selectedFile.description}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B0F17] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Kopiert</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Code kopieren</span>
                </>
              )}
            </button>
          </div>

          <pre className="max-h-[520px] overflow-auto bg-[#090D14] p-5 font-mono text-xs leading-relaxed text-slate-200">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
