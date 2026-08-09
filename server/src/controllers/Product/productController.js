import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";
import path from "path";
import fs from "fs";
import { createNotification } from "../../utils/notificationHelper.js";
import { getDatabasePath } from "../../db/database.js";
import { extractFilename, getImageUrl } from "../../utils/imageUrl.js";

const parseOptionalInt = (value, fallback = null) => {
  if (value === undefined) return fallback;
  if (value === null || value === "") return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Get products directory path (kept for potential future use)
 */
function getProductsImageDirectory() {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  const imagesDir = path.join(dbDir, "images");

  // Ensure directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  return imagesDir;
}

const batchSelectFields = {
  id: true,
  batchNo: true,
  mfgDate: true,
  expDate: true,
  barcode: true,
  basicPrice: true,
  openingStock: true,
  mrp: true,
  purchaseRate: true,
  saleRate: true,
  margin: true,
  gstAmount: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
};

function normalizeBatchPinFlags(batches = []) {
  let pinnedIndex = -1;
  batches.forEach((batch, index) => {
    if (batch.isPinned) {
      if (pinnedIndex === -1) {
        pinnedIndex = index;
      } else {
        batch.isPinned = false;
      }
    }
  });
  return batches;
}


/**
 * Create Product
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    // Basic Info
    productCode,
    productBrand,
    description,
    hsnSacCode,
    goodsServices,
    weight,
    unitId,
    productGroupId,

    // Additional Info
    productShortName,
    purchaseUnit,
    conversionFactor,
    pricePerPcs,
    productCompanyId,
    saleUnit,
    cartonPack,
    innerPack,

    // Packaging & Insurance Tax
    packagingBasic,
    packagingMRP,
    insuranceTaxBasic,
    insuranceTaxMRP,

    // GST Details
    gstRate,
    gstInclusive,
    cessRate,
    hsnChapter,
    gstApplicability,

    // Status
    status = true,

    // Images
    mainImage,
    relatedImages = [],

    // Batches
    batches = [],
  } = req.body;

  // Validate required fields
  if (
    !productCode ||
    !productBrand ||
    !description ||
    !hsnSacCode ||
    !goodsServices
  ) {
    return sendResponse(
      res,
      false,
      null,
      "Required fields are missing",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product with same code already exists
  const existingProduct = await prisma.product.findFirst({
    where: {
      productCode,
      deleted: false,
    },
  });

  if (existingProduct) {
    return sendResponse(
      res,
      false,
      null,
      "Product with this code already exists",
      statusType.CONFLICT,
    );
  }

  // Validate unit exists
  if (unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: parseInt(unitId), deleted: false, status: true },
    });
    if (!unit) {
      return sendResponse(
        res,
        false,
        null,
        "Unit not found",
        statusType.NOT_FOUND,
      );
    }
  }

  // Validate product group exists
  if (productGroupId) {
    const productGroup = await prisma.productGroup.findFirst({
      where: { id: parseInt(productGroupId), deleted: false, status: true },
    });
    if (!productGroup) {
      return sendResponse(
        res,
        false,
        null,
        "Product group not found",
        statusType.NOT_FOUND,
      );
    }
  }

  // Validate product company exists
  if (productCompanyId) {
    const productCompany = await prisma.productCompany.findFirst({
      where: { id: parseInt(productCompanyId), deleted: false, status: true },
    });
    if (!productCompany) {
      return sendResponse(
        res,
        false,
        null,
        "Product company not found",
        statusType.NOT_FOUND,
      );
    }
  }

  try {
    // Extract filename from main image (if it's a URL)
    const mainImageFilename = extractFilename(mainImage);

    // Create product with batches and images in transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          productCode,
          productBrand,
          description,
          hsnSacCode,
          goodsServices,
          weight: parseFloat(weight),
          unitId: unitId ? parseInt(unitId) : null,
          productGroupId: productGroupId ? parseInt(productGroupId) : null,
          productShortName,
          purchaseUnit,
          conversionFactor: conversionFactor ? parseFloat(conversionFactor) : 1,
          pricePerPcs: pricePerPcs ? parseFloat(pricePerPcs) : 0,
          productCompanyId: productCompanyId
            ? parseInt(productCompanyId)
            : null,
          saleUnit,
          cartonPack: cartonPack ? parseInt(cartonPack) : 1,
          innerPack: parseOptionalInt(innerPack),
          packagingBasic: packagingBasic || false,
          packagingMRP: packagingMRP || false,
          insuranceTaxBasic: insuranceTaxBasic || false,
          insuranceTaxMRP: insuranceTaxMRP || false,
          gstRate: gstRate ? parseFloat(gstRate) : 18,
          gstInclusive: gstInclusive || true,
          cessRate: cessRate ? parseFloat(cessRate) : 0,
          hsnChapter,
          gstApplicability: gstApplicability || "Regular",
          status,
          mainImage: mainImageFilename, // Store only filename
          userId: req.user?.id || null,
        },
      });

      // Create batches if provided
      if (batches && batches.length > 0) {
        const normalizedBatches = normalizeBatchPinFlags(batches);
        await Promise.all(
          normalizedBatches.map((batch) =>
            tx.batch.create({
              data: {
                batchNo: batch.bNo,
                mfgDate: batch.mfgDate,
                expDate: batch.expDate,
                barcode: batch.barcode,
                basicPrice: parseFloat(batch.basicPrice),
                openingStock: parseInt(batch.openingStock),
                mrp: parseFloat(batch.mrp),
                purchaseRate: parseFloat(batch.pRate),
                saleRate: parseFloat(batch.sRate),
                margin: parseFloat(batch.margin),
                gstAmount: parseFloat(batch.gstAmount || 0),
                isPinned: Boolean(batch.isPinned),
                productId: newProduct.id,
              },
            }),
          ),
        );
      }

      // Create related images if provided
      if (relatedImages && relatedImages.length > 0) {
        await Promise.all(
          relatedImages
            .map((imageUrl, index) => {
              // Extract filename from URL
              const filename = extractFilename(imageUrl);
              if (!filename) return null;

              return tx.productImage.create({
                data: {
                  imageUrl: filename, // Store only filename
                  imageType: "related",
                  sortOrder: index,
                  productId: newProduct.id,
                },
              });
            })
            .filter(Boolean), // Filter out null entries
        );
      }

      return newProduct;
    });

    // Fetch complete product with relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        productGroup: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        productCompany: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        batches: true,
        relatedImages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Convert image paths to URLs
    const productWithUrls = {
      ...completeProduct,
      mainImage: getImageUrl(completeProduct.mainImage),
      relatedImages: completeProduct.relatedImages.map((img) => ({
        ...img,
        imageUrl: getImageUrl(img.imageUrl),
      })),
    };
    await createNotification({
  title: "New Product Created",
  message: `Product "${product.productCode} - ${product.productBrand}" has been created by ${req.user?.username || 'Admin'}`,
  type: "success",
  section: null,
  page: "product"
}, res);
    return sendResponse(
      res,
      true,
      {
        message: "Product created successfully",
        product: productWithUrls,
      },
      "Product created",
      statusType.CREATED,
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error creating product",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * Get All Products with Pagination, Search and Filters
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    productCode = "",
    productBrand = "",
    description = "",
    saleUnit = "",
    purchaseUnit = "",
    hsnSacCode = "",
    productGroupId,
    productCompanyId,
    status,
    showDeleted = "false",
    sortBy = "createdAt",
    sortOrder = "desc",
    minStock,
    maxStock,
    // Manufacturing date range
    mfgFromDate,
    mfgToDate,
    // Expiry date range
    expFromDate,
    expToDate,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { page: validatedPage, limit: validatedLimit } = validatePagination(
    page,
    limit,
  );

  const skip = (validatedPage - 1) * validatedLimit;

  // Build where clause
  const andConditions = [];

  // Deleted filter
  if (showDeleted !== "true") {
    andConditions.push({ deleted: false });
  }

  // Status filter
  if (status !== undefined) {
    andConditions.push({
      status: status === "true" || status === true,
    });
  }

  // Product code filter
  if (productCode) {
    andConditions.push({
      productCode: { contains: productCode },
    });
  }

  // Product brand filter
  if (productBrand) {
    andConditions.push({
      productBrand: { contains: productBrand },
    });
  }

  // Description filter
  if (description) {
    andConditions.push({
      description: { contains: description },
    });
  }

  // Sale unit filter
  if (saleUnit) {
    andConditions.push({
      saleUnit: saleUnit.toString(),
    });
  }

  // Purchase unit filter
  if (purchaseUnit) {
    andConditions.push({
      purchaseUnit: purchaseUnit.toString(),
    });
  }

  // HSN/SAC code filter
  if (hsnSacCode) {
    andConditions.push({
      hsnSacCode: { contains: hsnSacCode },
    });
  }

  // Product group filter
  if (productGroupId) {
    andConditions.push({
      productGroupId: parseInt(productGroupId),
    });
  }

  // Product company filter
  if (productCompanyId) {
    andConditions.push({
      productCompanyId: parseInt(productCompanyId),
    });
  }

  // Stock Range Filter (Min/Max Total Opening Stock)
  if (
    (minStock !== undefined && minStock !== "") ||
    (maxStock !== undefined && maxStock !== "")
  ) {
    const min =
      minStock !== undefined && minStock !== "" ? parseInt(minStock) : 0;
    const max =
      maxStock !== undefined && maxStock !== ""
        ? parseInt(maxStock)
        : 999999999;

    const productsWithStock = await prisma.$queryRaw`
      SELECT productId 
      FROM batches 
      GROUP BY productId 
      HAVING SUM(opening_stock) >= ${min} 
      AND SUM(opening_stock) <= ${max}
    `;

    const productIds = (productsWithStock).map((p) => p.productId);

    if (productIds.length > 0) {
      andConditions.push({ id: { in: productIds } });
    } else {
      andConditions.push({ id: { in: [] } }); // empty result
    }
  }

  // Manufacturing date range – batches must have mfgDate within range
  if (mfgFromDate || mfgToDate) {
    const mfgCondition = {};
    if (mfgFromDate) mfgCondition.gte = mfgFromDate; // YYYY-MM-DD
    if (mfgToDate) mfgCondition.lte = mfgToDate;
    andConditions.push({
      batches: { some: { mfgDate: mfgCondition } },
    });
  }

  // Expiry date range
  if (expFromDate || expToDate) {
    const expCondition = {};
    if (expFromDate) expCondition.gte = expFromDate;
    if (expToDate) expCondition.lte = expToDate;
    andConditions.push({
      batches: { some: { expDate: expCondition } },
    });
  }

  // Search in multiple fields
  if (search) {
    andConditions.push({
      OR: [
        { productCode: { contains: search  } },
        { productBrand: { contains: search  } },
        { description: { contains: search  } },
        { productShortName: { contains: search  } },
        { hsnSacCode: { contains: search  } },
      ],
    });
  }

  const where = andConditions.length ? { AND: andConditions } : {};

  // Sorting
  const validSortFields = [
    "productCode",
    "productBrand",
    "createdAt",
    "updatedAt",
    "pricePerPcs",
  ];
  const validSortOrder = ["asc", "desc"];

  const orderBy = {
    [validSortFields.includes(sortBy ) ? sortBy : "createdAt"]:
      validSortOrder.includes((sortOrder ).toLowerCase())
        ? (sortOrder ).toLowerCase()
        : "desc",
  };

  // Build batch where condition for the include (to filter returned batches by date range if needed)
  // But we already filtered products by batch existence; we may still want to return all batches of those products.
  // If you want to also filter the batches returned per product, you can add a where clause inside include.
  // For simplicity, we return all batches of matched products.

  // Query with relations
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        unit: { select: { id: true, name: true, symbol: true } },
        productGroup: { select: { id: true, name: true } },
        productCompany: { select: { id: true, name: true } },
        batches: { orderBy: { createdAt: "desc" } },
        relatedImages: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, imageUrl: true, imageType: true, sortOrder: true },
        },
        _count: { select: { batches: true, relatedImages: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Convert file paths to public URLs
  const productsWithUrls = products.map((product) => {
    const totalOpeningStock = product.batches.reduce(
      (sum, batch) => sum + (batch.openingStock || 0),
      0,
    );

    return {
      ...product,
      totalOpeningStock,
      mainImage: getImageUrl(product.mainImage),
      relatedImages: product.relatedImages.map((img) => ({
        ...img,
        imageUrl: getImageUrl(img.imageUrl),
      })),
    };
  });

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      products: productsWithUrls,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Products retrieved successfully",
    statusType.OK,
  );
});

/**
 * Get Active Products (for dropdown) - Returns products with their batches as arrays
 */
export const getActiveProducts = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const products = await prisma.product.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      productCode: true,
      productBrand: true,
      productShortName: true,
      description: true,
      hsnSacCode: true,
      goodsServices: true,
      weight: true,
      pricePerPcs: true,
      gstRate: true,
      gstInclusive: true,
      cessRate: true,
      cartonPack: true,
      innerPack: true,
      saleUnit: true,
      purchaseUnit: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      conversionFactor: true,
      productShortName:true,
      productBrand:true,
      unit: {
        select: {
          id: true,
          name: true,
          symbol: true,
        },
      },
      productGroup: {
        select: {
          id: true,
          name: true,
        },
      },
      productCompany: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      productBrand: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    {
      products,
      count: products.length,
    },
    "Active products retrieved successfully",
    statusType.OK,
  );
});

/**
 * Get Single Product by ID
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const product = await prisma.product.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    include: {
      unit: {
        select: {
          id: true,
          name: true,
          symbol: true,
        },
      },
      productGroup: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      productCompany: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      batches: {
        orderBy: { createdAt: "desc" },
      },
      relatedImages: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product) {
    return sendResponse(
      res,
      false,
      null,
      "Product not found",
      statusType.NOT_FOUND,
    );
  }

  // Calculate total opening stock from all batches
  const totalOpeningStock = product.batches.reduce(
    (sum, batch) => sum + (batch.openingStock || 0),
    0,
  );

  // Convert image paths to public URLs
  const productWithUrls = {
    ...product,
    totalOpeningStock,
    mainImage: getImageUrl(product.mainImage),
    relatedImages: product.relatedImages.map((image) => ({
      ...image,
      imageUrl: getImageUrl(image.imageUrl),
    })),
  };

  return sendResponse(
    res,
    true,
    { product: productWithUrls },
    "Product retrieved successfully",
    statusType.OK,
  );
});

/**
 * Update Product
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    // Basic Info
    productCode,
    productBrand,
    description,
    hsnSacCode,
    goodsServices,
    weight,
    unitId,
    productGroupId,

    // Additional Info
    productShortName,
    purchaseUnit,
    conversionFactor,
    pricePerPcs,
    productCompanyId,
    saleUnit,
    cartonPack,
    innerPack,

    // Packaging & Insurance Tax
    packagingBasic,
    packagingMRP,
    insuranceTaxBasic,
    insuranceTaxMRP,

    // GST Details
    gstRate,
    gstInclusive,
    cessRate,
    hsnChapter,
    gstApplicability,

    // Status
    status,

    // Images
    mainImage,
    relatedImages = [],

    // Batches
    batches = [],
  } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product exists
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingProduct) {
    return sendResponse(
      res,
      false,
      null,
      "Product not found",
      statusType.NOT_FOUND,
    );
  }

  if (existingProduct.isLocked) {
    return sendResponse(
      res,
      false,
      null,
      "Product is locked and cannot be modified",
      statusType.FORBIDDEN,
    );
  }

  // Check if new product code conflicts with other products
  if (productCode && productCode !== existingProduct.productCode) {
    const codeConflict = await prisma.product.findFirst({
      where: {
        productCode,
        deleted: false,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (codeConflict) {
      return sendResponse(
        res,
        false,
        null,
        "Product with this code already exists",
        statusType.CONFLICT,
      );
    }
  }

  try {
    // Extract filename from main image (if it's a URL)
    const mainImageFilename =
      mainImage !== undefined
        ? extractFilename(mainImage)
        : existingProduct.mainImage;

    // Update product with batches and images in transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: {
          id: parseInt(id),
        },
        data: {
          productCode: productCode || existingProduct.productCode,
          productBrand: productBrand || existingProduct.productBrand,
          description: description || existingProduct.description,
          hsnSacCode: hsnSacCode || existingProduct.hsnSacCode,
          goodsServices: goodsServices || existingProduct.goodsServices,
          weight:
            weight !== undefined ? parseFloat(weight) : existingProduct.weight,
          unitId: unitId ? parseInt(unitId) : existingProduct.unitId,
          productGroupId: productGroupId
            ? parseInt(productGroupId)
            : existingProduct.productGroupId,
          productShortName:
            productShortName || existingProduct.productShortName,
          purchaseUnit: purchaseUnit || existingProduct.purchaseUnit,
          conversionFactor:
            conversionFactor !== undefined
              ? parseFloat(conversionFactor)
              : existingProduct.conversionFactor,
          pricePerPcs:
            pricePerPcs !== undefined
              ? parseFloat(pricePerPcs)
              : existingProduct.pricePerPcs,
          productCompanyId: productCompanyId
            ? parseInt(productCompanyId)
            : existingProduct.productCompanyId,
          saleUnit: saleUnit || existingProduct.saleUnit,
          cartonPack:
            cartonPack !== undefined
              ? parseInt(cartonPack)
              : existingProduct.cartonPack,
          innerPack: parseOptionalInt(innerPack, existingProduct.innerPack),
          packagingBasic:
            packagingBasic !== undefined
              ? packagingBasic
              : existingProduct.packagingBasic,
          packagingMRP:
            packagingMRP !== undefined
              ? packagingMRP
              : existingProduct.packagingMRP,
          insuranceTaxBasic:
            insuranceTaxBasic !== undefined
              ? insuranceTaxBasic
              : existingProduct.insuranceTaxBasic,
          insuranceTaxMRP:
            insuranceTaxMRP !== undefined
              ? insuranceTaxMRP
              : existingProduct.insuranceTaxMRP,
          gstRate:
            gstRate !== undefined
              ? parseFloat(gstRate)
              : existingProduct.gstRate,
          gstInclusive:
            gstInclusive !== undefined
              ? gstInclusive
              : existingProduct.gstInclusive,
          cessRate:
            cessRate !== undefined
              ? parseFloat(cessRate)
              : existingProduct.cessRate,
          hsnChapter:
            hsnChapter !== undefined ? hsnChapter : existingProduct.hsnChapter,
          gstApplicability:
            gstApplicability || existingProduct.gstApplicability,
          status: status !== undefined ? status : existingProduct.status,
          mainImage: mainImageFilename, // Store only filename
        },
      });

      // Delete existing batches and create new ones
      if (batches && batches.length > 0) {
        await tx.batch.deleteMany({
          where: { productId: parseInt(id) },
        });

        const normalizedBatches = normalizeBatchPinFlags(batches);
        await Promise.all(
          normalizedBatches.map((batch) =>
            tx.batch.create({
              data: {
                batchNo: batch.bNo,
                mfgDate: batch.mfgDate,
                expDate: batch.expDate,
                barcode: batch.barcode,
                basicPrice: parseFloat(batch.basicPrice),
                openingStock: parseInt(batch.openingStock),
                mrp: parseFloat(batch.mrp),
                purchaseRate: parseFloat(batch.pRate),
                saleRate: parseFloat(batch.sRate),
                margin: parseFloat(batch.margin),
                gstAmount: parseFloat(batch.gstAmount || 0),
                isPinned: Boolean(batch.isPinned),
                productId: parseInt(id),
              },
            }),
          ),
        );
      }

      // Delete existing related images and create new ones
      if (relatedImages) {
        await tx.productImage.deleteMany({
          where: { productId: parseInt(id) },
        });

        // Create new related images if provided
        if (relatedImages.length > 0) {
          await Promise.all(
            relatedImages
              .map((imageUrl, index) => {
                // Extract filename from URL
                const filename = extractFilename(imageUrl);
                if (!filename) return null;

                return tx.productImage.create({
                  data: {
                    imageUrl: filename, // Store only filename
                    imageType: "related",
                    sortOrder: index,
                    productId: parseInt(id),
                  },
                });
              })
              .filter(Boolean), // Filter out null entries
          );
        }
      }

      return product;
    });

    // Fetch complete updated product with relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        productGroup: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        productCompany: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        batches: true,
        relatedImages: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Calculate total opening stock from all batches
    const totalOpeningStock = completeProduct.batches.reduce(
      (sum, batch) => sum + (batch.openingStock || 0),
      0,
    );

    // Convert image paths to public URLs
    const productWithUrls = {
      ...completeProduct,
      totalOpeningStock,
      mainImage: getImageUrl(completeProduct.mainImage),
      relatedImages: completeProduct.relatedImages.map((image) => ({
        ...image,
        imageUrl: getImageUrl(image.imageUrl),
      })),
    };
    await createNotification({
  title: "Product Updated",
  message: `Product "${completeProduct.productCode} - ${completeProduct.productBrand}" has been updated by ${req.user?.username || 'Admin'}`,
  type: "info",
  section: null,
  page: "product"
}, res);
    return sendResponse(
      res,
      true,
      {
        message: "Product updated successfully",
        product: productWithUrls,
      },
      "Product updated",
      statusType.OK,
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error updating product",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * Delete Product (Soft Delete)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product exists
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingProduct) {
    return sendResponse(
      res,
      false,
      null,
      "Product not found",
      statusType.NOT_FOUND,
    );
  }

  if (existingProduct.isLocked) {
    return sendResponse(
      res,
      false,
      null,
      "Product is locked and cannot be deleted",
      statusType.FORBIDDEN,
    );
  }

  // Find all batches for this product with zero opening stock
  const zeroStockBatches = await prisma.batch.findMany({
    where: {
      productId: parseInt(id),
      openingStock: 0,
    },
  });

  // Hard delete batches with zero opening stock
  if (zeroStockBatches.length > 0) {
    await prisma.batch.deleteMany({
      where: {
        productId: parseInt(id),
        openingStock: 0,
      },
    });
  }

  // Soft delete the product
  await prisma.product.update({
    where: {
      id: parseInt(id),
    },
    data: {
      deleted: true,
      status: false,
    },
  });
  await createNotification({
  title: "Product Deleted",
  message: `Product "${existingProduct.productCode} - ${existingProduct.productBrand}" has been deleted by ${req.user?.username || 'Admin'}`,
  type: "warning",
  section: null,
  page: "product"
}, res);
  return sendResponse(
    res,
    true,
    {
      message: "Product deleted successfully",
      deletedZeroStockBatches: zeroStockBatches.length,
    },
    "Product deleted",
    statusType.OK,
  );
});

/**
 * Toggle product lock status
 */
export const toggleProductLock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { locked } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const existingProduct = await prisma.product.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingProduct) {
    return sendResponse(
      res,
      false,
      null,
      "Product not found",
      statusType.NOT_FOUND,
    );
  }

  const isLocked = locked === true || locked === "true";

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: { isLocked },
  });

  await createNotification(
    {
      title: isLocked ? "Product Locked" : "Product Unlocked",
      message: `Product "${existingProduct.productCode} - ${existingProduct.productBrand}" has been ${isLocked ? "locked" : "unlocked"} by ${req.user?.username || "Admin"}`,
      type: "info",
      section: null,
      page: "product",
    },
    res,
  );

  return sendResponse(
    res,
    true,
    { product },
    isLocked ? "Product locked successfully" : "Product unlocked successfully",
    statusType.OK,
  );
});

/**
 * Get Active Batches for a Product
 * Returns only batches with openingStock > 0 for a product that is active and not deleted
 */
export const getProductBatches = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Verify product exists and is active (status true, not deleted)
  const product = await prisma.product.findFirst({
    where: {
      id: parseInt(id),
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      productCode: true,
      productBrand: true,
      productShortName: true,
      unit: {
        select: {
          id: true,
          name: true,
          symbol: true,
        },
      },
    },
  });

  if (!product) {
    return sendResponse(
      res,
      false,
      null,
      "Active product not found",
      statusType.NOT_FOUND,
    );
  }

  // If a batch is pinned, only that batch is available for sales/purchase selection
  const pinnedBatch = await prisma.batch.findFirst({
    where: {
      productId: parseInt(id),
      isPinned: true,
    },
    orderBy: { updatedAt: "desc" },
    select: batchSelectFields,
  });

  let batches;
  if (pinnedBatch) {
    batches = [pinnedBatch];
  } else {
    // Fetch batches with positive opening stock
    batches = await prisma.batch.findMany({
      where: {
        productId: parseInt(id),
        openingStock: { gt: 0 },
      },
      orderBy: [
        { expDate: "asc" }, // Soon-to-expire first
        { createdAt: "desc" },
      ],
      select: batchSelectFields,
    });
  }

  // Calculate total available stock for the product
  const totalStock = batches.reduce(
    (sum, batch) => sum + (batch.openingStock || 0),
    0,
  );

  return sendResponse(
    res,
    true,
    {
      product: {
        id: product.id,
        productCode: product.productCode,
        productBrand: product.productBrand,
        productShortName: product.productShortName,
        unit: product.unit,
      },
      batches,
      summary: {
        totalBatches: batches.length,
        totalStock,
      },
    },
    "Product batches retrieved successfully",
    statusType.OK,
  );
});

/**
 * Get purchase history for a product (only entries linked to active batches)
 */
export const getProductPurchaseHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const product = await prisma.product.findFirst({
    where: { id: productId, status: true, deleted: false },
    select: { id: true, productCode: true },
  });

  if (!product) {
    return sendResponse(
      res,
      false,
      null,
      "Active product not found",
      statusType.NOT_FOUND,
    );
  }

  const activeBatches = await prisma.batch.findMany({
    where: { productId, openingStock: { gt: 0 } },
    select: {
      id: true,
      batchNo: true,
      purchaseRate: true,
      saleRate: true,
      openingStock: true,
      mrp: true,
    },
  });

  const activeBatchIds = activeBatches.map((b) => b.id);

  if (activeBatchIds.length === 0) {
    return sendResponse(
      res,
      true,
      { histories: [], activeBatches: [] },
      "No active batches for this product",
      statusType.OK,
    );
  }

  const histories = await prisma.purchaseHistory.findMany({
    where: {
      productId,
      batchId: { in: activeBatchIds },
      purchaseInvoice: {
        deleted: false,
        status: { not: "Return" },
      },
    },
    include: {
      batch: {
        select: {
          id: true,
          batchNo: true,
          purchaseRate: true,
          saleRate: true,
          openingStock: true,
          mrp: true,
        },
      },
      purchaseInvoice: { select: { id: true, invoiceNo: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { invoiceDate: "desc" },
    take: 100,
  });

  const formatted = histories.map((h) => ({
    id: h.id,
    batchId: h.batchId,
    batchNo: h.batch?.batchNo ?? "",
    invoiceNo:
      h.purchaseInvoice?.invoiceNo ?? h.invoiceNo ?? "",
    invoiceDate: h.invoiceDate,
    quantity: h.aQty,
    rate: h.rate,
    amount: h.totalAmount,
    currentRate: h.batch?.purchaseRate ?? h.rate,
    currentStock: h.batch?.openingStock ?? 0,
    supplierName: h.supplier?.name ?? "",
  }));

  return sendResponse(
    res,
    true,
    { histories: formatted, activeBatches },
    "Product purchase history retrieved successfully",
    statusType.OK,
  );
});

/**
 * Get sales history for a product (only entries linked to active batches)
 */
export const getProductSalesHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const product = await prisma.product.findFirst({
    where: { id: productId, status: true, deleted: false },
    select: { id: true, productCode: true },
  });

  if (!product) {
    return sendResponse(
      res,
      false,
      null,
      "Active product not found",
      statusType.NOT_FOUND,
    );
  }

  const activeBatches = await prisma.batch.findMany({
    where: { productId, openingStock: { gt: 0 } },
    select: {
      id: true,
      batchNo: true,
      purchaseRate: true,
      saleRate: true,
      openingStock: true,
      mrp: true,
    },
  });

  const activeBatchIds = activeBatches.map((b) => b.id);

  if (activeBatchIds.length === 0) {
    return sendResponse(
      res,
      true,
      { histories: [], activeBatches: [] },
      "No active batches for this product",
      statusType.OK,
    );
  }

  const histories = await prisma.salesHistory.findMany({
    where: {
      productId,
      batchId: { in: activeBatchIds },
      salesInvoice: {
        deleted: false,
        status: { not: "Return" },
      },
    },
    include: {
      batch: {
        select: {
          id: true,
          batchNo: true,
          purchaseRate: true,
          saleRate: true,
          openingStock: true,
          mrp: true,
        },
      },
      salesInvoice: { select: { id: true, invoiceNo: true } },
      customer: { select: { personName: true, companyName: true } },
    },
    orderBy: { invoiceDate: "desc" },
    take: 100,
  });

  const formatted = histories.map((h) => ({
    id: h.id,
    batchId: h.batchId,
    batchNo: h.batch?.batchNo ?? "",
    invoiceNo: h.salesInvoice?.invoiceNo ?? h.invoiceNo ?? "",
    invoiceDate: h.invoiceDate,
    quantity: h.aQty,
    rate: h.rate,
    amount: h.totalAmount,
    currentRate: h.batch?.saleRate ?? h.rate,
    currentStock: h.batch?.openingStock ?? 0,
    customerName: h.customer?.personName ?? h.customer?.companyName ?? "",
  }));

  return sendResponse(
    res,
    true,
    { histories: formatted, activeBatches },
    "Product sales history retrieved successfully",
    statusType.OK,
  );
});

/**
 * Pin or unpin a batch for a product.
 * Only one batch per product can be pinned at a time.
 */
export const pinProductBatch = asyncHandler(async (req, res) => {
  const { id, batchId } = req.params;
  const { pinned = true } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const productId = parseInt(id);
  const parsedBatchId = parseInt(batchId);

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deleted: false,
    },
    select: { id: true },
  });

  if (!product) {
    return sendResponse(
      res,
      false,
      null,
      "Product not found",
      statusType.NOT_FOUND,
    );
  }

  const batch = await prisma.batch.findFirst({
    where: {
      id: parsedBatchId,
      productId,
    },
  });

  if (!batch) {
    return sendResponse(
      res,
      false,
      null,
      "Batch not found for this product",
      statusType.NOT_FOUND,
    );
  }

  const shouldPin = Boolean(pinned);

  const updatedBatch = await prisma.$transaction(async (tx) => {
    if (shouldPin) {
      await tx.batch.updateMany({
        where: { productId },
        data: { isPinned: false },
      });
    }

    return tx.batch.update({
      where: { id: parsedBatchId },
      data: { isPinned: shouldPin },
      select: batchSelectFields,
    });
  });

  return sendResponse(
    res,
    true,
    { batch: updatedBatch },
    shouldPin
      ? "Batch pinned successfully"
      : "Batch unpinned successfully",
    statusType.OK,
  );
});

// Export all functions
export const productController = {
  createProduct,
  getProducts,
  getActiveProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductLock,
  getProductBatches,
  pinProductBatch,
  getProductPurchaseHistory,
  getProductSalesHistory,
};
