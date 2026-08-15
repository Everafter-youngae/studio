/* ─────────────────────────────────────────────────────────────────────────
   Everafter Youngae — 홈 전용 스크립트

   index.html 만 씁니다. ask.html·review.html 은 예전대로 script.js 를 쓰고,
   문의 폼 전송 로직도 그쪽에 그대로 있습니다. 이 파일은 폼을 다루지 않습니다.
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 스크롤에 맞춰 드러나기 ─────────────────────────────────────────
     자바스크립트가 없으면 html.js 가 붙지 않아 처음부터 다 보입니다. */
  var revealables = document.querySelectorAll('.r');
  revealables.forEach(function (el) {
    if (el.dataset.d) el.style.setProperty('--d', el.dataset.d);
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('on'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('on');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { revealObserver.observe(el); });

    // 첫 화면은 글꼴이 자리를 잡느라 관찰자가 늦게 깨어날 수 있습니다.
    // 대문은 기다리지 않고 바로 띄웁니다.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.querySelectorAll('.hero .r').forEach(function (el) { el.classList.add('on'); });
      });
    });
  }

  /* ── 헤더 ─────────────────────────────────────────────────────────── */
  var header = document.getElementById('hd');
  if (header) {
    var stuck = false;
    var syncHeader = function () {
      var next = window.scrollY > 24;
      if (next === stuck) return;      // 같은 상태면 손대지 않습니다
      stuck = next;
      header.classList.toggle('is-stuck', stuck);
    };
    window.addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
  }

  /* ── 모바일 메뉴 ──────────────────────────────────────────────────── */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (navToggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      // 메뉴판은 아이보리 면이라 헤더도 함께 불투명해져야 합니다. 대문 위에서는
      // 헤더가 투명하기 때문에, 이 표시가 없으면 메뉴가 파란 면에 떠 보입니다.
      if (header) header.classList.toggle('is-menu', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
  }

  /* ── 지금 보고 있는 장을 메뉴에 표시 ──────────────────────────────── */
  if (nav && 'IntersectionObserver' in window) {
    var links = {};
    nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var targets = Object.keys(links)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var here = targets.filter(function (t) { return visible[t.id]; })[0];
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('is-here', !!here && here.id === id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ── 비용 펼치기 ──────────────────────────────────────────────────── */
  var priceToggle = document.getElementById('priceToggle');
  var priceDetail = document.getElementById('priceDetail');
  var priceLabel = document.getElementById('priceSealLabel');
  if (priceToggle && priceDetail) {
    priceToggle.addEventListener('click', function () {
      var willOpen = priceToggle.getAttribute('aria-expanded') !== 'true';
      priceToggle.setAttribute('aria-expanded', String(willOpen));
      priceDetail.hidden = !willOpen;
      if (priceLabel) priceLabel.textContent = willOpen ? '접어두기' : '비용 열어보기';
    });
  }

  /* ─────────────────────────────────────────────────────────────────────
     Voice — 목소리 아카이브

     <audio> 하나가 재생을 전담하고, 트랙을 바꿀 때 src 만 갈아끼웁니다.
     그래서 두 트랙이 동시에 소리 나는 일이 없습니다.

     파일이 아직 없는 트랙은 index.html 에서 data-pending 이 붙어 있습니다.
     고를 수는 있지만(무엇이 담길 자리인지 읽을 수 있게) 재생은 막습니다.
     파일을 넣고 그 속성만 지우면 바로 살아납니다.
     ───────────────────────────────────────────────────────────────────── */
  var audio = document.getElementById('vxAudio');
  if (audio) {
    var deck     = document.querySelector('.vx-deck');
    var playBtn  = document.getElementById('vxPlay');
    var seek     = document.getElementById('vxSeek');
    var fill     = document.getElementById('vxFill');
    var stateEl  = document.getElementById('vxState');
    var titleEl  = document.getElementById('vxTitle');
    var noteEl   = document.getElementById('vxNote');
    var nowEl    = document.getElementById('vxNowTime');
    var durEl    = document.getElementById('vxDur');
    var download = document.getElementById('vxDownload');
    var items    = Array.prototype.slice.call(document.querySelectorAll('.vx-item'));
    var rail     = seek.querySelector('.vx-rail');

    var current = -1;
    var scrubbing = false;
    var scrubRatio = 0;

    var clock = function (sec) {
      if (!isFinite(sec) || sec < 0) sec = 0;
      return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
    };
    var isPending = function (i) { return items[i].hasAttribute('data-pending'); };

    // 막대·시간·읽어주기용 값을 한 번에 맞춥니다.
    var setUI = function (ratio, sec) {
      fill.style.width = (ratio * 100) + '%';
      nowEl.textContent = clock(sec);
      seek.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      seek.setAttribute('aria-valuetext', Math.round(sec) + '초');
    };
    var paint = function () {
      var d = audio.duration;
      if (!isFinite(d) || d <= 0 || scrubbing) return;
      setUI(audio.currentTime / d, audio.currentTime);
    };

    var setPlaying = function (on) {
      deck.classList.toggle('is-playing', on);
      var item = items[current];
      if (!item) return;
      // 파일이 없는 트랙에서는 '재생' 이라고 읽어주면 안 됩니다.
      playBtn.setAttribute('aria-label',
        item.dataset.title + (isPending(current) ? ' — 준비 중' : (on ? ' 일시정지' : ' 재생')));
      stateEl.textContent = 'Voice ' + item.querySelector('.vx-no').textContent + (on ? ' — Playing' : '');
    };

    var select = function (i, autoplay) {
      if (i === current) return;
      var item = items[i];
      current = i;

      items.forEach(function (el, n) { el.setAttribute('aria-current', String(n === i)); });

      titleEl.textContent = item.dataset.title;
      noteEl.textContent = item.dataset.note;
      stateEl.textContent = 'Voice ' + item.querySelector('.vx-no').textContent;

      var pending = isPending(i);
      playBtn.setAttribute('aria-disabled', String(pending));
      seek.setAttribute('aria-disabled', String(pending));
      deck.classList.remove('vx-error');

      audio.pause();
      setPlaying(false);   // 읽어주기 문구는 여기서 준비 중 여부까지 반영해 붙습니다
      setUI(0, 0);
      durEl.textContent = pending ? '준비 중' : (item.dataset.len || '0:00');
      if (download) download.setAttribute('href', item.dataset.src);

      if (pending) { audio.removeAttribute('src'); audio.load(); return; }

      audio.src = item.dataset.src;
      if (autoplay) start();
    };

    var start = function () {
      var started = audio.play();
      // 코덱 문제나 파일 없음으로 거절될 수 있어, 실패를 삼키지 않고 안내로 바꿉니다.
      if (started && started.catch) started.catch(function () {
        deck.classList.add('vx-error');
        setPlaying(false);
      });
    };

    audio.addEventListener('loadedmetadata', function () {
      durEl.textContent = clock(audio.duration);
      paint();
    });
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('play', function () { setPlaying(true); });
    audio.addEventListener('pause', function () { setPlaying(false); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; setUI(0, 0); });
    audio.addEventListener('error', function () {
      if (current > -1 && !isPending(current)) deck.classList.add('vx-error');
    });

    playBtn.addEventListener('click', function () {
      if (playBtn.getAttribute('aria-disabled') === 'true') return;
      if (audio.paused) start(); else audio.pause();
    });

    items.forEach(function (item, i) {
      item.setAttribute('aria-disabled', String(item.hasAttribute('data-pending')));
      item.addEventListener('click', function () {
        var wasPlaying = !audio.paused;
        select(i, wasPlaying && !isPending(i));
      });
    });

    /* 진행 막대. <input type="range"> 를 쓰지 않으므로 누르기·끌기·키보드를
       직접 처리합니다. 그 대신 브라우저가 손잡이 자리에 제멋대로 그리는 도형이
       하나도 없습니다.

       손가락이 닿았다고 곧바로 붙잡으면 안 됩니다. 이 막대는 화면 폭을 가로지르는
       얇은 띠라, 여기서 시작한 세로 스와이프까지 가로채면 페이지가 아예 스크롤되지
       않습니다. 방향이 드러날 때까지 기다렸다가 가로로 끄는 것이 분명해진 뒤에만
       손짓을 가져옵니다. */
    var gesture = null;

    var ratioAt = function (clientX) {
      var r = rail.getBoundingClientRect();
      if (!r.width) return 0;
      return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    };
    var seekTo = function (ratio) {
      var d = audio.duration;
      if (isFinite(d) && d > 0) audio.currentTime = ratio * d;
    };
    var preview = function (ratio) { setUI(ratio, ratio * (audio.duration || 0)); };
    var seekable = function () { return current > -1 && !isPending(current); };

    var startScrub = function (e) {
      scrubbing = true;
      try { seek.setPointerCapture(e.pointerId); } catch (err) {}
    };

    seek.addEventListener('pointerdown', function (e) {
      if (!seekable()) return;
      gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
      // 마우스는 끌어도 화면이 스크롤되지 않으므로 기다릴 이유가 없습니다.
      if (e.pointerType === 'mouse') {
        startScrub(e);
        scrubRatio = ratioAt(e.clientX);
        preview(scrubRatio);
      }
    });
    seek.addEventListener('pointermove', function (e) {
      if (!gesture || e.pointerId !== gesture.id) return;
      if (!scrubbing) {
        var dx = Math.abs(e.clientX - gesture.x);
        var dy = Math.abs(e.clientY - gesture.y);
        if (dy > 8 && dy >= dx) { gesture = null; return; } // 세로로 넘기는 중 — 스크롤에 양보
        if (dx < 6) return;                                 // 아직 어느 쪽인지 모름
        startScrub(e);
      }
      scrubRatio = ratioAt(e.clientX);
      preview(scrubRatio);
    });
    var endScrub = function (e) {
      if (!gesture || e.pointerId !== gesture.id) return;
      if (scrubbing) {
        scrubbing = false;
        try { seek.releasePointerCapture(e.pointerId); } catch (err) {}
        seekTo(scrubRatio);
      } else if (e.type === 'pointerup') {
        seekTo(ratioAt(e.clientX)); // 끌지 않고 톡 눌렀을 때는 그 자리로 옮깁니다
      }
      gesture = null;
      paint();
    };
    seek.addEventListener('pointerup', endScrub);
    seek.addEventListener('pointercancel', endScrub);

    seek.addEventListener('keydown', function (e) {
      if (!seekable()) return;
      var d = audio.duration;
      if (!isFinite(d) || d <= 0) return;
      var cur = audio.currentTime / d;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = cur + 0.05;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = cur - 0.05;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = 1;
      if (next === null) return;
      e.preventDefault();
      next = Math.min(1, Math.max(0, next));
      seekTo(next);
      setUI(next, next * d);
    });

    // 내려받기 안내를 감추는 기준은 '파일이 도착했는가'가 아니라 '재생 버튼이
    // 작동하는가' 입니다. 여기까지 왔으면 버튼은 듣습니다. 이 판단을 파일 도착과
    // 떼어놓은 덕분에 음성을 preload="none" 으로 미뤄둘 수 있습니다.
    deck.classList.add('vx-ready');

    // 파일이 실제로 있는 첫 트랙을 펼쳐둡니다. 소리는 내지 않습니다(자동재생 금지).
    var first = items.findIndex(function (el) { return !el.hasAttribute('data-pending'); });
    select(first > -1 ? first : 0, false);
  }
})();
