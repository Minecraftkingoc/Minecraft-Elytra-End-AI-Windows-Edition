import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import type { WindowsAppConfig } from '../lib/windowsProjectGenerator';

interface GitHubReleaseItem {
  id: number;
  tagName: string;
  name: string;
  publishedAt: string | null;
  prerelease: boolean;
  draft: boolean;
  htmlUrl: string;
  hasLatestYml: boolean;
  hasWindowsExe: boolean;
  assets: Array<{
    name: string;
    size: number;
    downloadCount: number;
    url: string;
  }>;
}

interface GitHubUpdaterViewProps {
  config: WindowsAppConfig;
  onUpdateConfig: (patch: Partial<WindowsAppConfig>) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function GitHubUpdaterView({
  config,
  onUpdateConfig,
}: GitHubUpdaterViewProps) {
  const [ownerInput, setOwnerInput] = useState(config.githubOwner);
  const [repoInput, setRepoInput] = useState(config.githubRepo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releases, setReleases] = useState<GitHubReleaseItem[] | null>(null);

  const fetchReleases = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const owner = ownerInput.trim();
    const repo = repoInput.trim();
    if (!owner || !repo) {
      setError('Bitte GitHub-Benutzername und Repository angeben.');
      return;
    }

    onUpdateConfig({ githubOwner: owner, githubRepo: repo });
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github-releases?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      const data = (await response.json()) as {
        error?: string;
        releases?: GitHubReleaseItem[];
      };

      if (!response.ok || data.error) {
        setReleases(null);
        setError(data.error || 'Releases konnten nicht geladen werden.');
        return;
      }

      setReleases(data.releases ?? []);
    } catch {
      setReleases(null);
      setError('Netzwerkfehler beim Abrufen der GitHub-API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 max-w-2xl">
        <p className="text-xs font-medium text-slate-400">
          GitHub Releases Auto-Updater · Automatisch oder Manuell in der App
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
          Automatische Updates über dein GitHub-Repository
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-2">
          <p className="font-display text-sm font-semibold text-white">
            01. Code auf GitHub pushen
          </p>
          <p className="text-xs leading-relaxed text-slate-400">
            Lade das heruntergeladene Windows-Projekt-ZIP in dein Repository{' '}
            <span className="font-mono text-slate-200">
              {config.githubOwner}/{config.githubRepo}
            </span>{' '}
            hoch und hinterlege deine Signatur-Secrets (<span className="font-mono">WIN_CSC_LINK</span>).
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-2">
          <p className="font-display text-sm font-semibold text-white">
            02. Version taggen (z. B. v1.0.1)
          </p>
          <p className="text-xs leading-relaxed text-slate-400">
            Sobald du ein Tag wie <span className="font-mono text-slate-200">git tag v1.0.1</span>{' '}
            pushst, baut GitHub Actions automatisch den signierten Windows-Installer plus{' '}
            <span className="font-mono text-slate-200">latest.yml</span>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-2">
          <p className="font-display text-sm font-semibold text-white">
            03. Sofort-Update in der App
          </p>
          <p className="text-xs leading-relaxed text-slate-400">
            Jede neue Version wird erkannt, über das eingebettete Zertifikat geprüft und je nach
            Einstellung <span className="text-slate-200">sofort automatisch</span> oder{' '}
            <span className="text-slate-200">manuell</span> installiert.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Live-Release-Prüfung gegen GitHub
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Prüfe, ob ein öffentliches GitHub-Repository bereits Releases mit{' '}
              <span className="font-mono">latest.yml</span> und Windows-<span className="font-mono">.exe</span>-Dateien bereitstellt.
            </p>
          </div>

          <form onSubmit={fetchReleases} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              aria-label="GitHub Benutzername"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              placeholder="owner"
              className="w-40 rounded-lg border border-slate-700 bg-[#0B0F17] px-3 py-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <span className="text-slate-500">/</span>
            <input
              type="text"
              aria-label="GitHub Repository"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="repository"
              className="w-48 rounded-lg border border-slate-700 bg-[#0B0F17] px-3 py-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60 whitespace-nowrap shrink-0 transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{loading ? 'Prüfe…' : 'Releases abrufen'}</span>
            </button>
          </form>
        </div>

        {loading && (
          <div className="space-y-2 py-4">
            <div className="h-10 w-full rounded bg-slate-800/70" />
            <div className="h-10 w-full rounded bg-slate-800/50" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">{error}</p>
              <p className="text-amber-200/80">
                Wenn du dein Repository gerade erst anlegst, lade zuerst das ZIP-Paket hoch und
                erstelle ein erstes Tag-Release (<span className="font-mono">v1.0.0</span>).
              </p>
            </div>
          </div>
        )}

        {!loading && !error && releases === null && (
          <div className="rounded-lg border border-dashed border-slate-800 bg-[#0B0F17] p-8 text-center">
            <p className="text-sm font-medium text-slate-200">
              Noch keine Live-Abfrage gestartet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Gib oben dein GitHub-Repository ein und klicke auf „Releases abrufen“, um echte
              veröffentlichte Versionen und Update-Manifeste zu prüfen.
            </p>
          </div>
        )}

        {!loading && !error && releases !== null && releases.length === 0 && (
          <div className="rounded-lg border border-slate-800 bg-[#0B0F17] p-6 text-center text-xs text-slate-400">
            Das Repository existiert, enthält aber noch keine veröffentlichten GitHub Releases.
          </div>
        )}

        {!loading && !error && releases && releases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 pr-4 font-medium">Tag</th>
                  <th className="py-3 pr-4 font-medium">Release-Name</th>
                  <th className="py-3 pr-4 font-medium">Veröffentlicht</th>
                  <th className="py-3 pr-4 font-medium">Update-Manifest</th>
                  <th className="py-3 pr-4 font-medium">Windows Installer</th>
                  <th className="py-3 text-right font-medium">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {releases.map((rel) => {
                  const exeAsset = rel.assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
                  return (
                    <tr key={rel.id} className="hover:bg-slate-800/30">
                      <td className="py-3 pr-4 font-mono font-semibold text-white tabular-nums">
                        {rel.tagName}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{rel.name}</td>
                      <td className="py-3 pr-4 font-mono text-slate-400 tabular-nums">
                        {rel.publishedAt
                          ? new Date(rel.publishedAt).toLocaleDateString('de-DE')
                          : 'Entwurf'}
                      </td>
                      <td className="py-3 pr-4">
                        {rel.hasLatestYml ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>latest.yml bereit</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Kein latest.yml</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-slate-300 tabular-nums">
                        {exeAsset ? `${exeAsset.name} (${formatBytes(exeAsset.size)})` : 'Nicht gefunden'}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={rel.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                        >
                          <span>GitHub</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
