// ===== Message Rendering =====
import { state } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';
import { renderMarkdown } from './markdown.js';
import { sendMessage } from './chat.js';
import { getCurrentConv, renderConvList } from './conversations.js';
import { updateCharDisplay, renderCharGrid } from './characters.js';
import { renderStatus } from './status.js';
import { renderWorldBook } from './worldbook.js';

const $ = s => document.querySelector(s);

function createEmptyState() {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.id = 'emptyState';
  div.innerHTML = '<i class="fa fa-magic"></i><p>选择一个角色开始冒险</p><p class="sub">点击左上角选择角色，或创建你自己的角色</p>';
  return div;
}

export function renderMessages() {
  const container = $('#messages');
  const conv = getCurrentConv();

  const empty = $('#emptyState') || createEmptyState();
  Array.from(container.children).forEach(child => {
    if (child !== empty) child.remove();
  });

  if (!conv || !conv.messages.length) {
    empty.style.display = '';
    if (!empty.parentElement) container.appendChild(empty);
    return;
  }

  empty.style.display = 'none';

  if (conv.summary) {
    const summaryHtml = `<div class="msg summary-indicator">
      <div class="msg-avatar" style="background:var(--primary-soft);color:var(--primary)"><i class="fa fa-compress"></i></div>
      <div>
        <div class="msg-name" style="color:var(--ink-muted)">对话摘要</div>
        <div class="msg-bubble" style="background:var(--primary-soft);border:1px dashed var(--primary)">
          <div class="markdown-content" style="font-size:.8rem;color:var(--ink-2)">${renderMarkdown(conv.summary)}</div>
        </div>
      </div>
    </div>`;
    container.insertAdjacentHTML('beforeend', summaryHtml);
  }

  const msgsHtml = conv.messages.map((m, i) => {
    const isUser = m.role === 'user';
    const char = state.characters.find(c => c.id === conv.charId);
    const name = isUser ? '你' : (m.name || char?.name || 'AI');
    const avatar = isUser ? '你' : (char?.avatar || '?');
    return `<div class="msg ${isUser ? 'user' : 'ai'}">
      <div class="msg-avatar" style="${isUser ? 'background:var(--primary);color:#fff' : 'background:var(--primary-soft);color:var(--primary)'}">${avatar}</div>
      <div>
        <div class="msg-name">${name}</div>
        <div class="msg-bubble">
          <div class="markdown-content">${renderMarkdown(m.content)}</div>
          <div class="msg-actions">
            <button class="msg-act" data-copy="${i}"><i class="fa fa-copy"></i></button>
            <button class="msg-act" data-regen="${i}"><i class="fa fa-refresh"></i></button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  container.insertAdjacentHTML('beforeend', msgsHtml);

  // Copy buttons
  container.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.copy);
      navigator.clipboard.writeText(conv.messages[idx].content);
      toast('已复制');
    });
  });

  // Regen buttons
  container.querySelectorAll('[data-regen]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.regen);
      if (conv.messages[idx].role !== 'assistant' || state.streaming) return;
      conv.messages.splice(idx);
      saveState();
      renderMessages();
      await sendMessage();
    });
  });

  container.scrollTop = container.scrollHeight;
}

export function renderAll() {
  renderConvList();
  updateCharDisplay();
  renderCharGrid();
  renderStatus();
  renderWorldBook();
  renderMessages();
}
