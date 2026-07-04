import { useState, useCallback } from "react";

export function useReportRowSelection<T>(
  getRowId: (item: T) => number,
) {
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  const handleSelectAll = useCallback(
    (checked: boolean | "indeterminate", allRows: T[]) => {
      if (checked === true) {
        setSelectedRowIds(allRows.map(getRowId));
      } else {
        setSelectedRowIds([]);
      }
    },
    [getRowId],
  );

  const handleSelectRow = useCallback((id: number, checked: boolean) => {
    setSelectedRowIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((rowId) => rowId !== id);
    });
  }, []);

  const applySelectedIds = useCallback(
    <F>(filters: F): F => {
      if (selectedRowIds.length === 0) return filters;
      return { ...filters, selectedIds: selectedRowIds } as F;
    },
    [selectedRowIds],
  );

  const isAllSelected = useCallback(
    (allRows: T[]) =>
      allRows.length > 0 && selectedRowIds.length === allRows.length,
    [selectedRowIds],
  );

  const isSomeSelected = useCallback(
    (allRows: T[]) =>
      selectedRowIds.length > 0 && selectedRowIds.length < allRows.length,
    [selectedRowIds],
  );

  const clearSelection = useCallback(() => setSelectedRowIds([]), []);

  return {
    selectedRowIds,
    setSelectedRowIds,
    handleSelectAll,
    handleSelectRow,
    applySelectedIds,
    isAllSelected,
    isSomeSelected,
    clearSelection,
  };
}
