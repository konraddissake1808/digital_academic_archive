export type { User, Category, Subject, Resource, Purchase, Role, Tier } from "@/generated/prisma/client";

export type ResourceWithRelations = {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  coverUrl: string | null;
  price: number | string;
  isFree: boolean;
  isPublished: boolean;
  fileType: string | null;
  pageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  subjectId: string | null;
  createdById: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  subject: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdBy: {
    id: string;
    fullName: string | null;
    email: string;
  };
};

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  cover_url: string | null;
  price: number;
  is_free: boolean;
  is_published: boolean;
  file_type: string | null;
  category_id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  rank: number;
};
