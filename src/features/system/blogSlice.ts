import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { blogApi } from '../../services/blogApi';
import type { BlogPost, BlogCategory } from '../../types/blog';

interface BlogState {
  posts: BlogPost[];
  selectedPost: BlogPost | null;
  categories: BlogCategory[];
  selectedCategory: BlogCategory | null;
  statistics: any | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: string;
    category_id?: number;
    search: string;
    page: number;
  };
}

const initialState: BlogState = {
  posts: [],
  selectedPost: null,
  categories: [],
  selectedCategory: null,
  statistics: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    search: '',
    page: 1,
  },
};

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setSelectedPost: (state, action: PayloadAction<BlogPost | null>) => {
      state.selectedPost = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<BlogCategory | null>) => {
      state.selectedCategory = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<BlogState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Blog Posts
      .addMatcher(
        blogApi.endpoints.getBlogPosts.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        blogApi.endpoints.getBlogPosts.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.posts = payload.data || [];
        }
      )
      .addMatcher(
        blogApi.endpoints.getBlogPosts.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch blog posts';
        }
      )

      // Get Blog Post By Id
      .addMatcher(
        blogApi.endpoints.getBlogPostById.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.selectedPost = payload.data;
        }
      )

      // Get Blog Categories
      .addMatcher(
        blogApi.endpoints.getBlogCategories.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.categories = payload.data || [];
        }
      )

      // Get Blog Statistics
      .addMatcher(
        blogApi.endpoints.getBlogStatistics.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.statistics = payload.data;
        }
      )

      // Create/Update/Delete mutations
      .addMatcher(
        blogApi.endpoints.createBlogPost.matchFulfilled,
        (state) => {
          state.selectedPost = null;
        }
      )
      .addMatcher(
        blogApi.endpoints.updateBlogPost.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.selectedPost = payload.data;
        }
      );
  },
});

export const { setSelectedPost, setSelectedCategory, setFilters, clearFilters, clearError } = blogSlice.actions;
export default blogSlice.reducer;