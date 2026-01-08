export interface CategoryModel {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
}
