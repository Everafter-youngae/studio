const priceToggle = document.getElementById('priceToggle');
const priceDetail = document.getElementById('priceDetail');
const priceSealLabel = document.getElementById('priceSealLabel');
if (priceToggle && priceDetail) {
  priceToggle.addEventListener('click', () => {
    const willOpen = priceToggle.getAttribute('aria-expanded') !== 'true';
    priceToggle.setAttribute('aria-expanded', String(willOpen));
    priceDetail.hidden = !willOpen;
    if (priceSealLabel) priceSealLabel.textContent = willOpen ? '접어두기' : '본식 사회 비용 열어보기';
  });
}

const siteHeader = document.querySelector('.site-header');
const headerHero = document.querySelector('.hero, .review-hero, .subpage-hero');
const headerHeroCopy = headerHero?.querySelector('.hero-copy, .review-hero-copy, .subpage-title');
function updateHeaderState() {
  if (!siteHeader || !headerHero) return;
  const headerH = siteHeader.offsetHeight;
  // Go solid as soon as the hero's own copy block scroll up to meet the
  // header, not only once the whole hero section has passed — the text
  // collides with the fixed header well before the hero fully scrolls away.
  const pastHero = headerHeroCopy
    ? headerHeroCopy.getBoundingClientRect().top < headerH + 16
    : window.scrollY > headerHero.offsetHeight - headerH;
  siteHeader.classList.toggle('is-scrolled', pastHero);
}
if (siteHeader && headerHero) {
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  window.addEventListener('resize', updateHeaderState);
  updateHeaderState();
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .16 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting));
}, { threshold: .25 });
document.querySelectorAll('.image-zoom').forEach(el => imageObserver.observe(el));

// 대문은 PC·모바일 모두 같은 사진 한 장을 씁니다. 예전에는 세로 화면에서만
// 영상을 얹었는데, 화면마다 다른 장면이 나와 첫인상이 갈렸습니다.
const heroMediaBox = document.querySelector('.hero-media');

const parallaxMedia = document.querySelector('.parallax-media');
const heroCopy = document.querySelector('.hero-copy');
function updateParallax(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (parallaxMedia) {
    const rect = parallaxMedia.parentElement.getBoundingClientRect();
    const offset = Math.max(-70, Math.min(70, -rect.top * .08));
    parallaxMedia.style.transform = `translateY(${offset}px)`;
  }
  if (heroMediaBox && heroCopy) {
    const y = Math.max(0, window.scrollY);
    const progress = Math.min(1, y / window.innerHeight);
    heroMediaBox.querySelectorAll('img').forEach(el => {
      el.style.transform = `scale(${1.02 + progress * .035})`;
    });
    heroCopy.style.transform = `translateY(${-progress * 28}px)`;
    heroCopy.style.opacity = String(1 - progress * .28);
  }
}
window.addEventListener('scroll', updateParallax, { passive:true });
updateParallax();

// 사회자 목소리 샘플. <audio> 가 재생을 맡고, 여기서는 겉모습만 따라 그립니다.
const voiceAudio = document.getElementById('voiceAudio');
if (voiceAudio) {
  const player  = voiceAudio.closest('.voice-player');
  const toggle  = document.getElementById('voiceToggle');
  const seek    = document.getElementById('voiceSeek');
  const fill    = document.getElementById('voiceFill');
  const nowEl   = document.getElementById('voiceNow');
  const totalEl = document.getElementById('voiceTotal');
  let scrubbing = false;

  const clock = (sec) => {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    return m + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  };
  // 막대·시간·읽어주기용 값을 한 번에 맞춥니다.
  const setUI = (ratio, sec) => {
    fill.style.width = (ratio * 100) + '%';
    nowEl.textContent = clock(sec);
    seek.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    seek.setAttribute('aria-valuetext', Math.round(sec) + '초');
  };
  const paint = () => {
    const d = voiceAudio.duration;
    if (!isFinite(d) || d <= 0 || scrubbing) return;
    setUI(voiceAudio.currentTime / d, voiceAudio.currentTime);
  };

  const onMeta = () => {
    totalEl.textContent = clock(voiceAudio.duration);
    paint();
  };
  // 내려받기 안내를 감추는 기준은 '파일이 도착했는가'가 아니라 '재생 버튼이 작동하는가'
  // 입니다. 자바스크립트가 여기까지 왔으면 버튼은 듣습니다. 이 판단을 파일 도착과 떼어
  // 놓은 덕분에 음성을 preload="none" 으로 미뤄둘 수 있습니다.
  player.classList.add('voice-ready');
  voiceAudio.addEventListener('loadedmetadata', onMeta);
  if (voiceAudio.readyState >= 1) onMeta();
  voiceAudio.addEventListener('timeupdate', paint);
  voiceAudio.addEventListener('error', () => {
    player.classList.remove('voice-ready');
    player.classList.add('voice-error');
  });

  const setPlaying = (on) => {
    player.classList.toggle('is-playing', on);
    toggle.setAttribute('aria-label', on ? '목소리로 전하는 이야기 일시정지' : '목소리로 전하는 이야기 재생');
  };
  voiceAudio.addEventListener('play',  () => setPlaying(true));
  voiceAudio.addEventListener('pause', () => setPlaying(false));
  voiceAudio.addEventListener('ended', () => { voiceAudio.currentTime = 0; paint(); });

  toggle.addEventListener('click', () => {
    if (voiceAudio.paused) {
      // 자동재생 차단이나 코덱 문제로 거절될 수 있어 실패를 삼키지 않고 안내로 바꿉니다.
      const started = voiceAudio.play();
      if (started && started.catch) started.catch(() => {
        player.classList.add('voice-error');
        setPlaying(false);
      });
    } else {
      voiceAudio.pause();
    }
  });

  // 진행 막대 조작. <input type="range"> 를 쓰지 않으므로 누르기·끌기·키보드를
  // 직접 처리합니다. 그 대신 브라우저가 손잡이 자리에 무언가를 그리는 일이 없습니다.
  const rail = seek.querySelector('.voice-rail');
  let scrubRatio = 0;

  const ratioAt = (clientX) => {
    const r = rail.getBoundingClientRect();
    if (!r.width) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const seekTo = (ratio) => {
    const d = voiceAudio.duration;
    if (isFinite(d) && d > 0) voiceAudio.currentTime = ratio * d;
  };
  const preview = (ratio) => setUI(ratio, ratio * (voiceAudio.duration || 0));

  // 손가락이 막대에 닿았다고 해서 곧바로 붙잡으면 안 됩니다. 이 막대는 카드 폭 전체를
  // 가로지르는 20px 띠라, 여기서 시작한 세로 스와이프까지 가로채면 페이지가 아예
  // 스크롤되지 않습니다(실제로 그랬습니다). 그래서 닿은 뒤 방향이 드러날 때까지
  // 기다렸다가, 가로로 끄는 것이 분명해진 뒤에만 손짓을 가져옵니다.
  let gesture = null;

  const startScrub = (e) => {
    scrubbing = true;
    // 손가락이 막대 밖으로 나가도 계속 따라오도록 붙잡습니다.
    try { seek.setPointerCapture(e.pointerId); } catch (err) {}
  };

  seek.addEventListener('pointerdown', (e) => {
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
    // 마우스는 끌어도 화면이 스크롤되지 않으므로 기다릴 이유가 없습니다.
    if (e.pointerType === 'mouse') {
      startScrub(e);
      scrubRatio = ratioAt(e.clientX);
      preview(scrubRatio);
    }
  });
  seek.addEventListener('pointermove', (e) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    if (!scrubbing) {
      const dx = Math.abs(e.clientX - gesture.x);
      const dy = Math.abs(e.clientY - gesture.y);
      if (dy > 8 && dy >= dx) { gesture = null; return; } // 세로로 넘기는 중 — 스크롤에 양보합니다
      if (dx < 6) return;                                 // 아직 어느 쪽인지 모릅니다
      startScrub(e);
    }
    scrubRatio = ratioAt(e.clientX);
    preview(scrubRatio);
  });
  const endScrub = (e) => {
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

  seek.addEventListener('keydown', (e) => {
    const d = voiceAudio.duration;
    if (!isFinite(d) || d <= 0) return;
    const cur = voiceAudio.currentTime / d;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   next = cur + .05;
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') next = cur - .05;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End')  next = 1;
    if (next === null) return;
    e.preventDefault();
    next = Math.min(1, Math.max(0, next));
    seekTo(next);
    setUI(next, next * d);
  });
}

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('site-nav');
if (menuToggle && siteNav) {
  menuToggle.addEventListener('click',()=>{
    const open = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  siteNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>siteNav.classList.remove('open')));
}

const dateInput = document.getElementById('weddingDate');
if (dateInput) {
  dateInput.addEventListener('input', () => {
    const digits = dateInput.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits.slice(0, 4);
    if (digits.length > 4) formatted += '.' + digits.slice(4, 6);
    if (digits.length > 6) formatted += '.' + digits.slice(6, 8);
    dateInput.value = formatted;
  });
}

// Google Apps Script Web App URL — deploy apps-script/inquiry-handler.gs
// (see apps-script/README.md) and paste the resulting /exec URL here.
const INQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzrhR-cqAzaY6ZaEwaid1US8wApfLWsuIldYYLJEyWkx5jOUB7dl_YF8PB9GlLhsN4c/exec';

// 개인정보 수집·이용 동의 문구 버전 — ask.html의 동의 박스 내용을 고치면 함께 올려주세요.
const PRIVACY_VER = '1.0';

const form = document.getElementById('inquiryForm');
const formStatus = document.getElementById('formStatus');
if (form && formStatus) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Honeypot: bots tend to fill every field, real users never see this one.
    if (form.elements.website?.value) {
      formStatus.textContent = '문의가 접수되었습니다. 확인 후 연락드리겠습니다.';
      form.reset();
      return;
    }

    if (!INQUIRY_ENDPOINT || INQUIRY_ENDPOINT.startsWith('PASTE_')) {
      formStatus.textContent = '문의 접수 연결이 아직 설정되지 않았습니다. 인스타그램(@everafter_youngae)으로 직접 DM 부탁드립니다.';
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    formStatus.textContent = '보내는 중입니다…';

    const data = new FormData(form);

    // 언제, 어떤 문구에 동의했는지 함께 남깁니다. 문구를 고치면 PRIVACY_VER를 올려주세요
    // (wedding-mc 쪽 ask.html의 PRIVACY_VER와 같은 뜻으로 맞춰 씁니다).
    data.set('consentAt', new Date().toISOString());
    data.set('consentVer', PRIVACY_VER);

    // Apps Script Web Apps don't send CORS headers, so the response is
    // opaque under no-cors — we can't read it, only tell whether the
    // request itself went out. That's enough to confirm delivery.
    fetch(INQUIRY_ENDPOINT, { method: 'POST', mode: 'no-cors', body: data })
      .then(() => {
        formStatus.textContent = '문의가 접수되었습니다. 확인 후 남겨주신 연락처로 답변드리겠습니다.';
        form.reset();
      })
      .catch(() => {
        formStatus.textContent = '전송에 실패했습니다. 잠시 후 다시 시도하시거나, 인스타그램(@everafter_youngae)으로 DM 부탁드립니다.';
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
  });
}
