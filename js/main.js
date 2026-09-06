document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('[data-site-header]');
  const nav = document.querySelector('[data-site-nav]');
  const toggle = document.querySelector('.nav-toggle');
  const menuLinks = [...document.querySelectorAll('.site-nav a')];
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];

  const setMenu = open => {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle?.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menuLinks.forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
  });

  document.addEventListener('click', event => {
    if (!nav?.classList.contains('is-open')) return;
    if (nav.contains(event.target) || toggle?.contains(event.target)) return;
    setMenu(false);
  });

  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const currentId = `#${entry.target.id}`;
        navLinks.forEach(link => {
          if (link.getAttribute('href') === currentId) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55%', threshold: 0 });

    sections.forEach(section => sectionObserver.observe(section));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(element => element.classList.add('is-visible'));
  }

  document.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });
});
