export const generalSettingGroups = [
  {
    title: "Pricing",
    description: "Currency conversion and service fee rules used by product and order pricing.",
    settings: [
      ["exchange_rate_cny_usd", "7.20", "CNY/USD Exchange Rate", "Used to convert source CNY prices to USD."],
      ["service_fee_rate", "0.05", "Service Fee Rate", "Accepts decimal or percentage, for example 0.05 or 5."],
      ["min_service_fee_usd", "2", "Minimum Service Fee", "Minimum service fee charged per order in USD."],
      ["service_fee_enabled", "true", "Enable Service Fee", "Set false to temporarily disable service fee calculation."]
    ]
  },
  {
    title: "Product API",
    description: "OneBound gateway credentials for product URL and keyword search.",
    settings: [
      ["onebound_gateway", "https://api-gw.fan-b.com", "OneBound Gateway", "API gateway base URL."],
      ["onebound_api_key", "", "OneBound API Key", "Development key stored in SQLite. Environment variable can override it."],
      ["onebound_api_secret", "", "OneBound API Secret", "Development secret stored in SQLite. Environment variable can override it."]
    ]
  },
  {
    title: "Purchasing",
    description: "Operational toggles for product and order workflows.",
    settings: [
      ["manual_price_adjustment", "true", "Allow Price Adjustment", "Allow administrators or buyers to request a corrected source price."]
    ]
  },
  {
    title: "Payment - ONLYPAY",
    description: "ONLYPAY credit card, Apple Pay, and Google Pay gateway settings.",
    settings: [
      ["onlypay_enabled", "false", "Enable ONLYPAY", "Set true to allow users to pay orders through ONLYPAY."],
      ["onlypay_title", "Credit Card / Wallet Payment", "Checkout Title", "Displayed to users on payment buttons."],
      ["onlypay_mch_id", "", "Merchant ID", "ONLYPAY mchId."],
      ["onlypay_app_id", "", "Application ID", "ONLYPAY appId."],
      ["onlypay_sign_key", "", "Signature Key", "ONLYPAY signKey. Environment variable ONLYPAY_SIGN_KEY can override this value."],
      ["onlypay_submit_url", "https://international.storepay.cn/api/pay/create_order", "Submit URL", "ONLYPAY create order endpoint."],
      ["onlypay_product_id", "8000", "Product ID", "ONLYPAY productId. The WordPress plugin uses 8000."]
    ]
  },
  {
    title: "Payment - PayPal",
    description: "PayPal Checkout, sandbox/live credentials, and Advanced Card Payments settings.",
    settings: [
      ["paypal_enabled", "false", "Enable PayPal Checkout", "Set true to allow users to pay orders and wallet recharges through PayPal."],
      ["paypal_title", "PayPal Checkout", "Checkout Title", "Displayed to users on PayPal payment panels."],
      ["paypal_mode", "sandbox", "Mode", "Use sandbox for testing and live for production payments."],
      ["paypal_sandbox_client_id", "", "Sandbox Client ID", "Client ID from the PayPal sandbox REST app."],
      ["paypal_sandbox_client_secret", "", "Sandbox Client Secret", "Client secret from the PayPal sandbox REST app."],
      ["paypal_live_client_id", "", "Live Client ID", "Client ID from the PayPal live REST app."],
      ["paypal_live_client_secret", "", "Live Client Secret", "Client secret from the PayPal live REST app."],
      ["paypal_advanced_card_enabled", "false", "Advanced Card Payments", "Set true when the PayPal merchant account is eligible for Advanced Card Payments."],
      ["paypal_brand_name", "CNSnap", "Brand Name", "Brand shown in the PayPal checkout context."],
      ["paypal_currency", "USD", "Currency", "Currency code used for PayPal order creation."]
    ]
  }
] as const;

export const generalSettingKeys = generalSettingGroups.flatMap((group) => group.settings.map(([key]) => key));
