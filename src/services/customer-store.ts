import { customerService } from './index';
import { toggleMuted, toggleSaved } from './discovery';
import type { CustomerPreferences } from '../types';

// One shared snapshot for every consumer, including independently mounted previews.
let snapshot: CustomerPreferences = customerService.read();
const listeners = new Set<() => void>();
function notify() { listeners.forEach(listener => listener()); }
function refresh() { snapshot = customerService.read(); notify(); }
function onStorage(event: StorageEvent) {
  if (event.key === 'bizapp.customer.v1' || event.key === null) refresh();
}
function change(transform: (value: CustomerPreferences) => CustomerPreferences) {
  const next = transform(customerService.read());
  customerService.write(next);
  snapshot = next;
  notify();
}
export const customerStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) {
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      refresh();
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
    };
  },
  save: (id: string) => change(value => toggleSaved(value, id)),
  mute: (id: string) => change(value => toggleMuted(value, id)),
};