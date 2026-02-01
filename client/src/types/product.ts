export interface Batch {
  id: number;
  batchNo: string;
  mfgDate: string | null;
  expDate: string | null;
  barcode: string;
  basicPrice: number;
  openingStock: number;
  mrp: number;
  purchaseRate: number;
  saleRate: number;
  margin: number;
  gstAmount: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  imageType: "main" | "related";
  sortOrder: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: number;
  name: string;
  symbol: string;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductGroup {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCompany {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string | null;
  address: string;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Product {
  id: number;
  productCode: string;
  productBrand: string;
  description: string;
  hsnSacCode: string;
  goodsServices: string;
  weight: number;
  unitId: number | null;
  unit: Unit | null;
  productGroupId: number | null;
  productGroup: ProductGroup | null;
  productShortName: string | null;
  purchaseUnit: string | null;
  conversionFactor: number;
  pricePerPcs: number | null;
  productCompanyId: number | null;
  productCompany: ProductCompany | null;
  saleUnit: string | null;
  cartonPack: number;
  innerPack: string | null;
  packagingBasic: boolean;
  packagingMRP: boolean;
  insuranceTaxBasic: boolean;
  insuranceTaxMRP: boolean;
  gstRate: number;
  gstInclusive: boolean;
  cessRate: number;
  hsnChapter: string | null;
  gstApplicability: string;
  status: boolean;
  mainImage: string | null;
  userId: number | null;
  deleted: boolean;
  batches: Batch[];
  relatedImages: ProductImage[];
  _count?: {
    batches: number;
    relatedImages: number;
  };
  createdAt: string;
  updatedAt: string;
  
  // Add this field for total opening stock
  totalOpeningStock?: number;
}

export interface ProductFormData {
  // Basic Info
  productCode: string;
  productBrand: string;
  description: string;
  hsnSacCode: string;
  goodsServices: "Goods" | "Services";
  weight: number;
  unitId: number;
  productGroupId: number;

  // Additional Info
  productShortName: string;
  purchaseUnit: string;
  conversionFactor: number;
  pricePerPcs: number;
  productCompanyId: number;
  saleUnit: string;
  cartonPack: number;
  innerPack?: string;

  // Packaging & Insurance Tax
  packagingBasic: boolean;
  packagingMRP: boolean;
  insuranceTaxBasic: boolean;
  insuranceTaxMRP: boolean;

  // GST Details
  gstRate: number;
  gstInclusive: boolean;
  cessRate: number;
  hsnChapter?: string;
  gstApplicability: "Regular" | "Composition" | "Exempt";

  // Status
  status?: boolean;

  // Images
  mainImage?: string;
  relatedImages?: string[];

  // Batches
  batches: Array<{
    bNo: string;
    mfgDate: string | null;
    expDate: string | null;
    barcode: string;
    basicPrice: number;
    openingStock: number;
    mrp: number;
    pRate: number;
    sRate: number;
    margin: number;
    gstAmount: number;
  }>;
}

export interface ProductFilters {
  search?: string;
  productCode?: string;
  productBrand?: string;
  productGroupId?: number;
  productCompanyId?: number;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
  minStock?: number;
  maxStock?: number;
  mfgDateFrom?: Date;
  mfgDateTo?: Date;
  expDateFrom?: Date;
  expDateTo?: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    products: T[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}
