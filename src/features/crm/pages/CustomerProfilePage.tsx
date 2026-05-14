import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Building2,
  ShoppingBag,
  MessageSquare,
  Star,
  User,
} from "lucide-react";
import {
  CustomerStatusBadge,
  TierBadge,
} from "../components/customers/CustomerStatusBadge";
import { CustomerForm } from "../components/customers/CustomerForm";
import { InteractionTimeline } from "../components/interactions/InteractionTimeline";
import { InteractionForm } from "../components/interactions/InteractionForm";
import {
  LoyaltyCard,
  LoyaltyTransactionTable,
  AdjustPointsModal,
} from "../components/loyalty/LoyaltyComponent";
import {
  setCustomerProfileTab,
  openCustomerModal,
  closeCustomerModal,
} from "../crmSlice";
import {
  useGetCustomerByIdQuery,
  useGetCustomerPurchaseHistoryQuery,
  useGetCustomerInteractionsQuery,
} from "../../../services/crmApi";
import type { RootState } from "../../../app/store";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useAppSelector } from "../../../app/hooks";

const TABS = [
  { id: "info", label: "Info", icon: User },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  // { id: 'interactions', label: 'Interactions',  icon: MessageSquare },
  { id: "loyalty", label: "Loyalty", icon: Star },
] as const;

export const CustomerProfilePage = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeTab = useSelector((s: RootState) => s.crm.customerProfileTab);
  const {
    isCustomerModalOpen,
    customerModalMode,
    selectedCustomer,
    isInteractionModalOpen,
  } = useSelector((s: RootState) => s.crm);

  const { data, isLoading } = useGetCustomerByIdQuery(Number(id));
  const customer = data?.data;
  console.log("customer", customer);

  // Try to get orders from customer data first, fallback to API
  const customerOrders = (customer as any)?.orders || [];
  const { data: ordersData, isLoading: ordersLoading } =
    useGetCustomerPurchaseHistoryQuery(
      { id: Number(id), per_page: 10 },
      { skip: activeTab !== "orders" || customerOrders.length > 0 },
    );
  const orders = Array.isArray(ordersData?.data)
    ? ordersData.data
    : customerOrders;
  console.log("customer orders:", orders);

  const { data: interactionsData, isLoading: interactionsLoading } =
    useGetCustomerInteractionsQuery(
      { id: Number(id), per_page: 20 },
      { skip: activeTab !== "interactions" || !id },
    );
  const interactions = interactionsData?.data || [];

  if (isLoading)
    return (
      <div className="p-4 sm:p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    );

  if (!customer)
    return (
      <div className="p-4 sm:p-6 text-center text-gray-400">
        Customer not found.
      </div>
    );

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto">
          {/* Back + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <button
              onClick={() => navigate(`${basePath}/crm/customers`)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 self-start"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Customers
            </button>
            <button
              onClick={() =>
                dispatch(openCustomerModal({ mode: "edit", customer }))
              }
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>

          {/* Profile Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar */}
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0 self-center sm:self-auto">
                <span className="text-xl font-semibold text-blue-600">
                  {customer.first_name?.[0]}
                  {customer.last_name?.[0]}
                </span>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {customer.full_name}
                  </h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <CustomerStatusBadge status={customer.status} />
                    <TierBadge tier={customer.loyalty_tier} />
                  </div>
                </div>
                {customer.company_name && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {customer.job_title} @ {customer.company_name}
                  </p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-sm text-gray-500">
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {customer.city}, {customer.country}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              {/* <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                {[
                  { label: 'Orders', value: customer.total_orders },
                  { label: 'Spent', value: `$${customer.total_spent?.toLocaleString() ?? 0}` },
                  { label: 'Avg Order', value: `$${customer.average_order_value?.toLocaleString() ?? 0}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <p className="text-sm sm:text-base font-semibold text-gray-800">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div> */}
            </div>
          </div>

          {/* Tabs - Responsive with horizontal scroll */}
          <div className="border-b border-gray-200 mb-5 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {TABS.map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => dispatch(setCustomerProfileTab(tabId))}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tabId
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Personal */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
                  {[
                    { label: "Full Name", value: customer.full_name },
                    { label: "Email", value: customer.email },
                    { label: "Phone", value: customer.phone },
                    { label: "Alt Phone", value: customer.alternative_phone },
                    { label: "Gender", value: customer.gender },
                    { label: "DOB", value: customer.date_of_birth },
                    { label: "Nationality", value: customer.nationality },
                    { label: "ID Type", value: customer.id_type },
                    { label: "ID Number", value: customer.id_number },
                  ]
                    .filter((f) => f.value)
                    .map(({ label, value }) => (
                      <React.Fragment key={label}>
                        <span className="text-gray-400 text-xs sm:text-sm">
                          {label}
                        </span>
                        <span className="text-gray-700 font-medium text-xs sm:text-sm break-words">
                          {value}
                        </span>
                      </React.Fragment>
                    ))}
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
                  {[
                    { label: "Address", value: customer.address },
                    { label: "City", value: customer.city },
                    { label: "State", value: customer.state },
                    { label: "Country", value: customer.country },
                    { label: "Postal", value: customer.postal_code },
                  ]
                    .filter((f) => f.value)
                    .map(({ label, value }) => (
                      <React.Fragment key={label}>
                        <span className="text-gray-400 text-xs sm:text-sm">
                          {label}
                        </span>
                        <span className="text-gray-700 font-medium text-xs sm:text-sm break-words">
                          {value}
                        </span>
                      </React.Fragment>
                    ))}
                </div>
              </div>

              {/* Company */}
              {(customer.company_name || customer.job_title) && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Company
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
                    {[
                      { label: "Company", value: customer.company_name },
                      { label: "VAT", value: customer.company_vat },
                      { label: "Title", value: customer.job_title },
                    ]
                      .filter((f) => f.value)
                      .map(({ label, value }) => (
                        <React.Fragment key={label}>
                          <span className="text-gray-400 text-xs sm:text-sm">
                            {label}
                          </span>
                          <span className="text-gray-700 font-medium text-xs sm:text-sm break-words">
                            {value}
                          </span>
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {customer.notes && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                  <h3 className="font-medium text-gray-800 mb-2">Notes</h3>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["Order #", "Date", "Channel", "Total", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-3 sm:px-4 py-3 text-left font-medium text-gray-500 text-xs sm:text-sm whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ordersLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <td key={j} className="px-3 sm:px-4 py-3">
                                <div className="h-4 bg-gray-100 rounded w-3/4" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : orders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 sm:px-4 py-8 text-center text-gray-400"
                          >
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-3 font-medium text-blue-600 text-xs sm:text-sm whitespace-nowrap">
                              #{o.order_number ?? o.id}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-gray-500 text-xs sm:text-sm">
                              {o.channel ?? "-"}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                              ${o.total_amount?.toLocaleString()}
                            </td>
                            <td className="px-3 sm:px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 whitespace-nowrap">
                                {o.order_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "interactions" && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <InteractionTimeline
                customer={customer}
                interactions={interactions}
                isLoading={interactionsLoading}
              />
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="space-y-4">
              <LoyaltyCard customer={customer} />
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 overflow-x-auto">
                <LoyaltyTransactionTable customerId={customer.id} />
              </div>
            </div>
          )}

          {/* Modals */}
          {isCustomerModalOpen && (
            <CustomerForm
              mode={customerModalMode === "create" ? "create" : "edit"}
              customer={selectedCustomer}
              onClose={() => dispatch(closeCustomerModal())}
            />
          )}
          {isInteractionModalOpen && <InteractionForm />}
          <AdjustPointsModal />
        </div>
      </div>
    </DashboardLayout>
  );
};
