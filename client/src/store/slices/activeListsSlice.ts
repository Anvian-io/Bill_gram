// src/store/slices/activeListsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { accountService } from "@/services/accountService";
import { areaService } from "@/services/areaService";
import { customerService } from "@/services/customerService";
import { productCompanyService } from "@/services/productCompanyService";
import { salesmanService } from "@/services/salesmanService";
import { unitService } from "@/services/unitService";
import { vanService } from "@/services/vanService";
import {
  type Account,
  type Area,
  type Customer,
  type ProductCompany,
  type Salesman,
  type Unit,
  type Van,
  type ProductGroup,
} from "@/types";
import { productGroupService } from "@/services/productGroupService";

interface ActiveListsState {
  accounts: {
    data: Account[];
    loading: boolean;
    error: string | null;
  };
  areas: {
    data: Area[];
    loading: boolean;
    error: string | null;
  };
  customers: {
    data: Customer[];
    loading: boolean;
    error: string | null;
  };
  productCompanies: {
    data: ProductCompany[];
    loading: boolean;
    error: string | null;
  };
  salesmen: {
    data: Salesman[];
    loading: boolean;
    error: string | null;
  };
  units: {
    data: Unit[];
    loading: boolean;
    error: string | null;
  };
  vans: {
    data: Van[];
    loading: boolean;
    error: string | null;
  };
  groups: {
    data: ProductGroup[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: ActiveListsState = {
  accounts: { data: [], loading: false, error: null },
  areas: { data: [], loading: false, error: null },
  customers: { data: [], loading: false, error: null },
  productCompanies: { data: [], loading: false, error: null },
  salesmen: { data: [], loading: false, error: null },
  units: { data: [], loading: false, error: null },
  vans: { data: [], loading: false, error: null },
  groups: { data: [], loading: false, error: null },
};

// Async thunks for each resource
export const fetchActiveAccounts = createAsyncThunk(
  "activeLists/fetchActiveAccounts",
  async (_, { rejectWithValue }) => {
    try {
      return await accountService.getActiveAccounts();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch accounts",
      );
    }
  },
);

export const fetchActiveAreas = createAsyncThunk(
  "activeLists/fetchActiveAreas",
  async (_, { rejectWithValue }) => {
    try {
      return await areaService.getActiveAreas();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch areas",
      );
    }
  },
);

export const fetchActiveCustomers = createAsyncThunk(
  "activeLists/fetchActiveCustomers",
  async (_, { rejectWithValue }) => {
    try {
      return await customerService.getActiveCustomers();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers",
      );
    }
  },
);

export const fetchActiveProductCompanies = createAsyncThunk(
  "activeLists/fetchActiveProductCompanies",
  async (_, { rejectWithValue }) => {
    try {
      return await productCompanyService.getActiveProductCompanies();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product companies",
      );
    }
  },
);

export const fetchActiveSalesmen = createAsyncThunk(
  "activeLists/fetchActiveSalesmen",
  async (_, { rejectWithValue }) => {
    try {
      return await salesmanService.getActiveSalesmen();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch salesmen",
      );
    }
  },
);

export const fetchActiveUnits = createAsyncThunk(
  "activeLists/fetchActiveUnits",
  async (_, { rejectWithValue }) => {
    try {
      return await unitService.getActiveUnits();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch units",
      );
    }
  },
);

export const fetchActiveVans = createAsyncThunk(
  "activeLists/fetchActiveVans",
  async (_, { rejectWithValue }) => {
    try {
      return await vanService.getActiveVans();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch vans",
      );
    }
  },
);

export const fetchActiveProductGroups = createAsyncThunk(
  "activeLists/fetchActiveProductGroups",
  async (_, { rejectWithValue }) => {
    try {
      return await productGroupService.getActiveProductGroups();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product groups",
      );
    }
  },
);

// Master thunk to fetch all active lists
export const fetchAllActiveLists = createAsyncThunk(
  "activeLists/fetchAllActiveLists",
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchActiveAccounts()),
      dispatch(fetchActiveAreas()),
      dispatch(fetchActiveCustomers()),
      dispatch(fetchActiveProductCompanies()),
      dispatch(fetchActiveSalesmen()),
      dispatch(fetchActiveUnits()),
      dispatch(fetchActiveVans()),
      dispatch(fetchActiveProductGroups()),
    ]);
  },
);

const activeListsSlice = createSlice({
  name: "activeLists",
  initialState,
  reducers: {
    // Reset all lists
    resetAllLists: () => initialState,

    // Individual reset actions
    resetAccounts: (state) => {
      state.accounts = initialState.accounts;
    },
    resetAreas: (state) => {
      state.areas = initialState.areas;
    },
    resetCustomers: (state) => {
      state.customers = initialState.customers;
    },
    resetProductCompanies: (state) => {
      state.productCompanies = initialState.productCompanies;
    },
    resetSalesmen: (state) => {
      state.salesmen = initialState.salesmen;
    },
    resetUnits: (state) => {
      state.units = initialState.units;
    },
    resetVans: (state) => {
      state.vans = initialState.vans;
    },
    resetGroups: (state) => {
      state.groups = initialState.groups;
    },
  },
  extraReducers: (builder) => {
    // Accounts
    builder
      .addCase(fetchActiveAccounts.pending, (state) => {
        state.accounts.loading = true;
        state.accounts.error = null;
      })
      .addCase(fetchActiveAccounts.fulfilled, (state, action) => {
        state.accounts.loading = false;
        state.accounts.data = action.payload;
      })
      .addCase(fetchActiveAccounts.rejected, (state, action) => {
        state.accounts.loading = false;
        state.accounts.error = action.payload as string;
      });

    // Areas
    builder
      .addCase(fetchActiveAreas.pending, (state) => {
        state.areas.loading = true;
        state.areas.error = null;
      })
      .addCase(fetchActiveAreas.fulfilled, (state, action) => {
        state.areas.loading = false;
        state.areas.data = action.payload;
      })
      .addCase(fetchActiveAreas.rejected, (state, action) => {
        state.areas.loading = false;
        state.areas.error = action.payload as string;
      });

    // Customers
    builder
      .addCase(fetchActiveCustomers.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(fetchActiveCustomers.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.data = action.payload;
      })
      .addCase(fetchActiveCustomers.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      });

    // Product Companies
    builder
      .addCase(fetchActiveProductCompanies.pending, (state) => {
        state.productCompanies.loading = true;
        state.productCompanies.error = null;
      })
      .addCase(fetchActiveProductCompanies.fulfilled, (state, action) => {
        state.productCompanies.loading = false;
        state.productCompanies.data = action.payload;
      })
      .addCase(fetchActiveProductCompanies.rejected, (state, action) => {
        state.productCompanies.loading = false;
        state.productCompanies.error = action.payload as string;
      });

    // Salesmen
    builder
      .addCase(fetchActiveSalesmen.pending, (state) => {
        state.salesmen.loading = true;
        state.salesmen.error = null;
      })
      .addCase(fetchActiveSalesmen.fulfilled, (state, action) => {
        state.salesmen.loading = false;
        state.salesmen.data = action.payload;
      })
      .addCase(fetchActiveSalesmen.rejected, (state, action) => {
        state.salesmen.loading = false;
        state.salesmen.error = action.payload as string;
      });

    // Units
    builder
      .addCase(fetchActiveUnits.pending, (state) => {
        state.units.loading = true;
        state.units.error = null;
      })
      .addCase(fetchActiveUnits.fulfilled, (state, action) => {
        state.units.loading = false;
        state.units.data = action.payload;
      })
      .addCase(fetchActiveUnits.rejected, (state, action) => {
        state.units.loading = false;
        state.units.error = action.payload as string;
      });

    // Vans
    builder
      .addCase(fetchActiveVans.pending, (state) => {
        state.vans.loading = true;
        state.vans.error = null;
      })
      .addCase(fetchActiveVans.fulfilled, (state, action) => {
        state.vans.loading = false;
        state.vans.data = action.payload;
      })
      .addCase(fetchActiveVans.rejected, (state, action) => {
        state.vans.loading = false;
        state.vans.error = action.payload as string;
      });

    //Groups
    builder
      .addCase(fetchActiveProductGroups.pending, (state) => {
        state.groups.loading = true;
        state.groups.error = null;
      })
      .addCase(fetchActiveProductGroups.fulfilled, (state, action) => {
        state.groups.loading = false;
        state.groups.data = action.payload;
      })
      .addCase(fetchActiveProductGroups.rejected, (state, action) => {
        state.groups.loading = false;
        state.groups.error = action.payload as string;
      });
  },
});

export const {
  resetAllLists,
  resetAccounts,
  resetAreas,
  resetCustomers,
  resetProductCompanies,
  resetSalesmen,
  resetUnits,
  resetVans,
  resetGroups
} = activeListsSlice.actions;

export default activeListsSlice.reducer;
