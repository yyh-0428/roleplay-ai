// ===== Chat Core: send, stream, status parse =====
import { state, getStatusData } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';
import { buildSystemPrompt, buildWorldBookInjection } from './prompt.js';
import { renderMessages } from './render.js';
import { renderStatus } from './status.js';
import { getCurrentConv, createConv } from './conversations.js';
import { summarizeConversation, SUMMARY_THRESHOLD } from './summary.js';
import { renderMarkdown } from './markdown.js';

const $ = s => document.querySelector(s);

export function parseStatusFromReply(text) {
  const regex = /```(?:python)?\s*\n([\s\S]*?)```/g;
  let match;
  let blockFound = false;
  while ((match = regex.exec(text)) !== null) {
    blockFound = true;
    const block = match[1];
    const lines = block.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    for (const line of lines) {
      let colonIdx = line.indexOf('：');
      let colonChar = '：';
      if (colonIdx === -1) {
        colonIdx = line.indexOf(':');
        colonChar = ':';
      }
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (!key || !val) continue;

      let found = false;
      for (const secKey of ['world', 'character', 'inventory', 'custom']) {
        const items = getStatusData()[secKey];
        if (!items) continue;
        const item = items.find(i => i.label === key);
        if (item) {
          if (item.type === 'bar' && val.includes('/')) {
            const [v, m] = val.split('/');
            item.value = parseInt(v) || item.value;
            item.max = parseInt(m) || item.max;
          } else {
            item.value = val;
          }
          found = true;
          break;
        }
      }

      if (!found) {
        const isBar = val.includes('/') && /^\d+\/\d+$/.test(val);
        const newItem = {
          id: 'auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          label: key,
          value: isBar ? parseInt(val.split('/')[0]) || 0 : val,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        };
        if (isBar) {
          newItem.max = parseInt(val.split('/')[1]) || 100;
          newItem.type = 'bar';
        }
        let targetSec = 'custom';
        if (['时间', '地点', '场景', '天气', '主角情绪'].includes(key)) targetSec = 'world';
        else if (key.includes('好感') || key.includes('欲望') || /（/.test(key)) targetSec = 'character';
        else if (['穿着', '发型', '配饰', '主角穿着'].includes(key)) targetSec = 'inventory';
        getStatusData()[targetSec].push(newItem);
      }
    }
  }
  return blockFound;
}

export async function sendMessage() {
  const input = $('#messageInput');
  const text = input.value.trim();
  if (!text || state.streaming) return;

  let conv = getCurrentConv();
  if (!conv) {
    createConv();
    conv = getCurrentConv();
  }
  if (!conv) return;

  let finalText = text;
  if (state.settings.oocMode) {
    finalText = `(OOC: ${text})`;
  }

  conv.messages.push({ role: 'user', content: finalText });
  input.value = '';
  input.style.height = 'auto';
  renderMessages();
  saveState();

  const systemPrompt = buildSystemPrompt(conv);
  const wbInjection = buildWorldBookInjection(text);

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt + wbInjection });

  if (conv.summary) {
    messages.push({ role: 'system', content: `【之前对话摘要】\n${conv.summary}` });
  }

  const history = conv.messages.slice(-20);
  history.forEach(m => {
    messages.push({ role: m.role, content: m.content });
  });

  if (state.settings.narrativeMode) {
    messages.push({ role: 'system', content: '【叙事模式】当前为叙事模式，请用第三人称叙述视角推进剧情，重点描写环境、氛围和角色动作。' });
  }

  state.streaming = true;
  $('#sendBtn').style.display = 'none';
  $('#stopBtn').style.display = 'flex';
  showTyping();

  try {
    state.abortController = new AbortController();
    const response = await fetch(`${state.settings.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.settings.apiKey}`
      },
      body: JSON.stringify({
        model: state.settings.model,
        messages,
        temperature: state.settings.temperature,
        max_tokens: state.settings.maxTokens,
        top_p: state.settings.topP,
        stream: true
      }),
      signal: state.abortController.signal
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API 错误 (${response.status}): ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMsg = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            assistantMsg += delta;
            updateStreamingMessage(assistantMsg);
          }
        } catch (e) {}
      }
    }

    conv.messages.push({ role: 'assistant', content: assistantMsg, name: conv.charName });
    const blockFound = parseStatusFromReply(assistantMsg);
    state.needsStatusReminder = !blockFound;
    saveState();
    renderMessages();
    renderStatus();

    if (conv.messages.length >= SUMMARY_THRESHOLD) {
      summarizeConversation(conv);
    }

  } catch (err) {
    const streamingEl = $('#messages')?.querySelector('.streaming-msg');
    if (streamingEl) streamingEl.remove();

    if (err.name === 'AbortError') {
      toast('已停止生成');
    } else {
      toast(err.message, 'error');
      conv.messages.pop();
      saveState();
      renderMessages();
    }
  } finally {
    state.streaming = false;
    state.abortController = null;
    $('#sendBtn').style.display = '';
    $('#stopBtn').style.display = 'none';
    hideTyping();
    const cursor = $('#messages')?.querySelector('.streaming-cursor');
    if (cursor) cursor.classList.remove('streaming-cursor');
  }
}

function showTyping() {
  const container = $('#messages');
  const existing = container.querySelector('.typing-wrapper');
  if (existing) return;
  const div = document.createElement('div');
  div.className = 'msg ai typing-wrapper';
  const conv = getCurrentConv();
  const char = state.characters.find(c => c.id === (conv?.charId || state.currentCharId));
  div.innerHTML = `
    <div class="msg-avatar" style="background:var(--primary-soft);color:var(--primary)">${char?.avatar || '?'}</div>
    <div class="msg-bubble" style="background:var(--surface);border:1px solid var(--border)">
      <div class="typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  const el = $('#messages')?.querySelector('.typing-wrapper');
  if (el) el.remove();
}

function updateStreamingMessage(text) {
  const container = $('#messages');
  let wrapper = container.querySelector('.streaming-msg');
  if (!wrapper) {
    hideTyping();
    const conv = getCurrentConv();
    const char = state.characters.find(c => c.id === (conv?.charId || state.currentCharId));
    wrapper = document.createElement('div');
    wrapper.className = 'msg ai streaming-msg';
    wrapper.innerHTML = `
      <div class="msg-avatar" style="background:var(--primary-soft);color:var(--primary)">${char?.avatar || '?'}</div>
      <div>
        <div class="msg-name">${char?.name || 'AI'}</div>
        <div class="msg-bubble"><div class="markdown-content"></div></div>
      </div>
    `;
    container.appendChild(wrapper);
  }
  const content = wrapper.querySelector('.markdown-content');
  content.innerHTML = renderMarkdown(text);
  content.classList.add('streaming-cursor');
  container.scrollTop = container.scrollHeight;
}
