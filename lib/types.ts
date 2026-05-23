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
  paymentMethod: "stripe";
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
