const variants = new Set(['error', 'empty', 'info']);

/**
 * Creates an accessible status, empty-state, or error message.
 *
 * @param {{ variant?: string, title?: string, description?: string, actionLabel?: string }} [options] Message content and variant.
 * @param {{ onAction?: () => void }} [callbacks] Optional action callback.
 * @returns {HTMLElement} State message container.
 * @throws {RangeError} If variant is not supported.
 */
export function createStateMessage(
  { variant = 'info', title = '', description, actionLabel } = {},
  { onAction } = {},
) {
  if (!variants.has(variant)) {
    throw new RangeError(`Invalid variant: ${variant}`);
  }

  const container = document.createElement('div');
  container.className = `state-message state-message--${variant}`;
  container.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  container.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');

  const heading = document.createElement('h2');
  heading.className = 'state-message__title';
  heading.textContent = title;
  container.append(heading);

  if (description !== undefined) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'state-message__description';
    descriptionElement.textContent = description;
    container.append(descriptionElement);
  }

  if (actionLabel && typeof onAction === 'function') {
    const button = document.createElement('button');
    button.className = 'state-message__action';
    button.type = 'button';
    button.textContent = actionLabel;
    button.addEventListener('click', () => onAction());
    container.append(button);
  }

  return container;
}
