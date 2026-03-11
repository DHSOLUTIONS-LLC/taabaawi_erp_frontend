import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { seoApi } from '../../services/seoApi';
import type { SeoSetting, SitemapUrl } from '../../types/seo';

interface SeoState {
  currentSeo: SeoSetting | null;
  sitemapUrls: SitemapUrl[];
  loading: boolean;
  error: string | null;
  sitemapXml: string | null;
}

const initialState: SeoState = {
  currentSeo: null,
  sitemapUrls: [],
  loading: false,
  error: null,
  sitemapXml: null,
};

const seoSlice = createSlice({
  name: 'seo',
  initialState,
  reducers: {
    setCurrentSeo: (state, action: PayloadAction<SeoSetting | null>) => {
      state.currentSeo = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get SEO for Page
      .addMatcher(
        seoApi.endpoints.getSeoForPage.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        seoApi.endpoints.getSeoForPage.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.currentSeo = payload.data;
        }
      )
      .addMatcher(
        seoApi.endpoints.getSeoForPage.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch SEO settings';
        }
      )

      // Save SEO
      .addMatcher(
        seoApi.endpoints.saveSeo.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        seoApi.endpoints.saveSeo.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.currentSeo = payload.data;
        }
      )
      .addMatcher(
        seoApi.endpoints.saveSeo.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to save SEO settings';
        }
      )

      // Get Sitemap
      .addMatcher(
        seoApi.endpoints.getSitemap.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        seoApi.endpoints.getSitemap.matchFulfilled,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.sitemapUrls = payload.data || [];
        }
      )
      .addMatcher(
        seoApi.endpoints.getSitemap.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch sitemap';
        }
      )

      // Generate Sitemap
      .addMatcher(
        seoApi.endpoints.generateSitemap.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        seoApi.endpoints.generateSitemap.matchFulfilled,
        (state, { payload }: PayloadAction<string>) => {
          state.loading = false;
          state.sitemapXml = payload;
        }
      )
      .addMatcher(
        seoApi.endpoints.generateSitemap.matchRejected,
        (state, { payload }: PayloadAction<any>) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to generate sitemap';
        }
      );
  },
});

export const { setCurrentSeo, clearError } = seoSlice.actions;
export default seoSlice.reducer;