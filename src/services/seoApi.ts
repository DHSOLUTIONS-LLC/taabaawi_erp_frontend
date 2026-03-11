import { api } from '../services/api';
import type {
  SeoSetting,
  SeoEntityRequest,
  SeoResponse,
  SeoListResponse,
  SitemapResponse,
  AddToSitemapPayload,
} from '../types/seo';

export const seoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get SEO for entity
    getSeoForEntity: builder.mutation<SeoResponse, SeoEntityRequest>({
      query: (body) => ({
        url: '/seo/entity',
        method: 'POST',
        body,
      }),
    }),

    // Get SEO for page
    getSeoForPage: builder.query<SeoResponse, string>({
      query: (pageName) => `/seo/page/${pageName}`,
      providesTags: (_result, _error, pageName) => [{ type: 'Seo', id: pageName }],
    }),

    // Create/Update SEO settings
    saveSeo: builder.mutation<SeoResponse, Partial<SeoSetting>>({
      query: (body) => ({
        url: '/seo',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Seo'],
    }),

    // Delete SEO settings
    deleteSeo: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/seo/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Seo'],
    }),

    // Get sitemap URLs
    getSitemap: builder.query<SitemapResponse, void>({
      query: () => '/seo/sitemap',
      providesTags: ['Sitemap'],
    }),

    // Generate XML sitemap
    generateSitemap: builder.query<string, void>({
      query: () => ({
        url: '/seo/sitemap/generate',
        responseHandler: (response) => response.text(),
      }),
    }),

    // Add URL to sitemap
    addToSitemap: builder.mutation<{ success: boolean; data: SitemapUrl }, AddToSitemapPayload>({
      query: (body) => ({
        url: '/seo/sitemap/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sitemap'],
    }),
  }),
});

export const {
  useGetSeoForEntityMutation,
  useGetSeoForPageQuery,
  useSaveSeoMutation,
  useDeleteSeoMutation,
  useGetSitemapQuery,
  useGenerateSitemapQuery,
  useAddToSitemapMutation,
  useLazyGenerateSitemapQuery,
} = seoApi;