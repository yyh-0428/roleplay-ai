// ===== Status Panel =====
import { state, getStatusData } from './state.js';
import { saveState } from './persistence.js';

const $ = s => document.querySelector(s);

export function renderStatus() {
  const body = $('#statusBody');
  const sections = [
    { key: 'world', title: '世界状态', icon: 'fa-globe', color: '#7c3aed' },
    { key: 'character', title: '角色状态', icon: 'fa-heartbeat', color: '#ef4444' },
    { key: 'inventory', title: '物品栏', icon: 'fa-briefcase', color: '#f59e0b' },
    { key: 'custom', title: '自定义', icon: 'fa-sliders', color: '#16a34a' }
  ];

  body.innerHTML = sections.map(sec => {
    const items = getStatusData()[sec.key] || [];
    return `<div class="status-section">
      <div class="status-section-header">
        <span class="status-section-title"><i class="fa ${sec.icon}"></i> ${sec.title}</span>
        <button class="status-add-btn" data-add-section="${sec.key}" title="添加"><i class="fa fa-plus"></i></button>
      </div>
      ${items.length ? items.map((item, i) => `
        <div class="status-card" data-section="${sec.key}" data-idx="${i}" style="border-left:3px solid ${item.color || 'var(--border)'}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div class="status-card-label" contenteditable="true" data-field="label" style="cursor:text">${item.label}</div>
            <input type="color" value="${item.color || '#7c3aed'}" data-field="color" style="width:18px;height:18px;border:none;border-radius:4px;cursor:pointer;background:none;padding:0" title="修改颜色">
          </div>
          ${item.type === 'bar' ? `
            <div style="display:flex;align-items:center;gap:6px">
              <button class="status-bar-btn" data-adjust="-10" title="-10"><i class="fa fa-minus"></i></button>
              <button class="status-bar-btn" data-adjust="-1" title="-1">-</button>
              <span class="status-card-value" contenteditable="true" data-field="value">${item.value}/${item.max}</span>
              <button class="status-bar-btn" data-adjust="1" title="+1">+</button>
              <button class="status-bar-btn" data-adjust="10" title="+10"><i class="fa fa-plus"></i></button>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" style="width:${item.max ? (item.value/item.max)*100 : 0}%;background:${item.color}"></div>
            </div>
          ` : `
            <div class="status-card-value" contenteditable="true" data-field="value">${item.value}</div>
          `}
          <button class="status-card-del" data-del-section="${sec.key}" data-del-idx="${i}"><i class="fa fa-times"></i></button>
        </div>
      `).join('') : '<div class="status-empty">点击 + 添加</div>'}
    </div>`;
  }).join('');

  // Event: inline edit (label or value)
  body.querySelectorAll('[contenteditable]').forEach(el => {
    el.addEventListener('blur', () => {
      const card = el.closest('.status-card');
      if (!card) return;
      const sec = card.dataset.section;
      const idx = parseInt(card.dataset.idx);
      const item = getStatusData()[sec]?.[idx];
      if (!item) return;
      const field = el.dataset.field;
      if (field === 'label') {
        item.label = el.textContent.trim() || item.label;
      } else if (field === 'value') {
        if (item.type === 'bar') {
          const parts = el.textContent.split('/');
          item.value = parseInt(parts[0]) || 0;
          if (parts[1]) item.max = parseInt(parts[1]) || 100;
        } else {
          item.value = el.textContent;
        }
      }
      saveState();
      renderStatus();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });
  });

  // Event: color change
  body.querySelectorAll('input[type="color"]').forEach(input => {
    input.addEventListener('input', () => {
      const card = input.closest('.status-card');
      if (!card) return;
      const sec = card.dataset.section;
      const idx = parseInt(card.dataset.idx);
      const item = getStatusData()[sec]?.[idx];
      if (!item) return;
      item.color = input.value;
      saveState();
      card.style.borderLeftColor = input.value;
      const fill = card.querySelector('.status-bar-fill');
      if (fill) fill.style.background = input.value;
    });
  });

  // Event: +/- buttons for bar items
  body.querySelectorAll('.status-bar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.status-card');
      if (!card) return;
      const sec = card.dataset.section;
      const idx = parseInt(card.dataset.idx);
      const item = getStatusData()[sec]?.[idx];
      if (!item || item.type !== 'bar') return;
      const delta = parseInt(btn.dataset.adjust) || 0;
      item.value = Math.max(0, Math.min(item.max || 100, item.value + delta));
      saveState();
      renderStatus();
    });
  });

  // Event: delete
  body.querySelectorAll('[data-del-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.delSection;
      const idx = parseInt(btn.dataset.delIdx);
      getStatusData()[sec].splice(idx, 1);
      saveState();
      renderStatus();
    });
  });

  // Event: add
  body.querySelectorAll('[data-add-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.addSection;
      const newItem = { id: sec + '_' + Date.now(), label: '新项目', value: '点击编辑', color: '#7c3aed' };
      if (sec === 'character') {
        newItem.value = '100';
        newItem.max = 100;
        newItem.type = 'bar';
      }
      getStatusData()[sec].push(newItem);
      saveState();
      renderStatus();
    });
  });
}
