(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const boot = $('#boot');
  window.addEventListener('load', () => {
    window.setTimeout(() => boot?.classList.add('hide'), reduced ? 0 : 450);
  }, {once:true});

  const progress = $('#progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Background music: native HTML audio + an always-visible user-activation control.
  // Mobile browsers may block audible autoplay, so the button is the guaranteed manual path.
  const backgroundMusic = $('#backgroundMusic');
  const musicStartButton = $('#musicStartButton');
  let musicPlayPending = false;

  const setMusicButtonState = (playing) => {
    if (!musicStartButton) return;
    musicStartButton.textContent = playing ? '❚❚ توقف موسیقی' : '♪ پخش موسیقی';
    musicStartButton.setAttribute('aria-label', playing ? 'توقف موسیقی' : 'پخش موسیقی');
    musicStartButton.setAttribute('aria-pressed', String(playing));
  };

  const playBackgroundMusic = async () => {
    if (!backgroundMusic || musicPlayPending) return;
    if (!backgroundMusic.paused) {
      setMusicButtonState(true);
      return;
    }

    musicPlayPending = true;
    try {
      backgroundMusic.loop = true;
      backgroundMusic.muted = false;
      backgroundMusic.defaultMuted = false;
      backgroundMusic.volume = 0.45;
      await backgroundMusic.play();
      setMusicButtonState(true);
    } catch (error) {
      console.warn('Background music could not start until a direct user gesture:', error);
      setMusicButtonState(false);
    } finally {
      musicPlayPending = false;
    }
  };

  const toggleBackgroundMusic = async () => {
    if (!backgroundMusic) return;
    if (backgroundMusic.paused) {
      await playBackgroundMusic();
    } else {
      backgroundMusic.pause();
      setMusicButtonState(false);
    }
  };

  setMusicButtonState(false);

  // Try to start after the first genuine interaction; the visible button remains
  // available on phones where autoplay is blocked.
  ['pointerup', 'touchend', 'keydown'].forEach(type => {
    document.addEventListener(type, () => {
      void playBackgroundMusic();
    }, {passive:true, capture:true});
  });

  musicStartButton?.addEventListener('click', () => {
    void toggleBackgroundMusic();
  });

  backgroundMusic?.addEventListener('play', () => setMusicButtonState(true));
  backgroundMusic?.addEventListener('pause', () => setMusicButtonState(false));
  backgroundMusic?.addEventListener('ended', () => {
    setMusicButtonState(false);
    void playBackgroundMusic();
  });

  window.__backgroundMusicDebug = () => ({
    url: backgroundMusic?.currentSrc || new URL('riserayss - Worry - Ultra Slowed (128).mp3', document.baseURI).href,
    paused: backgroundMusic ? backgroundMusic.paused : true,
    muted: backgroundMusic ? backgroundMusic.muted : true,
    defaultMuted: backgroundMusic ? backgroundMusic.defaultMuted : true,
    volume: backgroundMusic ? backgroundMusic.volume : 0,
    readyState: backgroundMusic ? backgroundMusic.readyState : 0,
    networkState: backgroundMusic ? backgroundMusic.networkState : 0,
    currentTime: backgroundMusic ? backgroundMusic.currentTime : 0,
    duration: backgroundMusic ? backgroundMusic.duration : 0,
    error: backgroundMusic?.error ? {
      code: backgroundMusic.error.code,
      message: backgroundMusic.error.message || ''
    } : null,
    buttonVisible: !!musicStartButton && !musicStartButton.hidden
  });

  const menuBtn = $('#menuBtn');
  const mobileNav = $('#mobileNav');
  const toggleMenu = (open) => {
    menuBtn?.setAttribute('aria-expanded', String(open));
    mobileNav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn?.addEventListener('click', () => toggleMenu(!mobileNav.classList.contains('open')));
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        reveal.unobserve(entry.target);
      }
    });
  }, {threshold:.12, rootMargin:'0px 0px -4% 0px'});
  $$('.reveal').forEach(el => reveal.observe(el));

  const fine = window.matchMedia('(pointer:fine)').matches;
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');

  if (fine && !reduced && cursorDot && cursorRing) {
    document.body.classList.add('cursor-ready');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      cursorDot.style.left = x + 'px';
      cursorDot.style.top = y + 'px';
    }, {passive:true});

    const loop = () => {
      rx += (x - rx) * .17;
      ry += (y - ry) * .17;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(loop);
    };
    loop();

    $$('a,button').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorRing.style.width = '50px';
        cursorRing.style.height = '50px';
        cursorRing.style.borderColor = 'rgba(154,240,191,.8)';
      });
      el.addEventListener('mouseleave', () => {
        cursorRing.style.width = '29px';
        cursorRing.style.height = '29px';
        cursorRing.style.borderColor = 'rgba(154,240,191,.4)';
      });
    });
  }

  if (fine && !reduced) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * .08;
        const dy = (e.clientY - (r.top + r.height / 2)) * .08;
        el.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    const parallax = $$('[data-speed]');
    let ticking = false;
    const updateParallax = () => {
      const y = window.scrollY;
      parallax.forEach(el => {
        const speed = Number(el.dataset.speed || 0);
        el.style.transform = 'translate3d(0,' + (y * speed * -.16) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, {passive:true});
  }

  const anchors = $$('a[href^="#"]');
  anchors.forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block:'start'});
    });
  });

  const stats = $$('[data-count]');
  const seenStats = new WeakSet();
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || seenStats.has(entry.target)) return;
      seenStats.add(entry.target);
      const node = entry.target;
      const target = Number(node.dataset.count);
      if (reduced) {
        node.textContent = String(target);
        return;
      }
      const start = performance.now();
      const duration = 900;
      const tick = now => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, {threshold:.65});
  stats.forEach(s => statsObserver.observe(s));

  const timelineItems = $$('.timeline-item');
  const timelineObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
  }, {threshold:.18});
  timelineItems.forEach(item => timelineObserver.observe(item));

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleMenu(false);
  });
})();