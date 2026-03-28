/* =============================================================
   script.js — Serenity: Stress & Anxiety Reduction System
   Sections: Nav Active State · Nav Scroll Shadow · Mobile Menu
             · Mode Selection · Restore Mode on Load
   ============================================================= */


/* ── Nav: Highlight active tab on scroll ───────────────────── */
/*
   Only sections that have a matching data-nav tab are observed,
   preventing unrelated [id] elements from triggering incorrect
   tab highlights. Home is set active immediately on load.
*/

// Cache nav height once — reused in rootMargin and scrollIntoView offset
const navHeight = getComputedStyle(document.documentElement).getPropertyValue('--nav-h').trim();

const navTabs = document.querySelectorAll('.nav__tab[data-nav]');

// Build a Set of section IDs that have a corresponding nav tab
const trackedIds = new Set(
  [...navTabs].map((tab) => tab.dataset.nav)
);

// Collect only the sections we actually care about
const trackedSections = [...document.querySelectorAll('section[id]')].filter(
  (section) => trackedIds.has(section.id)
);

function setActiveTab(sectionId) {
  navTabs.forEach((tab) => {
    tab.classList.toggle('nav__tab--active', tab.dataset.nav === sectionId);
  });
}

// Set Home as active immediately — prevents any other tab from flashing first
setActiveTab('home');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveTab(entry.target.id);
      }
    });
  },
  {
    // Shrink the top of the observation area by nav height so sections trigger
    // right when they scroll into view beneath the fixed nav bar.
    rootMargin: `-${navHeight} 0px -60% 0px`,
    threshold: 0,
  }
);

trackedSections.forEach((section) => sectionObserver.observe(section));


/* ── Nav: Smooth scroll for tab clicks ─────────────────────── */
/*
   CSS scroll-behavior: smooth covers most anchor clicks natively.
   This listener handles the edge case where the browser doesn't
   respect it (e.g., older WebKit) and ensures a consistent nav-height
   offset so section headings are never hidden behind the fixed bar.
*/

navTabs.forEach((tab) => {
  const link = tab.querySelector('a[href^="#"]');
  if (!link) return;

  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href').slice(1); // strip leading #
    const target   = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    // parseInt strips the "px" unit from the cached navHeight string
    const offsetTop = target.getBoundingClientRect().top
                    + window.scrollY
                    - parseInt(navHeight, 10);

    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  });
});


/* ── Nav: Scroll shadow feedback ───────────────────────────── */
/*
   Toggles .nav--scrolled on the <header> once the user scrolls past
   the very top. All visual changes (shadow, background opacity) live
   in CSS — JS only manages the class.

   requestAnimationFrame batches the handler to one DOM write per
   paint frame, preventing layout thrashing on rapid scroll events.
   { passive: true } lets the browser skip waiting on this listener
   before performing its own scroll handling.
*/

const navEl      = document.getElementById('nav');
let   rafPending = false;

function updateNavShadow() {
  if (!navEl) return;
  navEl.classList.toggle('nav--scrolled', window.scrollY > 0);
  rafPending = false;
}

window.addEventListener('scroll', () => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(updateNavShadow);
}, { passive: true });

// Run once immediately in case the page loads already scrolled
updateNavShadow();


/* ── Mobile menu toggle ────────────────────────────────────── */

const menuBtn = document.getElementById('menuBtn');

menuBtn?.addEventListener('click', () => {
  const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!isOpen));

  // TODO: implement mobile nav drawer open/close
  console.log(`[Serenity] Mobile menu ${isOpen ? 'closed' : 'opened'}`);
});


/* ── Mode buttons: selection + smooth scroll ───────────────── */
/*
   Mode buttons scroll to #begin via their href (native anchor behaviour).
   We intercept only to persist the chosen mode and update the visual
   highlight — preventDefault() is never called, so the anchor scroll
   still fires normally through the browser.
*/

const modeButtons = document.querySelectorAll('.mode-btn');

// Moves the .mode-btn--active class to whichever button matches `mode`
function setActiveMode(mode) {
  modeButtons.forEach((btn) => {
    btn.classList.toggle('mode-btn--active', btn.dataset.mode === mode);
  });
}

if (modeButtons.length) {
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;

      // Persist so the Begin section (or a future session page) can read it
      sessionStorage.setItem('serenity_mode', mode);

      // Highlight the selected button immediately
      setActiveMode(mode);

      console.log(`[Serenity] Mode selected: ${mode}`);
      // TODO: launch the appropriate therapy session for the selected mode
    });
  });
}


/* ── Restore mode on page load ─────────────────────────────── */
/*
   Reads any previously chosen mode from sessionStorage and restores
   the visual active state so returning users see their last selection.
   Runs on DOMContentLoaded so all mode buttons are guaranteed to exist.
*/

document.addEventListener('DOMContentLoaded', () => {
  const restoredMode = sessionStorage.getItem('serenity_mode');

  if (restoredMode) {
    setActiveMode(restoredMode);
    console.log(`[Serenity] Restored mode from session: ${restoredMode}`);
    // TODO: pre-populate session UI based on restoredMode
  }
});
