// src/store/selectors/activeListsSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { type RootState } from "../index";

// Basic selectors
export const selectActiveAccounts = (state: RootState) =>
  state.activeLists.accounts;
export const selectActiveAreas = (state: RootState) => state.activeLists.areas;
export const selectActiveCustomers = (state: RootState) =>
  state.activeLists.customers;
export const selectActiveProductCompanies = (state: RootState) =>
  state.activeLists.productCompanies;
export const selectActiveSalesmen = (state: RootState) =>
  state.activeLists.salesmen;
export const selectActiveUnits = (state: RootState) => state.activeLists.units;
export const selectActiveVans = (state: RootState) => state.activeLists.vans;
export const selectActiveProductGroups = (state:RootState)=>state.activeLists.groups;
export const selectActiveProducts = (state:RootState)=>state.activeLists.products;
export const selectActiveSuppliers = (state:RootState)=>state.activeLists.supplier;

// Memoized selectors for data only
export const selectActiveAccountsData = createSelector(
  selectActiveAccounts,
  (accounts) => accounts.data,
);

export const selectActiveAreasData = createSelector(
  selectActiveAreas,
  (areas) => areas.data,
);

export const selectActiveCustomersData = createSelector(
  selectActiveCustomers,
  (customers) => customers.data,
);

export const selectActiveProductCompaniesData = createSelector(
  selectActiveProductCompanies,
  (companies) => companies.data,
);

export const selectActiveSalesmenData = createSelector(
  selectActiveSalesmen,
  (salesmen) => salesmen.data,
);

export const selectActiveUnitsData = createSelector(
  selectActiveUnits,
  (units) => units.data
);

export const selectActiveVansData = createSelector(
  selectActiveVans,
  (vans) => vans.data,
);
export const selectActiveProductGroupsData = createSelector(
  selectActiveProductGroups,
  (groups) => groups.data,
);
export const selectActiveProductsData = createSelector(
  selectActiveProducts,
  (products) => {
    // console.log("products.data", products.data);
    return products.data;
  },
);

export const selectActiveSuppliersData = createSelector(
  selectActiveSuppliers,
  (suppliers) => suppliers.data,
);
// Loading selectors
export const selectIsLoading = createSelector(
  [
    selectActiveAccounts,
    selectActiveAreas,
    selectActiveCustomers,
    selectActiveProductCompanies,
    selectActiveSalesmen,
    selectActiveUnits,
    selectActiveVans,
    selectActiveProductGroups,
    selectActiveProducts,
    selectActiveSuppliers
  ],
  (...lists) => lists.some((list) => list.loading),
);

// Error selector (get first error if any)
export const selectAnyError = createSelector(
  [
    selectActiveAccounts,
    selectActiveAreas,
    selectActiveCustomers,
    selectActiveProductCompanies,
    selectActiveSalesmen,
    selectActiveUnits,
    selectActiveVans,
    selectActiveProductGroups,
    selectActiveProducts,
    selectActiveSuppliers
  ],
  (...lists) => {
    const errors = lists.map((list) => list.error).filter(Boolean);
    return errors.length > 0 ? errors[0] : null;
  },
);
