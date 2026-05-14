import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface VariantPayload {
  variant_name: string;
  variant_value: string;
  cost_price: number;
  selling_price: number;
  additional_price: number;
}

export interface CreateProductPayload {
  product_name: string;
  category_id: number;
  description: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  has_variants: boolean;
  low_stock_alert: number;
  is_active: boolean;
  images: string[];
  variants: VariantPayload[];
}

export type CreateCategoryReq = {
  category_name: string;
  description: string;
  image?: File;
  parent_id: number;
  is_active: boolean;
};

// interface Category {
//     id: number;
//     category_name: string;
//     parent_id: number | null;
//     description?: string;
//     image?: string;
//     is_active: boolean;
//     created_at?: string;
//     updated_at?: string;
//     deleted_at?: string | null;
//     parent?: Category | null;
//     children?: Category[];
// }

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL, // same as your other apis
    prepareHeaders: (headers) => {
      const auth = localStorage.getItem("erp_auth");

      if (auth) {
        const token = JSON.parse(auth)?.token;
        if (token) headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Products"],

  endpoints: (builder) => ({
    createProduct: builder.mutation<any, FormData | CreateProductPayload>({
      query: (data) => {
        // If it's FormData, send as is
        if (data instanceof FormData) {
          return {
            url: "/products",
            method: "POST",
            body: data,
          };
        }
        // If it's JSON payload (for backward compatibility)
        return {
          url: "/products",
          method: "POST",
          body: data,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
      invalidatesTags: ["Products"],
    }),

    // Add this endpoint to inventoryApi:
    getProducts: builder.query<any, void>({
      query: () => ({
        url: "/products?per_page=100",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),

      providesTags: ["Products"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, formData }: { id: number; formData: FormData }) => ({
        url: `/products/${id}`,
        method: "POST", // Laravel uses POST with _method: 'PUT' for FormData
        body: formData,
      }),
      invalidatesTags: ["Products"],
    }),

    createCategory: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/categories",
        method: "POST",
        body: formData,
      }),
    }),

    // GET Categories - Fixed to return full response without transformation
    getCategories: builder.query<any, void>({
      query: () => ({
        url: "/categories",
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),
    }),

    getProductStock: builder.query<any, number>({
      query: (productId) => ({
        url: `/products/${productId}/stock`,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),
      providesTags: (productId) => [{ type: "Products", id: productId }],
    }),

    addStock: builder.mutation<
      any,
      {
        product_id: number;
        variant_id: number | null;
        branch_id: number;
        quantity: number;
        notes?: string;
      }
    >({
      query: (data) => ({
        url: "/inventory/add-stock",
        method: "POST",
        body: data,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),
      invalidatesTags: ({ product_id }) => [
        { type: "Products", id: product_id },
        "Products",
      ],
    }),

    createStockTransfer: builder.mutation<
      any,
      {
        from_branch_id: number;
        to_branch_id: number;
        transfer_type: string;
        notes?: string;
        items: Array<{
          product_id: number;
          variant_id: number | null;
          quantity: number;
          notes?: string;
        }>;
      }
    >({
      query: (data) => ({
        url: "/stock-transfers",
        method: "POST",
        body: data,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),
      invalidatesTags: ["Products"],
    }),

    getInventoryMovements: builder.query<
      any,
      {
        page?: number;
        from_branch_id?: string | number;
        to_branch_id?: string | number;
        movement_type?: string;
        product_id?: number;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params.page) {
          queryParams.append("page", params.page.toString());
        }
        if (params.from_branch_id) {
          queryParams.append(
            "from_branch_id",
            params.from_branch_id.toString(),
          );
        }
        if (params.to_branch_id) {
          queryParams.append("to_branch_id", params.to_branch_id.toString());
        }
        if (params.movement_type) {
          queryParams.append("movement_type", params.movement_type);
        }
        if (params.product_id) {
          queryParams.append("product_id", params.product_id.toString());
        }

        return {
          url: `/inventory/movements?${queryParams.toString()}`,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        };
      },
      providesTags: ["Products"],
    }),

    getLowStockProducts: builder.query<any, void>({
      query: () => ({
        url: "/products/low-stock",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),
      providesTags: ["Products"],
    }),

    getStockTransfers: builder.query<any, { page?: number; status?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.status) queryParams.append("status", params.status);

        return {
          url: `/stock-transfers?${queryParams.toString()}`,
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        };
      },
      providesTags: ["Products"],
    }),

    getAllInventory: builder.query<any, void>({
      query: () => ({
        url: "/inventory?per_page=1000",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }),
      providesTags: ["Products"],
    }),

    bulkDiscount: builder.mutation({
      query: (formData) => ({
        url: "/products/discounts/import",
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      }),
      invalidatesTags: ["Products"], // This will refresh your products list after discount is applied
    }),

    reportDamagedItem: builder.mutation({
      query: (damagedItemData) => ({
        // Changed from damagedItemsData to damagedItemData
        url: "/damaged-items",
        method: "POST",
        body: damagedItemData, // Use the correct parameter name
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Products"],
    }),

    generateDiscountTemplate: builder.mutation<
      {
        success: boolean;
        data: {
          file_name: string;
          download_url: string;
          total_items: number;
        };
      },
      { category_id?: number; start_date: string; end_date: string }
    >({
      query: (body) => ({
        url: "/products/discounts/generate-template",
        method: "POST",
        body,
      }),
    }),

    // Import bulk discount
    importBulkDiscount: builder.mutation<
      {
        success: boolean;
        data: {
          created: number;
          updated: number;
          errors: string[];
          total_processed: number;
        };
      },
      FormData
    >({
      query: (formData) => ({
        url: "/products/discounts/import",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Products"],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductsQuery,
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  useGetProductStockQuery,
  useAddStockMutation,
  useCreateStockTransferMutation,
  useGetInventoryMovementsQuery,
  useGetLowStockProductsQuery,
  useGetStockTransfersQuery,
  useGetAllInventoryQuery,
  useBulkDiscountMutation,
  useReportDamagedItemMutation,
  useGenerateDiscountTemplateMutation,
  useImportBulkDiscountMutation,
} = inventoryApi;
