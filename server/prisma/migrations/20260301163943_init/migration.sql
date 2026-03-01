-- CreateTable
CREATE TABLE "google_drive_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expiry" DATETIME,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "google_drive_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "backup_histories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "file_name" TEXT,
    "drive_file_id" TEXT,
    "drive_link" TEXT,
    "error_msg" TEXT,
    "file_size_kb" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "backup_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_tokens_user_id_key" ON "google_drive_tokens"("user_id");

-- CreateIndex
CREATE INDEX "backup_histories_user_id_idx" ON "backup_histories"("user_id");

-- CreateIndex
CREATE INDEX "backup_histories_status_idx" ON "backup_histories"("status");

-- CreateIndex
CREATE INDEX "backup_histories_trigger_idx" ON "backup_histories"("trigger");

-- CreateIndex
CREATE INDEX "backup_histories_created_at_idx" ON "backup_histories"("created_at");
