import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import {
  DEFAULT_WINDOWS_CONFIG,
  generateWindowsProjectFiles,
  slugifyAppName,
  type WindowsAppConfig,
} from './src/lib/windowsProjectGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_SLUG_RE = /^[a-zA-Z0-9._-]{1,100}$/;

function isSafePublicHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.startsWith('169.254.') ||
      host === '::1'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/export-zip', async (req, res) => {
    try {
      const body = (req.body ?? {}) as Partial<WindowsAppConfig>;
      const config: WindowsAppConfig = {
        ...DEFAULT_WINDOWS_CONFIG,
        ...body,
      };

      const files = generateWindowsProjectFiles(config);
      const zip = new JSZip();
      const rootFolderName = `${slugifyAppName(config.appName)}-windows`;

      for (const file of files) {
        zip.file(`${rootFolderName}/${file.path}`, file.content);
      }

      const iconPath = path.resolve(__dirname, 'src/assets/images/elytra_app_icon_1795549229003.jpg');
      if (fs.existsSync(iconPath)) {
        const iconBuffer = fs.readFileSync(iconPath);
        zip.file(`${rootFolderName}/build/icon-preview.jpg`, iconBuffer);
      }

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      const filename = `${rootFolderName}-v${config.version.replace(/[^a-zA-Z0-9._-]/g, '') || '1.0.0'}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'ZIP-Erstellung fehlgeschlagen',
      });
    }
  });

  app.get('/api/github-releases', async (req, res) => {
    const owner = String(req.query.owner ?? '').trim();
    const repo = String(req.query.repo ?? '').trim();

    if (!GITHUB_SLUG_RE.test(owner) || !GITHUB_SLUG_RE.test(repo)) {
      res.status(400).json({
        error: 'Ungültiger GitHub-Owner oder Repository-Name.',
      });
      return;
    }

    try {
      const ghResponse = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=8`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Elytra-Desktop-Studio',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!ghResponse.ok) {
        res.status(ghResponse.status).json({
          error:
            ghResponse.status === 404
              ? `Repository „${owner}/${repo}“ oder Releases wurden auf GitHub nicht gefunden (evtl. noch nicht angelegt oder privat).`
              : `GitHub API antwortete mit Status ${ghResponse.status}.`,
        });
        return;
      }

      const rawReleases = (await ghResponse.json()) as Array<{
        id: number;
        tag_name: string;
        name: string | null;
        published_at: string | null;
        prerelease: boolean;
        draft: boolean;
        html_url: string;
        assets: Array<{
          name: string;
          size: number;
          download_count: number;
          browser_download_url: string;
        }>;
      }>;

      const releases = rawReleases.map((rel) => {
        const hasLatestYml = rel.assets.some((a) => a.name.toLowerCase() === 'latest.yml');
        const hasWindowsExe = rel.assets.some((a) => a.name.toLowerCase().endsWith('.exe'));
        return {
          id: rel.id,
          tagName: rel.tag_name,
          name: rel.name || rel.tag_name,
          publishedAt: rel.published_at,
          prerelease: rel.prerelease,
          draft: rel.draft,
          htmlUrl: rel.html_url,
          hasLatestYml,
          hasWindowsExe,
          assets: rel.assets.map((a) => ({
            name: a.name,
            size: a.size,
            downloadCount: a.download_count,
            url: a.browser_download_url,
          })),
        };
      });

      res.json({
        owner,
        repo,
        releases,
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Verbindung zu GitHub fehlgeschlagen',
      });
    }
  });

  app.get('/api/check-target', async (req, res) => {
    const targetUrl = String(req.query.url ?? DEFAULT_WINDOWS_CONFIG.targetUrl).trim();
    if (!isSafePublicHttpsUrl(targetUrl)) {
      res.status(400).json({ error: 'Nur öffentliche HTTPS-URLs sind zulässig.' });
      return;
    }

    const startedAt = Date.now();
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Date.now() - startedAt;
      const xfo = response.headers.get('x-frame-options');
      const csp = response.headers.get('content-security-policy');
      const frameBlockedInBrowser =
        Boolean(xfo && /deny|sameorigin/i.test(xfo)) ||
        Boolean(csp && /frame-ancestors\s+('none'|'self')/i.test(csp));

      res.json({
        reachable: response.ok,
        status: response.status,
        finalUrl: response.url,
        latencyMs,
        xFrameOptions: xfo,
        frameBlockedInBrowser,
      });
    } catch (error) {
      res.json({
        reachable: false,
        status: 0,
        finalUrl: targetUrl,
        latencyMs: Date.now() - startedAt,
        xFrameOptions: null,
        frameBlockedInBrowser: false,
        error: error instanceof Error ? error.message : 'Ziel-URL nicht erreichbar',
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
