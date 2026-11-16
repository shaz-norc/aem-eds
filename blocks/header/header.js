import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 1024px)');

function normalizePath(path) {
  const normalizedPath = path.replace(/\/+$/, '') || '/';
  return normalizedPath === '/index' ? '/' : normalizedPath;
}

function decorateActiveLink(navSections) {
  const currentPath = normalizePath(window.location.pathname);
  navSections.querySelectorAll('a[href]').forEach((link) => {
    const linkUrl = new URL(link.href, window.location);
    const isCurrentPage = normalizePath(linkUrl.pathname) === currentPath;
    if (linkUrl.origin !== window.location.origin || !isCurrentPage) return;
    link.setAttribute('aria-current', 'page');
    link.closest('li')?.classList.add('active');
  });
}

function createSkipLink() {
  const main = document.querySelector('main');
  if (main && !main.id) {
    main.id = 'main-content';
    main.tabIndex = -1;
  }

  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = `#${main?.id || 'main-content'}`;
  skipLink.textContent = 'Skip to main content';
  return skipLink;
}

function createLanguageSelector(languageSection) {
  const label = languageSection?.querySelector('p');
  const options = languageSection?.querySelector('ul');
  if (!label || !options) return null;

  const selector = document.createElement('div');
  selector.className = 'language-selector';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'language-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'language-options');

  const icon = label.querySelector('img');
  if (icon) {
    const languageIcon = icon.cloneNode(true);
    languageIcon.alt = '';
    button.append(languageIcon);
  }

  const languageLabel = document.createElement('span');
  languageLabel.className = 'language-label';
  languageLabel.textContent = label.textContent.trim();
  button.append(languageLabel);

  options.id = 'language-options';
  options.classList.add('language-options');
  options.hidden = true;

  const setExpanded = (expanded) => {
    button.setAttribute('aria-expanded', String(expanded));
    options.hidden = !expanded;
  };

  button.addEventListener('click', () => {
    setExpanded(button.getAttribute('aria-expanded') !== 'true');
  });
  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      setExpanded(true);
      options.querySelector('a[href]')?.focus();
    }
  });
  selector.addEventListener('keydown', (event) => {
    const links = [...options.querySelectorAll('a[href]')];
    const currentIndex = links.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      setExpanded(false);
      button.focus();
    } else if (event.key === 'ArrowDown' && currentIndex >= 0) {
      event.preventDefault();
      links[(currentIndex + 1) % links.length]?.focus();
    } else if (event.key === 'ArrowUp' && currentIndex >= 0) {
      event.preventDefault();
      links[(currentIndex - 1 + links.length) % links.length]?.focus();
    } else if (event.key === 'Home' && currentIndex >= 0) {
      event.preventDefault();
      links[0]?.focus();
    } else if (event.key === 'End' && currentIndex >= 0) {
      event.preventDefault();
      links.at(-1)?.focus();
    }
  });
  selector.addEventListener('focusout', (event) => {
    if (!selector.contains(event.relatedTarget)) setExpanded(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!selector.contains(event.target)) setExpanded(false);
  });

  selector.append(button, options);
  return selector;
}

function createNavigation(navSections) {
  const nav = document.createElement('nav');
  nav.id = 'primary-navigation';
  nav.setAttribute('aria-label', 'Primary');

  const menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'nav-hamburger';
  if (navSections) {
    navSections.id = 'primary-navigation-sections';
    menuButton.setAttribute('aria-controls', navSections.id);
  }
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  const menuIcon = document.createElement('span');
  menuIcon.className = 'nav-hamburger-icon';
  menuButton.append(menuIcon);

  const setMenuOpen = (open) => {
    nav.dataset.menuOpen = String(open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };

  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
  nav.addEventListener('focusout', (event) => {
    if (!nav.contains(event.relatedTarget)) setMenuOpen(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!nav.contains(event.target)) setMenuOpen(false);
  });
  isDesktop.addEventListener('change', () => setMenuOpen(false));

  nav.append(menuButton);
  if (navSections) decorateActiveLink(navSections);

  return nav;
}

/**
 * Loads and decorates the header, mainly the nav.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.error(`Header navigation fragment could not be loaded from ${navPath}`);
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'nav-content';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const sections = [...nav.children];
  sections[0]?.classList.add('nav-brand');
  sections[1]?.classList.add('nav-sections');
  sections[2]?.classList.add('nav-tools');
  sections[3]?.classList.add('nav-account');

  const brandLink = sections[0]?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container')?.classList.remove('button-container');
  }

  const languageSelector = createLanguageSelector(sections[2]);
  if (sections[1] && sections[3]) sections[1].append(sections[3]);
  const primaryNav = createNavigation(sections[1]);
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  primaryNav.prepend(...sections.slice(0, 2));
  navWrapper.append(primaryNav);

  const languageBar = document.createElement('div');
  languageBar.className = 'nav-language-bar';
  const languageInner = document.createElement('div');
  languageInner.className = 'language-inner';
  if (languageSelector) languageInner.append(languageSelector);
  languageBar.append(languageInner);

  block.replaceChildren(createSkipLink(), languageBar, navWrapper);
}
