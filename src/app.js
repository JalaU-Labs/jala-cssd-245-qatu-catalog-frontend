import { createPagination } from './components/pagination.js';
import { createProductCard } from './components/product-card.js';
import { createSearchBar } from './components/search-bar.js';
import { createSkeletonGrid } from './components/skeleton.js';
import { createStateMessage } from './components/state-message.js';

/**
 * Mounts the catalog shell and connects presentation components to a catalog store.
 *
 * @param {{ root: HTMLElement, store: ReturnType<typeof import('./state/catalog-store.js').createCatalogStore> }} options Root and catalog store.
 * @returns {{ unmount: () => void }} App lifecycle API.
 * @throws {TypeError} If root or store is invalid.
 */
export function mountCatalogApp({ root, store }) {
  if (!(root instanceof HTMLElement)) {
    throw new TypeError('root must be an HTMLElement');
  }
  if (
    !store ||
    typeof store.getState !== 'function' ||
    typeof store.subscribe !== 'function' ||
    typeof store.setSearch !== 'function' ||
    typeof store.setPage !== 'function' ||
    typeof store.retry !== 'function'
  ) {
    throw new TypeError('store must expose getState and subscribe');
  }

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const header = document.createElement('header');
  header.className = 'app-header';
  const heading = document.createElement('h1');
  heading.textContent = 'Qatu Marketplace';
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Discover products from local sellers.';
  header.append(heading, subtitle);

  const main = document.createElement('main');
  main.className = 'app-main';
  const searchSection = document.createElement('section');
  searchSection.className = 'app-search';
  searchSection.setAttribute('aria-label', 'Product search');
  const results = document.createElement('section');
  results.className = 'app-results';
  results.setAttribute('aria-label', 'Catalog results');
  main.append(searchSection, results);

  const footer = document.createElement('footer');
  footer.className = 'app-footer';
  footer.textContent = 'Qatu Marketplace';
  shell.append(header, main, footer);
  root.replaceChildren(shell);

  const searchBar = createSearchBar(
    { initialValue: store.getState().search },
    { onSearch: (value) => store.setSearch(value) },
  );
  searchSection.append(searchBar);

  /** @param {ReturnType<typeof store.getState>} state */
  const render = (state) => {
    results.setAttribute('aria-busy', String(state.status === 'loading'));
    results.replaceChildren();

    if (state.status === 'idle' || state.status === 'loading') {
      results.append(createSkeletonGrid(state.limit));
      return;
    }

    if (state.status === 'error') {
      results.append(
        createStateMessage(
          {
            variant: 'error',
            title: 'Unable to load products',
            description: state.error?.message ?? 'Please try again.',
            actionLabel: 'Retry',
          },
          { onAction: () => store.retry() },
        ),
      );
      return;
    }

    if (state.products.length === 0) {
      const isSearchActive = state.search.length > 0;
      results.append(
        createStateMessage(
          {
            variant: 'empty',
            title: isSearchActive ? 'No matching products' : 'No products available',
            description: isSearchActive
              ? 'Try a different search term.'
              : 'There are no products to display right now.',
            ...(isSearchActive ? { actionLabel: 'Clear search' } : {}),
          },
          isSearchActive
            ? {
                onAction: () => {
                  searchBar.setValue('');
                  store.setSearch('');
                },
              }
            : {},
        ),
      );
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'product-grid';
    for (const product of state.products) {
      grid.append(createProductCard(product));
    }
    results.append(grid);
    results.append(
      createPagination(
        {
          page: state.meta.page,
          totalPages: state.meta.total_pages,
          total: state.meta.total,
        },
        { onPageChange: (page) => store.setPage(page) },
      ),
    );
  };

  const unsubscribe = store.subscribe(render);
  render(store.getState());
  let mounted = true;

  return {
    unmount() {
      if (!mounted) {
        return;
      }
      mounted = false;
      unsubscribe();
      root.replaceChildren();
    },
  };
}
