import { catalogService } from '@/services';
export function useCatalog() { return catalogService.getCatalog(); }
