import { useState } from 'react';
import { TopBar, type ActiveTab } from './components/TopBar';
import { EmulatorView } from './components/EmulatorView';
import { ConfiguratorView } from './components/ConfiguratorView';
import { SecurityCodeView } from './components/SecurityCodeView';
import { GitHubUpdaterView } from './components/GitHubUpdaterView';
import {
  DEFAULT_WINDOWS_CONFIG,
  slugifyAppName,
  type WindowsAppConfig,
} from './lib/windowsProjectGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('emulator');
  const [config, setConfig] = useState<WindowsAppConfig>(DEFAULT_WINDOWS_CONFIG);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleUpdateConfig = (patch: Partial<WindowsAppConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleResetConfig = () => {
    setConfig(DEFAULT_WINDOWS_CONFIG);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch('/api/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'Download fehlgeschlagen');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${slugifyAppName(config.appName)}-windows-v${config.version || '1.0.0'}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : 'ZIP-Download konnte nicht gestartet werden.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8">
        {downloadError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            {downloadError}
          </div>
        )}

        {activeTab === 'emulator' && (
          <EmulatorView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onDownloadZip={handleDownloadZip}
          />
        )}

        {activeTab === 'configurator' && (
          <ConfiguratorView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onResetConfig={handleResetConfig}
            onDownloadZip={handleDownloadZip}
            isDownloading={isDownloading}
          />
        )}

        {activeTab === 'security' && <SecurityCodeView config={config} />}

        {activeTab === 'updates' && (
          <GitHubUpdaterView config={config} onUpdateConfig={handleUpdateConfig} />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-5">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {config.appName} · Ziel: {config.targetUrl}
          </span>
          <span>
            Windows 10 & Windows 11 · SHA-256 Authenticode & GitHub Auto-Updater
          </span>
        </div>
      </footer>
    </div>
  );
}
