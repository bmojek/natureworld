export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  categoryIds: string[];

  description?: string;
  shortDescription?: string;

  images: string[];

  stock: number | 0;
  isActive: boolean;

  attributes?: {
    weightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    material?: string;
    flavor?: string;
    ageGroup?: string;
  };

  nutrition?: {
    protein?: number;
    fat?: number;
    fiber?: number;
    ash?: number;
    moisture?: number;
  };

  createdAt: Date;
}
