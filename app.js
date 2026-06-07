const viewer = document.querySelector('.viewer');
const contentPane = document.querySelector('.content-pane');
const sourceView = document.getElementById('source-view');
const wikiView = document.getElementById('wiki-view');
const blankPage = 'blank.html';
let pendingExplicitPanel = null;
let applyingState = false;

function currentMode() {
  return viewer.classList.contains('topic-mode') ? 'topic' : 'source';
}

function setMode(mode, update = true) {
  viewer.classList.toggle('topic-mode', mode === 'topic');
  if (update) updateHash();
}

function setWikiPanel(panel, explicit, update = true) {
  if (!panel) return;
  if (explicit) pendingExplicitPanel = panel;
  wikiView.src = panel;
  if (update) updateHash();
}

function setSourcePage(source, update = true) {
  if (!source) return;
  sourceView.src = source;
  if (update) updateHash();
}

function viewerPathFromUrl(value) {
  try {
    const target = new URL(value, window.location.href);
    const base = new URL('.', window.location.href);
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) {
      return '';
    }
    const path = target.pathname.slice(base.pathname.length) || blankPage;
    return decodeURIComponent(path) + target.search + target.hash;
  } catch (_error) {
    return '';
  }
}

function framePath(frame) {
  try {
    return viewerPathFromUrl(frame.contentWindow.location.href) || frame.getAttribute('src') || blankPage;
  } catch (_error) {
    return frame.getAttribute('src') || blankPage;
  }
}

function parseState() {
  const params = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);
  return {
    mode: params.get('mode') === 'topic' ? 'topic' : 'source',
    source: params.get('source') || blankPage,
    wiki: params.get('wiki') || blankPage,
  };
}

function updateHash() {
  if (applyingState) return;
  const params = new URLSearchParams();
  const mode = currentMode();
  const source = framePath(sourceView);
  const wiki = framePath(wikiView);
  if (mode === 'topic') params.set('mode', 'topic');
  if (source && source !== blankPage) params.set('source', source);
  if (wiki && wiki !== blankPage) params.set('wiki', wiki);
  const nextHash = params.toString();
  const nextUrl = nextHash ? `${window.location.pathname}${window.location.search}#${nextHash}` : `${window.location.pathname}${window.location.search}`;
  if (window.location.hash.slice(1) !== nextHash) {
    history.replaceState(null, '', nextUrl);
  }
}

function applyStateFromHash() {
  const state = parseState();
  applyingState = true;
  pendingExplicitPanel = null;
  setMode(state.mode, false);
  sourceView.src = state.source;
  wikiView.src = state.wiki;
  applyingState = false;
}

document.querySelectorAll('[data-panel]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setMode('source', false);
    setSourcePage(link.getAttribute('href'), false);
    setWikiPanel(link.dataset.panel, true, false);
    updateHash();
  });
});
document.querySelectorAll('.topic-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setMode('topic', false);
    pendingExplicitPanel = null;
    setWikiPanel(link.getAttribute('href'), false, false);
    updateHash();
  });
});
sourceView.addEventListener('load', updateHash);
wikiView.addEventListener('load', updateHash);
window.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'source-link') {
    setMode('source', false);
    setWikiPanel(event.data.panel, true, false);
    updateHash();
  } else if (event.data.type === 'source-page') {
    setMode('source', false);
    if (pendingExplicitPanel && event.data.panel !== pendingExplicitPanel) {
      pendingExplicitPanel = null;
      return;
    }
    pendingExplicitPanel = null;
    setWikiPanel(event.data.panel, false, false);
    updateHash();
  } else if (event.data.type === 'frame-location') {
    updateHash();
  }
});
window.addEventListener('hashchange', applyStateFromHash);
applyStateFromHash();

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

document.querySelectorAll('[data-resize]').forEach((splitter) => {
  splitter.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);
    const mode = splitter.dataset.resize;
    const viewerRect = viewer.getBoundingClientRect();
    const contentRect = contentPane.getBoundingClientRect();
    const onMove = (moveEvent) => {
      if (mode === 'tree') {
        const width = clamp(moveEvent.clientX - viewerRect.left, 180, viewerRect.width - 360);
        viewer.style.setProperty('--tree-width', `${width}px`);
      } else if (mode === 'source' && !viewer.classList.contains('topic-mode')) {
        const height = clamp(moveEvent.clientY - contentRect.top, 120, contentRect.height - 120);
        contentPane.style.setProperty('--source-height', `${height}px`);
      }
    };
    const onUp = () => {
      splitter.removeEventListener('pointermove', onMove);
      splitter.removeEventListener('pointerup', onUp);
      splitter.removeEventListener('pointercancel', onUp);
    };
    splitter.addEventListener('pointermove', onMove);
    splitter.addEventListener('pointerup', onUp);
    splitter.addEventListener('pointercancel', onUp);
  });
});
