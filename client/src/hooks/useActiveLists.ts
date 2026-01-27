// src/hooks/useActiveLists.ts
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectActiveAccountsData,
  selectActiveAreasData,
  selectActiveCustomersData,
  selectActiveProductCompaniesData,
  selectActiveSalesmenData,
  selectActiveUnitsData,
  selectActiveVansData,
  selectIsLoading,
  selectAnyError,
  selectActiveProductGroupsData
} from "@/store/selectors/activeListsSelectors";
import { fetchAllActiveLists } from "@/store/slices/activeListsSlice";
import { toast } from "sonner";

export const useActiveLists = () => {
  const dispatch = useAppDispatch();

  const accounts = useAppSelector(selectActiveAccountsData);
  const areas = useAppSelector(selectActiveAreasData);
  const customers = useAppSelector(selectActiveCustomersData);
  const productCompanies = useAppSelector(selectActiveProductCompaniesData);
  const salesmen = useAppSelector(selectActiveSalesmenData);
  const units = useAppSelector(selectActiveUnitsData);
  const vans = useAppSelector(selectActiveVansData);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAnyError);
  const groups = useAppSelector(selectActiveProductGroupsData)
  // Refresh all active lists
  const refresh = async (showToast: boolean = true) => {
    try {
      await dispatch(fetchAllActiveLists()).unwrap();
      if (showToast) {
        toast.success("Data refreshed successfully!");
      }
    } catch (error: any) {
      if (showToast) {
        toast.error("Failed to refresh data", {
          description: error.message || "Please try again",
        });
      }
      throw error;
    }
  };

  return {
    // Data
    accounts,
    areas,
    customers,
    productCompanies,
    salesmen,
    units,
    vans,
    groups,

    // State
    isLoading,
    error,
    hasData: !isLoading && !error,

    // Actions
    refresh,
  };
};
