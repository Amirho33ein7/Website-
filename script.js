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

  // Background music uses Web Audio instead of HTMLMediaElement.
  // A direct user click is the reliable recovery path on browsers that keep
  // AudioContext suspended after incidental touch/scroll interaction.
  const MUSIC_URL = new URL('riserayss - Worry - Ultra Slowed (128).mp3', document.baseURI).href;
  const musicStartButton = $('#musicStartButton');

  let musicContext = null;
  let musicBufferPromise = null;
  let musicBuffer = null;
  let musicSource = null;
  let musicGain = null;
  let musicStarted = false;
  let musicPending = false;
  let musicStartTime = null;

  const showMusicRecovery = () => {
    if (musicStartButton) musicStartButton.hidden = false;
  };

  const hideMusicRecovery = () => {
    if (musicStartButton) musicStartButton.hidden = true;
  };

  const getMusicContext = () => {
    if (!musicContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('Web Audio API is not supported');
      musicContext = new Ctx();
    }
    return musicContext;
  };

  const fetchMusicData = () => {
    if (!musicBufferPromise) {
      musicBufferPromise = fetch(MUSIC_URL, {
        method: 'GET',
        cache: 'force-cache',
        credentials: 'same-origin'
      }).then(response => {
        if (!response.ok) throw new Error('Music request failed: HTTP ' + response.status);
        return response.arrayBuffer();
      });
    }
    return musicBufferPromise;
  };

  const decodeMusic = async () => {
    if (musicBuffer) return musicBuffer;
    const ctx = getMusicContext();
    const data = await fetchMusicData();
    musicBuffer = await ctx.decodeAudioData(data.slice(0));
    if (!musicBuffer || !(musicBuffer.duration > 0)) {
      throw new Error('Music decoded without a valid duration');
    }
    return musicBuffer;
  };

  const stopMusicSource = () => {
    if (!musicSource) return;
    try { musicSource.stop(); } catch (_) {}
    try { musicSource.disconnect(); } catch (_) {}
    musicSource = null;
  };

  const resumeWithTimeout = async (ctx) => {
    if (ctx.state === 'running') return;
    const timeout = new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('AudioContext resume timed out')), 1200);
    });
    await Promise.race([ctx.resume(), timeout]);
    if (ctx.state !== 'running') {
      throw new Error('AudioContext did not reach running state');
    }
  };

  const startWebAudioMusic = async () => {
    if (musicStarted || musicPending) return;

    musicPending = true;

    try {
      const ctx = getMusicContext();

      // Resume immediately from the user-activation event.
      await resumeWithTimeout(ctx);

      const buffer = await decodeMusic();

      // The context may have been suspended while the MP3 decoded; resume again
      // before creating/starting the source.
      await resumeWithTimeout(ctx);

      stopMusicSource();

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.45;
      musicGain.connect(ctx.destination);

      musicSource = ctx.createBufferSource();
      musicSource.buffer = buffer;
      musicSource.loop = true;
      musicSource.connect(musicGain);

      musicSource.onended = () => {
        // A looped source should not end during normal playback.
        if (musicSource && !musicSource.loop) {
          musicStarted = false;
          showMusicRecovery();
        }
      };

      musicSource.start(0);
      musicStartTime = ctx.currentTime;
      musicStarted = true;
      musicPending = false;
      hideMusicRecovery();
    } catch (error) {
      musicStarted = false;
      musicPending = false;
      console.error('Background music failed:', error);
      showMusicRecovery();
    }
  };

  // Incidental user interaction gets a chance to start music automatically.
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(type => {
    document.addEventListener(type, () => {
      void startWebAudioMusic();
    }, {passive:true, capture:true});
  });

  // A direct click on this control is the explicit user-activation fallback.
  musicStartButton?.addEventListener('click', () => {
    void startWebAudioMusic();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && musicContext && musicStarted && musicContext.state !== 'running') {
      musicContext.resume().catch(() => {});
    }
  });

  window.__backgroundMusicDebug = () => ({
    url: MUSIC_URL,
    contextState: musicContext ? musicContext.state : 'not-created',
    contextCurrentTime: musicContext ? musicContext.currentTime : 0,
    bufferDuration: musicBuffer ? musicBuffer.duration : 0,
    bufferSampleRate: musicBuffer ? musicBuffer.sampleRate : 0,
    bufferChannels: musicBuffer ? musicBuffer.numberOfChannels : 0,
    gain: musicGain ? musicGain.gain.value : 0,
    sourceStarted: !!musicSource && musicStarted,
    startTime: musicStartTime,
    pending: musicPending,
    recoveryVisible: !!musicStartButton && !musicStartButton.hidden
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