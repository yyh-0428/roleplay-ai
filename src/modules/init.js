// ===== Initialization + Event Binding =====
import { state } from './state.js';
import { loadState, saveState } from './persistence.js';
import { applyTheme, cycleTheme } from './theme.js';
import { toast } from './toast.js';
import { createConv, renderConvList, getCurrentConv } from './conversations.js';
import { renderCharGrid, openCharEditor, saveChar, deleteChar, updateCharDisplay } from './characters.js';
import { renderWorldBook, openWbEditor, saveWbEntry, deleteWbEntry } from './worldbook.js';
import { renderStatus } from './status.js';
import { sendMessage } from './chat.js';
import { summarizeConversation } from './summary.js';
import { buildSystemPrompt } from './prompt.js';
import { openModal, closeModal } from './modals.js';
import { exportConversations, importConversations } from './export.js';
import { renderMessages, renderAll } from './render.js';
import { initMemory } from './memory.js';
import { PROVIDERS, renderModelList } from './providers.js';
import { renderProfileList, saveCurrentAsProfile, loadProfile, deleteProfile } from './profiles.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

export async function init() {
  await loadState();
  applyTheme(state.settings.theme);
  renderAll();
  initMemory();

  // Sidebar toggle
  $('#sidebarToggle').addEventListener('click', () => $('#sidebar').classList.toggle('collapsed'));
  $('#sidebarClose').addEventListener('click', () => $('#sidebar').classList.add('collapsed'));

  // Status panel toggle
  $('#statusToggle').addEventListener('click', () => $('#statusPanel').classList.toggle('collapsed'));
  $('#statusClose').addEventListener('click', () => $('#statusPanel').classList.add('collapsed'));

  // Summarize conversation button
  $('#summarizeBtn')?.addEventListener('click', async () => {
    const conv = getCurrentConv();
    if (!conv) { toast('请先选择一个对话', 'error'); return; }
    if (conv.messages.length < 6) { toast('对话内容太少，无需总结', 'error'); return; }
    await summarizeConversation(conv);
    renderMessages();
  });

  // New chat
  $('#newChatBtn').addEventListener('click', () => {
    if (!state.currentCharId) {
      openModal('charSelectModal');
      renderCharGrid();
    } else {
      createConv();
    }
  });

  // Chat form
  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); sendMessage(); });

  // Textarea auto-resize
  $('#messageInput').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  // Enter to send (Shift+Enter for newline)
  $('#messageInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Stop button
  $('#stopBtn').addEventListener('click', () => {
    if (state.abortController) state.abortController.abort();
  });

  // Theme
  $('#themeBtn').addEventListener('click', cycleTheme);

  // Character select
  $('#charSelectBtn').addEventListener('click', () => { renderCharGrid(); openModal('charSelectModal'); });
  $('#charSelectClose').addEventListener('click', () => closeModal('charSelectModal'));

  // Character editor
  $('#charEditorClose').addEventListener('click', () => closeModal('charEditorModal'));
  $('#ceCancel').addEventListener('click', () => closeModal('charEditorModal'));
  $('#ceSave').addEventListener('click', saveChar);
  $('#ceDelete').addEventListener('click', deleteChar);

  // World book
  $('#worldBookBtn').addEventListener('click', () => { renderWorldBook(); openModal('worldBookModal'); });
  $('#wbClose').addEventListener('click', () => closeModal('worldBookModal'));
  $('#wbAddBtn').addEventListener('click', () => openWbEditor());

  // World book editor
  $('#wbEditorClose').addEventListener('click', () => closeModal('wbEditorModal'));
  $('#wbeCancel').addEventListener('click', () => closeModal('wbEditorModal'));
  $('#wbeSave').addEventListener('click', saveWbEntry);
  $('#wbeDelete').addEventListener('click', deleteWbEntry);

  // Settings
  $('#settingsBtn').addEventListener('click', () => {
    const provider = state.settings.provider || 'deepseek';
    $('#setProvider').value = provider;
    $('#setApiKey').value = state.settings.apiKey;
    $('#setApiBase').value = state.settings.apiBase;
    $('#setModel').value = state.settings.model;
    $('#setTemp').value = state.settings.temperature;
    $('#setMaxTokens').value = state.settings.maxTokens;
    $('#setTopP').value = state.settings.topP;
    $('#setTheme').value = state.settings.theme;
    $('#setFontSize').value = state.settings.fontSize;
    const p = PROVIDERS[provider];
    if ($('#setApiBaseRow')) $('#setApiBaseRow').style.display = provider === 'custom' ? '' : 'none';
    if ($('#modelHint')) $('#modelHint').textContent = p?.hint || '';
    renderProfileList();
    openModal('settingsModal');
  });
  $('#settingsClose').addEventListener('click', () => closeModal('settingsModal'));

  // Provider change
  $('#setProvider').addEventListener('change', function () {
    const provider = this.value;
    const p = PROVIDERS[provider];
    if ($('#setApiBaseRow')) $('#setApiBaseRow').style.display = provider === 'custom' ? '' : 'none';
    if ($('#modelHint')) $('#modelHint').textContent = p?.hint || '';
    if ($('#setApiKey')) $('#setApiKey').placeholder = provider === 'ollama' ? '无需 API Key' : 'sk-...';
    if ($('#modelListGroup')) $('#modelListGroup').style.display = 'none';
    if ($('#modelList')) $('#modelList').innerHTML = '';
    if (p?.baseUrl && provider !== 'custom') {
      $('#setApiBase').value = p.baseUrl;
    }
  });

  // Fetch models
  $('#fetchModelsBtn').addEventListener('click', async () => {
    const provider = $('#setProvider').value;
    const p = PROVIDERS[provider];
    if (!p) { toast('请先选择模型厂商', 'error'); return; }
    const apiKey = $('#setApiKey').value.trim();
    if (p.modelsUrl && provider !== 'ollama' && !apiKey && provider !== 'custom') {
      toast('请先填写 API Key', 'error');
      return;
    }
    const btn = $('#fetchModelsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    try {
      let models = [];
      if (p.modelsUrl) {
        const baseUrl = provider === 'custom' ? $('#setApiBase').value.trim() : p.baseUrl;
        const headers = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const resp = await fetch(baseUrl + p.modelsUrl, { headers });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        models = (data.data || data.models || []).map(m => m.id || m.name).filter(Boolean).sort();
      }
      if (!models.length && p.models) models = p.models;
      if (!models.length) throw new Error('未找到可用模型');
      renderModelList(models, state.settings.model);
      toast(`已获取 ${models.length} 个模型`);
    } catch (err) {
      toast('获取失败: ' + err.message, 'error');
      if (p.models) renderModelList(p.models, state.settings.model);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-refresh"></i> 获取';
    }
  });

  // API Profiles
  $('#setProfile').addEventListener('change', function () { loadProfile(this.value); });
  $('#saveProfileBtn').addEventListener('click', saveCurrentAsProfile);
  $('#deleteProfileBtn').addEventListener('click', deleteProfile);

  $('#settingsSave').addEventListener('click', () => {
    const provider = $('#setProvider').value;
    const p = PROVIDERS[provider];
    state.settings.provider = provider;
    state.settings.apiKey = $('#setApiKey').value.trim();
    state.settings.apiBase = provider === 'custom' ? ($('#setApiBase').value.trim() || '') : (p?.baseUrl || '');
    state.settings.model = $('#setModel').value.trim() || 'gpt-4o';
    state.settings.temperature = parseFloat($('#setTemp').value) || 0.9;
    state.settings.maxTokens = parseInt($('#setMaxTokens').value) || 2048;
    state.settings.topP = parseFloat($('#setTopP').value) || 0.95;
    state.settings.fontSize = parseFloat($('#setFontSize').value) || 0.88;
    applyTheme($('#setTheme').value);
    document.documentElement.style.setProperty('--msg-font-size', state.settings.fontSize + 'rem');
    saveState();
    closeModal('settingsModal');
    toast('设置已保存');
  });

  // Narrative / OOC mode
  $('#narrativeBtn').addEventListener('click', function () {
    state.settings.narrativeMode = !state.settings.narrativeMode;
    this.classList.toggle('active', state.settings.narrativeMode);
    saveState();
    toast(state.settings.narrativeMode ? '叙事模式已开启' : '叙事模式已关闭');
  });
  $('#oocBtn').addEventListener('click', function () {
    state.settings.oocMode = !state.settings.oocMode;
    this.classList.toggle('active', state.settings.oocMode);
    saveState();
    toast(state.settings.oocMode ? 'OOC 模式已开启' : 'OOC 模式已关闭');
  });

  // Clear chat
  $('#clearChatBtn').addEventListener('click', () => {
    const conv = getCurrentConv();
    if (!conv) return;
    if (!confirm('确定清空当前对话？')) return;
    conv.messages = [];
    if (conv.charId) {
      const char = state.characters.find(c => c.id === conv.charId);
      if (char?.greeting) conv.messages.push({ role: 'assistant', content: char.greeting, name: char.name });
    }
    saveState();
    renderMessages();
    toast('对话已清空');
  });

  // Export & Import
  $('#exportBtn').addEventListener('click', exportConversations);
  $('#importBtn').addEventListener('click', () => $('#importFileInput').click());

  // Search
  let searchTimeout;
  $('#searchInput').addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderConvList(e.target.value.trim()), 200);
  });

  // Bottom nav
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = btn.dataset.panel;
      if (panel === 'status') {
        $('#statusPanel').classList.remove('collapsed');
        renderStatus();
      } else if (panel === 'chars') {
        renderCharGrid();
        openModal('charSelectModal');
      } else if (panel === 'world') {
        renderWorldBook();
        openModal('worldBookModal');
      } else {
        $('#statusPanel').classList.add('collapsed');
      }
    });
  });

  // Close modals on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });
  $('#worldBookModal').addEventListener('click', e => {
    if (e.target.id === 'worldBookModal') closeModal('worldBookModal');
  });

  // Settings export/import
  $('#exportAllBtn').addEventListener('click', exportConversations);
  $('#importAllBtn').addEventListener('click', () => $('#importFileInput').click());
  $('#importFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      if (confirm('导入将覆盖当前所有数据，确定继续？')) {
        importConversations(file);
      }
    }
    e.target.value = '';
  });

  // Apply font size
  if (state.settings.fontSize) {
    document.documentElement.style.setProperty('--msg-font-size', state.settings.fontSize + 'rem');
  }

  // Set initial narrative/ooc button states
  if (state.settings.narrativeMode) $('#narrativeBtn').classList.add('active');
  if (state.settings.oocMode) $('#oocBtn').classList.add('active');

  // System prompt preview
  $('#promptPreviewBtn').addEventListener('click', () => {
    const conv = getCurrentConv();
    const prompt = buildSystemPrompt(conv);
    $('#promptPreviewContent').textContent = prompt || '（未选择角色，无系统提示词）';
    openModal('promptPreviewModal');
  });
  $('#promptPreviewClose').addEventListener('click', () => closeModal('promptPreviewModal'));
  $('#promptPreviewCloseBtn').addEventListener('click', () => closeModal('promptPreviewModal'));
  $('#promptPreviewCopy').addEventListener('click', () => {
    navigator.clipboard.writeText($('#promptPreviewContent').textContent);
    toast('已复制系统提示词');
  });

  // Empty state buttons
  $('#emptySelectCharBtn')?.addEventListener('click', () => { renderCharGrid(); openModal('charSelectModal'); });
  $('#emptyCreateCharBtn')?.addEventListener('click', () => openCharEditor());
  $('#emptySettingsBtn')?.addEventListener('click', () => $('#settingsBtn').click());

  // Scroll to top button
  const messagesContainer = $('#messages');
  const scrollTopBtn = $('#scrollTopBtn');
  if (messagesContainer && scrollTopBtn) {
    messagesContainer.addEventListener('scroll', () => {
      if (messagesContainer.scrollTop > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });
    scrollTopBtn.addEventListener('click', () => {
      messagesContainer.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Voice input (Web Speech API)
  initVoiceInput();

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal-overlay.show').forEach(m => m.classList.remove('show'));
      closeModal('worldBookModal');
      closeModal('promptPreviewModal');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (!state.currentCharId) {
        openModal('charSelectModal');
        renderCharGrid();
      } else {
        createConv();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      renderCharGrid();
      openModal('charSelectModal');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      $('#sidebar').classList.toggle('collapsed');
    }
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function initVoiceInput() {
  const voiceBtn = $('#voiceBtn');
  if (!voiceBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return; // Not supported, button stays hidden

  voiceBtn.style.display = ''; // Show button

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  let isRecording = false;

  voiceBtn.addEventListener('click', () => {
    if (isRecording) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      isRecording = true;
      voiceBtn.classList.add('recording');
    } catch (e) {
      toast('语音识别启动失败', 'error');
    }
  });

  recognition.onresult = (event) => {
    const input = $('#messageInput');
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    input.value = transcript;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  };

  recognition.onend = () => {
    isRecording = false;
    voiceBtn.classList.remove('recording');
  };

  recognition.onerror = (event) => {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    if (event.error !== 'aborted') {
      toast('语音识别错误: ' + event.error, 'error');
    }
  };
}
