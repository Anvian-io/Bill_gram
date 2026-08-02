export const SHARED_COMPANY_PROFILE_FIELDS = [
  "shop_name",
  "phone",
  "company_logo",
  "signature",
  "upi_id",
  "company_name",
  "address",
];

const hasStoredValue = (value) =>
  value !== null && value !== undefined && value !== "";

export const pickSharedCompanyProfile = (data = {}) =>
  SHARED_COMPANY_PROFILE_FIELDS.reduce((profile, field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      profile[field] = data[field];
    }
    return profile;
  }, {});

export async function getSharedCompanyProfile(prisma) {
  const fieldValues = await Promise.all(
    SHARED_COMPANY_PROFILE_FIELDS.map(async (field) => {
      const profileOwner = await prisma.user.findFirst({
        where: {
          AND: [{ [field]: { not: null } }, { [field]: { not: "" } }],
        },
        orderBy: { updatedAt: "desc" },
        select: { [field]: true },
      });

      return [field, profileOwner?.[field] ?? null];
    }),
  );

  return Object.fromEntries(fieldValues);
}

export function applySharedCompanyProfile(user, sharedProfile = {}) {
  if (!user) return user;

  const mergedUser = { ...user };
  for (const field of SHARED_COMPANY_PROFILE_FIELDS) {
    if (hasStoredValue(sharedProfile[field])) {
      mergedUser[field] = sharedProfile[field];
    }
  }

  return mergedUser;
}

export async function propagateSharedCompanyProfile(prisma, profileData) {
  const sharedProfile = pickSharedCompanyProfile(profileData);
  if (Object.keys(sharedProfile).length === 0) return;

  await prisma.user.updateMany({
    data: sharedProfile,
  });
}
