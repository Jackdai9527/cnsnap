PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS "_prisma_migrations";
DROP TABLE IF EXISTS "OperationLog";
DROP TABLE IF EXISTS "OrderNote";
DROP TABLE IF EXISTS "MediaAsset";
DROP TABLE IF EXISTS "ApiLog";
DROP TABLE IF EXISTS "EmailLog";
DROP TABLE IF EXISTS "HelpArticle";
DROP TABLE IF EXISTS "Page";
DROP TABLE IF EXISTS "ExchangeRateSnapshot";
DROP TABLE IF EXISTS "Setting";
DROP TABLE IF EXISTS "DiyOrder";
DROP TABLE IF EXISTS "WalletTransaction";
DROP TABLE IF EXISTS "Payment";
DROP TABLE IF EXISTS "PackageItem";
DROP TABLE IF EXISTS "Package";
DROP TABLE IF EXISTS "ShippingRate";
DROP TABLE IF EXISTS "ShippingChannel";
DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS "ProductCache";
DROP TABLE IF EXISTS "Address";
DROP TABLE IF EXISTS "AuthVerificationToken";
DROP TABLE IF EXISTS "AuthAccount";
DROP TABLE IF EXISTS "User";

CREATE TABLE "User" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT,
  "googleId" TEXT,
  "name" TEXT,
  "avatarUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "locale" TEXT NOT NULL DEFAULT 'en',
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "referralCode" TEXT NOT NULL UNIQUE,
  "referredBy" INTEGER,
  "walletBalance" DECIMAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuthAccount" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "refreshToken" TEXT,
  "accessToken" TEXT,
  "expiresAt" INTEGER,
  "tokenType" TEXT,
  "scope" TEXT,
  "idToken" TEXT,
  "sessionState" TEXT,
  CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");
CREATE UNIQUE INDEX "AuthAccount_provider_providerAccountId_key" ON "AuthAccount"("provider", "providerAccountId");

CREATE TABLE "AuthVerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AuthVerificationToken_token_key" ON "AuthVerificationToken"("token");
CREATE UNIQUE INDEX "AuthVerificationToken_identifier_token_key" ON "AuthVerificationToken"("identifier", "token");

CREATE TABLE "Address" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Default',
  "contactName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "state" TEXT,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ProductCache" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "platform" TEXT NOT NULL,
  "sourceItemId" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mainImage" TEXT NOT NULL,
  "images" JSONB NOT NULL,
  "shopName" TEXT,
  "shopUrl" TEXT,
  "priceCny" DECIMAL NOT NULL,
  "priceUsd" DECIMAL NOT NULL,
  "skus" JSONB NOT NULL,
  "attributes" JSONB NOT NULL,
  "descriptionHtml" TEXT,
  "rawJson" JSONB NOT NULL,
  "cacheExpiredAt" DATETIME NOT NULL,
  "isStorefrontActive" BOOLEAN NOT NULL DEFAULT false,
  "isHomepageFeatured" BOOLEAN NOT NULL DEFAULT false,
  "storefrontRank" INTEGER NOT NULL DEFAULT 0,
  "importSource" TEXT NOT NULL DEFAULT 'manual',
  "sourceShopId" TEXT,
  "sourceShopName" TEXT,
  "sourceShopUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ProductCache_platform_sourceItemId_key" ON "ProductCache"("platform", "sourceItemId");
CREATE INDEX "ProductCache_isStorefrontActive_storefrontRank_updatedAt_idx" ON "ProductCache"("isStorefrontActive", "storefrontRank", "updatedAt");
CREATE INDEX "ProductCache_isHomepageFeatured_storefrontRank_updatedAt_idx" ON "ProductCache"("isHomepageFeatured", "storefrontRank", "updatedAt");
CREATE INDEX "ProductCache_sourceShopId_idx" ON "ProductCache"("sourceShopId");

CREATE TABLE "ValueAddedService" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "applicableRange" TEXT,
  "chargeStandard" TEXT NOT NULL,
  "priceUsd" DECIMAL NOT NULL DEFAULT 0,
  "priceMode" TEXT NOT NULL DEFAULT 'per_piece',
  "serviceTime" TEXT,
  "buyerNotice" TEXT,
  "serviceGuarantee" TEXT,
  "specialNote" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ValueAddedService_isActive_idx" ON "ValueAddedService"("isActive");
CREATE INDEX "ValueAddedService_sortOrder_idx" ON "ValueAddedService"("sortOrder");

CREATE TABLE "Order" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "orderNo" TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending_payment',
  "orderSource" TEXT NOT NULL DEFAULT 'url',
  "orderStatus" TEXT NOT NULL DEFAULT 'pending_payment',
  "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
  "purchaseStatus" TEXT NOT NULL DEFAULT 'pending',
  "warehouseStatus" TEXT NOT NULL DEFAULT 'pending',
  "packageStatus" TEXT NOT NULL DEFAULT 'none',
  "shippingPaymentStatus" TEXT NOT NULL DEFAULT 'none',
  "shippingStatus" TEXT NOT NULL DEFAULT 'none',
  "riskStatus" TEXT NOT NULL DEFAULT 'normal',
  "refundStatus" TEXT NOT NULL DEFAULT 'none',
  "destinationCountry" TEXT,
  "destinationCountryCode" TEXT,
  "shippingAddressSnapshot" JSONB,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "subtotalCny" DECIMAL NOT NULL DEFAULT 0,
  "subtotalUsd" DECIMAL NOT NULL DEFAULT 0,
  "exchangeRate" DECIMAL NOT NULL DEFAULT 0,
  "serviceFeeUsd" DECIMAL NOT NULL DEFAULT 0,
  "domesticShippingUsd" DECIMAL NOT NULL DEFAULT 0,
  "valueAddedServicesUsd" DECIMAL NOT NULL DEFAULT 0,
  "valueAddedServicesSnapshot" JSONB,
  "estimatedShippingUsd" DECIMAL NOT NULL DEFAULT 0,
  "actualShippingUsd" DECIMAL NOT NULL DEFAULT 0,
  "discountUsd" DECIMAL NOT NULL DEFAULT 0,
  "refundUsd" DECIMAL NOT NULL DEFAULT 0,
  "totalUsd" DECIMAL NOT NULL DEFAULT 0,
  "paidUsd" DECIMAL NOT NULL DEFAULT 0,
  "unpaidUsd" DECIMAL NOT NULL DEFAULT 0,
  "itemCount" INTEGER NOT NULL DEFAULT 0,
  "totalQuantity" INTEGER NOT NULL DEFAULT 0,
  "assigneeId" INTEGER,
  "addressId" INTEGER,
  "userNote" TEXT,
  "adminNote" TEXT,
  "paidAt" DATETIME,
  "purchasedAt" DATETIME,
  "warehouseReceivedAt" DATETIME,
  "shippedAt" DATETIME,
  "completedAt" DATETIME,
  "cancelledAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_purchaseStatus_idx" ON "Order"("purchaseStatus");
CREATE INDEX "Order_warehouseStatus_idx" ON "Order"("warehouseStatus");
CREATE INDEX "Order_packageStatus_idx" ON "Order"("packageStatus");
CREATE INDEX "Order_shippingPaymentStatus_idx" ON "Order"("shippingPaymentStatus");
CREATE INDEX "Order_shippingStatus_idx" ON "Order"("shippingStatus");
CREATE INDEX "Order_riskStatus_idx" ON "Order"("riskStatus");
CREATE INDEX "Order_refundStatus_idx" ON "Order"("refundStatus");
CREATE INDEX "Order_assigneeId_idx" ON "Order"("assigneeId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_updatedAt_idx" ON "Order"("updatedAt");

CREATE TABLE "OrderNote" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'admin',
  "content" TEXT NOT NULL,
  "visibleToUser" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OrderNote_orderId_idx" ON "OrderNote"("orderId");
CREATE INDEX "OrderNote_type_idx" ON "OrderNote"("type");
CREATE INDEX "OrderNote_createdAt_idx" ON "OrderNote"("createdAt");

CREATE TABLE "OrderItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "productCacheId" INTEGER,
  "platform" TEXT NOT NULL,
  "sourceItemId" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "skuId" TEXT,
  "skuText" TEXT,
  "priceCny" DECIMAL NOT NULL,
  "priceUsd" DECIMAL NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "purchaseStatus" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_productCacheId_fkey" FOREIGN KEY ("productCacheId") REFERENCES "ProductCache" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ShippingChannel" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "supportedCountries" JSONB NOT NULL,
  "supportedCategories" JSONB NOT NULL,
  "forbiddenCategories" JSONB NOT NULL,
  "calculationRule" TEXT NOT NULL DEFAULT 'chargeable_weight * freight_rmb_per_kg + handling_fee_rmb',
  "notesHtml" TEXT,
  "trackingUrl" TEXT,
  "firstWeightKg" DECIMAL NOT NULL,
  "firstWeightFeeUsd" DECIMAL NOT NULL,
  "additionalWeightKg" DECIMAL NOT NULL,
  "additionalWeightFeeUsd" DECIMAL NOT NULL,
  "volumeDivisor" INTEGER NOT NULL DEFAULT 5000,
  "minWeightKg" DECIMAL NOT NULL DEFAULT 0.5,
  "deliveryTimeMin" INTEGER NOT NULL,
  "deliveryTimeMax" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ShippingRate" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "channelId" INTEGER NOT NULL,
  "countryCode" TEXT NOT NULL,
  "countryName" TEXT NOT NULL,
  "freightRmbPerKg" DECIMAL NOT NULL,
  "handlingFeeRmb" DECIMAL NOT NULL,
  "startWeightKg" DECIMAL NOT NULL,
  "maxWeightKg" DECIMAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingRate_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ShippingChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ShippingRate_channelId_countryCode_key" ON "ShippingRate"("channelId", "countryCode");
CREATE INDEX "ShippingRate_countryCode_idx" ON "ShippingRate"("countryCode");

CREATE TABLE "Package" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "packageNo" TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  "orderId" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "weightKg" DECIMAL NOT NULL DEFAULT 0.5,
  "lengthCm" DECIMAL,
  "widthCm" DECIMAL,
  "heightCm" DECIMAL,
  "shippingChannelId" INTEGER,
  "shippingFeeUsd" DECIMAL NOT NULL DEFAULT 0,
  "trackingNumber" TEXT,
  "shippedAt" DATETIME,
  "deliveredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Package_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Package_shippingChannelId_fkey" FOREIGN KEY ("shippingChannelId") REFERENCES "ShippingChannel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "MediaAsset" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "url" TEXT NOT NULL UNIQUE,
  "path" TEXT NOT NULL UNIQUE,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "altText" TEXT,
  "caption" TEXT,
  "usage" TEXT NOT NULL DEFAULT 'media_library',
  "orderId" INTEGER,
  "packageId" INTEGER,
  "uploadedBy" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MediaAsset_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MediaAsset_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "MediaAsset_usage_idx" ON "MediaAsset"("usage");
CREATE INDEX "MediaAsset_orderId_idx" ON "MediaAsset"("orderId");
CREATE INDEX "MediaAsset_packageId_idx" ON "MediaAsset"("packageId");
CREATE INDEX "MediaAsset_uploadedBy_idx" ON "MediaAsset"("uploadedBy");
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
CREATE INDEX "MediaAsset_originalName_idx" ON "MediaAsset"("originalName");

CREATE TABLE "PackageItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "packageId" INTEGER NOT NULL,
  "orderItemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PackageItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Payment" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "paymentNo" TEXT NOT NULL UNIQUE,
  "provider" TEXT NOT NULL,
  "providerOrderNo" TEXT UNIQUE,
  "gatewayOrderNo" TEXT,
  "type" TEXT NOT NULL DEFAULT 'product',
  "userId" INTEGER NOT NULL,
  "orderId" INTEGER,
  "packageId" INTEGER,
  "amount" DECIMAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paymentMethod" TEXT,
  "redirectUrl" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "callbackPayload" JSONB,
  "paidAt" DATETIME,
  "failedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Payment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_packageId_idx" ON "Payment"("packageId");
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

CREATE TABLE "WalletTransaction" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "balanceAfter" DECIMAL NOT NULL,
  "relatedOrderId" INTEGER,
  "relatedPackageId" INTEGER,
  "note" TEXT,
  "createdBy" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WalletTransaction_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "WalletTransaction_relatedPackageId_fkey" FOREIGN KEY ("relatedPackageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "DiyOrder" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER,
  "productUrl" TEXT NOT NULL,
  "productName" TEXT,
  "productImage" TEXT,
  "specification" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "budgetUsd" DECIMAL,
  "note" TEXT,
  "contactEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "quoteUsd" DECIMAL,
  "adminNote" TEXT,
  "purchaseItemName" TEXT,
  "purchaseDate" DATETIME,
  "purchaseSize" TEXT,
  "purchaseWeightKg" DECIMAL,
  "productCostUsd" DECIMAL,
  "purchaseStatus" TEXT NOT NULL DEFAULT 'not_purchased',
  "warehouseStatus" TEXT NOT NULL DEFAULT 'not_arrived',
  "purchaseLink" TEXT,
  "shippingFeeUsd" DECIMAL,
  "serviceFeeUsd" DECIMAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiyOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SupportTicket" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "ticketNo" TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  "orderOrTrackingNo" TEXT NOT NULL,
  "issueType" TEXT NOT NULL,
  "problemDescription" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "adminReply" TEXT,
  "repliedAt" DATETIME,
  "closedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

CREATE TABLE "Setting" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ExchangeRateSnapshot" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "provider" TEXT NOT NULL DEFAULT 'exchangerate-api',
  "baseCode" TEXT NOT NULL DEFAULT 'CNY',
  "enabledCurrencies" JSONB NOT NULL,
  "rates" JSONB NOT NULL,
  "result" TEXT NOT NULL DEFAULT 'pending',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "fetchedAt" DATETIME,
  "providerUpdatedAt" DATETIME,
  "providerNextAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ExchangeRateSnapshot_baseCode_idx" ON "ExchangeRateSnapshot"("baseCode");
CREATE INDEX "ExchangeRateSnapshot_fetchedAt_idx" ON "ExchangeRateSnapshot"("fetchedAt");

CREATE TABLE "SensitiveKeyword" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "term" TEXT NOT NULL UNIQUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "HelpArticle" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Page" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "contentHtml" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "error" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ApiLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "provider" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latencyMs" INTEGER NOT NULL DEFAULT 0,
  "requestMeta" JSONB,
  "error" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OperationLog" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "actorId" INTEGER,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "targetLabel" TEXT,
  "oldValue" JSONB,
  "newValue" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "message" TEXT,
  "orderId" INTEGER,
  "detail" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OperationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OperationLog_actorId_idx" ON "OperationLog"("actorId");
CREATE INDEX "OperationLog_actorEmail_idx" ON "OperationLog"("actorEmail");
CREATE INDEX "OperationLog_action_idx" ON "OperationLog"("action");
CREATE INDEX "OperationLog_targetType_idx" ON "OperationLog"("targetType");
CREATE INDEX "OperationLog_targetId_idx" ON "OperationLog"("targetId");
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");
