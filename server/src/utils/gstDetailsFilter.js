const DEFAULT_GST_DETAILS_ID = "1";

const GST_DETAILS_WITH_VALUES = [
  "1",
  "With GST",
  "with gst",
  "Against GST",
  "against gst",
];

const GST_DETAILS_WITHOUT_VALUES = ["2", "Without GST", "without gst"];

const GST_DETAILS_BOTH_VALUES = [
  "0",
  "Both",
  "both",
  "With GST and Without GST",
  "With GST & Without GST",
  "with gst and without gst",
  "with gst & without gst",
];

const GST_FILTER_VALUE_MAP = {
  0: GST_DETAILS_BOTH_VALUES,
  1: GST_DETAILS_WITH_VALUES,
  2: GST_DETAILS_WITHOUT_VALUES,
};

export const normalizeGstDetails = (value) => {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_GST_DETAILS_ID;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  const valueMap = {
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

  return valueMap[normalizedValue] ?? DEFAULT_GST_DETAILS_ID;
};

export const getGstDetailsFilterValue = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    String(value).trim().toLowerCase() === "all"
  ) {
    return null;
  }

  return normalizeGstDetails(value);
};

export const getGstDetailsMatchingValues = (value) => {
  const normalizedGstDetails = getGstDetailsFilterValue(value);
  if (normalizedGstDetails === null) return null;
  return GST_FILTER_VALUE_MAP[normalizedGstDetails] || null;
};

export const appendGstDetailsCondition = (andConditions, value) => {
  const normalizedGstDetails = getGstDetailsFilterValue(value);
  if (normalizedGstDetails !== null) {
    const matchingValues = getGstDetailsMatchingValues(value);
    if (matchingValues?.length) {
      andConditions.push({ gstDetails: { in: matchingValues } });
    }
  }
  return normalizedGstDetails;
};
