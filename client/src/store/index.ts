// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import activeListsReducer from "./slices/activeListsSlice";

export const store = configureStore({
  reducer: {
    activeLists: activeListsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// src/components/SomeComponent.tsx
// import React, { useEffect } from 'react';
// import { useActiveLists } from '@/hooks/useActiveLists';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// export default function SomeComponent() {
//   const { units, isLoading, error } = useActiveLists();

//   if (isLoading) {
//     return <div>Loading units...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <Select>
//       <SelectTrigger>
//         <SelectValue placeholder="Select unit" />
//       </SelectTrigger>
//       <SelectContent>
//         {units.map((unit) => (
//           <SelectItem key={unit.id} value={unit.id.toString()}>
//             {unit.name} ({unit.symbol})
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// }