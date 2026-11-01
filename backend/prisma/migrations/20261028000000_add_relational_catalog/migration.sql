CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "app_store" (
    "id" SMALLINT NOT NULL,
    "data" JSONB NOT NULL,
    "initialized" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "app_store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'Independent',
    "price" DOUBLE PRECISION NOT NULL,
    "old_price" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "best_seller" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'sand',
    "image" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_category_fkey'
    ) THEN
        ALTER TABLE "products"
        ADD CONSTRAINT "products_category_fkey"
        FOREIGN KEY ("category") REFERENCES "categories"("name")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
