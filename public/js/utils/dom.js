const _queryCache = new Map();

export function $(selector, scope = document) {
  if (scope === document && selector.startsWith('#') && !selector.includes(' ')) {
    return document.getElementById(selector.slice(1));
  }
  return scope.querySelector(selector);
}

export function $all(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function $id(id) {
  if (_queryCache.has(id)) {
    const cached = _queryCache.get(id);
    if (cached && cached.isConnected) return cached;
    _queryCache.delete(id);
  }
  const el = document.getElementById(id);
  if (el) _queryCache.set(id, el);
  return el;
}

export function clearDomCache() {
  _queryCache.clear();
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

export function toggleClass(el, className, force) {
  el?.classList.toggle(className, force);
}

export function setVisible(el, visible) {
  el?.classList.toggle('visible', visible);
}
