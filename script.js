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

  // Background music: preload the media, then start it directly from a trusted user gesture.
  // Important: do not treat play()'s Promise resolution alone as proof of actual playback.
  // Some Android/browser combinations can report a successful play request while the
  // playback position remains frozen at 0. We verify the real media timeline as well.
  const backgroundMusic = $('#backgroundMusic');

  if (backgroundMusic) {
    let musicStarted = false;
    let playPending = false;
    let playbackWatchdog = 0;
    let lastObservedTime = 0;

    backgroundMusic.defaultMuted = false;
    backgroundMusic.muted = false;
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.45;
    backgroundMusic.preload = 'auto';
    backgroundMusic.playsInline = true;

    // Start loading the local asset immediately. Loading is allowed before
    // user activation; audible playback itself remains gesture-gated.
    try { backgroundMusic.load(); } catch (_) {}

    const markPlaying = () => {
      // "playing" means the media element left the paused state, but on some
      // Android/browser combinations the clock can still remain frozen at 0.
      // Keep the watchdog alive until currentTime has actually advanced.
      musicStarted = true;
      playPending = false;
      lastObservedTime = backgroundMusic.currentTime || 0;
      if (playbackWatchdog) clearTimeout(playbackWatchdog);
      playbackWatchdog = window.setTimeout(verifyPlayback, 900);
    };

    const verifyPlayback = () => {
      const now = backgroundMusic.currentTime || 0;
      const advanced = now > lastObservedTime + 0.05;

      if (advanced || backgroundMusic.ended) {
        musicStarted = !backgroundMusic.ended;
        lastObservedTime = now;
        playPending = false;
        return;
      }

      // A resolved play() request with a frozen 0:00 position is not usable.
      // Leave the player eligible for another real user gesture instead of
      // permanently locking it into the false "started" state.
      musicStarted = false;
      playPending = false;
    };

    const startBackgroundMusic = () => {
      if (musicStarted || playPending) return;

      // A real pointer/touch/keyboard gesture has already happened at this point.
      // Explicitly restore an audible state in case a browser persisted a muted state.
      backgroundMusic.defaultMuted = false;
      backgroundMusic.muted = false;
      if (!(backgroundMusic.volume > 0)) backgroundMusic.volume = 0.45;

      playPending = true;
      lastObservedTime = backgroundMusic.currentTime || 0;

      try {
        if (backgroundMusic.readyState === 0 || backgroundMusic.networkState === HTMLMediaElement.NETWORK_EMPTY) {
          backgroundMusic.load();
        }
        const playRequest = backgroundMusic.play();

        Promise.resolve(playRequest).then(() => {
          // Do NOT set musicStarted here. The browser promise only tells us
          // the play request was accepted; the media timeline must move too.
          playbackWatchdog = window.setTimeout(verifyPlayback, 900);
        }).catch(() => {
          musicStarted = false;
          playPending = false;
        });
      } catch (_) {
        musicStarted = false;
        playPending = false;
      }
    };

    // Capture the gesture as early as possible. Per the platform's user
    // activation model, pointerup/touchend/keydown are trusted activation events.
    ['pointerup', 'touchend', 'click', 'keydown'].forEach(type => {
      document.addEventListener(type, startBackgroundMusic, {
        passive: true,
        capture: true
      });
    });

    backgroundMusic.addEventListener('playing', markPlaying);
    backgroundMusic.addEventListener('timeupdate', () => {
      const now = backgroundMusic.currentTime || 0;
      if (!backgroundMusic.paused && now > lastObservedTime + 0.02) {
        musicStarted = true;
        playPending = false;
        lastObservedTime = now;
      }
    });

    backgroundMusic.addEventListener('pause', () => {
      if (!backgroundMusic.ended) {
        musicStarted = false;
        playPending = false;
      }
    });

    backgroundMusic.addEventListener('ended', () => {
      musicStarted = false;
      playPending = false;
    });

    backgroundMusic.addEventListener('error', () => {
      musicStarted = false;
      playPending = false;
      if (playbackWatchdog) {
        clearTimeout(playbackWatchdog);
        playbackWatchdog = 0;
      }
    });

    // Expose diagnostics only for manual/browser debugging; no UI is changed.
    window.__backgroundMusicDebug = () => ({
      currentSrc: backgroundMusic.currentSrc,
      currentTime: backgroundMusic.currentTime,
      duration: backgroundMusic.duration,
      paused: backgroundMusic.paused,
      ended: backgroundMusic.ended,
      muted: backgroundMusic.muted,
      defaultMuted: backgroundMusic.defaultMuted,
      volume: backgroundMusic.volume,
      readyState: backgroundMusic.readyState,
      networkState: backgroundMusic.networkState,
      error: backgroundMusic.error ? {
        code: backgroundMusic.error.code,
        message: backgroundMusic.error.message || ''
      } : null,
      musicStarted,
      playPending,
      userActivated: navigator.userActivation ? {
        hasBeenActive: navigator.userActivation.hasBeenActive,
        isActive: navigator.userActivation.isActive
      } : null
    });
  }

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