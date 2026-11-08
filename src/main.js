/** @file Application bootstrap. Mounts the root container and marks it ready. */
import './styles/main.css';
import { mountCatalogApp } from './app.js';
import { createCatalogStore } from './state/catalog-store.js';

const root = document.querySelector('#app');

if (!(root instanceof HTMLElement)) {
  throw new Error('Root element #app not found');
}

const store = createCatalogStore();
mountCatalogApp({ root, store });
store.load();
root.dataset.ready = 'true';
