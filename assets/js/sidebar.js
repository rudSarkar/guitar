// Mobile sidebar toggle + "/" focuses search
(function () {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  if (sidebar && toggle) {
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    function setOpen(open) {
      sidebar.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      const input = document.getElementById('search-input');
      if (input) { e.preventDefault(); input.focus(); }
    }
    if (e.key === 'Escape') {
      const results = document.getElementById('search-results');
      if (results) results.classList.remove('show');
    }
  });

  // Fade-in on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
})();
