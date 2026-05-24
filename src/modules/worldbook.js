// ===== World Book =====
import { state } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';
import { openModal, closeModal } from './modals.js';

const $ = s => document.querySelector(s);

export function renderWorldBook() {
  const body = $('#wbBody');
  if (!state.worldBook.length) {
    body.innerHTML = '<div class="status-empty">世界书为空，添加条目来丰富你的世界</div>';
    return;
  }
  body.innerHTML = state.worldBook.map((entry, i) => `
    <div class="worldbook-entry" data-idx="${i}">
      <div class="worldbook-entry-header">
        <span class="worldbook-entry-title">${entry.name}</span>
        <div class="worldbook-entry-actions">
          <button class="wb-act" data-edit="${i}" title="编辑"><i class="fa fa-pencil"></i></button>
          <button class="wb-act del" data-del="${i}" title="删除"><i class="fa fa-trash-o"></i></button>
        </div>
      </div>
      <div class="worldbook-keywords">
        ${entry.keywords.map(k => `<span class="wb-kw">${k}</span>`).join('')}
        ${entry.always ? '<span class="wb-kw" style="background:var(--success-bg);color:var(--success);border-color:rgba(22,163,74,.15)">常驻</span>' : ''}
      </div>
      <div class="worldbook-content">${entry.content}</div>
    </div>
  `).join('');

  body.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openWbEditor(parseInt(btn.dataset.edit)));
  });
  body.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.worldBook.splice(parseInt(btn.dataset.del), 1);
      saveState();
      renderWorldBook();
      toast('条目已删除');
    });
  });
}

let editingWbIdx = null;

export function openWbEditor(idx) {
  editingWbIdx = idx != null ? idx : null;
  const entry = idx != null ? state.worldBook[idx] : null;
  $('#wbEditorTitle').textContent = entry ? '编辑条目' : '添加世界书条目';
  $('#wbeName').value = entry?.name || '';
  $('#wbeKeywords').value = entry?.keywords?.join(', ') || '';
  $('#wbeContent').value = entry?.content || '';
  $('#wbeAlways').checked = entry?.always || false;
  $('#wbeDelete').style.display = entry ? 'block' : 'none';
  openModal('wbEditorModal');
}

export function saveWbEntry() {
  const name = $('#wbeName').value.trim();
  if (!name) { toast('请输入条目名称', 'error'); return; }
  const data = {
    name,
    keywords: $('#wbeKeywords').value.split(',').map(k => k.trim()).filter(Boolean),
    content: $('#wbeContent').value.trim(),
    always: $('#wbeAlways').checked
  };
  if (editingWbIdx != null) {
    state.worldBook[editingWbIdx] = { ...state.worldBook[editingWbIdx], ...data };
  } else {
    state.worldBook.push(data);
  }
  saveState();
  renderWorldBook();
  closeModal('wbEditorModal');
  toast(editingWbIdx != null ? '条目已更新' : '条目已添加');
}

export function deleteWbEntry() {
  if (editingWbIdx != null) {
    state.worldBook.splice(editingWbIdx, 1);
    saveState();
    renderWorldBook();
    closeModal('wbEditorModal');
    toast('条目已删除');
  }
}
