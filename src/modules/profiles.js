// ===== API Profiles =====
import { state } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';

const $ = s => document.querySelector(s);

export function renderProfileList() {
  const sel = $('#setProfile');
  sel.innerHTML = '<option value="">当前配置</option>' +
    state.apiProfiles.map(p => `<option value="${p.id}" ${p.id === state.currentProfileId ? 'selected' : ''}>${p.name}</option>`).join('');
}

export function saveCurrentAsProfile() {
  const name = prompt('方案名称：');
  if (!name) return;
  const profile = {
    id: 'profile_' + Date.now(),
    name,
    provider: $('#setProvider').value,
    apiKey: $('#setApiKey').value,
    apiBase: $('#setApiBase').value,
    model: $('#setModel').value
  };
  state.apiProfiles.push(profile);
  state.currentProfileId = profile.id;
  saveState();
  renderProfileList();
  toast('方案已保存');
}

export function loadProfile(id) {
  if (!id) {
    state.currentProfileId = null;
    saveState();
    return;
  }
  const profile = state.apiProfiles.find(p => p.id === id);
  if (!profile) return;
  state.currentProfileId = id;
  state.settings.provider = profile.provider;
  state.settings.apiKey = profile.apiKey;
  state.settings.apiBase = profile.apiBase;
  state.settings.model = profile.model;
  $('#setProvider').value = profile.provider;
  $('#setApiKey').value = profile.apiKey;
  $('#setApiBase').value = profile.apiBase;
  $('#setModel').value = profile.model;
  saveState();
  toast('已加载方案: ' + profile.name);
}

export function deleteProfile() {
  if (!state.currentProfileId) { toast('请先选择一个方案', 'error'); return; }
  const profile = state.apiProfiles.find(p => p.id === state.currentProfileId);
  if (!profile) return;
  if (!confirm(`确定删除方案「${profile.name}」？`)) return;
  state.apiProfiles = state.apiProfiles.filter(p => p.id !== state.currentProfileId);
  state.currentProfileId = null;
  saveState();
  renderProfileList();
  toast('方案已删除');
}
