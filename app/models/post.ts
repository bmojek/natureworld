export interface Post {
  id: string;

  title: string;
  slug: string;

  excerpt?: string;
  content?: string;

  images?: string[];

  type: "news" | "article";

  isPublished: boolean;

  createdAt: number;
  publishedAt: number;
}
