// ===== System Prompt Builder + World Book Injection =====
import { state, getStatusData } from './state.js';

export function buildSystemPrompt(conv) {
  const char = state.characters.find(c => c.id === (conv?.charId || state.currentCharId));
  if (!char) return '';

  let prompt = char.systemPrompt;
  if (!prompt) {
    prompt = `你是 ${char.name}，一个虚构世界的角色。

【人格】${char.personality}

【背景】${char.backstory}

【说话风格】${char.speechStyle}

【规则】
- 始终保持角色扮演，不要打破角色
- 用生动的描写和对话推进故事
- 用 *星号* 包裹动作和描写，用普通文字表示对话
- 回复要详细、有沉浸感，但不要过于冗长
- 根据用户的输入做出合理的角色反应
- 可以适当推进剧情，但要尊重用户的行动选择`;
  }

  // Inject world book entries (always-on)
  const alwaysEntries = state.worldBook.filter(e => e.always && e.content);
  if (alwaysEntries.length) {
    prompt += '\n\n【世界设定】\n' + alwaysEntries.map(e => `${e.name}：${e.content}`).join('\n');
  }

  // Inject status as Python code block
  const allSections = [];
  const statusData = getStatusData();
  const worldItems = (statusData.world || []).filter(i => i.value);
  const charItems = (statusData.character || []).filter(i => i.value);
  const invItems = (statusData.inventory || []).filter(i => i.value);
  const customItems = (statusData.custom || []).filter(i => i.value);

  if (worldItems.length || charItems.length || invItems.length || customItems.length) {
    let pythonBlock = '\n\n以下是当前最新的互动状态信息，请根据这些信息回复并更新：\n```\n# 更新互动信息\n';
    worldItems.forEach(i => { pythonBlock += `${i.label}：${i.value}\n`; });
    charItems.forEach(i => {
      pythonBlock += `${i.label}：${i.type === 'bar' ? i.value + '/' + i.max : i.value}\n`;
    });
    invItems.forEach(i => { pythonBlock += `${i.label}：${i.value}\n`; });
    customItems.forEach(i => { pythonBlock += `${i.label}：${i.value}\n`; });
    pythonBlock += '```\n\n请在回复末尾用同样的 python 代码块格式更新状态信息。';
    prompt += pythonBlock;
  }

  // Add reminder if previous reply was missing status block
  if (state.needsStatusReminder) {
    prompt += '\n\n【重要提醒】你上次回复缺少了python代码块状态更新。请务必在本次回复末尾包含```python代码块来更新所有状态信息，这是强制要求。';
  }

  // Inject global core memory (permanent)
  if (state.globalCoreMemory) {
    prompt += `\n\n【用户核心记忆】\n${state.globalCoreMemory}`;
  }

  // Inject global notes (temporary)
  if (state.globalNotes) {
    prompt += `\n\n【用户近期笔记】\n${state.globalNotes}`;
  }

  // Inject character core memory
  if (state.currentCharId && state.characterCoreMemories[state.currentCharId]) {
    prompt += `\n\n【${char.name}核心记忆】\n${state.characterCoreMemories[state.currentCharId]}`;
  }

  // Inject character notes
  if (state.currentCharId && state.characterNotes[state.currentCharId]) {
    prompt += `\n\n【${char.name}近期笔记】\n${state.characterNotes[state.currentCharId]}`;
  }

  return prompt;
}

export function buildWorldBookInjection(userMessage) {
  const matched = state.worldBook.filter(entry => {
    if (entry.always || !entry.keywords.length) return false;
    return entry.keywords.some(kw => userMessage.includes(kw));
  });
  if (!matched.length) return '';
  return '\n\n【相关世界知识】\n' + matched.map(e => `${e.name}：${e.content}`).join('\n');
}
