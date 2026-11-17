const AUTOPLAY_INTERVAL = 4000;

/**
 * Decorates the featured carousel.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const rows = Array.from(block.children);
  const slides = [];
  let headingCell;
  let actionsCell;
  let skippedRows = false;

  rows.forEach((row) => {
    const [imageCell, copyCell, actionCell] = row.children;
    const picture = imageCell?.querySelector('picture');
    const image = picture?.querySelector('img');

    if (!picture || !image) {
      skippedRows = true;
      return;
    }

    if (!slides.length) {
      headingCell = copyCell;
      actionsCell = actionCell;
    }
    slides.push(picture);
  });

  if (!slides.length) {
    // eslint-disable-next-line no-console
    console.error('[featured-carousel] Add at least one slide image.');
    return;
  }

  if (skippedRows) {
    // eslint-disable-next-line no-console
    console.warn('[featured-carousel] Skipped a row without a slide image.');
  }

  if (headingCell && !headingCell.querySelector('h1')) {
    // eslint-disable-next-line no-console
    console.warn('[featured-carousel] Add the shared H1 to the first slide row.');
  }

  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'featured-carousel-slides';
  slidesContainer.setAttribute('aria-live', 'off');

  const slideElements = slides.map((picture, index) => {
    const slide = document.createElement('div');
    const image = picture.querySelector('img');

    slide.className = 'featured-carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
    slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
    slide.append(picture);

    if (image) image.loading = index === 0 ? 'eager' : 'lazy';
    if (index === 0) slide.classList.add('is-active');

    slidesContainer.append(slide);
    return slide;
  });

  const heading = document.createElement('div');
  heading.className = 'featured-carousel-heading';
  if (headingCell) heading.append(...headingCell.childNodes);

  const actions = document.createElement('div');
  actions.className = 'featured-carousel-actions';
  if (actionsCell) actions.append(...actionsCell.childNodes);
  actions.querySelectorAll('p').forEach((paragraph) => {
    if (paragraph.querySelector('a.button')) paragraph.classList.add('featured-carousel-cta');
  });

  const content = document.createElement('div');
  content.className = 'featured-carousel-content';
  if (heading.childElementCount || actions.childElementCount) {
    content.append(heading, actions);
  }

  block.replaceChildren(slidesContainer);
  if (content.childElementCount) block.append(content);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured carousel and content');
  if (slideElements.length > 1) {
    block.tabIndex = 0;
    block.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End');
  }

  if (slideElements.length < 2) return;

  const toggle = document.createElement('button');
  toggle.className = 'featured-carousel-toggle';
  toggle.type = 'button';
  toggle.textContent = 'Pause';
  toggle.setAttribute('aria-label', 'Pause automatic slide rotation');
  block.append(toggle);

  let activeIndex = 0;
  let timer;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionQuery.matches;
  let interacting = false;

  const stopRotation = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  function showSlide(index, announce = false) {
    activeIndex = index;
    slideElements.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    if (announce) slidesContainer.setAttribute('aria-live', 'polite');
  }

  const startRotation = () => {
    if (timer || paused || interacting || document.hidden) return;
    timer = window.setInterval(() => {
      showSlide((activeIndex + 1) % slideElements.length);
    }, AUTOPLAY_INTERVAL);
  };

  const updateToggle = () => {
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute(
      'aria-label',
      `${paused ? 'Start' : 'Pause'} automatic slide rotation`,
    );
    slidesContainer.setAttribute('aria-live', paused ? 'polite' : 'off');
  };

  toggle.addEventListener('click', () => {
    paused = !paused;
    updateToggle();
    if (paused) {
      stopRotation();
    } else {
      interacting = false;
      startRotation();
    }
  });

  block.addEventListener('pointerenter', () => {
    interacting = true;
    stopRotation();
  });

  block.addEventListener('pointerleave', () => {
    interacting = block.contains(document.activeElement);
    startRotation();
  });

  block.addEventListener('focusin', () => {
    interacting = true;
    stopRotation();
  });

  block.addEventListener('focusout', (event) => {
    const nextTarget = event.relatedTarget;
    interacting = (nextTarget instanceof Node && block.contains(nextTarget)) || block.matches(':hover');
    startRotation();
  });

  block.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    paused = true;
    stopRotation();
    updateToggle();

    if (event.key === 'Home') {
      showSlide(0, true);
    } else if (event.key === 'End') {
      showSlide(slideElements.length - 1, true);
    } else {
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (activeIndex + direction + slideElements.length) % slideElements.length;
      showSlide(nextIndex, true);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRotation();
    } else {
      startRotation();
    }
  });

  motionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      paused = true;
      stopRotation();
      updateToggle();
    }
  });

  updateToggle();
  startRotation();
}
