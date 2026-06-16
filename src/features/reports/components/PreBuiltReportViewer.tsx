// src/features/reports/components/PreBuiltReportViewer.tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { setPreBuiltDates } from '../reportsSlice';
import type { RootState } from '../../../app/store';
import {
  useGetSalesSummaryQuery,
  useGetTopSellingProductsQuery,
  useGetInventoryStatusQuery,
  useGetCustomerAnalysisQuery,
  useGetEmployeePerformanceQuery,
  useGetFinancialSummaryQuery,
} from '../../../services/reportsApi';
import * as XLSX from 'xlsx';

type ReportKey = 'sales' | 'products' | 'inventory' | 'customers' | 'employees' | 'financial';

const REPORT_CONFIG: Record<ReportKey, { label: string; description: string }> = {
  sales: { label: 'Sales Summary', description: 'Daily sales, revenue, discounts and tax' },
  products: { label: 'Top Selling Products', description: 'Best performing products by quantity sold' },
  inventory: { label: 'Inventory Status', description: 'Stock levels, low stock and out of stock items' },
  customers: { label: 'Customer Analysis', description: 'Customer activity, top spenders and segments' },
  employees: { label: 'Employee Performance', description: 'Sales performance per employee' },
  financial: { label: 'Financial Summary', description: 'Revenue, costs, gross and net profit' },
};

// Helper function to fetch purchase history for a customer
const fetchCustomerPurchaseHistory = async (customerId: number, token: string) => {
  try {
    const response = await fetch(
      `https://prearticulate-nonsymbiotically-mira.ngrok-free.dev/api/customers/${customerId}/purchase-history?per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const result = await response.json();
    return result?.data?.orders?.data || [];
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}:`, error);
    return [];
  }
};

// Helper function to export data to Excel
const exportToExcel = (data: any[], reportKey: string, reportLabel: string, dateRange: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  let exportData = [...data];
  
  if (reportKey === 'customers') {
    exportData = data.map(customer => ({
      'Customer ID': customer.customer_id || customer.id || 'N/A',
      'Customer Name': customer.full_name || customer.customer_name || customer.name || 'Anonymous Customer',
      'Email': customer.email || 'N/A',
      'Phone': customer.phone || customer.mobile || 'N/A',
      'Total Orders': customer.period_orders || customer.total_orders || customer.order_count || 0,
      'Total Spent (KWD)': customer.period_spent || customer.total_spent || customer.amount_spent || 0,
      'Average Order Value (KWD)': customer.period_average_order_value || customer.average_order_value || 0,
      'Last Order Date': customer.period_last_purchase_date || customer.last_order_date || 'No orders yet',
      'Last Invoice Number': customer.last_invoice_number || 'N/A',
      'Last Invoice Value (KWD)': customer.last_invoice_value || 0,
      'Date of Creation': customer.created_at || customer.registration_date || 'N/A',
      'Customer Status': customer.status || customer.customer_status || 'Active',
      'Customer Tier': customer.tier || customer.loyalty_tier || 'N/A',
      'Lifetime Points': customer.lifetime_points || customer.points || 0,
      'Customer Type': customer.type || 'registered',
    }));
  }

  if (reportKey === 'sales') {
    exportData = data.map(sale => ({
      'Date': sale.date,
      'Total Sales': sale.total_sales || 0,
      'Total Revenue (KWD)': parseFloat(sale.total_revenue || 0).toFixed(3),
      'Total Discount (KWD)': parseFloat(sale.total_discount || 0).toFixed(3),
      'Total Tax (KWD)': parseFloat(sale.total_tax || 0).toFixed(3),
      'Average Sale (KWD)': parseFloat(sale.average_sale || 0).toFixed(3),
    }));
  }

  if (reportKey === 'products') {
    exportData = data.map(product => ({
      'Product ID': product.id,
      'Product Name': product.product_name,
      'SKU': product.sku,
      'Quantity Sold': product.total_quantity_sold || 0,
      'Total Revenue (KWD)': parseFloat(product.total_revenue || 0).toFixed(3),
      'Number of Sales': product.number_of_sales || 0,
    }));
  }

  if (reportKey === 'financial') {
    const financialData = data[0] || {};
    exportData = [{
      'Start Date': financialData.start_date || 'N/A',
      'End Date': financialData.end_date || 'N/A',
      'Total Revenue (KWD)': parseFloat(financialData.revenue || 0).toFixed(3),
      'Cost of Goods Sold (KWD)': parseFloat(financialData.cost_of_goods_sold || 0).toFixed(3),
      'Gross Profit (KWD)': (financialData.gross_profit || 0).toFixed(3),
      'Operating Expenses (KWD)': parseFloat(financialData.operating_expenses || 0).toFixed(3),
      'Net Profit (KWD)': (financialData.net_profit || 0).toFixed(3),
      'Gross Margin (%)': (financialData.gross_margin || 0).toFixed(2),
      'Net Margin (%)': (financialData.net_margin || 0).toFixed(2),
    }];
  }

  const ws = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths: { [key: string]: number } = {};
  exportData.forEach(row => {
    Object.keys(row).forEach(key => {
      const value = row[key]?.toString() || '';
      colWidths[key] = Math.min(50, Math.max(colWidths[key] || 0, value.length, key.length));
    });
  });
  
  ws['!cols'] = Object.keys(exportData[0]).map(key => ({ wch: colWidths[key] + 2 }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, reportLabel);
  XLSX.writeFile(wb, `${reportLabel.replace(/\s/g, '_')}_${dateRange}.xlsx`);
};

const ResultTable = ({ data, reportKey, loading }: { data: any[]; reportKey: ReportKey; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  if (!data?.length) {
    return <p className="text-sm text-gray-400 py-4 text-center">Click "Run" to generate report</p>;
  }
  
  let displayData = [...data];
  let columns: string[] = [];
  
  if (reportKey === 'customers') {
    columns = ['customer_name', 'email', 'phone', 'total_orders', 'total_spent', 'last_invoice_number', 'last_invoice_value', 'last_order_date', 'customer_type'];
    displayData = data.map(customer => ({
      customer_name: customer.full_name || customer.customer_name || customer.name || (customer.type === 'walk_in' ? 'Walk-in / Guest' : 'Anonymous Customer'),
      email: customer.email || customer.customer_email || 'N/A',
      phone: customer.phone || customer.customer_phone || customer.mobile || 'N/A',
      total_orders: customer.period_orders || customer.total_orders || 0,
      total_spent: customer.period_spent || customer.total_spent ? `${parseFloat(customer.period_spent || customer.total_spent || 0).toFixed(3)} KWD` : '0.000 KWD',
      last_invoice_number: customer.last_invoice_number || customer.sale_number || 'N/A',
      last_invoice_value: customer.last_invoice_value ? `${parseFloat(customer.last_invoice_value).toFixed(3)} KWD` : '0.000 KWD',
      last_order_date: customer.period_last_purchase_date || customer.last_order_date ? new Date(customer.period_last_purchase_date || customer.last_order_date).toLocaleDateString() : 'No orders',
      customer_type: customer.type || 'registered',
    }));
  } else if (reportKey === 'sales') {
    columns = ['date', 'total_sales', 'total_revenue', 'average_sale'];
    displayData = data.map(sale => ({
      date: sale.date,
      total_sales: sale.total_sales || 0,
      total_revenue: `${parseFloat(sale.total_revenue || 0).toFixed(3)} KWD`,
      average_sale: `${parseFloat(sale.average_sale || 0).toFixed(3)} KWD`,
    }));
  } else if (reportKey === 'products') {
    columns = ['product_name', 'sku', 'total_quantity_sold', 'total_revenue', 'number_of_sales'];
    displayData = data.map(product => ({
      product_name: product.product_name,
      sku: product.sku,
      total_quantity_sold: product.total_quantity_sold || 0,
      total_revenue: `${parseFloat(product.total_revenue || 0).toFixed(3)} KWD`,
      number_of_sales: product.number_of_sales || 0,
    }));
  } else if (reportKey === 'financial') {
    const financialData = data[0] || {};
    columns = ['metric', 'value'];
    displayData = [
      { metric: 'Period', value: `${financialData.start_date || 'N/A'} to ${financialData.end_date || 'N/A'}` },
      { metric: 'Total Revenue', value: `${parseFloat(financialData.revenue || 0).toFixed(3)} KWD` },
      { metric: 'Cost of Goods Sold', value: `${parseFloat(financialData.cost_of_goods_sold || 0).toFixed(3)} KWD` },
      { metric: 'Gross Profit', value: `${(financialData.gross_profit || 0).toFixed(3)} KWD` },
      { metric: 'Operating Expenses', value: `${parseFloat(financialData.operating_expenses || 0).toFixed(3)} KWD` },
      { metric: 'Net Profit', value: `${(financialData.net_profit || 0).toFixed(3)} KWD` },
      { metric: 'Gross Margin', value: `${(financialData.gross_margin || 0).toFixed(2)}%` },
      { metric: 'Net Margin', value: `${(financialData.net_margin || 0).toFixed(2)}%` },
    ];
  } else {
    columns = Object.keys(data[0]);
  }
  
  return (
    <div className="overflow-x-auto mt-3 max-w-full">
      <table className="text-xs border border-gray-200 rounded-lg overflow-hidden min-w-max w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => (
              <th key={c} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                {c.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {displayData.slice(0, 20).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map(c => (
                <td key={c} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                  {row[c] != null ? String(row[c]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {displayData.length > 20 && (
        <p className="text-xs text-gray-400 mt-1 text-center">Showing first 20 of {displayData.length} rows</p>
      )}
    </div>
  );
};

const ReportPanel = ({
  reportKey, dates, skipQuery, setSkipQuery,
}: {
  reportKey: ReportKey;
  dates: { start_date: string; end_date: string };
  skipQuery: boolean;
  setSkipQuery: (v: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [enrichedCustomerData, setEnrichedCustomerData] = useState<any[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  const [posOrdersData, setPosOrdersData] = useState<any[]>([]);

  const params = { start_date: dates.start_date, end_date: dates.end_date };

  const { data: sales, isFetching: l1, refetch: refetchSales } = useGetSalesSummaryQuery(params, { skip: skipQuery || reportKey !== 'sales' });
  const { data: products, isFetching: l2, refetch: refetchProducts } = useGetTopSellingProductsQuery(params, { skip: skipQuery || reportKey !== 'products' });
  const { data: inventory, isFetching: l3, refetch: refetchInventory } = useGetInventoryStatusQuery({}, { skip: skipQuery || reportKey !== 'inventory' });
  const { data: customers, isFetching: l4, refetch: refetchCustomers } = useGetCustomerAnalysisQuery(params, { skip: skipQuery || reportKey !== 'customers' });
  const { data: employees, isFetching: l5, refetch: refetchEmployees } = useGetEmployeePerformanceQuery(params, { skip: skipQuery || reportKey !== 'employees' });
  const { data: financial, isFetching: l6, refetch: refetchFinancial } = useGetFinancialSummaryQuery(params, { skip: skipQuery || reportKey !== 'financial' });

  const dataMap: Record<ReportKey, any> = { sales, products, inventory, customers, employees, financial };
  const loadingMap: Record<ReportKey, boolean> = {
    sales: l1, products: l2, inventory: l3, customers: l4, employees: l5, financial: l6,
  };

  const rawData = dataMap[reportKey];
  const isLoading = loadingMap[reportKey];

  // Extract the actual data from API response (handles { success, data } structure)
  const extractData = (response: any) => {
    if (!response) return null;
    if (response.success === true && response.data) {
      return response.data;
    }
    return response;
  };

  const extractedData = extractData(rawData);

  // Fetch POS orders for the date range
  useEffect(() => {
    const fetchPOSOrders = async () => {
      if (reportKey !== 'customers') return;
      
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch(
          `https://prearticulate-nonsymbiotically-mira.ngrok-free.dev/api/sales?start_date=${dates.start_date}&end_date=${dates.end_date}&per_page=1000`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch POS orders');
        }
        
        const result = await response.json();
        const orders = result?.data?.data || [];
        setPosOrdersData(orders);
      } catch (error) {
        console.error('Error fetching POS orders:', error);
        setPosOrdersData([]);
      }
    };
    
    fetchPOSOrders();
  }, [dates, reportKey]);

  // Fetch purchase history for customers to get invoice details
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (reportKey !== 'customers' || !extractedData) return;
      
      let customersList = [];
      if (Array.isArray(extractedData)) {
        customersList = extractedData;
      } else {
        customersList = extractedData.top_customers || 
                        extractedData.data || 
                        extractedData.customers || [];
      }
      
      // If no customers data, use empty array
      if (!customersList || customersList.length === 0) {
        customersList = extractedData?.top_customers || [];
      }

      // Ensure all customers have proper names
      customersList = customersList.map((customer: any) => ({
        ...customer,
        full_name: customer.full_name || 
                   customer.customer_name || 
                   customer.name || 
                   (customer.type === 'walk_in' ? 'Walk-in / Guest' : 'Anonymous Customer'),
        customer_name: customer.full_name || 
                      customer.customer_name || 
                      customer.name || 
                      (customer.type === 'walk_in' ? 'Walk-in / Guest' : 'Anonymous Customer'),
      }));

      // Also include all POS orders with customer information
      const posOrders = posOrdersData || [];
      const posCustomers = posOrders.map((order: any) => ({
        customer_id: order.customer_id || null,
        customer_name: order.customer_name || 
                      (order.customer?.full_name) || 
                      (order.customer?.first_name + ' ' + order.customer?.last_name) ||
                      'Walk-in / Guest',
        full_name: order.customer_name || 
                  (order.customer?.full_name) || 
                  (order.customer?.first_name + ' ' + order.customer?.last_name) ||
                  'Walk-in / Guest',
        email: order.customer_email || order.customer?.email || null,
        phone: order.customer_phone || order.customer?.phone || null,
        type: order.customer_id ? 'registered' : 'walk_in',
        period_orders: 1,
        period_spent: parseFloat(order.total_amount || 0),
        period_last_purchase_date: order.sale_date || order.created_at,
        sale_number: order.sale_number,
        payment_method: order.payment_method,
        order_status: order.status,
        is_from_pos: true,
      }));
      
      // Merge customers from both sources, deduplicate
      const allCustomersMap = new Map();
      
      // Add POS customers first to ensure all are included
      posCustomers.forEach((posCustomer: any) => {
        const key = posCustomer.customer_id || posCustomer.customer_name || `walkin_${Date.now()}_${Math.random()}`;
        if (!allCustomersMap.has(key)) {
          allCustomersMap.set(key, posCustomer);
        }
      });
      
      // Add customer analysis data (merge with existing if same customer)
      customersList.forEach((customer: any) => {
        const key = customer.id || customer.customer_id || customer.full_name;
        if (key) {
          if (allCustomersMap.has(key)) {
            const existing = allCustomersMap.get(key);
            existing.period_orders = (existing.period_orders || 0) + (customer.period_orders || customer.total_orders || 0);
            existing.period_spent = (existing.period_spent || 0) + (customer.period_spent || customer.total_spent || 0);
            existing.period_last_purchase_date = customer.period_last_purchase_date || 
                                               customer.last_order_date || 
                                               existing.period_last_purchase_date;
            // Keep the best name
            existing.full_name = customer.full_name || existing.full_name || 'Walk-in / Guest';
            existing.customer_name = customer.full_name || existing.customer_name || 'Walk-in / Guest';
          } else {
            allCustomersMap.set(key, {
              ...customer,
              full_name: customer.full_name || customer.customer_name || customer.name || 'Walk-in / Guest',
              customer_name: customer.full_name || customer.customer_name || customer.name || 'Walk-in / Guest',
              type: customer.type || 'registered',
            });
          }
        }
      });
      
      customersList = Array.from(allCustomersMap.values());
      
      if (customersList.length === 0) {
        setEnrichedCustomerData([]);
        return;
      }
      
      setIsFetchingOrders(true);
      const token = localStorage.getItem('token') || '';
      
      try {
        const enrichedCustomers = await Promise.all(
          customersList.map(async (customer: any) => {
            const customerId = customer.customer_id || customer.id;
            
            // If no customer ID, this is an anonymous/guest customer
            if (!customerId) {
              // Check if we have POS order details for this customer
              const posOrdersForCustomer = posOrders.filter(
                (order: any) => order.customer_name === customer.customer_name ||
                               order.customer?.full_name === customer.full_name
              );
              const lastPOSOrder = posOrdersForCustomer.length > 0 ? posOrdersForCustomer[0] : null;
              
              return {
                ...customer,
                full_name: customer.full_name || customer.customer_name || 'Walk-in / Guest',
                customer_name: customer.full_name || customer.customer_name || 'Walk-in / Guest',
                last_invoice_number: lastPOSOrder?.sale_number || 'N/A',
                last_invoice_value: lastPOSOrder?.total_amount ? parseFloat(lastPOSOrder.total_amount) : 0,
                last_order_date: lastPOSOrder?.sale_date || customer.period_last_purchase_date || customer.last_order_date || 'No orders yet',
                total_orders: customer.period_orders || customer.total_orders || posOrdersForCustomer.length,
                total_spent: customer.period_spent || customer.total_spent || posOrdersForCustomer.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0),
                sale_number: lastPOSOrder?.sale_number,
                payment_method: lastPOSOrder?.payment_method,
                order_status: lastPOSOrder?.status,
                type: 'walk_in',
              };
            }
            
            // Fetch orders for customers with ID
            const orders = await fetchCustomerPurchaseHistory(customerId, token);
            const lastOrder = orders.length > 0 ? orders[0] : null;
            
            // Also check POS orders for this customer
            const posOrdersForCustomer = posOrders.filter(
              (order: any) => order.customer_id === customerId
            );
            const lastPOSOrder = posOrdersForCustomer.length > 0 ? posOrdersForCustomer[0] : null;
            
            // Use the most recent order between POS and purchase history
            const mostRecentOrder = lastOrder || lastPOSOrder;
            
            // Calculate total spent from both sources
            const totalFromOrders = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0);
            const totalFromPOS = posOrdersForCustomer.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || 0), 0);
            
            return {
              ...customer,
              full_name: customer.full_name || customer.customer_name || customer.name || 'Anonymous Customer',
              customer_name: customer.full_name || customer.customer_name || customer.name || 'Anonymous Customer',
              last_invoice_number: mostRecentOrder?.order_number || mostRecentOrder?.sale_number || 'N/A',
              last_invoice_value: mostRecentOrder?.total_amount ? parseFloat(mostRecentOrder.total_amount) : 0,
              last_order_date: mostRecentOrder?.created_at || mostRecentOrder?.sale_date || customer.last_order_date || 'No orders yet',
              total_orders: customer.period_orders || customer.total_orders || orders.length + posOrdersForCustomer.length,
              total_spent: customer.period_spent || customer.total_spent || totalFromOrders + totalFromPOS,
              sale_number: mostRecentOrder?.sale_number,
              payment_method: mostRecentOrder?.payment_method,
              order_status: mostRecentOrder?.status,
            };
          })
        );
        setEnrichedCustomerData(enrichedCustomers);
      } catch (error) {
        console.error('Error fetching customer orders:', error);
        setEnrichedCustomerData(customersList);
      } finally {
        setIsFetchingOrders(false);
      }
    };
    
    fetchCustomerOrders();
  }, [extractedData, reportKey, posOrdersData]);

  const config = REPORT_CONFIG[reportKey];

  // Define getRows inside the component
  const getRows = (): any[] => {
    if (reportKey === 'customers') {
      return enrichedCustomerData.length > 0 ? enrichedCustomerData : [];
    }
    
    if (!extractedData) return [];
    
    if (reportKey === 'sales') {
      return extractedData.daily_data || extractedData.data || [];
    }
    
    if (reportKey === 'products') {
      return extractedData.top_products || extractedData.products || extractedData.data || [];
    }
    
    if (reportKey === 'financial') {
      return [{
        start_date: extractedData.period?.start_date,
        end_date: extractedData.period?.end_date,
        revenue: extractedData.revenue,
        cost_of_goods_sold: extractedData.cost_of_goods_sold,
        gross_profit: extractedData.gross_profit,
        operating_expenses: extractedData.operating_expenses,
        net_profit: extractedData.net_profit,
        gross_margin: extractedData.gross_margin,
        net_margin: extractedData.net_margin,
      }];
    }
    
    if (reportKey === 'inventory') {
      return extractedData.products || extractedData.data || [];
    }
    
    if (reportKey === 'employees') {
      return extractedData.employees || extractedData.data || [];
    }
    
    return [];
  };

  // Define getSummary inside the component
  const getSummary = () => {
    if (!extractedData && enrichedCustomerData.length === 0) return null;
    
    if (reportKey === 'sales') {
      return extractedData.totals || null;
    }
    
    if (reportKey === 'customers' && enrichedCustomerData.length > 0) {
      const totalCustomers = enrichedCustomerData.length;
      const totalOrders = enrichedCustomerData.reduce((sum, c) => sum + (c.period_orders || c.total_orders || 0), 0);
      const totalSpent = enrichedCustomerData.reduce((sum, c) => sum + (c.period_spent || c.total_spent || 0), 0);
      const posOrdersCount = posOrdersData.length;
      const registeredCustomers = enrichedCustomerData.filter((c: any) => c.type === 'registered' || c.type === 'customer').length;
      const walkInCustomers = enrichedCustomerData.filter((c: any) => c.type === 'walk_in' || c.type === 'guest').length;
      
      return {
        'Total Customers': totalCustomers,
        'Registered Customers': registeredCustomers,
        'Walk-in Customers': walkInCustomers,
        'Total Orders (All)': totalOrders,
        'POS Orders Count': posOrdersCount,
        'Total Revenue': `${totalSpent.toFixed(3)} KWD`,
        'Average Order Value': `${(totalOrders > 0 ? totalSpent / totalOrders : 0).toFixed(3)} KWD`,
      };
    }
    
    if (reportKey === 'financial') {
      return {
        'Total Revenue': `${parseFloat(extractedData.revenue || 0).toFixed(3)} KWD`,
        'Gross Profit': `${(extractedData.gross_profit || 0).toFixed(3)} KWD`,
        'Net Profit': `${(extractedData.net_profit || 0).toFixed(3)} KWD`,
        'Gross Margin': `${(extractedData.gross_margin || 0).toFixed(2)}%`,
        'Net Margin': `${(extractedData.net_margin || 0).toFixed(2)}%`,
      };
    }
    
    return extractedData.totals ?? extractedData.summary ?? null;
  };

  const rows = getRows();
  const summary = getSummary();
  const isCustomerLoading = reportKey === 'customers' && (isLoading || isFetchingOrders);

  const handleRun = () => {
    setSkipQuery(false);
    setOpen(true);
    setTimeout(() => {
      switch (reportKey) {
        case 'sales': refetchSales(); break;
        case 'products': refetchProducts(); break;
        case 'inventory': refetchInventory(); break;
        case 'customers': refetchCustomers(); break;
        case 'employees': refetchEmployees(); break;
        case 'financial': refetchFinancial(); break;
      }
    }, 100);
  };

  const handleExportExcel = () => {
    if (!rows.length) {
      alert('No data to export');
      return;
    }
    const dateRange = `${dates.start_date}_to_${dates.end_date}`;
    exportToExcel(rows, reportKey, config.label, dateRange);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-800">{config.label}</p>
          <p className="text-xs text-gray-400">{config.description}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          {rows.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-green-600 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Play className="h-3 w-3" /> {isLoading ? 'Running...' : 'Run'}
          </button>
          {(extractedData || enrichedCustomerData.length > 0) && (
            <button
              onClick={() => setOpen(p => !p)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {open && (extractedData || enrichedCustomerData.length > 0) && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
              {Object.entries(summary).map(([k, v]) => (
                typeof v !== 'object' && (
                  <div key={k} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                    <p className="text-gray-400 truncate">{k.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-gray-800 break-words">{String(v)}</p>
                  </div>
                )
              ))}
            </div>
          )}
          
          {reportKey === 'customers' && rows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <p className="text-gray-400">Total Customers</p>
                <p className="font-semibold text-gray-800">{rows.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <p className="text-gray-400">Total Orders</p>
                <p className="font-semibold text-gray-800">
                  {rows.reduce((sum, c) => sum + (c.period_orders || c.total_orders || 0), 0)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <p className="text-gray-400">Total Revenue</p>
                <p className="font-semibold text-gray-800">
                  KWD {rows.reduce((sum, c) => sum + (c.period_spent || c.total_spent || 0), 0).toFixed(3)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <p className="text-gray-400">Avg Order Value</p>
                <p className="font-semibold text-gray-800">
                  KWD {(rows.reduce((sum, c) => sum + (c.period_spent || c.total_spent || 0), 0) / 
                        (rows.reduce((sum, c) => sum + (c.period_orders || c.total_orders || 0), 0) || 1)).toFixed(3)}
                </p>
              </div>
            </div>
          )}
          
          <ResultTable data={rows} reportKey={reportKey} loading={isCustomerLoading} />
          
          {reportKey === 'customers' && isFetchingOrders && (
            <p className="text-xs text-blue-600 text-center mt-2">Fetching invoice details...</p>
          )}
        </div>
      )}
    </div>
  );
};

export const PreBuiltReportViewer = () => {
  const dispatch = useDispatch();
  const dates = useSelector((s: RootState) => s.reports.preBuiltDates);
  const [skipMap, setSkipMap] = useState<Record<ReportKey, boolean>>({
    sales: true, products: true, inventory: true, customers: true, employees: true, financial: true,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Today', days: 0 },
              { label: 'This Week', days: 7 },
              { label: 'This Month', days: 30 },
              { label: 'Last 3 Months', days: 90 },
              { label: 'This Year', days: 365 },
            ].map((period) => (
              <button
                key={period.label}
                onClick={() => {
                  const endDate = new Date();
                  const startDate = new Date();
                  startDate.setDate(endDate.getDate() - period.days);
                  dispatch(setPreBuiltDates({
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                  }));
                }}
                className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-3 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700">Custom Range:</label>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dates.start_date}
                  onChange={e => dispatch(setPreBuiltDates({ start_date: e.target.value }))}
                  className="w-full xs:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-gray-400 text-sm text-center xs:text-left">to</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dates.end_date}
                  onChange={e => dispatch(setPreBuiltDates({ end_date: e.target.value }))}
                  className="w-full xs:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {(Object.keys(REPORT_CONFIG) as ReportKey[]).map(key => (
          <ReportPanel
            key={key}
            reportKey={key}
            dates={dates}
            skipQuery={skipMap[key]}
            setSkipQuery={(v) => setSkipMap(p => ({ ...p, [key]: v }))}
          />
        ))}
      </div>
    </div>
  );
};