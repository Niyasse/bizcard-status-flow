import { expect, test } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { useCustomer } from '../contexts/CustomerContext';

test('customer preferences render without a CustomerProvider', () => {
  function Consumer() {
    const { preferences } = useCustomer();
    return createElement('output', null, preferences.savedIds.length);
  }
  expect(() => renderToString(createElement(Consumer))).not.toThrow();
});