import { api } from '../services/api';
import type {
  BlogPostFilters,
  BlogCategory,
  BlogCategoryFilters,
  BlogPostResponse,
  BlogPostsResponse,
  BlogCategoriesResponse,
  BlogStatistics,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types/blog';

export const blogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ========== BLOG POSTS ==========
    getBlogPosts: builder.query<BlogPostsResponse, BlogPostFilters | void>({
      query: (params) => ({
        url: '/blog/posts',
        params: params || {},
      }),
      providesTags: ['Blog'],
    }),

    getBlogPostById: builder.query<BlogPostResponse, number>({
      query: (id) => `/blog/posts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Blog', id }],
    }),

    getBlogPostBySlug: builder.query<BlogPostResponse, string>({
      query: (slug) => `/blog/posts/slug/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: 'Blog', id: slug }],
    }),

    createBlogPost: builder.mutation<BlogPostResponse, CreateBlogPostPayload>({
      query: (body) => {
        // Handle FormData if file upload
        if (body.featured_image instanceof File) {
          const formData = new FormData();
          Object.entries(body).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (key === 'tags' && Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, value as any);
              }
            }
          });
          return {
            url: '/blog/posts',
            method: 'POST',
            body: formData,
          };
        }
        return {
          url: '/blog/posts',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Blog'],
    }),

    updateBlogPost: builder.mutation<BlogPostResponse, UpdateBlogPostPayload>({
      query: ({ id, ...body }) => {
        // Handle FormData if file upload
        if (body.featured_image instanceof File) {
          const formData = new FormData();
          Object.entries(body).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (key === 'tags' && Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, value as any);
              }
            }
          });
          formData.append('_method', 'PUT');
          return {
            url: `/blog/posts/${id}`,
            method: 'POST',
            body: formData,
          };
        }
        return {
          url: `/blog/posts/${id}`,
          method: 'PUT',
          body,
        };
      },
      invalidatesTags: (_result, _error, { id }) => ['Blog', { type: 'Blog', id }],
    }),

    deleteBlogPost: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/blog/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Blog'],
    }),

    getBlogStatistics: builder.query<{ success: boolean; data: BlogStatistics }, void>({
      query: () => '/blog/posts/statistics',
      providesTags: ['Blog'],
    }),

    // ========== BLOG CATEGORIES ==========
    getBlogCategories: builder.query<BlogCategoriesResponse, BlogCategoryFilters | void>({
      query: (params) => ({
        url: '/blog/categories',
        params: params || {},
      }),
      providesTags: ['BlogCategories'],
    }),

    createBlogCategory: builder.mutation<{ success: boolean; data: BlogCategory }, CreateCategoryPayload>({
      query: (body) => ({
        url: '/blog/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BlogCategories'],
    }),

    updateBlogCategory: builder.mutation<{ success: boolean; data: BlogCategory }, UpdateCategoryPayload>({
      query: ({ id, ...body }) => ({
        url: `/blog/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['BlogCategories', { type: 'BlogCategories', id }],
    }),

    deleteBlogCategory: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/blog/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BlogCategories'],
    }),
  }),
});

export const {
  // Posts
  useGetBlogPostsQuery,
  useGetBlogPostByIdQuery,
  useGetBlogPostBySlugQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
  useGetBlogStatisticsQuery,
  // Categories
  useGetBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
} = blogApi;