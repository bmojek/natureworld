export type Product = {
  id: string;
  name: string;

  slug: string;

  sku: string;

  allegroId?: string;

  price: number;

  stock: number;

  images: string[];

  content: string;

  categoryIds: string[];

  isActive: boolean;

  createdAt?: any;

  updatedAt?: any;
};
