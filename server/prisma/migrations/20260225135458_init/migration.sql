-- AlterTable
ALTER TABLE "purchase_invoice_items" ADD COLUMN "DQty" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "sales_invoice_items" ADD COLUMN "DQty" INTEGER DEFAULT 0;
