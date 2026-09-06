document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-site-header]');
  const nav = document.querySelector('[data-site-nav]');
  const toggle = document.querySelector('.nav-toggle');
  const menuLinks = [...document.querySelectorAll('.site-nav a')];
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const dockLinks = [...document.querySelectorAll('.dock-menu a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];

  if (document.documentElement.classList.contains('home-first-boot')) {
    window.setTimeout(() => {
      document.documentElement.classList.remove('home-first-boot');
    }, 2500);
  }

  const startAmbientMatrix = () => {
    if (reduceMotion) return;

    const storageKey = 'exbr.matrixStartedAt';
    let startedAt = Date.now();

    try {
      const stored = Number(sessionStorage.getItem(storageKey));
      if (Number.isFinite(stored) && stored > 0) startedAt = stored;
      else sessionStorage.setItem(storageKey, String(startedAt));
    } catch (error) {
      // O efeito continua sem persistência quando o armazenamento está indisponível.
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'ambient-matrix';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let ratio = 1;
    let columns = [];
    let animationFrame = 0;
    let lastFrame = 0;

    const seeded = value => {
      const result = Math.sin(value * 9301 + 49297) * 233280;
      return result - Math.floor(result);
    };

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = Math.ceil(window.innerHeight * 0.58);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const spacing = width < 560 ? 20 : 23;
      const count = Math.ceil(width / spacing) + 1;
      columns = Array.from({ length: count }, (_, index) => ({
        x: index * spacing + (seeded(index + 2) - 0.5) * 8,
        offset: seeded(index + 21),
        speed: 0.000012 + seeded(index + 47) * 0.00001,
        trail: 9 + Math.floor(seeded(index + 73) * 9),
        depth: 0.48 + seeded(index + 91) * 0.52,
        size: 9 + Math.floor(seeded(index + 113) * 4)
      }));
    };

    const draw = timestamp => {
      if (timestamp - lastFrame < 32) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }

      lastFrame = timestamp;
      const elapsed = Date.now() - startedAt;
      context.clearRect(0, 0, width, height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.globalCompositeOperation = 'lighter';

      columns.forEach((column, columnIndex) => {
        context.font = `${column.size}px Consolas, "Courier New", monospace`;

        for (let stream = 0; stream < 2; stream += 1) {
          const phase = (elapsed * column.speed + column.offset + stream * 0.51) % 1;
          const head = phase * (height + 150) - 75;

          for (let index = 0; index < column.trail; index += 1) {
            const y = head - index * 13;
            if (y < -20 || y > height + 20) continue;
            const shimmer = 0.72 + seeded(columnIndex * 19 + index * 37 + stream * 11) * 0.28;
            const fade = Math.max(0.025, 0.2 - index * 0.011);
            const alpha = fade * shimmer * column.depth;
            context.fillStyle = `rgba(94, 189, 201, ${alpha})`;
            context.fillText('•', column.x + stream * 2, y);
          }
        }
      });

      context.globalCompositeOperation = 'source-over';

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw(performance.now());
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
      } else {
        window.cancelAnimationFrame(animationFrame);
        draw(performance.now());
      }
    });
  };

  startAmbientMatrix();

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
        dockLinks.forEach(link => {
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
