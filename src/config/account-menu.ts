import type { ComponentType } from "react";
import {
  BadgeHelp,
  CreditCard,
  Gift,
  Home,
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
  UserRound,
  WalletCards
} from "lucide-react";

export type AccountMenuItem = {
  key: string;
  label: string;
  path: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export const accountMenu: AccountMenuItem[] = [
  { key: "dashboard", label: "Dashboard", path: "/account", icon: Home },
  { key: "orders", label: "Orders", path: "/account/orders", icon: ShoppingBag },
  { key: "packages", label: "Packages", path: "/account/packages", icon: Package },
  { key: "wallet", label: "Wallet", path: "/account/wallet", icon: WalletCards },
  { key: "billing", label: "Billing", path: "/account/billing", icon: CreditCard },
  { key: "recharge", label: "Recharge", path: "/account/recharge", icon: ReceiptText },
  { key: "addresses", label: "Addresses", path: "/account/addresses", icon: MapPin },
  { key: "favorites", label: "Wishlist", path: "/account/favorites", icon: Heart },
  { key: "diyOrders", label: "DIY Orders", path: "/account/diy-orders", icon: Search },
  { key: "affiliate", label: "Affiliate", path: "/account/affiliate", icon: Gift },
  { key: "coupons", label: "Coupons", path: "/account/coupons", icon: Gift },
  { key: "ticketsCenter", label: "Tickets Center", path: "/account/tickets", icon: MessageSquareText },
  { key: "profile", label: "Profile", path: "/account/profile", icon: UserRound },
  { key: "helpCenter", label: "Help Center", path: "/account/help", icon: BadgeHelp }
];
