export interface SeoSetting {
  id: number;
  seoable_type?: string;
  seoable_id?: number;
  is_global: boolean;
  page_name?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  schema_markup?: Record<string, any>;
  robots?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeoEntityRequest {
  seoable_type: string;
  seoable_id: number;
}

export interface SitemapUrl {
  id: number;
  url: string;
  type?: string;
  type_id?: number;
  priority: number;
  change_frequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddToSitemapPayload {
  url: string;
  type?: string;
  type_id?: number;
  priority?: number;
  change_frequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export interface SeoResponse {
  success: boolean;
  data: SeoSetting;
  message?: string;
}

export interface SeoListResponse {
  success: boolean;
  data: SeoSetting[];
  message?: string;
}

export interface SitemapResponse {
  success: boolean;
  data: SitemapUrl[];
  message?: string;
}