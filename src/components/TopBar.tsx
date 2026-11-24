import { Download } from 'lucide-react';

export type ActiveTab = 'emulator' | 'configurator' | 'security' | 'updates';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'emulator', label: 'Emulator' },
  { id: 'configurator', label: 'Konfigurator' },
  { id: 'security', label: 'Sicherheit' },
  { id: 'updates', label: 'GitHub Updates' },
];

export function TopBar({
  activeTab,
  onSelectTab,
  onDownloadZip,
  isDownloading,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0B0F17]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-4">
        <button
          type="button"
          onClick={() => onSelectTab('emulator')}
          className="font-display text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-sm"
        >
          Elytra Desktop Studio
        </button>

        <nav aria-label="Hauptnavigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-sm ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-sky-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isDownloading ? 'Paket wird erstellt…' : 'Windows-Paket (.zip)'}</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-800/80 px-6 py-2.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
