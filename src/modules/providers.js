// ===== API Providers Config =====

export const PROVIDERS = {
  deepseek: { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', modelsUrl: '/models', hint: '免费注册即送 500 万 Token', models: ['deepseek-chat', 'deepseek-reasoner'] },
  openai:   { name: 'OpenAI',   baseUrl: 'https://api.openai.com/v1', modelsUrl: '/models', hint: '需要绑卡付费', models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini'] },
  claude:   { name: 'Claude',    baseUrl: 'https://api.anthropic.com/v1', modelsUrl: null, hint: '最新 Claude Sonnet 4 / Opus 4', models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250918', 'claude-haiku-4-20250414'] },
  qwen:     { name: '通义千问',  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', modelsUrl: '/models', hint: '阿里云大模型，兼容 OpenAI 格式', models: ['qwen-max', 'qwen-plus', 'qwen-turbo-latest'] },
  doubao:   { name: '豆包',      baseUrl: 'https://api.doubao.com/v1', modelsUrl: '/models', hint: '字节跳动大模型', models: ['doubao-pro-256k', 'doubao-pro-128k', 'doubao-lite-128k'] },
  ollama:   { name: 'Ollama',    baseUrl: 'http://localhost:11434/v1', modelsUrl: '/models', hint: '本地部署，无需 API Key', models: ['llama3.1', 'qwen2.5', 'deepseek-r1'] },
  custom:   { name: '自定义',    baseUrl: '', modelsUrl: '/models', hint: '手动填写 API 地址', models: [] },
};

export function renderModelList(models, currentModel) {
  const list = document.getElementById('modelList');
  const group = document.getElementById('modelListGroup');
  if (!list || !group) return;
  if (!models.length) { group.style.display = 'none'; return; }
  group.style.display = 'block';
  list.innerHTML = models.map(id =>
    `<span class="model-chip${id === currentModel ? ' active' : ''}" data-model="${id}">${id}</span>`
  ).join('');
  list.querySelectorAll('.model-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      list.querySelectorAll('.model-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('setModel').value = chip.dataset.model;
    });
  });
}
