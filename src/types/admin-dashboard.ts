export type SalesTrendPoint = {
  date: string;
  salesUsd: number;
  serviceFeeUsd: number;
};

export type OrdersTrendPoint = {
  date: string;
  orders: number;
  paidOrders: number;
};

export type PaymentMethodPoint = {
  method: string;
  value: number;
};

export type CountryOrdersPoint = {
  country: string;
  orders: number;
};

export type TopProductPoint = {
  product: string;
  orders: number;
  revenueUsd: number;
};

export type ApiUsagePoint = {
  date: string;
  success: number;
  failed: number;
};

export type AdminDashboardStats = {
  salesTrend: SalesTrendPoint[];
  ordersTrend: OrdersTrendPoint[];
  paymentMethods: PaymentMethodPoint[];
  countryOrders: CountryOrdersPoint[];
  topProducts: TopProductPoint[];
  apiUsage: ApiUsagePoint[];
};
