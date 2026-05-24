// ===== Conversations =====
import { state, getStatusData } from './state.js';
import { saveState } from './persistence.js';
import { renderMessages } from './render.js';
import { renderStatus } from './status.js';
import { updateCharDisplay } from './characters.js';

const $ = s => document.querySelector(s);

export function createConv() {
  const char = state.characters.find(c => c.id === state.currentCharId);
  const conv = {
    id: 'conv_' + Date.now(),
    charId: state.currentCharId,
    charName: char ? char.name : '未选择角色',
    title: char ? `${char.name} 的对话` : '新对话',
    messages: [],
    summary: '',
    createdAt: Date.now()
  };
  if (char && char.greeting) {
    conv.messages.push({ role: 'assistant', content: char.greeting, name: char.name });
  }
  state.conversations.unshift(conv);
  state.currentConvId = conv.id;
  saveState();
  renderConvList();
  renderMessages();
  renderStatus();
}

export function deleteConv(id) {
  state.conversations = state.conversations.filter(c => c.id !== id);
  if (state.currentConvId === id) {
    state.currentConvId = state.conversations[0]?.id || null;
  }
  saveState();
  renderConvList();
  renderMessages();
}

export function switchConv(id) {
  state.currentConvId = id;
  const conv = state.conversations.find(c => c.id === id);
  if (conv && conv.charId) {
    state.currentCharId = conv.charId;
    updateCharDisplay();
  }
  saveState();
  renderConvList();
  renderMessages();
  renderStatus();
}

export function getCurrentConv() {
  return state.conversations.find(c => c.id === state.currentConvId);
}

export function renderConvList(filter = '') {
  const list = $('#convList');
  const filtered = filter
    ? state.conversations.filter(c => c.messages.some(m => m.content.toLowerCase().includes(filter.toLowerCase())))
    : state.conversations;
  if (!filtered.length) {
    list.innerHTML = `<div class="status-empty">${filter ? '没有匹配的对话' : '暂无对话'}</div>`;
    return;
  }
  list.innerHTML = filtered.map(c => {
    const char = state.characters.find(ch => ch.id === c.charId);
    const avatar = char ? char.avatar : '?';
    const title = filter ? c.title.replace(new RegExp(`(${filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>') : c.title;
    return `<div class="conv-item ${c.id === state.currentConvId ? 'active' : ''}" data-id="${c.id}">
      <div class="conv-icon" style="background:var(--primary-soft);color:var(--primary)">${avatar}</div>
      <span class="conv-name">${title}</span>
      <button class="conv-del" data-del="${c.id}"><i class="fa fa-times"></i></button>
    </div>`;
  }).join('');

  list.querySelectorAll('.conv-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.conv-del')) return;
      switchConv(el.dataset.id);
    });
    el.addEventListener('dblclick', e => {
      if (e.target.closest('.conv-del')) return;
      const id = el.dataset.id;
      const conv = state.conversations.find(c => c.id === id);
      if (!conv) return;
      const nameEl = el.querySelector('.conv-name');
      const oldTitle = conv.title;
      nameEl.contentEditable = true;
      nameEl.focus();
      const sel = window.getSelection();
      sel.selectAllChildren(nameEl);
      const finish = () => {
        nameEl.contentEditable = false;
        const newTitle = nameEl.textContent.trim();
        if (newTitle && newTitle !== oldTitle) {
          conv.title = newTitle;
          saveState();
        } else {
          nameEl.textContent = oldTitle;
        }
      };
      nameEl.addEventListener('blur', finish, { once: true });
      nameEl.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); nameEl.blur(); }
        if (ev.key === 'Escape') { nameEl.textContent = oldTitle; nameEl.blur(); }
      });
    });
  });
  list.querySelectorAll('.conv-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteConv(btn.dataset.del);
    });
  });
}
