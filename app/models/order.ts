import type { Timestamp } from "firebase-admin/firestore";

/** Firestore order document. This model is only consumed by server code. */
export type OrderPaymentMethod = "cod";
export type OrderDeliveryMethod = "courier";
export type OrderPaymentStatus = "unpaid" | "paid" | "refunded";
export type OrderFulfillmentStatus =
  | "new"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "completed"
  | "cancelled"
  // Legacy values retained for orders created before the status workflow change.
  | "pending"
  | "delivered";

export interface OrderStatusHistoryEntry {
  previousStatus: OrderFulfillmentStatus;
  newStatus: OrderFulfillmentStatus;
  changedAt: Timestamp;
  adminUid: string;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  sku: string;
  /** Product variants are not represented by the current Base catalog adapter. */
  variant: null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string | null;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
  note: string;
  wantInvoice: boolean;
  nip: string | null;
}

export interface OrderShippingAddress {
  street: string;
  postalCode: string;
  city: string;
  countryCode: "PL";
}

export interface OrderModel {
  id: string;
  orderNumber: string;
  createdAt: Timestamp;
  currency: "PLN";
  items: OrderItemSnapshot[];
  productTotal: number;
  deliveryCost: number;
  discountTotal: number;
  total: number;
  customer: OrderCustomer;
  shippingAddress: OrderShippingAddress;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  updatedAt?: Timestamp;
  statusHistory?: OrderStatusHistoryEntry[];
  idempotencyKey: string;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  items: Array<{ productId: string; qty: number }>;
  customer: OrderCustomerInput;
}

export interface OrderCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  note?: string;
  wantInvoice?: boolean;
  nip?: string;
}
