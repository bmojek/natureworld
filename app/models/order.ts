import { CartItem } from "./cart";

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface OrderModel {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  shipping: ShippingAddress;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "card" | "blik" | "cod";
  createdAt: Date;
}
