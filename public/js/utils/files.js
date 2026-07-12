import { showToast } from '../modules/shell/toast.js';

const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function handleFileValidation(file) {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    showToast(`"${file.name}" — only PNG, JPG, or WebP images are supported.`, 'danger');
    return false;
  }
  if (file.size > MAX_FILE_BYTES) {
    showToast(`"${file.name}" — file exceeds the 5MB limit.`, 'danger');
    return false;
  }
  return true;
}

export async function readValidFiles(fileList) {
  const files = Array.from(fileList || []);
  const results = [];
  for (const file of files) {
    if (!handleFileValidation(file)) continue;
    try {
      const url = await readFileAsDataUrl(file);
      results.push({ url, name: file.name, size: file.size, type: file.type });
    } catch {
    }
  }
  return results;
}
