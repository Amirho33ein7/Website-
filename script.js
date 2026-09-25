(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loader = $('#pageLoader');
  window.addEventListener('load', () => {
    window.setTimeout(() => loader?.classList.add('hide'), reduceMotion ? 0 : 500);
  }, {once:true});

  const scrollLine = $('#scrollLine');
  const updateScrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollLine) {
      scrollLine.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
    }
  };
  window.addEventListener('scroll', updateScrollProgress, {passive:true});
  updateScrollProgress();

  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');

  const setMenu = (open) => {
    menuToggle?.setAttribute('aria-expanded', String(open));
    mobileMenu?.classList.toggle('open', open);
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };

  menuToggle?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  $$('.mobile-menu a').forEach(link => link.addEventListener('click', () => setMenu(false)));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.12, rootMargin:'0px 0px -5% 0px'});
  $$('.reveal').forEach(el => revealObserver.observe(el));

  const scenes = $$('.project-scene');
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-active', entry.isIntersecting && entry.intersectionRatio > .22);
    });
  }, {threshold:[0,.22,.48,.72]});
  scenes.forEach(scene => sceneObserver.observe(scene));

  if (!reduceMotion) {
    const parallaxNodes = $$('[data-parallax]');
    let ticking = false;
    const applyParallax = () => {
      const y = window.scrollY;
      parallaxNodes.forEach(el => {
        const speed = Number(el.dataset.parallax || 0);
        el.style.transform = 'translate3d(0,' + (y * speed * -0.18) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, {passive:true});
  }

  const roles = ['Developer','Creator','Software Builder'];
  const roleEls = [$('#rolePrimary'), $('#roleSecondary'), $('#roleTertiary')].filter(Boolean);
  let roleIndex = 0;
  let typingTimer = null;

  const updateRoles = () => {
    roleEls.forEach((el, index) => {
      const role = roles[(roleIndex + index) % roles.length];
      el.textContent = role;
      el.style.opacity = index === 0 ? '1' : '.72';
    });
  };

  const typeRole = () => {
    if (!roleEls[0] || reduceMotion) return;
    const target = roles[roleIndex];
    let i = 0;
    const typeForward = () => {
      roleEls[0].textContent = target.slice(0, i++);
      if (i <= target.length) {
        typingTimer = window.setTimeout(typeForward, 62);
      } else {
        typingTimer = window.setTimeout(() => {
          roleIndex = (roleIndex + 1) % roles.length;
          updateRoles();
          typeRole();
        }, 1150);
      }
    };
    typeForward();
  };
  updateRoles();
  if (!reduceMotion) {
    window.setTimeout(typeRole, 850);
  }

  const finePointer = window.matchMedia('(pointer:fine)').matches;
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');

  if (finePointer && cursorDot && cursorRing && !reduceMotion) {
    document.body.classList.add('cursor-ready');
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    window.addEventListener('pointermove', (event) => {
      x = event.clientX;
      y = event.clientY;
      cursorDot.style.left = x + 'px';
      cursorDot.style.top = y + 'px';
    }, {passive:true});

    const loop = () => {
      rx += (x - rx) * .16;
      ry += (y - ry) * .16;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      window.requestAnimationFrame(loop);
    };
    loop();

    const interactive = $$('a,button,.magnetic-card');
    interactive.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorRing.style.width = '52px';
        cursorRing.style.height = '52px';
        cursorRing.style.borderColor = 'rgba(145,247,199,.82)';
      });
      el.addEventListener('mouseleave', () => {
        cursorRing.style.width = '30px';
        cursorRing.style.height = '30px';
        cursorRing.style.borderColor = 'rgba(145,247,199,.45)';
      });
    });
  }

  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', event => {
        const rect = el.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) * .10;
        const dy = (event.clientY - (rect.top + rect.height / 2)) * .10;
        el.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });

    $$('.magnetic-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - .5;
        const py = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = 'perspective(1000px) rotateX(' + (-py * 3) + 'deg) rotateY(' + (px * 4) + 'deg) translateY(-5px)';
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  const smoothLinks = $$('a[href^="#"]');
  smoothLinks.forEach(link => {
    link.addEventListener('click', event => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
    });
  });

  const hero = $('#hero');
  if (hero && finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      const orbit = $('.hero-orbit');
      if (orbit) {
        orbit.style.transform = 'translate3d(' + (x * 16) + 'px,' + (y * 10) + 'px,0) rotate(-16deg)';
      }
    });
  }

  const cards = $$('.project-card');
  const updateProjectDepth = () => {
    const vh = window.innerHeight;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - vh / 2) / vh;
      const scene = card.closest('.project-scene');
      if (!scene) return;
      const active = scene.classList.contains('is-active');
      if (!active || reduceMotion) return;
      const scale = Math.max(.96, 1 - Math.min(.035, distance * .018));
      card.style.setProperty('--depth-scale', scale.toFixed(3));
    });
  };

  if (!reduceMotion) {
    let depthTick = false;
    window.addEventListener('scroll', () => {
      if (depthTick) return;
      depthTick = true;
      window.requestAnimationFrame(() => {
        updateProjectDepth();
        depthTick = false;
      });
    }, {passive:true});
  }

  window.addEventListener('beforeunload', () => {
    if (typingTimer) window.clearTimeout(typingTimer);
  });
})();