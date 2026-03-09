-- CreateTable
CREATE TABLE "gst_report_histories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "file_name" TEXT,
    "data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gst_report_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "gst_report_histories_userId_idx" ON "gst_report_histories"("userId");

-- CreateIndex
CREATE INDEX "gst_report_histories_source_idx" ON "gst_report_histories"("source");

-- CreateIndex
CREATE INDEX "gst_report_histories_report_key_idx" ON "gst_report_histories"("report_key");

-- CreateIndex
CREATE INDEX "gst_report_histories_type_idx" ON "gst_report_histories"("type");
