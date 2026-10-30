import { useQuery } from "@tanstack/react-query";
import {
  businessService, categoryService, locationService, templateService, updateService,
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
