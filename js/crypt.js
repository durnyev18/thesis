(() => {
  'use strict';

  if (window.location.protocol === 'file:') {
    return;
  }

  const isFormField = (el) => {
    if (!el || !(el instanceof Element)) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'));
  };

  document.addEventListener(
    'contextmenu',
    (e) => {
      if (isFormField(e.target)) return;
      e.preventDefault();
    },
    true
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.defaultPrevented) return;

      const inField = isFormField(e.target);

      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return;
      }

      if (ctrl && (e.key === 's' || e.key === 'S') && !inField) {
        e.preventDefault();
        return;
      }

      if (ctrl && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) {
        e.preventDefault();
        return;
      }
    },
    true
  );
})();
