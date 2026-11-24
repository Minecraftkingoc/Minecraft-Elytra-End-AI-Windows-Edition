import { Download, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  DEFAULT_WINDOWS_CONFIG,
  type SigningMethod,
  type WindowsAppConfig,
} from '../lib/windowsProjectGenerator';

interface ConfiguratorViewProps {
  config: WindowsAppConfig;
  onUpdateConfig: (patch: Partial<WindowsAppConfig>) => void;
  onResetConfig: () => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

const SECURITY_TOGGLES: Array<{
  key: keyof Pick<
    WindowsAppConfig,
    | 'strictOriginLock'
    | 'blockPermissions'
    | 'stripTrackingHeaders'
    | 'blockWebRtcLeak'
    | 'disableDevToolsInProd'
    | 'pureFramelessMode'
  >;
  title: string;
  description: string;
}> = [
  {
    key: 'strictOriginLock',
    title: 'Strikte Origin-Sperre (HTTPS-Only)',
    description:
      'Blockiert jede Navigation, Umleitung und jedes Pop-up außerhalb der definierten Ziel-Domain.',
  },
  {
    key: 'blockPermissions',
    title: 'Hardware- & Sensor-Berechtigungen sperren',
    description:
      'Lehnt Kamera, Mikrofon, GPS, USB, Serial, HID, Bluetooth und Zwischenablage-Zugriffe ab.',
  },
  {
    key: 'stripTrackingHeaders',
    title: 'Referrer-Stripping & Tracking-Blocker',
    description:
      'Entfernt Referrer-Header, setzt DNT/Sec-GPC und blockiert bekannte Telemetrie-Endpunkte.',
  },
  {
    key: 'blockWebRtcLeak',
    title: 'WebRTC IP-Leak-Schutz',
    description:
      'Erzwingt disable_non_proxied_udp, damit lokale Netzwerk-IPs nicht offengelegt werden.',
  },
  {
    key: 'disableDevToolsInProd',
    title: 'DevTools in Release-Builds sperren',
    description:
      'Verhindert F12 und Entwicklerkonsolen-Shortcuts in der signierten Produktiv-App.',
  },
  {
    key: 'pureFramelessMode',
    title: 'Reiner App-Modus ohne Browser-UI',
    description:
      'Startet direkt in die Website mit nativer Windows 11/10 Titelleiste ohne Adressleiste.',
  },
];

export function ConfiguratorView({
  config,
  onUpdateConfig,
  onResetConfig,
  onDownloadZip,
  isDownloading,
}: ConfiguratorViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-slate-400">
            Build- & Signatur-Konfigurator · Direkt in das ZIP-Projekt eingebettet
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            Windows-App, Zertifikat & Auto-Updater anpassen
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetConfig}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white whitespace-nowrap shrink-0 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Standardwerte</span>
          </button>
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60 whitespace-nowrap shrink-0 transition-colors"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isDownloading ? 'Wird verpackt…' : 'Windows-Paket (.zip) laden'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
        <section className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-6">
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                01. App-Identität & GitHub-Update-Quelle
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Legt fest, welche Website geladen wird und welches GitHub-Repository neue Releases bereitstellt.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cfg-url" className="block text-xs font-medium text-slate-300">
                  Ziel-URL (HTTPS)
                </label>
                <input
                  id="cfg-url"
                  type="url"
                  value={config.targetUrl}
                  onChange={(e) => onUpdateConfig({ targetUrl: e.target.value })}
                  placeholder={DEFAULT_WINDOWS_CONFIG.targetUrl}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cfg-name" className="block text-xs font-medium text-slate-300">
                    App-Name
                  </label>
                  <input
                    id="cfg-name"
                    type="text"
                    value={config.appName}
                    onChange={(e) => onUpdateConfig({ appName: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-version" className="block text-xs font-medium text-slate-300">
                    Start-Version (SemVer)
                  </label>
                  <input
                    id="cfg-version"
                    type="text"
                    value={config.version}
                    onChange={(e) => onUpdateConfig({ version: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 tabular-nums focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cfg-appid" className="block text-xs font-medium text-slate-300">
                  Windows AppUserModelID
                </label>
                <input
                  id="cfg-appid"
                  type="text"
                  value={config.appId}
                  onChange={(e) => onUpdateConfig({ appId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cfg-gh-owner" className="block text-xs font-medium text-slate-300">
                    GitHub Benutzer / Organisation
                  </label>
                  <input
                    id="cfg-gh-owner"
                    type="text"
                    value={config.githubOwner}
                    onChange={(e) => onUpdateConfig({ githubOwner: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-gh-repo" className="block text-xs font-medium text-slate-300">
                    GitHub Repository
                  </label>
                  <input
                    id="cfg-gh-repo"
                    type="text"
                    value={config.githubRepo}
                    onChange={(e) => onUpdateConfig({ githubRepo: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-medium text-slate-300">
                    Standard-Update-Modus
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-slate-700 bg-[#0B0F17] p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ updateMode: 'auto' })}
                      className={`rounded-md py-2 text-xs font-medium transition-colors ${
                        config.updateMode === 'auto'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Automatisch
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ updateMode: 'manual' })}
                      className={`rounded-md py-2 text-xs font-medium transition-colors ${
                        config.updateMode === 'manual'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Manuell
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="cfg-interval" className="block text-xs font-medium text-slate-300">
                    Prüfintervall (Minuten)
                  </label>
                  <input
                    id="cfg-interval"
                    type="number"
                    min={5}
                    max={1440}
                    value={config.checkIntervalMinutes}
                    onChange={(e) =>
                      onUpdateConfig({
                        checkIntervalMinutes: Math.max(5, Number(e.target.value) || 30),
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 tabular-nums focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 leading-relaxed">
            Benutzer können in der installierten Windows-App jederzeit per Rechtsklick auf das
            System-Tray-Symbol zwischen <span className="text-slate-200">Automatisch</span> und{' '}
            <span className="text-slate-200">Manuell</span> wechseln.
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-6">
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                02. Windows-Signatur & Sicherheits-Härtung
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Authenticode-Zertifikat für Windows Defender SmartScreen sowie Schutzmaßnahmen gegen Angriffe.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cfg-signing" className="block text-xs font-medium text-slate-300">
                  Zertifikat- & Signatur-Strategie
                </label>
                <select
                  id="cfg-signing"
                  value={config.signingMethod}
                  onChange={(e) =>
                    onUpdateConfig({ signingMethod: e.target.value as SigningMethod })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="ov-ev-pfx">
                    Offizielles OV / EV Code-Signing-Zertifikat (.pfx über GitHub Secret)
                  </option>
                  <option value="azure-trusted-signing">
                    Microsoft Azure Trusted Signing (sofortiges SmartScreen-Vertrauen)
                  </option>
                  <option value="self-signed-local">
                    Lokales SHA-256 Zertifikat (für eigenen PC via create-dev-cert.ps1)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cfg-publisher" className="block text-xs font-medium text-slate-300">
                    Herausgeber-Name (Publisher CN)
                  </label>
                  <input
                    id="cfg-publisher"
                    type="text"
                    value={config.publisherName}
                    onChange={(e) => onUpdateConfig({ publisherName: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-thumb" className="block text-xs font-medium text-slate-300">
                    Zertifikat-Thumbprint Pinning (Optional)
                  </label>
                  <input
                    id="cfg-thumb"
                    type="text"
                    value={config.certThumbprint}
                    onChange={(e) => onUpdateConfig({ certThumbprint: e.target.value })}
                    placeholder="SHA-1 / SHA-256 Fingerabdruck"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80">
                {SECURITY_TOGGLES.map((item) => {
                  const enabled = config[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex cursor-pointer items-start justify-between gap-4 py-3"
                    >
                      <div className="space-y-0.5">
                        <span className="block text-xs font-medium text-slate-100">
                          {item.title}
                        </span>
                        <span className="block text-xs text-slate-400">{item.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => onUpdateConfig({ [item.key]: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-[#0B0F17] text-sky-500 focus:ring-sky-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-[#0B0F17] p-3.5 text-xs text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="font-medium text-slate-200">Hinweis zu Windows Defender:</strong>{' '}
              Für fremde PCs ohne Warnung ist ein gültiges CA-Zertifikat (z. B. Azure Trusted
              Signing oder EV/OV-Zertifikat als GitHub Secret <span className="font-mono">WIN_CSC_LINK</span>)
              erforderlich. Für den eigenen PC enthält das ZIP bereits ein PowerShell-Skript zur
              lokalen Vertrauensstellung.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
