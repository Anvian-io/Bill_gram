export const GST_DETAILS_DEFAULT_ID = "1";

export const gst_details = [
  {
    id: 1,
    type: "With GST",
  },
  {
    id: 2,
    type: "Without GST",
  },
  {
    id: 0,
    type: "Both",
  },
] as const;

const gstDetailsValueMap: Record<string, string> = {
  "0": "0",
  "1": "1",
  "2": "2",
  both: "0",
  "with gst": "1",
  "without gst": "2",
  "against gst": "1",
  "with gst and without gst": "0",
  "with gst & without gst": "0",
};

export const normalizeGstDetailsValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return GST_DETAILS_DEFAULT_ID;
  }

  const normalizedValue = String(value).trim();
  return (
    gstDetailsValueMap[normalizedValue.toLowerCase()] ?? GST_DETAILS_DEFAULT_ID
  );
};

export const getGstDetailsLabel = (value: unknown): string => {
  const normalizedValue = normalizeGstDetailsValue(value);

  return (
    gst_details.find((gst) => String(gst.id) === normalizedValue)?.type ??
    "With GST"
  );
};
