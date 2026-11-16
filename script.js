/* Independent demonstration. No network requests, payment, or order submission. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const menuBtn = $('#menu-btn');
  const mobileNav = $('#mobile-nav');
  const toggleMenu = show => {
    mobileNav.hidden = !show;
    menuBtn.setAttribute('aria-expanded', String(show));
    menuBtn.setAttribute('aria-label', show ? 'Закрыть меню' : 'Открыть меню');
  };
  menuBtn.addEventListener('click', () => toggleMenu(mobileNav.hidden));
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });

  // Interactive visual comparison (clearly marked as illustrative artwork).
  const compareRange = $('#compare-range');
  const compareGraphic = $('#compare-graphic');
  const paintSplit = () => compareGraphic.style.setProperty('--split', `${compareRange.value}%`);
  compareRange.addEventListener('input', paintSplit);
  paintSplit();

  // Live, accessible request builder. Images never leave this browser.
  const quantityInput = $('#quantity');
  const quantityOut = $('#quantity-out');
  const summary = $('#request-summary');
  const photoInput = $('#photos');
  const thumbnails = $('#photo-previews');
  let photos = [];
  let toastTimer;
  const notify = message => {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3500);
  };
  const chosenFurniture = () => $('input[name="furniture"]:checked')?.value || 'Прямой диван';
  const chosenIssues = () => $$('#issue-options input:checked').map(input => input.value);
  const quantity = () => Number(quantityInput.value);
  const description = () => {
    const c = chosenIssues();
    const problem = c.length ? c.join(', ') : 'не указано';
    return `${chosenFurniture()} · ${quantity()} шт. · ${problem.toLowerCase()}${photos.length ? ` · фото: ${photos.length}` : ''}`;
  };
  const updateSummary = () => { summary.textContent = description(); };
  $('#quantity-minus').addEventListener('click', () => {
    quantityInput.value = String(Math.max(1, quantity() - 1));
    quantityOut.textContent = quantityInput.value;
    updateSummary();
  });
  $('#quantity-plus').addEventListener('click', () => {
    quantityInput.value = String(Math.min(10, quantity() + 1));
    quantityOut.textContent = quantityInput.value;
    updateSummary();
  });
  $$('#furniture-options input, #issue-options input').forEach(input => input.addEventListener('change', updateSummary));
  $('#fabric').addEventListener('change', updateSummary);

  function renderPhotos() {
    thumbnails.replaceChildren();
    for (const photo of photos) {
      const wrapper = document.createElement('div'); wrapper.className = 'photo-thumb';
      const image = document.createElement('img'); image.src = photo.url; image.alt = `Предпросмотр: ${photo.file.name}`;
      const button = document.createElement('button'); button.type = 'button'; button.title = `Удалить ${photo.file.name}`;
      button.setAttribute('aria-label', `Удалить фото ${photo.file.name}`);
      button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>';
      button.addEventListener('click', () => {
        URL.revokeObjectURL(photo.url);
        photos = photos.filter(p => p !== photo);
        renderPhotos(); updateSummary();
      });
      wrapper.append(image, button); thumbnails.append(wrapper);
    }
    photoInput.value = '';
  }
  photoInput.addEventListener('change', () => {
    const incoming = [...photoInput.files];
    let rejected = 0;
    for (const file of incoming) {
      if (photos.length >= 3 || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) { rejected++; continue; }
      photos.push({ file, url: URL.createObjectURL(file) });
    }
    if (rejected) notify('Можно выбрать максимум 3 фотографии: JPG, PNG или WebP до 8 МБ.');
    renderPhotos(); updateSummary();
  });
  window.addEventListener('pagehide', () => photos.forEach(photo => URL.revokeObjectURL(photo.url)));
  const buildRequest = () => {
    const comments = $('#comment').value.trim();
    return [
      'Здравствуйте! Хочу уточнить стоимость химчистки мебели в Оренбурге.',
      `Мебель: ${chosenFurniture()}`,
      `Количество: ${quantity()} шт.`,
      `Обивка: ${$('#fabric').value}`,
      `Загрязнения: ${chosenIssues().join(', ') || 'не указаны'}`,
      ...(comments ? [`Комментарий: ${comments}`] : []),
      ...(photos.length ? [`Есть фотографии (${photos.length} шт.), приложу отдельно в переписке.`] : []),
      'Подскажите, пожалуйста, ориентировочную стоимость и условия выезда. Спасибо!'
    ].join('\n');
  };
  async function copyRequest(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text; el.style.cssText = 'position:fixed;opacity:0;left:0;top:0;pointer-events:none;';
        document.body.append(el); el.select();
        const ok = document.execCommand('copy'); el.remove();
        if (!ok) throw new Error('copy refused');
      }
      notify('Текст заявки скопирован. Отправьте его компании через VK.');
    } catch (e) {
      notify('Браузер ограничил копирование. Откройте сайт через HTTPS или localhost.');
    }
  }
  $('#copy-request').addEventListener('click', () => copyRequest(buildRequest()));
  // Prevent accidental form submission, including Enter.
  $('#estimate-form').addEventListener('submit', event => event.preventDefault());
  updateSummary();

  // Respect motion preferences; keep page content visible without JavaScript.
  const elements = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }
    }, { threshold: .05, rootMargin: '0px 0px 80px 0px' });
    elements.forEach(el => observer.observe(el));
  } else { elements.forEach(el => el.classList.add('is-visible')); }
})();
