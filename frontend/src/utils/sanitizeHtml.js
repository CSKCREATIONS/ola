// Lightweight client-side HTML sanitizer.
// Removes <script> and <style> tags and strips event handler attributes (on*)
// and javascript: href/src attributes. This is not a full replacement for
// a dedicated library like DOMPurify, but provides basic protection.

function removeDangerousElements(doc) {
  doc.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());
}

function isJsOrDataUrl(value) {
  return /^\s*(javascript|data):/i.test(value);
}

function sanitizeAttributes(node) {
  // Copy attributes to avoid live mutation issues
  const attrs = Array.from(node.attributes || []);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    const value = attr.value || '';
    if (name.startsWith('on')) {
      node.removeAttribute(attr.name);
      continue;
    }
    if ((name === 'href' || name === 'src') && isJsOrDataUrl(value)) {
      node.removeAttribute(attr.name);
      continue;
    }
  }
}

function sanitizeTree(root) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) sanitizeAttributes(node);
}

export default function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirty, 'text/html');

    removeDangerousElements(doc);
    if (doc.body) sanitizeTree(doc.body);

    return doc.body ? doc.body.innerHTML : '';
  } catch (e) {
    // Log and fallback: strip tags conservatively
    console.error('sanitizeHtml parse error:', e);
    return dirty.replaceAll(/<script[\s\S]*?>[\s\S]*?<\script>/gi, '')
                .replaceAll(/<style[\s\S]*?>[\s\S]*?<\style>/gi, '')
                .replaceAll(/on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }
}
