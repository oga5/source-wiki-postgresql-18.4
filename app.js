const viewer = document.querySelector('.viewer');
const contentPane = document.querySelector('.content-pane');
const wikiView = document.getElementById('wiki-view');
let pendingExplicitPanel = null;

function setMode(mode) {
  viewer.classList.toggle('topic-mode', mode === 'topic');
}

function setWikiPanel(panel, explicit) {
  if (!panel) return;
  if (explicit) pendingExplicitPanel = panel;
  wikiView.src = panel;
}

document.querySelectorAll('[data-panel]').forEach((link) => {
  link.addEventListener('click', () => {
    setMode('source');
    setWikiPanel(link.dataset.panel, true);
  });
});
document.querySelectorAll('.topic-link').forEach((link) => {
  link.addEventListener('click', () => {
    setMode('topic');
    pendingExplicitPanel = null;
  });
});
window.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'source-link') {
    setMode('source');
    setWikiPanel(event.data.panel, true);
  } else if (event.data.type === 'source-page') {
    setMode('source');
    if (pendingExplicitPanel && event.data.panel !== pendingExplicitPanel) {
      pendingExplicitPanel = null;
      return;
    }
    pendingExplicitPanel = null;
    setWikiPanel(event.data.panel, false);
  }
});

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
