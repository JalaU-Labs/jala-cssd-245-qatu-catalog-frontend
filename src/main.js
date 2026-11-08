/** @file Application bootstrap. Mounts the root container and marks it ready. */
import './styles/main.css';

const root = document.querySelector('#app');

if (!(root instanceof HTMLElement)) {
  throw new Error('Root element #app not found');
}

root.dataset.ready = 'true';
