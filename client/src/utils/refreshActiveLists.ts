import { store } from "@/store";
import { fetchAllActiveLists } from "@/store/slices/activeListsSlice";

/** Reload Redux active-list caches used by dropdowns across the app. */
export function refreshActiveLists() {
  return store.dispatch(fetchAllActiveLists());
}
