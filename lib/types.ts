export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  grade: string;
  subject: string;
  badge: string;
  format: string;
  accentA: string;
  accentB: string;
};

export type CheckoutPayload = {
  items: CartItem[];
  customerName: string;
  email: string;
  phone?: string;
  notes?: string;
  purchaseTrackingConsent?: boolean;
  paymentMethod: "stripe";
  voucherCode?: string;
};

export type ProductInput = {
  title: string;
  excerpt: string;
  description: string;
  price: number;
  compareAt?: number;
  badge: string;
  grade: string;
  subject: string;
  category: string;
  format: string;
  pages: string;
  level: string;
  featured?: boolean;
  status?: string;
  accentA?: string;
  accentB?: string;
  slug?: string;
};

export type WalletTransactionType = "credit" | "debit";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string | null;
  orderId: string | null;
  createdAt: string;
};

export type UserWallet = {
  balance: number;
  transactions: WalletTransaction[];
};

export type GiftVoucher = {
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

export type VoucherValidation = {
  valid: boolean;
  voucher?: GiftVoucher;
  error?: string;
};
