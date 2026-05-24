// ===== Export / Import =====
import { state } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';
import { renderAll } from './render.js';

export function exportConversations() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roleplay-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('数据已导出');
}

export function importConversations(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      Object.assign(state, data);
      saveState();
      renderAll();
      toast('数据已导入');
    } catch (err) {
      toast('导入失败: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}
