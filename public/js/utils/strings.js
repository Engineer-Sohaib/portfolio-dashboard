export { escapeHtml } from './dom.js';

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function isValidSlug(s) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

export function isValidCategoryKey(k) {
  return /^[a-z0-9][a-z0-9-]*$/.test(k);
}

export function isValidUrl(str) {
  if (!str) return true;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function appendCopySuffix(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return `${filename} (copy)`;
  return `${filename.slice(0, dot)} (copy)${filename.slice(dot)}`;
}
