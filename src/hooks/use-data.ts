import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import {
  businessService, walletService, categoryService, locationService, templateService, updateService, myBusinessService,
  ownUpdatesStore, prefsStore, trackStore,
} from "@/services";
import type { BusinessFilter } from "@/types";

export const useBusinesses = (filter?: BusinessFilter) =>
  useQuery({ queryKey: ["businesses", filter], queryFn: () => businessService.list(filter) });
export const useBusiness = (id?: string) =>
  useQuery({ queryKey: ["business", id], queryFn: () => businessService.getById(id!), enabled: !!id });
export const useUpdates = (companyId?: string) =>
  useQuery({ queryKey: ["updates", companyId], queryFn: () => updateService.list(companyId) });
export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: categoryService.getCategories });
export const useDistricts = () =>
  useQuery({ queryKey: ["districts"], queryFn: locationService.getDistricts });
export const useLocalities = (districtId?: string) =>
  useQuery({ queryKey: ["localities", districtId], queryFn: () => locationService.getLocalities(districtId) });
export const useTemplates = () =>
  useQuery({ queryKey: ["templates"], queryFn: templateService.list });
export const useWallet = () => useSyncExternalStore(walletService.subscribe, walletService.get);
export const useMyBusiness = () =>
  useQuery({ queryKey: ["myBusiness"], queryFn: myBusinessService.get });
export const useOwnUpdates = () => useSyncExternalStore(ownUpdatesStore.subscribe, ownUpdatesStore.get).items;
export const usePrefs = () => useSyncExternalStore(prefsStore.subscribe, prefsStore.get);
export const useTracking = () => useSyncExternalStore(trackStore.subscribe, trackStore.get);
