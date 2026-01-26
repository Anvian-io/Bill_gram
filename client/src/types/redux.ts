import {
  type Account,
  type Area,
  type Customer,
  type ProductCompany,
  // type ProductGroup,
  type Salesman,
  type Unit,
  type Van,
} from "./index";
export interface ApiState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export interface ActiveListsState {
  accounts: ApiState<Account[]>;
  areas: ApiState<Area[]>;
  customers: ApiState<Customer[]>;
  productCompanies: ApiState<ProductCompany[]>;
  salesmen: ApiState<Salesman[]>;
  units: ApiState<Unit[]>;
  vans: ApiState<Van[]>;
}
