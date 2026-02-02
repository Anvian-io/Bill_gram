import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";
import path from "path";
import fs from "fs";
import { getDatabasePath } from "../db/database.js";

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

/**
 * Helper function to extract filename from URL
 */
function extractFilename(url) {
  if (!url) return null;

  // Extract filename from URL (e.g., /api/images/filename.jpg -> filename.jpg)
  // or just return the filename if it's already just a filename
  if (url.includes("/")) {
    return url.split("/").pop();
  }
  return url;
}

/**
 * Helper function to convert filename to public URL
 */
function getImageUrl(filename) {
  if (!filename) return null;
  // Return public API URL path
  // return `/api/images/${filename}`;
  return `${filename}`;
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
      statusType.BAD_REQUEST,
      null,
      "Required fields are missing",
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
      statusType.CONFLICT,
      null,
      "Product with this code already exists",
    );
  }

  // Validate unit exists
  if (unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: parseInt(unitId), deleted: false, status: true },
    });
    if (!unit) {
      return sendResponse(res, statusType.NOT_FOUND, null, "Unit not found");
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
        statusType.NOT_FOUND,
        null,
        "Product group not found",
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
        statusType.NOT_FOUND,
        null,
        "Product company not found",
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
          innerPack,
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
        await Promise.all(
          batches.map((batch) =>
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

    return sendResponse(
      res,
      statusType.CREATED,
      {
        message: "Product created successfully",
        product: productWithUrls,
      },
      "Product created",
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error creating product",
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
    productGroupId,
    productCompanyId,
    status,
    showDeleted = "false",
    sortBy = "createdAt",
    sortOrder = "desc",
    minStock,
    maxStock,
    mfgDate,
    expDate,
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
      productCode: {
        contains: productCode,
      },
    });
  }

  // Product brand filter
  if (productBrand) {
    andConditions.push({
      productBrand: {
        contains: productBrand,
      },
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
  if (minStock !== undefined && minStock !== "" || maxStock !== undefined && maxStock !== "") {
    const min = minStock !== undefined && minStock !== "" ? parseInt(minStock) : 0;
    const max = maxStock !== undefined && maxStock !== "" ? parseInt(maxStock) : 999999999;
    
    // Use raw query to get product IDs with stock in range
    const productsWithStock = await prisma.$queryRaw`
      SELECT productId 
      FROM batches 
      GROUP BY productId 
      HAVING SUM(opening_stock) >= ${min} 
      AND SUM(opening_stock) <= ${max}
    `;
    
    const productIds = productsWithStock.map(p => p.productId);
    
    if (productIds.length > 0) {
      andConditions.push({
        id: { in: productIds }
      });
    } else {
      // If no products match stock criteria, return empty results
      andConditions.push({
        id: { in: [] }
      });
    }
  }

  // Manufacturing Date Filter - handle as string
  if (mfgDate) {
    // The date comes in YYYY-MM-DD format from frontend
    // We need to use string comparison since the field is likely a string
    andConditions.push({
      batches: {
        some: {
          mfgDate: mfgDate  // Direct string comparison
        }
      }
    });
  }

  // Expiry Date Filter - handle as string
  if (expDate) {
    // The date comes in YYYY-MM-DD format from frontend
    // We need to use string comparison since the field is likely a string
    andConditions.push({
      batches: {
        some: {
          expDate: expDate  // Direct string comparison
        }
      }
    });
  }

  // Search in multiple fields
  if (search) {
    andConditions.push({
      OR: [
        {
          productCode: {
            contains: search,
          },
        },
        {
          productBrand: {
            contains: search,
          },
        },
        {
          description: {
            contains: search,
          },
        },
        {
          productShortName: {
            contains: search,
          },
        },
        {
          hsnSacCode: {
            contains: search,
          },
        },
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
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      validSortOrder.includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : "desc",
  };

  // Build batch where condition for the include to filter returned batches
  const batchWhere = {};
  if (mfgDate) {
    batchWhere.mfgDate = mfgDate;  // String comparison
  }
  if (expDate) {
    batchWhere.expDate = expDate;  // String comparison
  }

  // Query with relations - INCLUDING RELATED IMAGES
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
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
          },
        },
        productCompany: {
          select: {
            id: true,
            name: true,
          },
        },
        batches: {
          orderBy: { createdAt: "desc" },
          where: Object.keys(batchWhere).length > 0 ? batchWhere : undefined,
        },
        relatedImages: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            imageUrl: true,
            imageType: true,
            sortOrder: true,
          },
        },
        _count: {
          select: {
            batches: true,
            relatedImages: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Convert to public URLs instead of file paths
  const productsWithUrls = products.map((product) => {
    // Calculate total opening stock from all batches
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
    statusType.OK,
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
  );
});

/**
 * Get Active Products (for dropdown) - Now returns separate rows for each batch
 */
export const getActiveProducts = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const products = await prisma.product.findMany({
    where: {
      status: true,
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
      productCompany: {
        select: {
          id: true,
          name: true,
        },
      },
      batches: {
        where: {
          openingStock: { gt: 0 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: {
      productBrand: "asc",
    },
  });

  // Flatten the products to create separate entries for each batch
  const productBatchEntries = products.flatMap((product) => {
    if (!product.batches || product.batches.length === 0) {
      // Return product even if no batches (for dropdown display)
      return [
        {
          ...product,
          mainImage: getImageUrl(product.mainImage),
          batch: null,
          batchId: null,
          batchNo: null,
          mfgDate: null,
          expDate: null,
          barcode: null,
          basicPrice: null,
          openingStock: 0,
          mrp: null,
          purchaseRate: null,
          saleRate: null,
          margin: null,
          gstAmount: null,
        },
      ];
    }

    return product.batches.map((batch) => ({
      id: product.id,
      productCode: product.productCode,
      productBrand: product.productBrand,
      productShortName: product.productShortName,
      description: product.description,
      pricePerPcs: product.pricePerPcs,
      mainImage: getImageUrl(product.mainImage),
      unit: product.unit,
      productCompany: product.productCompany,
      // Batch details
      batchId: batch.id,
      batchNo: batch.batchNo,
      mfgDate: batch.mfgDate,
      expDate: batch.expDate,
      barcode: batch.barcode,
      basicPrice: batch.basicPrice,
      openingStock: batch.openingStock,
      mrp: batch.mrp,
      purchaseRate: batch.purchaseRate,
      saleRate: batch.saleRate,
      margin: batch.margin,
      gstAmount: batch.gstAmount,
    }));
  });

  return sendResponse(
    res,
    statusType.OK,
    { products: productBatchEntries },
    "Active products retrieved successfully",
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
    return sendResponse(res, statusType.NOT_FOUND, null, "Product not found");
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
    statusType.OK,
    { product: productWithUrls },
    "Product retrieved successfully",
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
    return sendResponse(res, statusType.NOT_FOUND, null, "Product not found");
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
        statusType.CONFLICT,
        null,
        "Product with this code already exists",
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
          innerPack:
            innerPack !== undefined ? innerPack : existingProduct.innerPack,
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

        await Promise.all(
          batches.map((batch) =>
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

    return sendResponse(
      res,
      statusType.OK,
      {
        message: "Product updated successfully",
        product: productWithUrls,
      },
      "Product updated",
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error updating product",
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
    return sendResponse(res, statusType.NOT_FOUND, null, "Product not found");
  }

  // Check if product has active stock
  const activeBatches = await prisma.batch.findFirst({
    where: {
      productId: parseInt(id),
      openingStock: { gt: 0 },
    },
  });

  if (activeBatches) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Cannot delete product with active stock",
    );
  }

  // Soft delete
  await prisma.product.update({
    where: {
      id: parseInt(id),
    },
    data: {
      deleted: true,
      status: false,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    { message: "Product deleted successfully" },
    "Product deleted",
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
};
