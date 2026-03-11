import { api } from '../services/api';
import type { 
  AILogsResponse, 
  AIStatisticsResponse,
  AILogsFilters 
} from '../types/ai-content';

export const aiContentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ========== GENERATION ENDPOINTS ==========
    
    /**
     * Generate SEO-friendly title from content
     * Used in: BlogPostForm, SEOForm
     */
    generateSeoTitle: builder.mutation<
      { success: boolean; data: { generated_title: string } },
      { content: string; keywords?: string }
    >({
      query: (body) => ({
        url: '/ai-content/generate-seo-title',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AIStatistics', 'AILogs'],
    }),

    /**
     * Generate meta description from content
     * Used in: BlogPostForm, SEOForm
     */
    generateMetaDescription: builder.mutation<
      { success: boolean; data: { generated_description: string; length: number } },
      { content: string; max_length?: number }
    >({
      query: (body) => ({
        url: '/ai-content/generate-meta-description',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AIStatistics', 'AILogs'],
    }),

    /**
     * Generate keywords from content
     * Used in: BlogPostForm, SEOForm
     */
    generateKeywords: builder.mutation<
      { success: boolean; data: { keywords: string[] } },
      { content: string; count?: number }
    >({
      query: (body) => ({
        url: '/ai-content/generate-keywords',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AIStatistics', 'AILogs'],
    }),

    /**
     * Generate product description from product details
     * Used in: ProductForm (Inventory module)
     */
    generateProductDescription: builder.mutation<
      { success: boolean; data: { generated_content: string; response_time_ms: number } },
      { 
        product_name: string; 
        category?: string; 
        features?: string;
        specifications?: string;
      }
    >({
      query: (body) => ({
        url: '/ai-content/generate-product-description',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AIStatistics', 'AILogs'],
    }),

    // ========== MONITORING ENDPOINTS ==========

    /**
     * Get AI generation logs with filters
     * Used in: AIContentDashboard
     */
    getAILogs: builder.query<AILogsResponse, AILogsFilters | void>({
      query: (params) => ({
        url: '/ai-content/logs',
        params: params || {},
      }),
      providesTags: ['AILogs'],
    }),

    /**
     * Get AI usage statistics
     * Used in: AIContentDashboard
     */
    getAIStatistics: builder.query<AIStatisticsResponse, void>({
      query: () => '/ai-content/statistics',
      providesTags: ['AIStatistics'],
    }),
  }),
});

export const {
  // Generation hooks
  useGenerateSeoTitleMutation,
  useGenerateMetaDescriptionMutation,
  useGenerateKeywordsMutation,
  useGenerateProductDescriptionMutation,
  
  // Monitoring hooks
  useGetAILogsQuery,
  useGetAIStatisticsQuery,
} = aiContentApi;