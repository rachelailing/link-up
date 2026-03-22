// js/utils/validators.js
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

export function minLength(value, n) {
  return String(value || '').length >= n;
}

export function digitsCount(value) {
  return String(value || '').replace(/[^\d]/g, '').length;
}
