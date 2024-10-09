-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "Products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "featuredImage" TEXT,
    "handle" TEXT,
    "status" TEXT,
    "title" TEXT,
    "store_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GroupProducts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "swatch_title" TEXT NOT NULL,
    "swatch_color" TEXT NOT NULL,
    "swatch_image" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Products_store_id_key" ON "Products"("store_id");
