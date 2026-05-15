// Theme toggle
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
  });
})();
