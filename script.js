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

const progressCopy = document.getElementById('progressCopy');
const sections = [...document.querySelectorAll('[data-progress]')];
if (progressCopy && sections.length) {
  const progressObserver = new IntersectionObserver((entries) => {
    const active = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (active) progressCopy.textContent = active.target.dataset.progress;
  }, { threshold: [.25,.5,.75] });
  sections.forEach(section => progressObserver.observe(section));
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

// 대문 영상은 세로(9:16)라 가로 화면에 채우면 가운데 32%만 남고 잘립니다.
// 그래서 세로 화면일 때만 영상을 얹고, 그 외에는 기존 튤립 이미지를 그대로 둡니다.
// CSS로 숨기기만 하면 데스크톱에서도 영상을 내려받게 되므로 아예 DOM에 넣지 않습니다.
const heroMediaBox = document.querySelector('.hero-media');
const heroVideoQuery = window.matchMedia('(max-width:900px) and (orientation:portrait)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function syncHeroVideo(){
  if (!heroMediaBox) return;
  const wanted = heroVideoQuery.matches && !reduceMotion.matches;
  const existing = heroMediaBox.querySelector('video');
  if (wanted && !existing) {
    const v = document.createElement('video');
    // iOS Safari는 muted를 '속성'으로 갖고 있어야 자동재생을 허용합니다.
    // 프로퍼티(v.muted=true)만 주면 막히는 경우가 있어 둘 다 지정합니다.
    // 속성은 src를 넣기 전에 걸어둬야 합니다.
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');   // 전체화면으로 튀어나가지 않게
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('loop', '');
    v.setAttribute('preload', 'auto');
    v.setAttribute('aria-hidden', 'true');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.src = 'assets/hero.mp4';
    heroMediaBox.appendChild(v);
    v.play().catch(() => {}); // 막히면 아래 이미지가 그대로 보이므로 조용히 넘어갑니다
  } else if (!wanted && existing) {
    existing.remove();
  }
}
syncHeroVideo();
heroVideoQuery.addEventListener('change', syncHeroVideo);
reduceMotion.addEventListener('change', syncHeroVideo);

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
    // 이미지·영상이 함께 있을 수 있으므로 둘 다 같은 값으로 움직입니다
    heroMediaBox.querySelectorAll('img, video').forEach(el => {
      el.style.transform = `scale(${1.02 + progress * .035})`;
    });
    heroCopy.style.transform = `translateY(${-progress * 28}px)`;
    heroCopy.style.opacity = String(1 - progress * .28);
  }
}
window.addEventListener('scroll', updateParallax, { passive:true });
updateParallax();

// 움직임을 줄이도록 설정한 사용자에게는 영상을 멈추고 첫 화면(poster)만 보여줍니다.
const heroVideo = document.querySelector('.hero-media video');
if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroVideo.removeAttribute('autoplay');
  heroVideo.pause();
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
