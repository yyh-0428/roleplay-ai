// ===== Memory Panel Logic =====
import { state } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';
import { getCurrentConv } from './conversations.js';

const $ = s => document.querySelector(s);

export function initMemory() {
  const memoryBtn = $('#memoryBtn');
  const memoryPanel = $('#memoryPanel');
  const saveMemoryBtn = $('#saveMemoryBtn');
  const memoryConflictAlert = $('#memoryConflictAlert');
  const hasAnyMemory = state.globalCoreMemory || state.globalNotes || Object.values(state.characterCoreMemories).some(v => v) || Object.values(state.characterNotes).some(v => v);
  if (memoryBtn) memoryBtn.addEventListener('click', () => { if (memoryPanel) memoryPanel.classList.toggle('open'); });
  if (memoryPanel && !hasAnyMemory) memoryPanel.classList.remove('open');

  // Tier tab switching
  document.querySelectorAll('.memory-tier-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tier = tab.dataset.tier;
      const parent = tab.closest('#charMemorySection') || tab.parentElement.parentElement;
      parent.querySelectorAll('.memory-tier-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isGlobal = tier.startsWith('global');
      const isNotes = tier.endsWith('Notes');
      if (isGlobal) {
        $('#globalCoreMemoryInput').style.display = isNotes ? 'none' : '';
        $('#globalNotesInput').style.display = isNotes ? '' : 'none';
        $('#globalNotesActions').style.display = isNotes ? '' : 'none';
      } else {
        $('#charCoreMemoryInput').style.display = isNotes ? 'none' : '';
        $('#charNotesInput').style.display = isNotes ? '' : 'none';
        $('#charNotesActions').style.display = isNotes ? '' : 'none';
      }
    });
  });

  function promoteToCore(coreInput, notesInput) {
    const notes = notesInput?.value.trim() || '';
    if (!notes) { toast('临时笔记为空', 'error'); return; }
    const core = coreInput?.value.trim() || '';
    coreInput.value = core ? core + '\n' + notes : notes;
    notesInput.value = '';
    toast('已提升为核心记忆');
  }

  $('#globalPromoteBtn')?.addEventListener('click', () => {
    promoteToCore($('#globalCoreMemoryInput'), $('#globalNotesInput'));
    state.globalCoreMemory = $('#globalCoreMemoryInput')?.value.trim() || '';
    state.globalNotes = '';
    state.globalMemory = [state.globalCoreMemory, state.globalNotes].filter(Boolean).join('\n');
    saveState();
  });
  $('#charPromoteBtn')?.addEventListener('click', () => {
    if (!state.currentCharId) return;
    promoteToCore($('#charCoreMemoryInput'), $('#charNotesInput'));
    state.characterCoreMemories[state.currentCharId] = $('#charCoreMemoryInput')?.value.trim() || '';
    state.characterNotes[state.currentCharId] = '';
    state.characterMemories[state.currentCharId] = [state.characterCoreMemories[state.currentCharId], state.characterNotes[state.currentCharId]].filter(Boolean).join('\n');
    saveState();
  });

  function clearNotes(notesInput) {
    if (!notesInput?.value.trim()) { toast('笔记已为空'); return; }
    notesInput.value = '';
    toast('临时笔记已清空');
  }

  $('#globalClearNotesBtn')?.addEventListener('click', () => {
    clearNotes($('#globalNotesInput'));
    state.globalNotes = '';
    state.globalMemory = [state.globalCoreMemory, state.globalNotes].filter(Boolean).join('\n');
    saveState();
  });
  $('#charClearNotesBtn')?.addEventListener('click', () => {
    if (!state.currentCharId) return;
    clearNotes($('#charNotesInput'));
    state.characterNotes[state.currentCharId] = '';
    state.characterMemories[state.currentCharId] = [state.characterCoreMemories[state.currentCharId], state.characterNotes[state.currentCharId]].filter(Boolean).join('\n');
    saveState();
  });

  // Load tier values
  const gci = $('#globalCoreMemoryInput');
  const gni = $('#globalNotesInput');
  if (gci) gci.value = state.globalCoreMemory || '';
  if (gni) gni.value = state.globalNotes || '';

  if (saveMemoryBtn) saveMemoryBtn.addEventListener('click', () => {
    const gci = $('#globalCoreMemoryInput');
    const gni = $('#globalNotesInput');
    if (gci) state.globalCoreMemory = gci.value.trim();
    if (gni) state.globalNotes = gni.value.trim();
    state.globalMemory = [state.globalCoreMemory, state.globalNotes].filter(Boolean).join('\n');
    if (state.currentCharId) {
      const cci = $('#charCoreMemoryInput');
      const cni = $('#charNotesInput');
      if (cci) state.characterCoreMemories[state.currentCharId] = cci.value.trim();
      if (cni) state.characterNotes[state.currentCharId] = cni.value.trim();
      state.characterMemories[state.currentCharId] = [state.characterCoreMemories[state.currentCharId], state.characterNotes[state.currentCharId]].filter(Boolean).join('\n');
    }
    saveState();
    toast('记忆已保存');
    if (memoryConflictAlert) memoryConflictAlert.classList.remove('show');
  });

  // Extract memory from conversation
  const extractMemoryBtn = $('#extractMemoryBtn');
  if (extractMemoryBtn) extractMemoryBtn.addEventListener('click', async () => {
    const conv = getCurrentConv();
    if (!conv || conv.messages.length < 2) { toast('对话内容太少，无法提取记忆', 'error'); return; }
    const recentMsgs = conv.messages.slice(-10).map(m => `${m.role === 'user' ? '用户' : m.name || 'AI'}：${m.content.slice(0, 200)}`).join('\n');
    const extractPrompt = `分析以下对话，提取关于用户的关键信息（姓名、偏好、重要事件、关系等），用简洁的条目格式输出，每条一行。不要输出对话内容本身，只输出提取的事实。\n\n对话内容：\n${recentMsgs}`;
    try {
      toast('正在提取记忆...', 'info');
      const resp = await fetch(`${state.settings.apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.settings.apiKey}` },
        body: JSON.stringify({ model: state.settings.model, messages: [{ role: 'user', content: extractPrompt }], temperature: 0.3, max_tokens: 500 })
      });
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      const extracted = data.choices?.[0]?.message?.content?.trim();
      if (extracted) {
        const existing = state.globalNotes || '';
        state.globalNotes = existing ? existing + '\n' + extracted : extracted;
        state.globalMemory = [state.globalCoreMemory, state.globalNotes].filter(Boolean).join('\n');
        const gni = $('#globalNotesInput');
        if (gni) gni.value = state.globalNotes;
        if (state.currentCharId) {
          const charExisting = state.characterNotes[state.currentCharId] || '';
          state.characterNotes[state.currentCharId] = charExisting ? charExisting + '\n' + extracted : extracted;
          state.characterMemories[state.currentCharId] = [state.characterCoreMemories[state.currentCharId], state.characterNotes[state.currentCharId]].filter(Boolean).join('\n');
          const cni = $('#charNotesInput');
          if (cni) cni.value = state.characterNotes[state.currentCharId];
        }
        saveState();
        toast('记忆已提取到临时笔记');
      }
    } catch (e) { toast('提取失败: ' + e.message, 'error'); }
  });

  // Close memory panel when clicking outside
  document.addEventListener('click', (e) => {
    if (memoryPanel?.classList.contains('open') && !memoryPanel.contains(e.target) && e.target !== memoryBtn && !memoryBtn?.contains(e.target)) {
      memoryPanel.classList.remove('open');
    }
  });
}
