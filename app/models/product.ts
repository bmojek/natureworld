export type Product = {
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
