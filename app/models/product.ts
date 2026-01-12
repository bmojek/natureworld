export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  categoryIds: string[];
  images: string[];
  description: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
}
