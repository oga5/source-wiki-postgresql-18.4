document.querySelectorAll('[data-panel]').forEach((link) => {
  link.addEventListener('click', () => { document.getElementById('wiki-view').src = link.dataset.panel; });
});
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'source-page') {
    document.getElementById('wiki-view').src = event.data.panel;
  }
});
