// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { fetchAllActiveLists } from "@/store/slices/activeListsSlice";
import { toast } from "sonner";

export default function AppInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await dispatch(fetchAllActiveLists()).unwrap();
      } catch (error) {
        console.error("Failed to initialize app data:", error);
        toast.error(
          "Failed to load initial data. Some features may not work properly.",
        );
      }
    };

    initializeApp();
  }, [dispatch]);

  return null; // This component doesn't render anything
}
