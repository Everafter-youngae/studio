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

const parallaxMedia = document.querySelector('.parallax-media');
const heroMedia = document.querySelector('.hero-media img');
const heroCopy = document.querySelector('.hero-copy');
function updateParallax(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (parallaxMedia) {
    const rect = parallaxMedia.parentElement.getBoundingClientRect();
    const offset = Math.max(-70, Math.min(70, -rect.top * .08));
    parallaxMedia.style.transform = `translateY(${offset}px)`;
  }
  if (heroMedia && heroCopy) {
    const y = Math.max(0, window.scrollY);
    const progress = Math.min(1, y / window.innerHeight);
    heroMedia.style.transform = `scale(${1.02 + progress * .035})`;
    heroCopy.style.transform = `translateY(${-progress * 28}px)`;
    heroCopy.style.opacity = String(1 - progress * .28);
  }
}
window.addEventListener('scroll', updateParallax, { passive:true });
updateParallax();

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

const INSTAGRAM_DM_URL = 'https://ig.me/m/ever.after_youngae';

const form = document.getElementById('inquiryForm');
const formStatus = document.getElementById('formStatus');
const formCopyBox = document.getElementById('formCopyBox');
if (form && formStatus) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const text = [
      '[Everafter 사회 문의]','',
      `두 사람의 이름: ${data.get('names')}`,
      `예식 날짜: ${data.get('date')}`,
      `예식 장소: ${data.get('venue')}`,
      `연락처: ${data.get('contactInfo')}`,
      `남기고 싶은 이야기: ${data.get('message') || '없음'}`
    ].join('\n');

    // window.open must run synchronously in the submit handler so
    // Safari still counts it as user-gesture-triggered.
    const dmWindow = window.open(INSTAGRAM_DM_URL, '_blank', 'noopener');

    if (formCopyBox) {
      formCopyBox.textContent = text;
      formCopyBox.hidden = false;
    }

    const popupBlockedNote = dmWindow ? '' : ` 팝업이 차단되었다면 인스타그램(@ever.after_youngae)에서 직접 DM을 보내주세요.`;

    navigator.clipboard?.writeText(text).then(() => {
      formStatus.textContent = `문의 내용을 복사했습니다. 새로 열린 인스타그램 DM 창에 붙여넣어 보내주세요.${popupBlockedNote}`;
    }).catch(() => {
      formStatus.textContent = `아래 내용을 직접 복사해서 인스타그램 DM에 붙여넣어 보내주세요.${popupBlockedNote}`;
    });
  });
}
