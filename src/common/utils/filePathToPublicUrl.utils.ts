// src/common/utils/file-to-url.ts
import { relative, sep } from 'path';

export function filePathToPublicUrl(
  filePath: string,
  baseUrl: string, // e.g., process.env.PUBLIC_BASE_URL
): string {
  // Normalize Windows backslashes → forward slashes
  const normalized = filePath.replace(/\\/g, '/');

  // Ensure it contains "public/". If not, treat as already relative.
  const idx = normalized.indexOf('public/');
  const relFromPublic =
    idx >= 0
      ? normalized.substring(idx + 'public/'.length) // e.g. 'uploads/profiles/abc.png'
      : normalized.replace(/^\/+/, ''); // fallback

  // Build https://host/public/<relative>
  return `${baseUrl.replace(/\/$/, '')}/public/${relFromPublic}`;
}
