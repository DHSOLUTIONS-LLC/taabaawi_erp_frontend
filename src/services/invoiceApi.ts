// src/services/invoiceApi.ts
import { api } from './api';

export const invoiceApi = api.injectEndpoints({
    endpoints: (builder) => ({

        // ─── INVOICES ─────────────────────────────────────────────────────

        getInvoices: builder.query<any, {
            invoice_type?: 'b2c' | 'b2b' | 'quotation';
            branch_id?: number;
            payment_status?: string;
            source?: string;
            start_date?: string;
            end_date?: string;
            search?: string;
            page?: number;
            per_page?: number;
        }>({
            query: (params) => ({ url: '/invoices', params }),
            providesTags: ['Invoices'],
        }),

        getInvoiceById: builder.query<{ success: boolean; data: any }, number>({
            query: (id) => `/invoices/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Invoices', id }],
        }),

        getInvoiceStatistics: builder.query<{ success: boolean; data: any }, {
            branch_id?: number;
            start_date?: string;
            end_date?: string;
        }>({
            query: (params) => ({ url: '/invoices/statistics', params }),
            providesTags: ['Invoices'],
        }),

        createInvoice: builder.mutation<{ success: boolean; data: any }, {
            invoice_type: 'b2c' | 'b2b' | 'quotation';
            source: string;
            branch_id?: number;
            payment_method?: string;
            payment_status?: string;

            // B2C
            customer_name?: string;
            customer_phone?: string;
            customer_type?: string;

            // B2B
            company_name?: string;
            contact_person?: string;
            company_phone?: string;
            company_address?: string;
            sales_rep_id?: number;

            // Quotation
            valid_till?: string;
            quotation_status?: string;
            inco_terms?: string;

            // Items
            items: {
                product_id: number;
                variant_id?: number;
                product_name: string;
                variant_name?: string;
                sku?: string;
                image_url?: string;
                quantity: number;
                unit_price: number;
                discount_percentage?: number;
                tax_percentage?: number;
            }[];

            notes?: string;
        }>({
            query: (body) => ({ url: '/invoices', method: 'POST', body }),
            invalidatesTags: ['Invoices'],
        }),

        updateInvoice: builder.mutation<{ success: boolean; data: any }, {
            id: number;
            data: {
                customer_name?: string;
                customer_phone?: string;
                customer_type?: string;
                company_name?: string;
                contact_person?: string;
                company_phone?: string;
                company_address?: string;
                valid_till?: string;
                quotation_status?: string;
                inco_terms?: string;
                payment_method?: string;
                payment_status?: string;
                paid_amount?: number;
                notes?: string;
            };
        }>({
            query: ({ id, data }) => ({ url: `/invoices/${id}`, method: 'PUT', body: data }),
            invalidatesTags: (_r, _e, { id }) => [{ type: 'Invoices', id }, 'Invoices'],
        }),

        deleteInvoice: builder.mutation<{ success: boolean }, number>({
            query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Invoices'],
        }),

        // ─── QUOTATION CONVERT ────────────────────────────────────────────

        convertQuotation: builder.mutation<{ success: boolean; data: any }, {
            id: number;
            invoice_type: 'b2c' | 'b2b';
            payment_method: string;
            payment_status: string;
        }>({
            query: ({ id, ...body }) => ({ url: `/invoices/${id}/convert`, method: 'POST', body }),
            invalidatesTags: ['Invoices'],
        }),

        // ─── INSTALLMENTS (B2B only) ──────────────────────────────────────

        createInstallmentPlan: builder.mutation<{ success: boolean; data: any }, {
            id: number;
            installments: {
                due_date: string;
                amount: number;
                notes?: string;
            }[];
        }>({
            query: ({ id, ...body }) => ({ url: `/invoices/${id}/installments`, method: 'POST', body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: 'Invoices', id }],
        }),

        payInstallment: builder.mutation<{ success: boolean; data: any }, {
            invoiceId: number;
            installmentId: number;
        }>({
            query: ({ invoiceId, installmentId }) => ({
                url: `/invoices/${invoiceId}/installments/${installmentId}`,
                method: 'PUT',
            }),
            invalidatesTags: (_r, _e, { invoiceId }) => [{ type: 'Invoices', invoiceId }, 'Invoices'],
        }),

         

    }),
});

export const {
    // Invoices
    useGetInvoicesQuery,
    useGetInvoiceByIdQuery,
    useGetInvoiceStatisticsQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation,
    // Quotation
    useConvertQuotationMutation,
    // Installments
    useCreateInstallmentPlanMutation,
    usePayInstallmentMutation,
} = invoiceApi;