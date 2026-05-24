// ===== Theme =====
import { state } from './state.js';
import { saveState } from './persistence.js';

const $ = s => document.querySelector(s);

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? '' : theme);
  const icons = { light: 'fa-sun-o', dark: 'fa-moon-o', amber: 'fa-diamond', crimson: 'fa-fire' };
  $('#themeBtn').innerHTML = `<i class="fa ${icons[theme] || 'fa-moon-o'}"></i>`;
  state.settings.theme = theme;
  saveState();
}

export function cycleTheme() {
  const themes = ['light', 'dark', 'amber', 'crimson'];
  const idx = themes.indexOf(state.settings.theme);
  applyTheme(themes[(idx + 1) % themes.length]);
}
