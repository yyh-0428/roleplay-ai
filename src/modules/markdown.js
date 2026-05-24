// ===== Markdown / KaTeX Rendering =====

export function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined' && typeof katex !== 'undefined' && !marked._katexExt) {
    const katexInline = { name: 'katexInline', level: 'inline', start(src) { return src.match(/\$[^$\n]/) ? 0 : -1; },
      tokenizer(src) { const m = src.match(/^\$+([^\$]+?)\$(?!\$)/); if (m && /\\[a-zA-Z{|\\]/.test(m[1])) return { type: 'katexInline', raw: m[0], text: m[1] }; },
      renderer(token) { try { return katex.renderToString(token.text, { throwOnError: false, trust: true, displayMode: false }); } catch(e) { return `<code>$${token.text}$</code>`; } }
    };
    const katexBlock = { name: 'katexBlock', level: 'block', start(src) { return src.match(/\$\$[^$]/) ? 0 : -1; },
      tokenizer(src) { const m = src.match(/^\$\$+([^$]+?)\$\$+/); if (m) return { type: 'katexBlock', raw: m[0], text: m[1] }; },
      renderer(token) { try { return katex.renderToString(token.text, { throwOnError: false, trust: true, displayMode: true }); } catch(e) { return `<pre><code>$$${token.text}$$</code></pre>`; } }
    };
    const katexParenInline = { name: 'katexParenInline', level: 'inline', start(src) { return src.match(/\\\(/) ? 0 : -1; },
      tokenizer(src) { const m = src.match(/^\\\((.+?)\\\)/s); if (m) return { type: 'katexParenInline', raw: m[0], text: m[1] }; },
      renderer(token) { try { return katex.renderToString(token.text, { throwOnError: false, trust: true, displayMode: false }); } catch(e) { return `<code>\\(${token.text}\\)</code>`; } }
    };
    const katexParenBlock = { name: 'katexParenBlock', level: 'block', start(src) { return src.match(/\\\[/) ? 0 : -1; },
      tokenizer(src) { const m = src.match(/^\\\[(.+?)\\\]/s); if (m) return { type: 'katexParenBlock', raw: m[0], text: m[1] }; },
      renderer(token) { try { return katex.renderToString(token.text, { throwOnError: false, trust: true, displayMode: true }); } catch(e) { return `<pre><code>${token.text}</code></pre>`; } }
    };
    marked.use({ extensions: [katexInline, katexBlock, katexParenInline, katexParenBlock], breaks: true, gfm: true });
    marked._katexExt = true;
  }
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      highlight: function(code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try { return hljs.highlight(code, { language: lang }).value; } catch(e) {}
        }
        return code;
      }
    });
  }
  let html = typeof marked !== 'undefined' ? marked.parse(text) : text.replace(/\n/g, '<br>');
  if (typeof DOMPurify !== 'undefined') {
    html = DOMPurify.sanitize(html);
  }
  return html;
}
