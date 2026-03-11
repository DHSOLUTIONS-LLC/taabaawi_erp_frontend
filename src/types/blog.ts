export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  image_alt_text?: string;
  category_id?: number;
  category?: BlogCategory;
  tags?: string[];
  author_id: number;
  author?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  view_count: number;
  allow_comments: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  reading_time?: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  parent?: BlogCategory;
  children?: BlogCategory[];
  meta_title?: string;
  meta_description?: string;
  sort_order: number;
  is_active: boolean;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFilters {
  status?: string;
  category_id?: number;
  author_id?: number;
  is_featured?: boolean;
  tag?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface BlogCategoryFilters {
  is_active?: boolean;
  parent_id?: number;
  search?: string;
}

export interface BlogPostResponse {
  success: boolean;
  data: BlogPost;
  message?: string;
}

export interface BlogPostsResponse {
  success: boolean;
  data: BlogPost[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BlogCategoriesResponse {
  success: boolean;
  data: BlogCategory[];
}

export interface BlogStatistics {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  scheduled_posts: number;
  total_categories: number;
  total_views: number;
  most_viewed: BlogPost[];
  recent_posts: BlogPost[];
}

export interface CreateBlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featured_image?: File | string;
  image_alt_text?: string;
  category_id?: number;
  tags?: string[] | string; 
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  allow_comments?: boolean;
  is_featured?: boolean;
}

export interface UpdateBlogPostPayload extends Partial<CreateBlogPostPayload> {
  id: number;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number;
  meta_title?: string;
  meta_description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {
  id: number;
}