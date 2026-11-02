export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  qty: number;
  /** Last server reported available stock; checkout still revalidates live stock. */
  stock?: number;
};
