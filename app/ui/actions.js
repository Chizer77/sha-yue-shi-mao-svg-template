export const find = (id) => document.getElementById(id);

export const handleAction = (notice, action) => async (event) => {
  try {
    await action(event);
  } catch (error) {
    notice(error.message);
  }
};

export function mountInspector() {
  find('close-assets').onclick = () => {
    document.body.classList.add('panel-hidden');
    document.body.classList.remove('panel-open');
  };
  find('toggle-panel').onclick = () => {
    document.body.classList.remove('panel-hidden');
    document.body.classList.toggle('panel-open');
  };
  const observer = new ResizeObserver(([entry]) =>
    document.body.style.setProperty(
      '--header-height',
      `${entry.target.getBoundingClientRect().height}px`,
    ),
  );
  observer.observe(document.querySelector('.site-header'));
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}
