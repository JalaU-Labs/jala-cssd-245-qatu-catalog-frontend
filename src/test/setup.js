/** @file Vitest setup. Runs before each test file in the jsdom environment. */
import { afterEach } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
});
