export function parseSelectedIds(selectedIds) {
  if (!selectedIds) return null;

  const ids = String(selectedIds)
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0);

  return ids.length > 0 ? ids : null;
}

export function appendSelectedIdsCondition(
  andConditions,
  selectedIds,
  field = "id",
) {
  const ids = parseSelectedIds(selectedIds);
  if (ids) {
    andConditions.push({ [field]: { in: ids } });
  }
  return ids;
}
