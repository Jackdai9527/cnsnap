import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authSettingGroups } from "../src/lib/auth-settings";
import { dgeubNotesHtml, dgeubRates, dgeubSupportedCountries } from "../src/lib/dgeub-rates";
import { footerSectionSettings } from "../src/lib/footer-settings";
import { defaultEnabledCurrencies } from "../src/lib/exchange-rates";
import { getEnabledFrontendLocaleConfigs } from "../config/i18n";
import { defaultValueAddedServices, valueAddedServiceSeedToPrisma } from "../src/lib/value-added-services";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "myadminx@cnsnap.com";
const LEGACY_ADMIN_EMAIL = "admin@haitao.local";
const TEST_BUYER_EMAIL = "dguoquan60@gmail.com";
const LEGACY_TEST_BUYER_EMAIL = "demo@haitao.local";
const isProduction = process.env.NODE_ENV === "production";
const seedDemoData = process.env.SEED_DEMO_DATA === "true" || !isProduction;
const seedAdminEmail = (process.env.SEED_ADMIN_EMAIL || (seedDemoData ? ADMIN_EMAIL : "")).trim().toLowerCase();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || (seedDemoData ? "admin123456" : "");
const seedBuyerEmail = (process.env.SEED_TEST_BUYER_EMAIL || TEST_BUYER_EMAIL).trim().toLowerCase();
const seedBuyerPassword = process.env.SEED_TEST_BUYER_PASSWORD || "demo123456";
const seedGuestEmail = (process.env.SEED_GUEST_EMAIL || "guest@haitao.local").trim().toLowerCase();
const seedGuestPassword = process.env.SEED_GUEST_PASSWORD || "guest123456";

const productImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1200&auto=format&fit=crop"
];

async function main() {
  if (!seedDemoData && (!seedAdminEmail || !seedAdminPassword)) {
    throw new Error("Production seeding requires SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or set SEED_DEMO_DATA=true explicitly.");
  }

  let admin: { id: number } | null = null;
  let user: { id: number; email: string } | null = null;
  let address: { id: number; country: string } | null = null;

  if (seedAdminEmail && seedAdminPassword) {
    const adminPasswordHash = await bcrypt.hash(seedAdminPassword, 10);

    const legacyAdminCandidates = [LEGACY_ADMIN_EMAIL, ADMIN_EMAIL].filter((email, index, array) => array.indexOf(email) === index && email !== seedAdminEmail);
    for (const email of legacyAdminCandidates) {
      const existingAdmin = await prisma.user.findUnique({ where: { email } });
      if (existingAdmin) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { email: seedAdminEmail }
        });
      }
    }

    admin = await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: {
        passwordHash: adminPasswordHash,
        role: "super_admin",
        status: "active"
      },
      create: {
        email: seedAdminEmail,
        passwordHash: adminPasswordHash,
        name: "CNSnap Admin",
        role: "super_admin",
        referralCode: "ADMIN001",
        walletBalance: 0
      },
      select: { id: true }
    });
  }

  if (seedDemoData) {
    const demoPasswordHash = await bcrypt.hash(seedBuyerPassword, 10);
    const guestPasswordHash = await bcrypt.hash(seedGuestPassword, 10);

    const existingTestBuyer = await prisma.user.findUnique({
      where: { email: LEGACY_TEST_BUYER_EMAIL }
    });
    if (existingTestBuyer && seedBuyerEmail !== LEGACY_TEST_BUYER_EMAIL) {
      await prisma.user.update({
        where: { id: existingTestBuyer.id },
        data: { email: seedBuyerEmail }
      });
    }

    user = await prisma.user.upsert({
      where: { email: seedBuyerEmail },
      update: {
        passwordHash: demoPasswordHash,
        role: "user",
        status: "active"
      },
      create: {
        email: seedBuyerEmail,
        passwordHash: demoPasswordHash,
        name: "Demo Buyer",
        role: "user",
        referralCode: "BUYER88",
        walletBalance: 128.5
      },
      select: { id: true, email: true }
    });

    await prisma.user.upsert({
      where: { email: seedGuestEmail },
      update: {
        passwordHash: guestPasswordHash,
        role: "user",
        status: "active"
      },
      create: {
        email: seedGuestEmail,
        passwordHash: guestPasswordHash,
        name: "Guest Test Buyer",
        role: "user",
        referralCode: "GUEST88",
        walletBalance: 0
      }
    });

    address = await prisma.address.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: user.id,
        label: "Home",
        contactName: "Demo Buyer",
        phone: "+1 555 0168",
        country: "US",
        state: "CA",
        city: "San Francisco",
        postalCode: "94107",
        line1: "88 Market Street",
        line2: "Apt 1208",
        isDefault: true
      },
      select: { id: true, country: true }
    });
  }

  const settings = [
    ["exchange_rate_cny_usd", "7.20", "CNY/USD Exchange Rate"],
    ["service_fee_rate", "0.05", "Service Fee Rate"],
    ["min_service_fee_usd", "2", "Minimum Service Fee"],
    ["service_fee_enabled", "true", "Enable Service Fee"],
    ["manual_price_adjustment", "true", "Allow Admin Price Adjustment"],
    ["exchange_rate_api_key", "", "ExchangeRate-API Key"],
    ["enabled_frontend_currencies", defaultEnabledCurrencies.join(","), "Frontend Currencies"],
    ["admin_language", "en", "Admin Language"],
    ["frontend_language", "en", "Frontend Source Language"],
    ["translate_languages", getEnabledFrontendLocaleConfigs().map((language) => language.locale).join(","), "Frontend UI Locales"],
    ["onebound_gateway", "https://api-gw.fan-b.com", "OneBound Gateway"],
    ["onebound_api_key", "t3266838640", "OneBound API Key"],
    ["onebound_api_secret", "", "OneBound API Secret"],
    ["onlypay_enabled", "false", "Enable ONLYPAY"],
    ["onlypay_title", "Credit Card / Wallet Payment", "ONLYPAY Checkout Title"],
    ["onlypay_mch_id", "", "ONLYPAY Merchant ID"],
    ["onlypay_app_id", "", "ONLYPAY Application ID"],
    ["onlypay_sign_key", "", "ONLYPAY Signature Key"],
    ["onlypay_submit_url", "https://international.storepay.cn/api/pay/create_order", "ONLYPAY Submit URL"],
    ["onlypay_product_id", "8000", "ONLYPAY Product ID"],
    ["paypal_enabled", "false", "Enable PayPal Checkout"],
    ["paypal_title", "PayPal Checkout", "PayPal Checkout Title"],
    ["paypal_mode", "sandbox", "PayPal Mode"],
    ["paypal_sandbox_client_id", "", "PayPal Sandbox Client ID"],
    ["paypal_sandbox_client_secret", "", "PayPal Sandbox Client Secret"],
    ["paypal_live_client_id", "", "PayPal Live Client ID"],
    ["paypal_live_client_secret", "", "PayPal Live Client Secret"],
    ["paypal_advanced_card_enabled", "false", "Enable PayPal Advanced Card Payments"],
    ["paypal_brand_name", "CNSnap", "PayPal Brand Name"],
    ["paypal_currency", "USD", "PayPal Currency"],
    ["sepa_enabled", "false", "Enable SEPA Instant Payments"],
    ["sepa_title", "SEPA Instant Payments", "SEPA Checkout Title"],
    ["sepa_description", "<p>Transfer the payable amount in EUR to our SEPA account, then submit your bank account holder name and the last four characters of the transaction reference.</p>", "SEPA Checkout Description"],
    ["sepa_beneficiary_name", "", "SEPA Beneficiary Name"],
    ["sepa_iban", "", "SEPA IBAN"],
    ["sepa_bic", "", "SEPA BIC / SWIFT"],
    ["sepa_reference", "CNSNAP-{orderNo}", "SEPA Payment Reference"],
    ["sepa_bank_name", "", "SEPA Bank Name"],
    ["sepa_bank_address", "", "SEPA Bank Address"],
    ["sepa_tips", "After completing the transfer, please enter the last 4 characters of your transaction ID or the last 4 digits of your bank account number.", "SEPA Transaction ID Tips"],
    ["sepa_instructions", "<p>We will confirm your SEPA transfer within the next 12 hours after submission.</p>", "SEPA Instructions"],
    ["sepa_usd_eur_rate", "0.92", "SEPA USD to EUR Rate"],
    ...authSettingGroups.flatMap((group) => group.settings.map(([key, value, label]) => [key, value, label])),
    ...footerSectionSettings.map(([key, value, label]) => [key, value, label])
  ];

  for (const [key, value, label] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value, label },
      create: { key, value, label }
    });
  }

  for (const service of defaultValueAddedServices) {
    const data = valueAddedServiceSeedToPrisma(service);
    await prisma.valueAddedService.upsert({
      where: { code: service.code },
      update: {},
      create: data
    });
  }

  await prisma.shippingChannel.deleteMany({ where: { code: { not: "DGEUB" } } });
  const dgeubChannel = await prisma.shippingChannel.upsert({
    where: { code: "DGEUB" },
    update: {
      name: "广州E邮宝（DGEUB）",
      supportedCountries: dgeubSupportedCountries,
      supportedCategories: ["general", "fashion", "accessories"],
      forbiddenCategories: ["battery", "liquid", "powder", "brand", "food", "medicine"],
      calculationRule: "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb",
      notesHtml: dgeubNotesHtml,
      trackingUrl: "https://www.17track.net/zh-cn",
      firstWeightKg: 0.001,
      firstWeightFeeUsd: 0,
      additionalWeightKg: 1,
      additionalWeightFeeUsd: 0,
      volumeDivisor: 5000,
      minWeightKg: 0.001,
      deliveryTimeMin: 7,
      deliveryTimeMax: 18,
      isActive: true
    },
    create: {
      name: "广州E邮宝（DGEUB）",
      code: "DGEUB",
      supportedCountries: dgeubSupportedCountries,
      supportedCategories: ["general", "fashion", "accessories"],
      forbiddenCategories: ["battery", "liquid", "powder", "brand", "food", "medicine"],
      calculationRule: "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb",
      notesHtml: dgeubNotesHtml,
      trackingUrl: "https://www.17track.net/zh-cn",
      firstWeightKg: 0.001,
      firstWeightFeeUsd: 0,
      additionalWeightKg: 1,
      additionalWeightFeeUsd: 0,
      volumeDivisor: 5000,
      minWeightKg: 0.001,
      deliveryTimeMin: 7,
      deliveryTimeMax: 18,
      isActive: true
    }
  });

  for (const rate of dgeubRates) {
    await prisma.shippingRate.upsert({
      where: {
        channelId_countryCode: {
          channelId: dgeubChannel.id,
          countryCode: rate.countryCode
        }
      },
      update: rate,
      create: { ...rate, channelId: dgeubChannel.id }
    });
  }

  const products = [
    {
      platform: "taobao",
      sourceItemId: "TB10001",
      title: "Lightweight running sneakers with cushioned sole",
      priceCny: 289,
      shopName: "Hangzhou Motion Lab",
      mainImage: productImages[0],
      skus: [
        { id: "black-42", text: "Black / EU 42", stock: 38 },
        { id: "cream-40", text: "Cream / EU 40", stock: 21 }
      ],
      attributes: { category: "fashion", weight: "0.8kg", material: "mesh" }
    },
    {
      platform: "tmall",
      sourceItemId: "TM20002",
      title: "Minimal wool blend coat for autumn travel",
      priceCny: 468,
      shopName: "Shanghai Atelier",
      mainImage: productImages[1],
      skus: [
        { id: "camel-m", text: "Camel / M", stock: 12 },
        { id: "charcoal-l", text: "Charcoal / L", stock: 8 }
      ],
      attributes: { category: "fashion", weight: "1.2kg", material: "wool blend" }
    },
    {
      platform: "1688",
      sourceItemId: "AL30003",
      title: "Smart desk clock with wireless charging pad",
      priceCny: 119,
      shopName: "Shenzhen Maker Wholesale",
      mainImage: productImages[2],
      skus: [
        { id: "white-cn", text: "White / CN plug", stock: 200 },
        { id: "black-usb", text: "Black / USB-C", stock: 160 }
      ],
      attributes: { category: "electronics", weight: "0.45kg", battery: "none" }
    },
    {
      platform: "jd",
      sourceItemId: "JD40004",
      title: "Portable instant camera gift set",
      priceCny: 699,
      shopName: "JD Digital Flagship",
      mainImage: productImages[3],
      skus: [
        { id: "green-kit", text: "Green / 20 films", stock: 18 },
        { id: "white-kit", text: "White / 10 films", stock: 25 }
      ],
      attributes: { category: "electronics", weight: "0.9kg", battery: "built-in" }
    }
  ];

  if (!seedDemoData || !admin || !user || !address) {
    return;
  }

  for (const [index, product] of products.entries()) {
    await prisma.productCache.upsert({
      where: {
        platform_sourceItemId: {
          platform: product.platform,
          sourceItemId: product.sourceItemId
        }
      },
      update: {
        title: product.title,
        priceCny: product.priceCny,
        priceUsd: Number((product.priceCny / 7.2).toFixed(2)),
        mainImage: product.mainImage,
        images: [product.mainImage, productImages[(index + 1) % productImages.length]],
        skus: product.skus,
        attributes: product.attributes,
        rawJson: product
      },
      create: {
        platform: product.platform,
        sourceItemId: product.sourceItemId,
        sourceUrl: `https://item.${product.platform}.com/item.htm?id=${product.sourceItemId}`,
        title: product.title,
        mainImage: product.mainImage,
        images: [product.mainImage, productImages[(index + 1) % productImages.length]],
        shopName: product.shopName,
        shopUrl: `https://shop.${product.platform}.com/${product.sourceItemId}`,
        priceCny: product.priceCny,
        priceUsd: Number((product.priceCny / 7.2).toFixed(2)),
        skus: product.skus,
        attributes: product.attributes,
        descriptionHtml: "<p>Inspected by our purchasing team after order confirmation. Final availability depends on source platform stock.</p>",
        rawJson: product,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  const firstProduct = await prisma.productCache.findFirstOrThrow();
  const secondProduct = await prisma.productCache.findFirstOrThrow({
    where: { sourceItemId: "TM20002" }
  });

  const order = await prisma.order.upsert({
    where: { orderNo: "HT202606090001" },
    update: {},
    create: {
      orderNo: "HT202606090001",
      userId: user.id,
      addressId: address.id,
      status: "warehouse_received",
      orderSource: "url",
      orderStatus: "processing",
      paymentStatus: "paid",
      purchaseStatus: "purchased",
      warehouseStatus: "received",
      packageStatus: "waiting_shipping_payment",
      shippingStatus: "pending",
      riskStatus: "normal",
      destinationCountry: address.country,
      destinationCountryCode: address.country,
      subtotalCny: 757,
      subtotalUsd: 105.14,
      exchangeRate: 7.2,
      serviceFeeUsd: 5.26,
      estimatedShippingUsd: 18,
      totalUsd: 128.4,
      paidUsd: 128.4,
      unpaidUsd: 0,
      itemCount: 2,
      totalQuantity: 2,
      userNote: "Please inspect color and size before packing.",
      items: {
        create: [
          {
            productCacheId: firstProduct.id,
            platform: firstProduct.platform,
            sourceItemId: firstProduct.sourceItemId,
            sourceUrl: firstProduct.sourceUrl,
            title: firstProduct.title,
            image: firstProduct.mainImage,
            skuId: "black-42",
            skuText: "Black / EU 42",
            priceCny: firstProduct.priceCny,
            priceUsd: firstProduct.priceUsd,
            quantity: 1,
            purchaseStatus: "purchased"
          },
          {
            productCacheId: secondProduct.id,
            platform: secondProduct.platform,
            sourceItemId: secondProduct.sourceItemId,
            sourceUrl: secondProduct.sourceUrl,
            title: secondProduct.title,
            image: secondProduct.mainImage,
            skuId: "camel-m",
            skuText: "Camel / M",
            priceCny: secondProduct.priceCny,
            priceUsd: secondProduct.priceUsd,
            quantity: 1,
            purchaseStatus: "purchased"
          }
        ]
      }
    }
  });

  const packageRecord = await prisma.package.upsert({
    where: { packageNo: "PK202606090001" },
    update: {},
    create: {
      packageNo: "PK202606090001",
      userId: user.id,
      orderId: order.id,
      status: "waiting_shipping_payment",
      weightKg: 1.85,
      lengthCm: 36,
      widthCm: 28,
      heightCm: 18,
      shippingChannelId: dgeubChannel.id,
      shippingFeeUsd: 34
    }
  });

  const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  for (const item of orderItems) {
    await prisma.packageItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        packageId: packageRecord.id,
        orderItemId: item.id,
        quantity: item.quantity
      }
    });
  }

  await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      type: "recharge",
      amount: 150,
      balanceAfter: 150,
      note: "Manual demo recharge",
      createdBy: admin.id
    }
  });

  await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      type: "deduction",
      amount: -21.5,
      balanceAfter: 128.5,
      relatedOrderId: order.id,
      note: "Demo order partial payment",
      createdBy: admin.id
    }
  });

  const existingDiy = await prisma.diyOrder.findFirst({
    where: { userId: user.id, productUrl: "https://weidian.com/item.html?itemID=demo" }
  });
  if (existingDiy) {
    await prisma.diyOrder.update({
      where: { id: existingDiy.id },
      data: {
        productName: "Limited handmade accessory",
        status: "reviewing",
        purchaseItemName: "Limited handmade accessory",
        purchaseSize: "Silver / gift box",
        purchaseWeightKg: 0.42,
        productCostUsd: 38.5,
        purchaseStatus: "purchasing",
        warehouseStatus: "not_arrived",
        purchaseLink: "https://weidian.com/item.html?itemID=demo",
        shippingFeeUsd: 4.8,
        serviceFeeUsd: 2.5
      }
    });
  } else {
    await prisma.diyOrder.create({
      data: {
        userId: user.id,
        productUrl: "https://weidian.com/item.html?itemID=demo",
        productName: "Limited handmade accessory",
        specification: "Silver / gift box",
        quantity: 2,
        budgetUsd: 45,
        note: "Need seller confirmation on stock.",
        contactEmail: user.email,
        status: "reviewing",
        purchaseItemName: "Limited handmade accessory",
        purchaseSize: "Silver / gift box",
        purchaseWeightKg: 0.42,
        productCostUsd: 38.5,
        purchaseStatus: "purchasing",
        warehouseStatus: "not_arrived",
        purchaseLink: "https://weidian.com/item.html?itemID=demo",
        shippingFeeUsd: 4.8,
        serviceFeeUsd: 2.5
      }
    });
  }

  const helpArticles = [
    ["how-to-buy", "How to Buy", "Getting Started", "Search, submit, pay, and track your China shopping order."],
    ["shipping-guide", "Shipping Guide", "Shipping", "Estimate freight and learn how parcels are billed."],
    ["restricted-items", "Restricted Items", "Policy", "Some items require manual review before international shipping."],
    ["refund-policy", "Refund Policy", "Payment", "Refunds return to your wallet first, then can be processed manually."]
  ];

  for (const [slug, title, category, excerpt] of helpArticles) {
    await prisma.helpArticle.upsert({
      where: { slug },
      update: { title, category, excerpt },
      create: {
        slug,
        title,
        category,
        excerpt,
        content: `${excerpt}\n\nOur operations team reviews exceptions and will contact you by email when action is needed.`
      }
    });
  }

  await prisma.page.upsert({
    where: { slug: "about-cnsnap" },
    update: {},
    create: {
      slug: "about-cnsnap",
      title: "About CNSnap",
      contentHtml: "<p>CNSnap helps international buyers purchase from Chinese marketplaces, inspect goods, store parcels, and ship globally.</p>",
      isPublished: true
    }
  });

  await prisma.emailLog.create({
    data: {
      to: user.email,
      subject: "Your demo package is ready for shipping payment",
      template: "package_shipping_pending",
      status: "sent"
    }
  });

  await prisma.apiLog.create({
    data: {
      provider: "onebound",
      endpoint: "item_search",
      status: "mock_success",
      latencyMs: 86,
      requestMeta: { q: "demo" }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
