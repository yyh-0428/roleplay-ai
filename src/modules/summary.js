// ===== Conversation Summary =====
import { state } from './state.js';
import { saveState } from './persistence.js';
import { toast } from './toast.js';

export const SUMMARY_THRESHOLD = 30;
export const SUMMARY_KEEP = 10;

export async function summarizeConversation(conv) {
  if (!conv || conv.messages.length < SUMMARY_THRESHOLD) return false;
  const char = state.characters.find(c => c.id === conv.charId);
  const charName = char ? char.name : '角色';
  const toSummarize = conv.messages.slice(0, -SUMMARY_KEEP);
  const summaryInput = toSummarize.map(m => {
    const speaker = m.role === 'user' ? '用户' : (m.name || charName);
    return `${speaker}：${m.content.slice(0, 300)}`;
  }).join('\n');

  const summaryPrompt = `请用简洁的中文总结以下对话的关键信息（人物、事件、情感、重要决定等），控制在200字以内，保留所有对后续剧情重要的细节。不要添加对话中没有的信息。\n\n对话内容：\n${summaryInput}`;

  try {
    const resp = await fetch(`${state.settings.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.settings.apiKey}` },
      body: JSON.stringify({ model: state.settings.model, messages: [{ role: 'user', content: summaryPrompt }], temperature: 0.3, max_tokens: 500 })
    });
    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();
    if (newSummary) {
      conv.summary = conv.summary ? conv.summary + '\n' + newSummary : newSummary;
      conv.messages = conv.messages.slice(-SUMMARY_KEEP);
      saveState();
      toast('对话已自动总结');
      return true;
    }
  } catch (e) { console.error('Summarize failed:', e); }
  return false;
}
