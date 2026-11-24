export type UpdateMode = 'auto' | 'manual';
export type SigningMethod = 'self-signed-local' | 'ov-ev-pfx' | 'azure-trusted-signing';

export interface WindowsAppConfig {
  appName: string;
  appId: string;
  version: string;
  targetUrl: string;
  githubOwner: string;
  githubRepo: string;
  updateMode: UpdateMode;
  checkIntervalMinutes: number;
  publisherName: string;
  certThumbprint: string;
  signingMethod: SigningMethod;
  strictOriginLock: boolean;
  blockPermissions: boolean;
  stripTrackingHeaders: boolean;
  blockWebRtcLeak: boolean;
  disableDevToolsInProd: boolean;
  pureFramelessMode: boolean;
}

export interface GeneratedFile {
  path: string;
  language: 'typescript' | 'json' | 'yaml' | 'powershell' | 'markdown';
  category: 'electron' | 'build' | 'signing' | 'cicd';
  description: string;
  content: string;
}

export const DEFAULT_WINDOWS_CONFIG: WindowsAppConfig = {
  appName: 'Elytra End AI',
  appId: 'app.lovable.elytraendai.desktop',
  version: '1.0.0',
  targetUrl: 'https://minecraft-elytra-end-ai.lovable.app/',
  githubOwner: 'dein-github-name',
  githubRepo: 'elytra-end-ai-desktop',
  updateMode: 'auto',
  checkIntervalMinutes: 30,
  publisherName: 'Elytra Desktop Publisher',
  certThumbprint: '',
  signingMethod: 'ov-ev-pfx',
  strictOriginLock: true,
  blockPermissions: true,
  stripTrackingHeaders: true,
  blockWebRtcLeak: true,
  disableDevToolsInProd: true,
  pureFramelessMode: true,
};

function sanitizeIdentifier(value: string, fallback: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '').trim();
  return cleaned || fallback;
}

function sanitizeDisplayName(value: string, fallback: string): string {
  const cleaned = value.replace(/["'\\`\r\n]/g, '').trim();
  return cleaned || fallback;
}

function normalizeHttpsUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') {
      parsed.protocol = 'https:';
    }
    return parsed.toString();
  } catch {
    return 'https://minecraft-elytra-end-ai.lovable.app/';
  }
}

export function slugifyAppName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'elytra-end-ai-desktop'
  );
}

export function generateWindowsProjectFiles(rawConfig: WindowsAppConfig): GeneratedFile[] {
  const appName = sanitizeDisplayName(rawConfig.appName, 'Elytra End AI');
  const slug = slugifyAppName(appName);
  const appId = sanitizeIdentifier(rawConfig.appId, 'app.lovable.elytraendai.desktop');
  const version = sanitizeIdentifier(rawConfig.version, '1.0.0');
  const targetUrl = normalizeHttpsUrl(rawConfig.targetUrl);
  const targetOrigin = new URL(targetUrl).origin;
  const githubOwner = sanitizeIdentifier(rawConfig.githubOwner, 'dein-github-name');
  const githubRepo = sanitizeIdentifier(rawConfig.githubRepo, 'elytra-end-ai-desktop');
  const publisherName = sanitizeDisplayName(rawConfig.publisherName, 'Elytra Desktop Publisher');
  const certThumbprint = rawConfig.certThumbprint.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const checkIntervalMs = Math.max(5, Math.min(1440, Number(rawConfig.checkIntervalMinutes) || 30)) * 60 * 1000;

  const packageJson = JSON.stringify(
    {
      name: slug,
      version,
      description: `${appName} — Gehärtete Windows 10/11 Desktop-App für ${targetUrl}`,
      main: 'dist-electron/main.js',
      private: true,
      author: publisherName,
      license: 'MIT',
      scripts: {
        'build:ts': 'tsc -p tsconfig.json',
        dev: 'npm run build:ts && electron .',
        'dist:win': 'npm run build:ts && electron-builder --win --x64 --arm64',
        'dist:win:publish': 'npm run build:ts && electron-builder --win --x64 --arm64 --publish always',
        'cert:create': 'powershell -ExecutionPolicy Bypass -File scripts/create-dev-cert.ps1',
        'cert:verify': 'powershell -ExecutionPolicy Bypass -File scripts/verify-signature.ps1',
      },
      dependencies: {
        'electron-updater': '^6.3.9',
      },
      devDependencies: {
        electron: '^35.1.5',
        'electron-builder': '^25.1.8',
        typescript: '^5.8.2',
      },
    },
    null,
    2
  );

  const tsconfigJson = JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'CommonJS',
        moduleResolution: 'Node',
        outDir: 'dist-electron',
        rootDir: 'electron',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
      },
      include: ['electron/**/*.ts'],
    },
    null,
    2
  );

  const electronBuilderYml = `appId: ${appId}
productName: "${appName}"
copyright: "Copyright © 2026 ${publisherName}"
directories:
  output: release
  buildResources: build

files:
  - "dist-electron/**/*"
  - "package.json"

win:
  target:
    - target: nsis
      arch:
        - x64
        - arm64
    - target: portable
      arch:
        - x64
  artifactName: "\${productName}-\${version}-\${arch}-\${os}.\${ext}"
  requestedExecutionLevel: asInvoker
  signAndEditExecutable: true
  verifyUpdateCodeSignature: true
  publisherName:
    - "${publisherName}"
  signtoolOptions:
    signingHashAlgorithms:
      - sha256
    timeStampServer: "http://timestamp.digicert.com"
    rfc3161TimeStampServer: "http://timestamp.digicert.com"
    ${
      rawConfig.signingMethod === 'azure-trusted-signing'
        ? `# Für Microsoft Azure Trusted Signing über sign.ts / TrustedSigning CLI`
        : `certificateSubjectName: "${publisherName}"`
    }

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "${appName}"
  deleteAppDataOnUninstall: false

portable:
  artifactName: "\${productName}-Portable-\${version}-\${arch}.\${ext}"

publish:
  provider: github
  owner: "${githubOwner}"
  repo: "${githubRepo}"
  releaseType: release
  vPrefixedTagName: true
`;

  const configTs = `export const APP_CONFIG = {
  appName: ${JSON.stringify(appName)},
  appId: ${JSON.stringify(appId)},
  targetUrl: ${JSON.stringify(targetUrl)},
  allowedOrigin: ${JSON.stringify(targetOrigin)},
  githubOwner: ${JSON.stringify(githubOwner)},
  githubRepo: ${JSON.stringify(githubRepo)},
  defaultUpdateMode: ${JSON.stringify(rawConfig.updateMode)} as 'auto' | 'manual',
  checkIntervalMs: ${checkIntervalMs},
  expectedPublisher: ${JSON.stringify(publisherName)},
  pinnedCertThumbprint: ${JSON.stringify(certThumbprint)},
  security: {
    strictOriginLock: ${Boolean(rawConfig.strictOriginLock)},
    blockPermissions: ${Boolean(rawConfig.blockPermissions)},
    stripTrackingHeaders: ${Boolean(rawConfig.stripTrackingHeaders)},
    blockWebRtcLeak: ${Boolean(rawConfig.blockWebRtcLeak)},
    disableDevToolsInProd: ${Boolean(rawConfig.disableDevToolsInProd)},
    pureFramelessMode: ${Boolean(rawConfig.pureFramelessMode)},
  },
} as const;
`;

  const securityTs = `import { app, BrowserWindow, session } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { APP_CONFIG } from './config';

const execFileAsync = promisify(execFile);

const BLOCKED_TRACKING_HOSTS = new Set([
  'www.google-analytics.com',
  'analytics.google.com',
  'www.googletagmanager.com',
  'connect.facebook.net',
  'doubleclick.net',
  'sentry.io',
  'browser.sentry-cdn.com',
  'mixpanel.com',
  'api.mixpanel.com',
]);

export function applyProcessPrivacySwitches(): void {
  app.commandLine.appendSwitch('disable-breakpad');
  app.commandLine.appendSwitch('disable-crash-reporter');
  app.commandLine.appendSwitch('no-pings');
  app.commandLine.appendSwitch('disable-domain-reliability');
  app.commandLine.appendSwitch('disable-background-networking');
  app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication,CertificateTransparencyComponentUpdater');

  if (APP_CONFIG.security.blockWebRtcLeak) {
    app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');
  }
}

export function isPermittedUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    if (!APP_CONFIG.security.strictOriginLock) {
      return true;
    }
    return parsed.origin === APP_CONFIG.allowedOrigin;
  } catch {
    return false;
  }
}

export function hardenSessionSecurity(targetSession: Electron.Session): void {
  if (APP_CONFIG.security.blockPermissions) {
    targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      const allowedPermissions = new Set(['fullscreen']);
      callback(allowedPermissions.has(permission));
    });

    targetSession.setPermissionCheckHandler((_webContents, permission) => {
      return permission === 'fullscreen';
    });
  }

  targetSession.webRequest.onBeforeRequest((details, callback) => {
    try {
      const parsed = new URL(details.url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'wss:' && parsed.protocol !== 'blob:') {
        callback({ cancel: true });
        return;
      }

      if (APP_CONFIG.security.stripTrackingHeaders && BLOCKED_TRACKING_HOSTS.has(parsed.hostname)) {
        callback({ cancel: true });
        return;
      }

      if (details.resourceType === 'mainFrame' && !isPermittedUrl(details.url)) {
        callback({ cancel: true });
        return;
      }

      callback({ cancel: false });
    } catch {
      callback({ cancel: true });
    }
  });

  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    if (APP_CONFIG.security.stripTrackingHeaders) {
      delete headers['Referer'];
      delete headers['referer'];
      headers['DNT'] = '1';
      headers['Sec-GPC'] = '1';
    }
    callback({ requestHeaders: headers });
  });

  targetSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    responseHeaders['X-Content-Type-Options'] = ['nosniff'];
    responseHeaders['Referrer-Policy'] = ['no-referrer'];
    responseHeaders['Strict-Transport-Security'] = ['max-age=63072000; includeSubDomains; preload'];

    if (APP_CONFIG.security.blockPermissions) {
      responseHeaders['Permissions-Policy'] = [
        'camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=(), bluetooth=(), payment=()',
      ];
    }

    if (details.resourceType === 'mainFrame') {
      responseHeaders['X-Frame-Options'] = ['DENY'];
    }

    callback({ responseHeaders });
  });
}

export function attachWindowSecurityGuards(win: BrowserWindow): void {
  const { webContents } = win;

  webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  webContents.on('will-navigate', (event, navigationUrl) => {
    if (!isPermittedUrl(navigationUrl)) {
      event.preventDefault();
    }
  });

  webContents.on('will-redirect', (event, redirectUrl) => {
    if (!isPermittedUrl(redirectUrl)) {
      event.preventDefault();
    }
  });

  webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  if (APP_CONFIG.security.disableDevToolsInProd && app.isPackaged) {
    webContents.on('before-input-event', (event, input) => {
      const isDevToolsShortcut =
        input.key === 'F12' ||
        ((input.control || input.meta) && input.shift && ['I', 'J', 'C'].includes(input.key.toUpperCase()));
      if (isDevToolsShortcut) {
        event.preventDefault();
      }
    });
  }
}

export async function verifyWindowsAuthenticodeSignature(filePath: string): Promise<{
  valid: boolean;
  thumbprint: string;
  subject: string;
  reason?: string;
}> {
  if (process.platform !== 'win32') {
    return { valid: false, thumbprint: '', subject: '', reason: 'Nur unter Windows verfügbar' };
  }

  const psScript = [
    '$sig = Get-AuthenticodeSignature -LiteralPath $env:TARGET_BIN;',
    '$cert = $sig.SignerCertificate;',
    '[PSCustomObject]@{',
    '  Status = [string]$sig.Status;',
    '  Thumbprint = if ($cert) { [string]$cert.Thumbprint } else { "" };',
    '  Subject = if ($cert) { [string]$cert.Subject } else { "" };',
    '} | ConvertTo-Json -Compress',
  ].join(' ');

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      {
        env: { ...process.env, TARGET_BIN: filePath },
        timeout: 15000,
      }
    );

    const parsed = JSON.parse(stdout.trim()) as {
      Status: string;
      Thumbprint: string;
      Subject: string;
    };

    const statusValid = parsed.Status === 'Valid';
    const thumbprintMatches =
      !APP_CONFIG.pinnedCertThumbprint ||
      parsed.Thumbprint.toUpperCase() === APP_CONFIG.pinnedCertThumbprint.toUpperCase();

    if (!statusValid) {
      return {
        valid: false,
        thumbprint: parsed.Thumbprint,
        subject: parsed.Subject,
        reason: \`Authenticode-Status ungültig: \${parsed.Status}\`,
      };
    }

    if (!thumbprintMatches) {
      return {
        valid: false,
        thumbprint: parsed.Thumbprint,
        subject: parsed.Subject,
        reason: 'Zertifikat-Thumbprint stimmt nicht mit dem eingebetteten Zertifikat überein.',
      };
    }

    return {
      valid: true,
      thumbprint: parsed.Thumbprint,
      subject: parsed.Subject,
    };
  } catch (error) {
    return {
      valid: false,
      thumbprint: '',
      subject: '',
      reason: error instanceof Error ? error.message : 'Signaturprüfung fehlgeschlagen',
    };
  }
}
`;

  const updaterTs = `import { app, Notification } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import fs from 'node:fs';
import path from 'node:path';
import { APP_CONFIG } from './config';

export type UpdateMode = 'auto' | 'manual';

export interface UpdaterStatus {
  mode: UpdateMode;
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error';
  currentVersion: string;
  availableVersion?: string;
  progressPercent?: number;
  lastCheckedAt?: string;
  errorMessage?: string;
}

const PREFS_PATH = path.join(app.getPath('userData'), 'updater-preferences.json');

let currentStatus: UpdaterStatus = {
  mode: APP_CONFIG.defaultUpdateMode,
  state: 'idle',
  currentVersion: app.getVersion(),
};

let statusListeners: Array<(status: UpdaterStatus) => void> = [];
let checkTimer: NodeJS.Timeout | null = null;

function loadSavedMode(): UpdateMode {
  try {
    if (fs.existsSync(PREFS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8')) as { mode?: string };
      if (raw.mode === 'auto' || raw.mode === 'manual') {
        return raw.mode;
      }
    }
  } catch {
    // Fallback auf Standardmodus
  }
  return APP_CONFIG.defaultUpdateMode;
}

function saveMode(mode: UpdateMode): void {
  try {
    fs.writeFileSync(PREFS_PATH, JSON.stringify({ mode }, null, 2), 'utf8');
  } catch {
    // Ignoriere schreibgeschützte Fehler im Tray-Kontext
  }
}

function emitStatus(patch: Partial<UpdaterStatus>): void {
  currentStatus = { ...currentStatus, ...patch };
  for (const listener of statusListeners) {
    listener(currentStatus);
  }
}

function notifyUser(title: string, body: string): void {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: true }).show();
  }
}

export function getUpdaterStatus(): UpdaterStatus {
  return currentStatus;
}

export function subscribeUpdaterStatus(listener: (status: UpdaterStatus) => void): () => void {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter((item) => item !== listener);
  };
}

export function setUpdateMode(mode: UpdateMode): UpdaterStatus {
  saveMode(mode);
  autoUpdater.autoDownload = mode === 'auto';
  autoUpdater.autoInstallOnAppQuit = mode === 'auto';
  emitStatus({ mode });
  return currentStatus;
}

export async function checkForUpdatesNow(manualTrigger = false): Promise<void> {
  if (!app.isPackaged) {
    emitStatus({
      state: 'up-to-date',
      lastCheckedAt: new Date().toISOString(),
    });
    if (manualTrigger) {
      notifyUser(APP_CONFIG.appName, 'Update-Prüfung ist nur in der signierten Release-App aktiv.');
    }
    return;
  }

  try {
    emitStatus({ state: 'checking', errorMessage: undefined });
    await autoUpdater.checkForUpdates();
  } catch (error) {
    emitStatus({
      state: 'error',
      errorMessage: error instanceof Error ? error.message : 'GitHub-Update-Prüfung fehlgeschlagen',
    });
  }
}

export async function downloadAndInstallManualUpdate(): Promise<void> {
  if (currentStatus.state === 'downloaded') {
    autoUpdater.quitAndInstall(false, true);
    return;
  }
  if (currentStatus.state === 'available') {
    emitStatus({ state: 'downloading', progressPercent: 0 });
    await autoUpdater.downloadUpdate();
  }
}

export function initGitHubUpdater(): void {
  const mode = loadSavedMode();
  currentStatus.mode = mode;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: APP_CONFIG.githubOwner,
    repo: APP_CONFIG.githubRepo,
    vPrefixedTagName: true,
    releaseType: 'release',
  });

  autoUpdater.autoDownload = mode === 'auto';
  autoUpdater.autoInstallOnAppQuit = mode === 'auto';
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('checking-for-update', () => {
    emitStatus({ state: 'checking', lastCheckedAt: new Date().toISOString() });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    emitStatus({
      state: currentStatus.mode === 'auto' ? 'downloading' : 'available',
      availableVersion: info.version,
      lastCheckedAt: new Date().toISOString(),
    });

    if (currentStatus.mode === 'manual') {
      notifyUser(
        \`Update verfügbar: v\${info.version}\`,
        'Öffne das Tray-Menü, um das signierte GitHub-Update manuell zu installieren.'
      );
    }
  });

  autoUpdater.on('update-not-available', () => {
    emitStatus({
      state: 'up-to-date',
      lastCheckedAt: new Date().toISOString(),
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    emitStatus({
      state: 'downloading',
      progressPercent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    emitStatus({
      state: 'downloaded',
      availableVersion: info.version,
      progressPercent: 100,
    });

    if (currentStatus.mode === 'auto') {
      notifyUser(
        \`Update v\${info.version} bereit\`,
        'Das signierte Update wird jetzt automatisch installiert...'
      );
      setTimeout(() => {
        autoUpdater.quitAndInstall(true, true);
      }, 1500);
    } else {
      notifyUser(
        \`Update v\${info.version} heruntergeladen\`,
        'Klicke im Tray-Menü auf „Update jetzt installieren“.'
      );
    }
  });

  autoUpdater.on('error', (error) => {
    emitStatus({
      state: 'error',
      errorMessage: error.message,
    });
  });

  void checkForUpdatesNow(false);

  if (checkTimer) {
    clearInterval(checkTimer);
  }
  checkTimer = setInterval(() => {
    void checkForUpdatesNow(false);
  }, APP_CONFIG.checkIntervalMs);
}
`;

  const preloadTs = `import { contextBridge, ipcRenderer } from 'electron';

export interface DesktopBridgeAPI {
  getUpdateStatus: () => Promise<unknown>;
  setUpdateMode: (mode: 'auto' | 'manual') => Promise<unknown>;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: unknown) => void) => () => void;
}

const api: DesktopBridgeAPI = Object.freeze({
  getUpdateStatus: () => ipcRenderer.invoke('updater:get-status'),
  setUpdateMode: (mode: 'auto' | 'manual') => {
    if (mode !== 'auto' && mode !== 'manual') {
      return Promise.reject(new Error('Ungültiger Update-Modus'));
    }
    return ipcRenderer.invoke('updater:set-mode', mode);
  },
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdateStatus: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status);
    ipcRenderer.on('updater:status', listener);
    return () => {
      ipcRenderer.removeListener('updater:status', listener);
    };
  },
});

contextBridge.exposeInMainWorld('desktopBridge', api);
`;

  const mainTs = `import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import path from 'node:path';
import { APP_CONFIG } from './config';
import {
  attachWindowSecurityGuards,
  applyProcessPrivacySwitches,
  hardenSessionSecurity,
} from './security';
import {
  checkForUpdatesNow,
  downloadAndInstallManualUpdate,
  getUpdaterStatus,
  initGitHubUpdater,
  setUpdateMode,
  subscribeUpdaterStatus,
} from './updater';

applyProcessPrivacySwitches();

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_CONFIG.appId);
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createAppWindow(): void {
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    title: APP_CONFIG.appName,
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0B0F17',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      navigateOnDragDrop: false,
      safeDialogs: true,
      devTools: APP_CONFIG.security.disableDevToolsInProd ? !app.isPackaged : true,
    },
  };

  if (APP_CONFIG.security.pureFramelessMode) {
    windowOptions.titleBarStyle = 'hidden';
    windowOptions.titleBarOverlay = {
      color: '#0B0F17',
      symbolColor: '#E2E8F0',
      height: 34,
    };
  }

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.removeMenu();
  attachWindowSecurityGuards(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  void mainWindow.loadURL(APP_CONFIG.targetUrl);
}

function buildTrayMenu(): void {
  if (!tray) return;
  const status = getUpdaterStatus();
  const isManualReady = status.state === 'available' || status.state === 'downloaded';

  const menu = Menu.buildFromTemplate([
    { label: \`\${APP_CONFIG.appName} v\${status.currentVersion}\`, enabled: false },
    { type: 'separator' },
    {
      label: 'Fenster anzeigen',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        } else {
          createAppWindow();
        }
      },
    },
    {
      label: 'Seite neu laden',
      click: () => mainWindow?.webContents.reloadIgnoringCache(),
    },
    { type: 'separator' },
    {
      label: 'Update-Modus: Automatisch installieren',
      type: 'radio',
      checked: status.mode === 'auto',
      click: () => setUpdateMode('auto'),
    },
    {
      label: 'Update-Modus: Manuell bestätigen',
      type: 'radio',
      checked: status.mode === 'manual',
      click: () => setUpdateMode('manual'),
    },
    {
      label: 'Jetzt auf GitHub nach Updates suchen',
      click: () => void checkForUpdatesNow(true),
    },
    ...(isManualReady
      ? [
          {
            label: \`Update v\${status.availableVersion} jetzt installieren\`,
            click: () => void downloadAndInstallManualUpdate(),
          },
        ]
      : []),
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(menu);
}

function createSystemTray(): void {
  const emptyIcon = nativeImage.createEmpty();
  tray = new Tray(emptyIcon);
  tray.setToolTip(APP_CONFIG.appName);
  buildTrayMenu();
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle('updater:get-status', () => getUpdaterStatus());
  ipcMain.handle('updater:set-mode', (_event, mode: 'auto' | 'manual') => {
    const updated = setUpdateMode(mode);
    buildTrayMenu();
    return updated;
  });
  ipcMain.handle('updater:check', () => checkForUpdatesNow(true));
  ipcMain.handle('updater:install', () => downloadAndInstallManualUpdate());
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  hardenSessionSecurity(app.isReady() ? require('electron').session.defaultSession : mainWindow!.webContents.session);
  registerIpcHandlers();
  createAppWindow();
  createSystemTray();
  initGitHubUpdater();

  subscribeUpdaterStatus((status) => {
    buildTrayMenu();
    mainWindow?.webContents.send('updater:status', status);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
`;

  const mainTsClean = mainTs.replace(
    "hardenSessionSecurity(app.isReady() ? require('electron').session.defaultSession : mainWindow!.webContents.session);",
    "const { session } = require('electron') as typeof import('electron');\n  hardenSessionSecurity(session.defaultSession);"
  );

  const createCertPs1 = `#Requires -Version 5.1
<#
.SYNOPSIS
  Erzeugt ein SHA-256 Code-Signing-Zertifikat (.pfx + .cer) für lokale Tests auf Windows 10/11
  und gibt den Thumbprint sowie Base64-String für GitHub Actions Secrets aus.
#>

param(
  [string]$PublisherName = "${publisherName}",
  [string]$OutputDir = ".\\certs",
  [string]$Password = "AendereDiesesPasswort123!"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$cert = New-SelfSignedCertificate \`
  -Type CodeSigningCert \`
  -Subject "CN=$PublisherName" \`
  -KeyAlgorithm RSA \`
  -KeyLength 4096 \`
  -HashAlgorithm SHA256 \`
  -KeyUsage DigitalSignature \`
  -NotAfter (Get-Date).AddYears(3) \`
  -CertStoreLocation "Cert:\\CurrentUser\\My"

$pfxPath = Join-Path $OutputDir "codesign.pfx"
$cerPath = Join-Path $OutputDir "codesign.cer"
$securePwd = ConvertTo-SecureString -String $Password -Force -AsPlainText

Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePwd | Out-Null
Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null

# Optional lokal vertrauen, damit Windows Defender SmartScreen auf diesem PC keinen Warnhinweis zeigt:
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\\CurrentUser\\Root" | Out-Null
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\\CurrentUser\\TrustedPublisher" | Out-Null

$base64Pfx = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $pfxPath)))

Write-Host ""
Write-Host "Zertifikat erfolgreich erstellt und lokal als vertrauenswürdig hinterlegt:" -ForegroundColor Green
Write-Host "  PFX-Datei       : $pfxPath"
Write-Host "  Thumbprint      : $($cert.Thumbprint)"
Write-Host "  GitHub CSC_LINK : (in Datei certs/csc_link_base64.txt gespeichert)"
Set-Content -Path (Join-Path $OutputDir "csc_link_base64.txt") -Value $base64Pfx -NoNewline
Write-Host ""
Write-Host "WICHTIG: Für öffentliche Releases an fremde PCs ohne manuelle Zertifikatsinstallation" -ForegroundColor Yellow
Write-Host "         empfiehlt sich ein offizielles OV/EV-Zertifikat oder Microsoft Azure Trusted Signing."
`;

  const verifySigPs1 = `#Requires -Version 5.1
param(
  [string]$ExePath = ""
)

$ErrorActionPreference = "Stop"

if (-not $ExePath) {
  $found = Get-ChildItem -Path ".\\release" -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $found) {
    Write-Error "Keine .exe im Ordner .\\release gefunden. Bitte zuerst 'npm run dist:win' ausführen."
    exit 1
  }
  $ExePath = $found.FullName
}

$sig = Get-AuthenticodeSignature -LiteralPath $ExePath
$hash = (Get-FileHash -LiteralPath $ExePath -Algorithm SHA256).Hash

Write-Host "Datei       : $ExePath"
Write-Host "Status      : $($sig.Status)"
Write-Host "SHA-256     : $hash"
if ($sig.SignerCertificate) {
  Write-Host "Aussteller  : $($sig.SignerCertificate.Issuer)"
  Write-Host "Subject     : $($sig.SignerCertificate.Subject)"
  Write-Host "Thumbprint  : $($sig.SignerCertificate.Thumbprint)"
}

if ($sig.Status -ne "Valid") {
  Write-Error "Signatur ungültig oder nicht vertrauenswürdig ($($sig.Status))."
  exit 1
}
`;

  const githubWorkflowYml = `name: Build & Sign Windows App

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Repository auschecken
        uses: actions/checkout@v4

      - name: Node.js 22 einrichten
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Abhängigkeiten installieren
        run: npm ci

      - name: Windows Installer & Portable bauen, signieren & auf GitHub veröffentlichen
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: \${{ secrets.WIN_CSC_LINK }}
          CSC_KEY_PASSWORD: \${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run dist:win:publish

      - name: Authenticode-Signatur verifizieren
        if: \${{ env.CSC_LINK != '' }}
        shell: pwsh
        run: .\\scripts\\verify-signature.ps1
`;

  const readmeMd = `# ${appName} — Windows 10 & 11 Desktop-App

Schlanker, gehärteter Windows-Desktop-Emulator für **${targetUrl}** mit automatischem GitHub-Release-Updater, Authenticode-Signatur-Workflow und strengen Datenschutz- und Sicherheitsrichtlinien.

## Enthaltene Sicherheits- & Datenschutz-Standards

- **Isolierte Execution-Sandbox**: \`contextIsolation: true\`, \`nodeIntegration: false\`, \`sandbox: true\`, \`webviewTag: false\`.
- **Strikte Origin-Sperre**: Navigationen und Redirects außerhalb von \`${targetOrigin}\` werden blockiert.
- **Pop-up- & Script-Injection-Schutz**: Alle externen \`window.open()\`-Aufrufe sowie \`javascript:\`, \`data:\` und \`file:\` Hauptnavigationen werden abgelehnt.
- **Berechtigungs-Blockade**: Kamera, Mikrofon, Standort, USB, Serial, HID und Bluetooth werden standardmäßig blockiert.
- **Datenschutz-Header & WebRTC-Schutz**: Referrer-Stripping, \`DNT: 1\`, \`Sec-GPC: 1\`, Blockade von WebRTC-IP-Leaks und deaktivierte Crash-/Telemetrie-Dienste.
- **Zertifikat-gesicherter GitHub-Updater**: \`electron-updater\` prüft \`latest.yml\` (SHA-512) und die Windows Authenticode-Signatur des Herausgebers (\`${publisherName}\`), bevor ein Update installiert wird.

## Update-Modi (Automatisch oder Manuell)

- **Automatisch**: Die App prüft beim Start sowie alle ${Math.round(checkIntervalMs / 60000)} Minuten auf neue GitHub-Releases (\`v*\`). Jede neue Version wird automatisch heruntergeladen, verifiziert und installiert.
- **Manuell**: Im Windows-System-Tray (Rechtsklick auf das App-Symbol) lässt sich der Modus jederzeit auf *Manuell* umstellen. Neue Versionen werden dann gemeldet und erst per Klick installiert.

## Installation & Build auf Windows 10 / 11

\`\`\`powershell
npm install
npm run cert:create      # Optional für lokale Signatur-Tests
npm run dist:win         # Baut NSIS-Installer & Portable .exe in ./release
npm run cert:verify      # Prüft Authenticode-Signatur & SHA-256
\`\`\`

## GitHub Auto-Update & Signatur einrichten

1. Lege auf GitHub das Repository \`${githubOwner}/${githubRepo}\` an und lade diesen Ordner hoch.
2. Hinterlege unter **Settings -> Secrets and variables -> Actions** folgende Secrets für die Windows-Signatur:
   - \`WIN_CSC_LINK\`: Base64-codierte \`.pfx\`-Datei (für öffentliche Verteilung ohne SmartScreen-Warnung: offizielles OV/EV Code-Signing-Zertifikat oder Microsoft Azure Trusted Signing).
   - \`WIN_CSC_KEY_PASSWORD\`: Passwort des Zertifikats.
3. Veröffentliche ein neues Release einfach per Git-Tag:
   \`\`\`bash
   git tag v1.0.1
   git push origin v1.0.1
   \`\`\`
   GitHub Actions baut automatisch den signierten Installer plus \`latest.yml\` — jede installierte App erkennt die neue Version sofort als Update.
`;

  return [
    {
      path: 'package.json',
      language: 'json',
      category: 'build',
      description: 'Electron-Abhängigkeiten, Build- und Signatur-Skripte',
      content: packageJson,
    },
    {
      path: 'tsconfig.json',
      language: 'json',
      category: 'build',
      description: 'TypeScript-Konfiguration für den Electron-Hauptprozess',
      content: tsconfigJson,
    },
    {
      path: 'electron-builder.yml',
      language: 'yaml',
      category: 'build',
      description: 'Windows 10/11 NSIS & Portable Installer, Authenticode & GitHub Publish',
      content: electronBuilderYml,
    },
    {
      path: 'electron/config.ts',
      language: 'typescript',
      category: 'electron',
      description: 'Zentrale Konfiguration für Ziel-URL, GitHub-Repo und Sicherheits-Policies',
      content: configTs,
    },
    {
      path: 'electron/main.ts',
      language: 'typescript',
      category: 'electron',
      description: 'Schlankes Windows 10/11 App-Fenster ohne UI-Ballast + System-Tray',
      content: mainTsClean,
    },
    {
      path: 'electron/security.ts',
      language: 'typescript',
      category: 'electron',
      description: 'Origin-Lock, CSP, Berechtigungssperre, WebRTC- & Zertifikatprüfung',
      content: securityTs,
    },
    {
      path: 'electron/updater.ts',
      language: 'typescript',
      category: 'electron',
      description: 'GitHub Releases Auto-Updater mit automatischem & manuellem Modus',
      content: updaterTs,
    },
    {
      path: 'electron/preload.ts',
      language: 'typescript',
      category: 'electron',
      description: 'Gehärtete contextBridge ohne Node.js-Zugriff',
      content: preloadTs,
    },
    {
      path: 'scripts/create-dev-cert.ps1',
      language: 'powershell',
      category: 'signing',
      description: 'Erstellt ein lokales SHA-256 Code-Signing-Zertifikat (.pfx/.cer)',
      content: createCertPs1,
    },
    {
      path: 'scripts/verify-signature.ps1',
      language: 'powershell',
      category: 'signing',
      description: 'Prüft Authenticode-Signatur & SHA-256 der gebauten .exe',
      content: verifySigPs1,
    },
    {
      path: '.github/workflows/build-windows.yml',
      language: 'yaml',
      category: 'cicd',
      description: 'Automatischer GitHub-Release-Build mit Signatur auf Tag-Push (v*)',
      content: githubWorkflowYml,
    },
    {
      path: 'README.md',
      language: 'markdown',
      category: 'build',
      description: 'Vollständige Anleitung für Build, Signatur & Auto-Updates',
      content: readmeMd,
    },
  ];
}
