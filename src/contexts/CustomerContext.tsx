import { useSyncExternalStore, type ReactNode } from 'react';
import { customerStore } from '@/services/customer-store';
import { toast } from 'sonner';
// Compatibility wrapper for existing callers; preference access is not provider-dependent.
export function CustomerProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function useCustomer() {
  const preferences = useSyncExternalStore(customerStore.subscribe, customerStore.getSnapshot, customerStore.getSnapshot);
  const run = (action: (id: string) => void, id: string) => {
    try { action(id); }
    catch { toast.error('Unable to save on this device. Please allow browser storage.'); }
  };
  return { preferences, save: (id: string) => run(customerStore.save, id), mute: (id: string) => run(customerStore.mute, id) };
}
