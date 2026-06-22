# 海淘代购系统开发文档 V1.0

> 技术栈：Next.js + MySQL  
> 开发方式：Vibe Coding / AI 辅助快速开发  
> 对标产品：Superbuy、Oopbuy  
> 商品数据 API：OneBound / 万邦开放平台  
> 文档目标：在 V1.0 阶段快速上线，跑通核心代购业务流程，并为后续迭代保留清晰、模块化、可扩展的系统架构。

---

## 1. 项目定位

本项目是一套面向海外用户的中国电商代购系统。用户可以通过平台搜索淘宝、天猫、1688、京东、微店、唯品会、闲鱼等平台商品，提交代购订单，支付商品费用与国际运费，并通过用户中心查看订单、包裹和充值记录。

V1.0 不追求一次性复制 Superbuy / Oopbuy 的全部复杂能力，而是优先实现：

1. 用户能找到商品；
2. 用户能选择商品规格并加入购物车；
3. 用户能提交代购订单；
4. 后台能处理订单；
5. 系统能估算国际运费；
6. 用户能注册、登录、管理地址、查看订单；
7. 系统能发送基础邮件通知；
8. 后续支付、仓储、物流、推广联盟、客服等模块可以继续扩展。

---

## 2. V1.0 核心业务流程

### 2.1 标准代购流程

```text
用户访问网站
  ↓
输入商品 URL / 关键词 / 上传图片 / 搜索店铺
  ↓
系统调用 OneBound API 获取商品数据
  ↓
展示搜索结果或商品详情
  ↓
用户选择变体、数量
  ↓
加入购物车 / 立即购买
  ↓
填写收货地址
  ↓
系统估算商品金额 + 服务费 + 预估国际运费
  ↓
生成订单
  ↓
后台审核/确认订单
  ↓
用户支付商品费用/充值余额
  ↓
平台采购商品
  ↓
商品入库/后台更新包裹状态
  ↓
用户支付国际运费
  ↓
平台发货
  ↓
订单完成
```

### 2.2 DIY Order 流程

```text
用户提交 DIY Order 表单
  ↓
填写商品链接、商品说明、数量、备注、图片
  ↓
后台人工审核
  ↓
后台创建代购订单或补充报价
  ↓
用户确认并支付
  ↓
进入正常订单处理流程
```

---

## 3. V1.0 初期必须补充完善的功能

根据当前需求，V1.0 如果只做搜索、商品详情、购物车和订单还不够。作为代购系统，必须补充以下功能，否则业务很难闭环。

### 3.1 价格汇率与服务费模块

代购平台不能只展示原始 CNY 价格，还需要支持：

- CNY 原始商品价；
- USD 展示价格；
- 后台汇率设置；
- 服务费设置；
- 最低服务费；
- 手续费；
- 汇率加价比例；
- 后台手动调整订单金额。

建议 V1.0 做一个简单规则：

```text
USD Price = CNY Price / 后台汇率
Final Payable = 商品金额 + 服务费 + 预估运费
```

后台配置：

| 配置项 | 示例 |
|---|---|
| CNY/USD 汇率 | 7.20 |
| 服务费比例 | 5% |
| 最低服务费 | 2 USD |
| 是否启用服务费 | 是 |
| 是否允许后台改价 | 是 |

---

### 3.2 商品数据缓存模块

OneBound API 有调用成本，也可能出现响应慢、限流或失败。V1.0 必须设计商品缓存表。

缓存策略：

| 场景 | 策略 |
|---|---|
| 商品详情 URL 第一次访问 | 调用 OneBound API 并缓存 |
| 24 小时内重复访问 | 优先读取缓存 |
| 用户下单前 | 可强制刷新一次价格/库存 |
| API 失败 | 使用旧缓存并提示数据可能不是最新 |
| 后台 | 支持手动刷新商品数据 |

必须缓存的数据：

- 商品源平台；
- 原始商品 ID；
- 原始商品 URL；
- 标题；
- 主图；
- 图集；
- 价格；
- SKU / 变体；
- 店铺名称；
- 店铺链接；
- 商品详情 HTML / 图片；
- 重量估算；
- API 原始响应 JSON；
- 缓存时间；
- 失效时间。

---

### 3.3 订单拆分与包裹模块

代购系统和普通电商最大的区别是：用户买的是商品，但平台最终发的是包裹。

因此 V1.0 至少要有基础包裹模型：

- 一个用户可以有多个订单；
- 一个订单可以有多个商品；
- 商品采购后可以形成一个或多个包裹；
- 包裹可以单独支付国际运费；
- 包裹有重量、体积、物流方式、运单号。

V1.0 可以先简化：

```text
Order 订单
  └── OrderItem 商品项
  └── Package 包裹
        └── PackageItem 包裹商品
```

这样后续可以扩展：

- 合箱；
- 分箱；
- 拍照验货；
- 仓储费；
- 包裹加固；
- 退货；
- 转运。

---

### 3.4 余额/充值模块

代购系统通常涉及：

- 商品费用支付；
- 国际运费支付；
- 订单补差价；
- 退款；
- 余额充值；
- 余额扣款。

即使 V1.0 暂时不接真实支付，也建议设计钱包表，方便后面接入 PayPal、Stripe、信用卡、本地支付。

V1.0 可实现：

- 用户余额；
- 充值记录；
- 扣款记录；
- 退款记录；
- 后台手动加减余额；
- 支付模块预留。

---

### 3.5 后台人工处理能力

V1.0 必须考虑“人工可运营”，不能所有流程都依赖自动化。

后台必须支持：

- 查看订单；
- 修改订单状态；
- 修改订单金额；
- 修改商品采购状态；
- 添加包裹；
- 修改包裹重量；
- 选择物流渠道；
- 录入运单号；
- 发送邮件通知；
- 处理 DIY Order；
- 管理用户余额；
- 手动刷新商品 API 数据。

---

### 3.6 商品限制与敏感品类规则

代购业务必须处理不可运输商品或限制商品。

V1.0 后台建议增加：

- 禁运品类；
- 可运输品类；
- 不同物流渠道支持的商品类型；
- 商品标签；
- 敏感货标记；
- 后台人工审核开关。

商品详情页与运费估算页需要提示：

```text
部分商品可能因国家、物流渠道或品类限制无法运输，最终以平台审核结果为准。
```

---

### 3.7 操作日志与订单日志

为了方便客服、售后和排查问题，V1.0 必须有日志。

至少记录：

- 用户登录日志；
- 订单状态变更日志；
- 后台管理员操作日志；
- 余额变动日志；
- 邮件发送日志；
- API 调用日志；
- 支付回调日志（预留）。

---

## 4. 系统角色设计

| 角色 | 权限 |
|---|---|
| 游客 | 搜索商品、查看商品详情、运费估算、浏览帮助中心 |
| 注册用户 | 加购物车、提交订单、管理地址、查看订单、充值、查看包裹 |
| 管理员 | 后台全部管理权限 |
| 运营人员 | 订单、包裹、用户、物流管理 |
| 财务人员 | 充值、扣款、退款、支付记录管理 |
| 客服人员 | 用户查询、订单查询、帮助中心回复 |

V1.0 可以先实现：

```text
user
admin
```

后续再扩展 RBAC 权限系统。

---

## 5. 技术架构设计

### 5.1 推荐技术栈

| 模块 | 技术 |
|---|---|
| 前端框架 | Next.js App Router |
| UI | Tailwind CSS + shadcn/ui |
| 后端 | Next.js Route Handlers / Server Actions |
| 数据库 | MySQL |
| ORM | Prisma |
| 认证 | Auth.js / NextAuth |
| OAuth | Google Login |
| 邮件 | Nodemailer + SMTP |
| 缓存 | Redis，V1.0 可选 |
| 队列 | BullMQ，后续扩展 |
| 文件上传 | 本地 / S3 / Cloudflare R2 |
| 日志 | Winston / Pino |
| 部署 | Vercel / VPS / Docker |
| API 文档 | OpenAPI / Swagger |
| 后台 | Next.js Admin Panel |

### 5.2 总体架构

```text
┌──────────────────────────────┐
│            Browser            │
│  Web Frontend / Admin / User  │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│          Next.js App          │
│  Pages / Components / API     │
│  Route Handlers / Middleware  │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│        Service Layer          │
│ Product / Order / Shipping    │
│ User / Wallet / Notification  │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│        Integration Layer      │
│ OneBound / Google OAuth       │
│ SMTP / Payment Plugins        │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       Database / Cache        │
│       MySQL / Redis           │
└──────────────────────────────┘
```

### 5.3 分层目录设计

```text
src/
  app/
    (frontend)/
    (auth)/
    user/
    admin/
    api/
  components/
    ui/
    product/
    cart/
    order/
    shipping/
  modules/
    auth/
    user/
    product/
    cart/
    order/
    package/
    shipping/
    wallet/
    affiliate/
    notification/
    cms/
    settings/
  integrations/
    onebound/
    google/
    smtp/
    payment/
  lib/
    db.ts
    auth.ts
    logger.ts
    currency.ts
    validators.ts
  prisma/
    schema.prisma
```

---

## 6. 模块化设计原则

为了方便未来迭代，所有核心业务都要模块化，不要把逻辑全部写在页面里。

推荐模块：

```text
AuthModule
UserModule
ProductModule
SearchModule
CartModule
OrderModule
PackageModule
ShippingModule
WalletModule
PaymentModule
AffiliateModule
NotificationModule
CmsModule
AdminModule
SettingsModule
```

正确调用关系：

```text
Product Page → ProductService → OneBoundClient
Order Page → OrderService → CartService / WalletService
Admin Page → ShippingService → ShippingRuleRepository
```

---

## 7. V1.0 功能清单

### 7.1 前台首页

首页功能：

- 顶部导航；
- Logo；
- 语言切换；
- 币种切换；
- 登录/注册入口；
- 核心搜索框；
- 搜索类型 Tabs：商品 URL、关键词、图片、店铺、DIY Order；
- 热门平台入口：Taobao、Tmall、1688、JD、Weidian、Vip、Xianyu；
- 运费估算入口；
- How It Works；
- 服务优势；
- 帮助中心入口；
- Affiliate 入口。

V1.0 搜索框建议：

```text
[ 输入商品链接/关键词/店铺名 ] [图片搜索] [搜索按钮]
```

### 7.2 搜索结果页

支持：

- 商品卡片；
- 商品图片；
- 商品标题；
- CNY 价格；
- USD 价格；
- 平台来源；
- 店铺名；
- 查看详情按钮；
- 分页；
- 搜索失败提示；
- API 错误提示；
- 空结果提示。

### 7.3 图片搜索

流程：

```text
用户上传图片
  ↓
前端校验图片大小和格式
  ↓
上传到后端临时目录或对象存储
  ↓
调用 OneBound 图片搜索接口
  ↓
返回相似商品列表
```

限制：

- 支持 jpg/png/webp；
- 最大 5MB；
- 上传文件需进行安全校验；
- 临时图片定期清理。

### 7.4 店铺搜索

V1.0 可简化为：

```text
输入店铺 URL → 调用 API → 展示店铺商品列表
```

### 7.5 DIY Orders

表单字段：

| 字段 | 类型 | 必填 |
|---|---|---|
| 商品链接 | URL | 是 |
| 商品名称 | 文本 | 否 |
| 商品图片 | 上传 | 否 |
| 商品规格 | 文本 | 否 |
| 数量 | 数字 | 是 |
| 预算价格 | 数字 | 否 |
| 备注 | 文本 | 否 |
| 联系邮箱 | 邮箱 | 是 |

状态：

```text
submitted
reviewing
quoted
converted_to_order
rejected
cancelled
```

### 7.6 商品详情页

必须展示：

- 商品图片；
- 商品标题；
- 原始商品链接；
- 店铺名称；
- 店铺链接；
- 平台来源；
- CNY 价格；
- USD 价格；
- SKU / 变体选择器；
- 数量选择；
- 库存状态；
- 加入购物车；
- 立即购买；
- 运费估算模块；
- 商品详情；
- 商品属性；
- 购买须知；
- 禁运提醒。

核心组件：

```text
ProductGallery
ProductTitle
ProductPrice
ProductSkuSelector
QuantitySelector
AddToCartButton
BuyNowButton
ShippingEstimator
ProductDescription
ProductNotice
```

### 7.7 购物车

功能：

- 添加商品；
- 修改数量；
- 删除商品；
- 选择/取消选择商品；
- 展示商品规格；
- 展示 CNY / USD；
- 商品失效提醒；
- 商品重新同步；
- 去结算。

购物车存储策略：

| 状态 | 策略 |
|---|---|
| 游客 | localStorage |
| 登录用户 | MySQL |
| 游客登录后 | 合并 localStorage 到用户购物车 |

### 7.8 结算页

字段：

- 商品列表；
- 收货地址；
- 商品金额；
- 服务费；
- 预估运费；
- 总金额；
- 备注；
- 提交订单按钮。

V1.0 可以先不接真实支付，订单创建后状态为：

```text
pending_payment
```

后台可手动标记为已支付。

### 7.9 订单管理

用户端订单状态：

```text
pending_payment     待付款
paid                已付款
purchasing          采购中
purchased           已采购
warehouse_received  已入库
shipping_pending    待支付国际运费
shipping_paid       运费已支付
shipped             已发货
completed           已完成
cancelled           已取消
refunded            已退款
```

后台订单功能：

- 订单列表；
- 订单详情；
- 修改状态；
- 修改价格；
- 添加备注；
- 添加采购信息；
- 创建包裹；
- 发送通知；
- 导出订单。

### 7.10 包裹管理

包裹字段：

- 包裹编号；
- 用户；
- 关联订单；
- 包裹商品；
- 重量；
- 体积；
- 物流渠道；
- 国际运费；
- 运单号；
- 状态。

包裹状态：

```text
pending
waiting_shipping_payment
shipping_paid
shipped
delivered
returned
cancelled
```

### 7.11 运费估算模块

前台页面路径：

```text
/shipping-calculator
```

后台配置：

| 配置项 | 说明 |
|---|---|
| 物流渠道名称 | DHL / EMS / Air Cargo |
| 支持国家 | 多选国家 |
| 首重价格 | 例如 0.5kg 起 |
| 续重价格 | 每 0.5kg |
| 体积重系数 | 长 × 宽 × 高 / 5000 |
| 最小计费重量 | 例如 0.5kg |
| 预计时效 | 7-15 天 |
| 支持品类 | 普货 / 敏感货 / 电子产品 |
| 禁运品类 | 液体 / 电池 / 食品等 |
| 是否启用 | 是/否 |

计算公式：

```text
volumeWeight = length * width * height / divisor
chargeableWeight = max(actualWeight, volumeWeight, minWeight)
shippingFee = firstWeightFee + ceil((chargeableWeight - firstWeight) / unitWeight) * additionalFee
```

### 7.12 多币种

V1.0 支持：

- CNY；
- USD。

后台设置：

- 汇率；
- 默认币种；
- 价格小数位；
- 汇率更新时间；
- 是否启用自动汇率接口，V1.0 可先手动。

### 7.13 多语言

系统语言：

- 中文简体；
- 英文。

前台实时翻译：

- 德语；
- 法语；
- 荷兰语；
- 波兰语；
- 日语；
- 韩语；
- 后台可继续添加。

设计策略：

1. 系统基础 UI 使用语言包；
2. 后台与核心业务字段支持中英文；
3. 前台非核心内容通过 Google JS 实时翻译；
4. 商品数据不存储多语言版本；
5. 订单、金额、状态等关键字段不依赖机器翻译。

语言包结构：

```text
locales/
  en.json
  zh-CN.json
```

### 7.14 用户中心

页面：

```text
/user/dashboard
/user/orders
/user/packages
/user/addresses
/user/wallet
/user/recharge
/user/profile
/user/affiliate
/user/diy-orders
```

功能：

- 个人信息；
- 地址管理；
- 订单历史；
- 包裹查询；
- 余额；
- 充值记录；
- 推广链接；
- DIY Order 记录。

### 7.15 推广联盟模块

V1.0 简化版：

- 用户拥有唯一邀请码；
- 用户拥有推广链接；
- 注册时记录推荐人；
- 后台可设置佣金比例；
- 订单完成后生成佣金记录；
- 后台可手动审核佣金；
- 用户中心展示推广数据。

佣金状态：

```text
pending
approved
rejected
paid
```

### 7.16 邮件通知 SMTP

邮件场景：

- 注册欢迎；
- 找回密码；
- 订单创建；
- 订单状态更新；
- 包裹创建；
- 运费待支付；
- 包裹已发货；
- DIY Order 报价；
- 余额变动。

### 7.17 帮助中心

V1.0 支持后台创建文章：

- How to Buy；
- Shipping Guide；
- Payment Guide；
- Refund Policy；
- Restricted Items；
- FAQ；
- Affiliate Guide。

---

## 8. 后台管理系统

### 8.1 后台菜单

```text
Dashboard
Users
Orders
Packages
DIY Orders
Products Cache
Shipping Channels
Wallet / Transactions
Affiliate
Help Center
Email Logs
API Logs
Settings
Admins
```

### 8.2 Dashboard 指标

- 今日注册用户；
- 今日订单；
- 待处理订单；
- 待报价 DIY Order；
- 待发货包裹；
- 今日充值；
- API 调用次数；
- API 失败次数。

---

## 9. 第三方接口设计

### 9.1 OneBound API 封装

不要在业务代码里直接请求 OneBound API。必须封装为统一客户端。

路径建议：

```text
src/integrations/onebound/
  client.ts
  types.ts
  mapper.ts
  endpoints.ts
```

核心方法：

```ts
searchByKeyword(platform, keyword, page)
searchByUrl(url)
searchByImage(imageUrl)
searchShop(platform, shopUrlOrKeyword)
getItemDetail(platform, itemIdOrUrl)
```

支持平台：

| 平台 | API Type |
|---|---|
| 淘宝 | taobao |
| 天猫 | tmall |
| 1688 | 1688 |
| 京东 | jd |
| 微店 | weidian |
| 唯品会 | vip |
| 闲鱼 | xianyu |

统一商品结构：

```ts
type NormalizedProduct = {
  platform: string
  sourceItemId: string
  sourceUrl: string
  title: string
  priceCny: number
  priceUsd: number
  images: string[]
  mainImage: string
  shopName?: string
  shopUrl?: string
  skus: ProductSku[]
  attributes: Record<string, string>
  descriptionHtml?: string
  raw: unknown
}
```

### 9.2 Google OAuth

使用 Auth.js / NextAuth 接入 Google 登录。

要求：

- Google Client ID；
- Google Client Secret；
- 回调地址；
- 登录成功后写入 users 表；
- 支持绑定已有邮箱用户；
- 支持后台禁用用户。

### 9.3 Google JS Translate

设计要求：

- 翻译组件只在前台加载；
- 后台不加载 Google JS 翻译；
- 订单状态、金额、按钮等核心 UI 优先使用系统语言包；
- 后台可以配置允许显示的语言列表；
- 用户选择语言后存储在 cookie/localStorage。

### 9.4 支付模块预留

路径建议：

```text
src/integrations/payment/
  providers/
    paypal.ts
    stripe.ts
    manual.ts
  payment.service.ts
  payment.types.ts
```

统一接口：

```ts
interface PaymentProvider {
  createPayment(orderId: string, amount: number, currency: string): Promise<PaymentResult>
  verifyWebhook(payload: unknown): Promise<WebhookResult>
  refund(paymentId: string, amount: number): Promise<RefundResult>
}
```

V1.0 可实现：

- Manual Payment；
- Admin Mark as Paid；
- Wallet Balance Payment。

---

## 10. 数据库设计

以下为 V1.0 推荐核心表。

### 10.1 users

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  locale VARCHAR(20) DEFAULT 'en',
  currency VARCHAR(10) DEFAULT 'USD',
  referral_code VARCHAR(50) UNIQUE,
  referred_by BIGINT NULL,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10.2 product_cache

```sql
CREATE TABLE product_cache (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  platform VARCHAR(50) NOT NULL,
  source_item_id VARCHAR(255),
  source_url TEXT,
  title TEXT,
  main_image TEXT,
  images JSON,
  shop_name VARCHAR(255),
  shop_url TEXT,
  price_cny DECIMAL(12,2),
  price_usd DECIMAL(12,2),
  skus JSON,
  attributes JSON,
  description_html LONGTEXT,
  raw_json JSON,
  cache_expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10.3 orders

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_payment',
  currency VARCHAR(10) DEFAULT 'USD',
  subtotal_cny DECIMAL(12,2) DEFAULT 0,
  subtotal_usd DECIMAL(12,2) DEFAULT 0,
  service_fee_usd DECIMAL(12,2) DEFAULT 0,
  estimated_shipping_usd DECIMAL(12,2) DEFAULT 0,
  total_usd DECIMAL(12,2) DEFAULT 0,
  address_id BIGINT,
  user_note TEXT,
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10.4 order_items

```sql
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_cache_id BIGINT,
  platform VARCHAR(50),
  source_item_id VARCHAR(255),
  source_url TEXT,
  title TEXT,
  image TEXT,
  sku_id VARCHAR(255),
  sku_text TEXT,
  price_cny DECIMAL(12,2),
  price_usd DECIMAL(12,2),
  quantity INT DEFAULT 1,
  purchase_status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10.5 packages

```sql
CREATE TABLE packages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  package_no VARCHAR(100) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  order_id BIGINT,
  status VARCHAR(50) DEFAULT 'pending',
  weight_kg DECIMAL(10,3),
  length_cm DECIMAL(10,2),
  width_cm DECIMAL(10,2),
  height_cm DECIMAL(10,2),
  shipping_channel_id BIGINT,
  shipping_fee_usd DECIMAL(12,2),
  tracking_number VARCHAR(255),
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10.6 shipping_channels

```sql
CREATE TABLE shipping_channels (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  supported_countries JSON,
  supported_categories JSON,
  forbidden_categories JSON,
  first_weight_kg DECIMAL(10,3),
  first_weight_fee_usd DECIMAL(12,2),
  additional_weight_kg DECIMAL(10,3),
  additional_weight_fee_usd DECIMAL(12,2),
  volume_divisor INT DEFAULT 5000,
  min_weight_kg DECIMAL(10,3) DEFAULT 0.5,
  delivery_time_min INT,
  delivery_time_max INT,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 10.7 wallet_transactions

```sql
CREATE TABLE wallet_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  balance_after DECIMAL(12,2),
  related_order_id BIGINT NULL,
  related_package_id BIGINT NULL,
  note TEXT,
  created_by BIGINT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 11. API 路由设计

### 11.1 Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 11.2 Product / Search

```text
GET  /api/search?type=keyword&q=xxx&platform=taobao
POST /api/search/image
GET  /api/search/shop?q=xxx&platform=taobao
GET  /api/product/detail?platform=taobao&id=xxx
POST /api/product/refresh
```

### 11.3 Cart

```text
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
POST   /api/cart/merge
```

### 11.4 Order

```text
GET   /api/orders
GET   /api/orders/:id
POST  /api/orders
PATCH /api/orders/:id/cancel
POST  /api/orders/:id/pay-wallet
```

### 11.5 Package

```text
GET  /api/packages
GET  /api/packages/:id
POST /api/packages/:id/pay-shipping
```

### 11.6 Shipping

```text
POST /api/shipping/estimate
GET  /api/shipping/channels?country=US
```

### 11.7 Admin

```text
GET   /api/admin/dashboard
GET   /api/admin/users
PATCH /api/admin/users/:id
GET   /api/admin/orders
PATCH /api/admin/orders/:id
GET   /api/admin/packages
PATCH /api/admin/packages/:id
GET   /api/admin/settings
PATCH /api/admin/settings
```

---

## 12. 页面路由设计

### 12.1 前台

```text
/
/search
/product/[platform]/[id]
/cart
/checkout
/shipping-calculator
/diy-order
/affiliate
/help
/help/[slug]
/login
/register
```

### 12.2 用户中心

```text
/user
/user/orders
/user/orders/[id]
/user/packages
/user/packages/[id]
/user/addresses
/user/wallet
/user/recharge
/user/profile
/user/affiliate
/user/diy-orders
```

### 12.3 后台

```text
/admin
/admin/users
/admin/orders
/admin/orders/[id]
/admin/packages
/admin/diy-orders
/admin/product-cache
/admin/shipping
/admin/wallet
/admin/affiliate
/admin/help
/admin/settings
/admin/logs
```

---

## 13. 订单金额计算规则

### 13.1 商品金额

```text
商品总价 CNY = sum(item.priceCny * item.quantity)
商品总价 USD = 商品总价 CNY / 汇率
```

### 13.2 服务费

```text
服务费 = max(商品总价 USD * 服务费比例, 最低服务费)
```

### 13.3 订单应付金额

V1.0 可以分两阶段收费：

阶段一：商品费用

```text
商品支付金额 = 商品总价 USD + 服务费
```

阶段二：国际运费

```text
包裹支付金额 = 实际国际运费
```

---

## 14. 状态机设计

### 14.1 订单状态机

```text
pending_payment
  ↓
paid
  ↓
purchasing
  ↓
purchased
  ↓
warehouse_received
  ↓
shipping_pending
  ↓
shipping_paid
  ↓
shipped
  ↓
completed
```

异常状态：

```text
cancelled
refunded
purchase_failed
out_of_stock
price_changed
```

### 14.2 包裹状态机

```text
pending
  ↓
waiting_shipping_payment
  ↓
shipping_paid
  ↓
shipped
  ↓
delivered
```

异常状态：

```text
returned
lost
cancelled
```

---

## 15. 安全设计

### 15.1 用户安全

- 密码必须 hash；
- 登录失败限制；
- Google OAuth 回调校验；
- Session 过期；
- 用户状态禁用；
- CSRF 防护；
- XSS 防护。

### 15.2 API 安全

- OneBound API Key 只存服务端；
- 后台接口必须校验管理员权限；
- 文件上传必须限制类型和大小；
- API 请求限流；
- 所有用户输入必须校验；
- 重要操作记录日志。

### 15.3 金额安全

- 金额计算必须在后端完成；
- 前端金额仅用于展示；
- 订单金额快照必须写入数据库；
- 后台改价必须记录日志；
- 余额变动必须写入交易记录。

---

## 16. 缓存与性能优化

### 16.1 商品缓存

| 数据 | 缓存时间 |
|---|---|
| 商品详情 | 24 小时 |
| 搜索结果 | 1-6 小时 |
| 店铺商品 | 6 小时 |
| 汇率 | 手动或 12 小时 |
| 运费渠道 | 30 分钟 |

### 16.2 数据库索引建议

```sql
users.email
orders.user_id
orders.order_no
orders.status
packages.user_id
packages.package_no
product_cache.platform
product_cache.source_item_id
wallet_transactions.user_id
logs.type
```

---

## 17. 错误处理

### 17.1 OneBound API 错误

错误场景：

- API 超时；
- 商品不存在；
- 平台不支持；
- API Key 错误；
- 频率限制；
- 返回字段缺失。

处理策略：

```text
1. 记录 api_logs
2. 返回用户友好提示
3. 如果有缓存，展示缓存
4. 如果无缓存，提示稍后再试或提交 DIY Order
```

前端提示：

```text
We could not fetch this product right now. You can try again later or submit a DIY Order.
```

### 17.2 价格变化

下单前刷新商品价格，如价格变化：

```text
提示用户价格已更新，需要重新确认。
```

---

## 18. Vibe Coding 开发任务拆解

### 18.1 第一阶段：项目基础

```text
- 初始化 Next.js 项目
- 配置 TypeScript
- 配置 Tailwind CSS
- 配置 shadcn/ui
- 配置 Prisma
- 连接 MySQL
- 创建基础数据库模型
- 配置 Auth.js / NextAuth
- 实现邮箱注册登录
- 实现 Google 登录
- 创建基础布局
- 创建后台布局
```

### 18.2 第二阶段：商品搜索与详情

```text
- 封装 OneBound Client
- 实现 URL 类型判断
- 实现关键词搜索
- 实现商品详情接口
- 实现商品数据 Normalizer
- 实现商品缓存表
- 实现搜索结果页
- 实现商品详情页
- 实现 SKU 选择器
- 实现价格 CNY/USD 显示
```

### 18.3 第三阶段：购物车与订单

```text
- 实现游客购物车 localStorage
- 实现登录用户购物车
- 实现购物车合并
- 实现 checkout 页面
- 实现地址管理
- 实现订单创建
- 实现订单状态
- 实现用户订单列表
- 实现订单详情页
```

### 18.4 第四阶段：运费与包裹

```text
- 创建物流渠道表
- 实现后台物流渠道管理
- 实现运费估算 API
- 实现运费估算页面
- 商品详情页接入运费估算
- 后台创建包裹
- 用户中心查看包裹
```

### 18.5 第五阶段：后台管理

```text
- 后台 Dashboard
- 用户管理
- 订单管理
- 包裹管理
- DIY Order 管理
- 商品缓存管理
- 钱包记录管理
- 系统设置
- API 日志
- 邮件日志
```

### 18.6 第六阶段：通知、多语言与联盟

```text
- SMTP 配置
- 邮件模板
- 订单状态邮件
- 包裹状态邮件
- 语言包 zh-CN/en
- Google JS Translate
- 推广链接
- 推荐关系
- 佣金记录
```

---

## 19. 推荐 Cursor / Vibe Coding Prompt

### 19.1 初始化项目 Prompt

```text
请使用 Next.js App Router + TypeScript + Tailwind CSS + Prisma + MySQL 创建一个海淘代购系统项目。请按模块化架构创建目录：modules、integrations、components、lib、app。先实现基础布局、数据库连接、Prisma schema、Auth.js 登录框架，并创建 user/admin 两套布局。
```

### 19.2 OneBound 接口 Prompt

```text
请在 src/integrations/onebound 中封装 OneBound API Client，支持 searchByKeyword、searchByUrl、searchByImage、searchShop、getItemDetail。不要在页面中直接调用第三方 API。请把不同平台返回的数据统一映射为 NormalizedProduct，并增加错误处理、超时、日志记录和商品缓存。
```

### 19.3 商品详情页 Prompt

```text
请实现商品详情页 /product/[platform]/[id]，从后端 API 获取 NormalizedProduct，展示图片、标题、原始链接、店铺链接、CNY/USD 价格、SKU 选择器、数量选择、加入购物车、立即购买、运费估算和商品详情 HTML。注意 SKU 选择后价格和库存要联动更新。
```

### 19.4 运费估算 Prompt

```text
请实现 ShippingModule，后台可管理物流渠道，包括支持国家、首重、续重、体积重系数、预计运输时间、支持品类、禁运品类。前台实现 /shipping-calculator 页面，商品详情页也可以调用运费估算组件。
```

### 19.5 订单与包裹 Prompt

```text
请实现订单模块和包裹模块。订单从购物车创建，记录商品快照、价格快照、地址快照和订单状态。后台可修改订单状态、创建包裹、填写重量、选择物流渠道、计算运费、录入运单号。用户中心可查看订单和包裹状态。
```

---

## 20. 环境变量设计

```env
DATABASE_URL="mysql://user:password@localhost:3306/buy_agent"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change_this_secret"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

ONEBOUND_API_KEY=""
ONEBOUND_API_SECRET=""
ONEBOUND_API_BASE_URL="https://api-gw.onebound.cn"

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM_EMAIL=""
SMTP_FROM_NAME="Buy Agent"

DEFAULT_CURRENCY="USD"
CNY_USD_RATE="7.20"
SERVICE_FEE_RATE="0.05"
MIN_SERVICE_FEE_USD="2"
```

---

## 21. 后续迭代路线图

### V1.1 支付与钱包增强

- PayPal；
- Stripe；
- 支付回调；
- 自动充值；
- 退款流程；
- 支付失败重试；
- 财务报表。

### V1.2 仓库与物流增强

- 入库拍照；
- 合箱；
- 分箱；
- 仓储费；
- 包裹加固；
- 物流轨迹查询；
- 物流 API 对接。

### V1.3 搜索体验增强

- 搜索历史；
- 热门搜索；
- 商品收藏；
- 商品推荐；
- 搜索筛选；
- 搜索排序；
- 搜索结果缓存优化。

### V1.4 多语言与国际化增强

- 后台语言包管理；
- SEO 多语言页面；
- 人工翻译字段；
- 不同国家独立运费页；
- 多币种自动汇率。

### V1.5 运营增长

- 优惠券；
- 积分；
- 会员等级；
- 推广联盟自动结算；
- 邮件营销；
- 用户生命周期运营。

---

## 22. V1.0 验收标准

### 22.1 用户端验收

- 用户可以注册和登录；
- 用户可以使用 Google 登录；
- 用户可以搜索商品 URL；
- 用户可以关键词搜索商品；
- 用户可以查看商品详情；
- 用户可以选择 SKU；
- 用户可以加入购物车；
- 用户可以提交订单；
- 用户可以填写地址；
- 用户可以查看订单状态；
- 用户可以查看包裹状态；
- 用户可以使用运费估算；
- 用户可以提交 DIY Order；
- 用户可以切换 CNY/USD；
- 用户可以切换前台语言。

### 22.2 后台验收

- 管理员可以登录后台；
- 管理员可以查看用户；
- 管理员可以查看订单；
- 管理员可以修改订单状态；
- 管理员可以创建包裹；
- 管理员可以设置物流渠道；
- 管理员可以查看 API 日志；
- 管理员可以设置汇率和服务费；
- 管理员可以处理 DIY Order；
- 管理员可以配置 SMTP；
- 管理员可以发送订单通知邮件。

### 22.3 技术验收

- 所有 API Key 不暴露到前端；
- 数据库 migration 可执行；
- 订单金额由后端计算；
- 商品详情有缓存；
- API 错误有日志；
- 后台接口有权限控制；
- 项目可以本地启动；
- 项目可以部署到生产环境；
- README 包含安装和部署说明。

---

## 23. README 安装说明建议

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env

# 3. 初始化数据库
npx prisma migrate dev

# 4. 生成 Prisma Client
npx prisma generate

# 5. 启动开发环境
npm run dev
```

---

## 24. 项目开发优先级建议

如果只想快速上线，建议按以下顺序开发：

```text
1. 用户注册登录
2. OneBound URL 商品解析
3. 商品详情页
4. 购物车
5. 地址管理
6. 订单创建
7. 后台订单管理
8. 运费估算
9. 包裹管理
10. SMTP 邮件通知
11. DIY Order
12. 多语言和多币种
13. 推广联盟
14. 支付预留
```

其中最小上线版本可以是：

```text
用户登录 + 商品 URL 解析 + 商品详情 + 加购物车 + 下单 + 后台处理订单 + 运费估算 + 邮件通知
```

关键词搜索、图片搜索、店铺搜索可以作为 V1.0 完整版继续补充，但为了最快跑通业务，建议优先保证 URL 商品解析和 DIY Order 可用。

---

## 25. 重要产品建议

### 25.1 V1.0 不要过度自动化

代购系统初期最重要的是跑通业务，而不是把所有流程都自动化。建议保留大量后台人工处理能力。

### 25.2 商品数据要做快照

订单一旦创建，必须保存商品标题、图片、SKU、价格等快照，不能只保存商品 API ID。否则后续 API 数据变化会导致订单数据混乱。

### 25.3 支付可以先预留，不强行一次接完

支付系统涉及回调、安全、退款和对账。V1.0 可以先做余额和后台手动确认，后续再接 PayPal / Stripe。

### 25.4 包裹模块必须从 V1.0 开始设计

如果不设计包裹模块，后续做国际运费、合箱、物流追踪会非常痛苦。

### 25.5 API 成本要控制

OneBound API 需要缓存、限流和日志统计。搜索和详情接口不能无限调用。

---

## 26. 参考资料

- Next.js App Router / Route Handlers / Server Actions 官方文档
- Prisma ORM / MySQL Connector 官方文档
- Auth.js / NextAuth Google OAuth 文档
- OneBound / 万邦开放平台 API 文档
- Superbuy / Oopbuy 海淘代购业务流程参考

---

## 27. 结论

这套系统的 V1.0 目标不是完整复制 Superbuy，而是快速搭建一个可运营、可接单、可处理订单、可估算运费、可继续迭代的海淘代购平台。

最关键的架构原则是：

1. 商品 API 封装独立；
2. 商品数据缓存；
3. 订单数据快照；
4. 订单和包裹分离；
5. 运费规则后台可配置；
6. 支付模块插件化预留；
7. 后台人工运营能力优先；
8. 所有核心模块保持清晰边界。

只要按照该文档开发，V1.0 可以较快上线，并且后续可以平滑迭代到支付、仓储、物流、联盟、客服和自动化运营系统。
