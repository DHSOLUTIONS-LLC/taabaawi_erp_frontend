// src/features/sales/pages/CreateOrderPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layouts/DashboardLayout";
import { useAppSelector, useAppDispatch } from "../../../../app/hooks";
import type { RootState } from "../../../../app/store";
import {
  removeOrderProduct,
  updateOrderProductQty,
  clearOrderForm,
} from "../../salesSlice";
import {
  useCreateOrderMutation,
  useGetShippingMethodsQuery,
} from "../../../../services/salesApi";
import { useGetBranchesQuery } from "../../../../services/superAdminApi";
import { useGetCustomersQuery } from "../../../../services/crmApi";
import { canSwitchBranch } from "../../../../utils/roleHelpers";

import arrow_back_icon from "../../../../assets/icons/arrow_back_icon.svg";
import dropdown_arrow_icon from "../../../../assets/icons/dropdown_arrow_icon.svg";
import add_icon from "../../../../assets/icons/add.svg";
import search_icon from "../../../../assets/icons/search_icon.svg";
import ProductSelectionModal from "../../components/OrderProductSelectionModel";

export interface ShippingMethod {
  id: number;
  method_name: string;
  provider: string | null;
  description: string | null;
  base_cost: number;
  cost_per_kg: number;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
  available_areas: string[] | null;
  estimated_delivery_text?: string;
  created_at: string;
  updated_at: string;
}

export default function CreateOrderPage() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role?.role_name === "Super Admin";
  const basePath = isSuperAdmin ? "/admin" : "";
  const userCanSwitchBranch = canSwitchBranch(user?.role?.role_name);

  // ─── Redux State ──────────────────────────────────
  const selectedProducts =
    useAppSelector((state: RootState) => state.sales.orderProducts) || [];

  // ─── Local State ──────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [channel, setChannel] = useState("Website");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingCountry, setShippingCountry] = useState("Kuwait");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [couponCode, setCouponCode] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState("");
  const [shippingFee, setShippingFee] = useState(2.0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, _setSearch] = useState("");

  // ─── APIs ─────────────────────────────────────────
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const { data: branchesData } = useGetBranchesQuery();
  const { data: methodsResponse, isLoading: _isLoadingShipping } =
    useGetShippingMethodsQuery({ search: search || undefined });
  const { data: customersResponse, isLoading: isLoadingCustomers } =
    useGetCustomersQuery(customerSearch ? { search: customerSearch } : {});
  console.log("customersResponse:", customersResponse);

  const branches = Array.isArray(branchesData) ? branchesData : [];
  const methods: ShippingMethod[] =
    methodsResponse?.data?.data || methodsResponse?.data || [];
  const customers = customersResponse?.data || [];
  console.log("customers", customers);
  // ─── Calculations ─────────────────────────────────
  const subtotal = selectedProducts.reduce(
    (sum: number, p: any) => sum + p.price * p.quantity,
    0,
  );
  const taxAmount = 0;
  const grandTotal = subtotal + shippingFee;

  // ─── Handlers ─────────────────────────────────────
  const handleRemoveProduct = (id: string) => dispatch(removeOrderProduct(id));

  const handleUpdateQuantity = (id: string, quantity: number) => {
    dispatch(updateOrderProductQty({ id, quantity }));
  };

  const handleAddProduct = () => {
    setIsModalOpen(true);
  };

  const handleCustomerSelect = (selectedCustomer: any) => {
    setCustomerId(selectedCustomer.id.toString());
    setCustomerName(selectedCustomer.first_name);
    setCustomerEmail(selectedCustomer.email);
    setCustomerPhone(selectedCustomer.phone || "");
    setCustomerSearch(selectedCustomer.first_name + selectedCustomer.last_name);
    setShowCustomerDropdown(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!customerId) newErrors.customerId = "Please select a customer";
    if (!customerName.trim())
      newErrors.customerName = "Customer name is required";
    if (!customerEmail.trim()) newErrors.customerEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(customerEmail))
      newErrors.customerEmail = "Email is invalid";
    if (!customerPhone.trim()) newErrors.customerPhone = "Phone is required";
    if (!shippingAddress.trim())
      newErrors.shippingAddress = "Shipping address is required";
    if (!shippingCity.trim())
      newErrors.shippingCity = "Shipping city is required";
    if (!shippingCountry.trim())
      newErrors.shippingCountry = "Shipping country is required";
    if (!channel) newErrors.channel = "Channel is required";
    if (!paymentMethod) newErrors.paymentMethod = "Payment method is required";
    if (selectedProducts.length === 0)
      newErrors.products = "Add at least one product";
    if (!selectedShippingMethodId)
      newErrors.shippingMethod = "Select a shipping method";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const items = selectedProducts.map((p: any) => ({
        product_id: p.product_id,
        variant_id: p.variant_id || null,
        quantity: p.quantity,
        unit_price: p.price,
      }));

      const payload: any = {
        customer_id: parseInt(customerId),
        channel: channel,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_state: shippingState || null,
        shipping_country: shippingCountry,
        shipping_postal_code: shippingPostalCode || null,
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
        items: items,
      };

      if (branchId) payload.branch_id = parseInt(branchId);
      if (couponCode) payload.coupon_code = couponCode;
      if (customerNotes) payload.customer_notes = customerNotes;

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const result = await createOrder(payload).unwrap();

      dispatch(clearOrderForm());
      alert("Order created successfully!");
      navigate(`${basePath}/sales/orders/${result.data.id}`);
    } catch (err: any) {
      console.error("Failed to create order:", err);

      if (err.data?.errors) {
        const errorMessages = Object.entries(err.data.errors)
          .map(
            ([field, messages]) => `${field}: ${(messages as any).join(", ")}`,
          )
          .join("\n");
        alert(`Validation failed:\n${errorMessages}`);
      } else {
        alert(
          err?.data?.message ||
            "Failed to create order. Please check all fields and try again.",
        );
      }
    }
  };

  // Lock branch for non-switchable users
  useEffect(() => {
    if (!userCanSwitchBranch && user?.branch_id) {
      setBranchId(user.branch_id.toString());
    }
  }, [userCanSwitchBranch, user?.branch_id]);

  // Clear form on mount for new orders
  useEffect(() => {
    dispatch(clearOrderForm());
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCustomerDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const CHANNELS = ["Website", "Mobile App", "POS", "Phone", "Manual"];
  const PAYMENT_METHODS = [
    "Cash on Delivery",
    "Credit Card",
    "Debit Card",
    "K-Net",
    "Online Payment",
    "Bank Transfer",
  ];
  const COUNTRIES = [
    "Kuwait",
    "UAE",
    "Saudi Arabia",
    "Qatar",
    "Bahrain",
    "Oman",
  ];
  const KUWAIT_CITIES = [
    "Kuwait City",
    "Hawally",
    "Salmiya",
    "Farwaniya",
    "Jahra",
    "Mubarak Al-Kabeer",
    "Ahmadi",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-8xl mx-auto space-y-4 sm:space-y-6 lg:p-4 sm:p-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate(`${basePath}/sales/orders`)}>
              <img
                src={arrow_back_icon}
                alt="Back"
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              Create New Order
            </h1>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Order Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Customer Search */}
                <div className="relative sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Search Customer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <img
                        src={search_icon}
                        alt=""
                        className="w-4 h-4 text-gray-400"
                      />
                    </div>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                        setCustomerId("");
                        setCustomerName("");
                        setCustomerEmail("");
                        setCustomerPhone("");
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search by name, email or phone..."
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingCustomers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                          Loading customers...
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No customers found
                        </div>
                      ) : (
                        customers.map((customer: any) => (
                          <button
                            key={customer.id}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-300  last:border-b-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomerSelect(customer);
                            }}
                          >
                            <div className="font-medium text-gray-900 text-sm">
                              {customer.full_name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 break-all">
                              {customer.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {customer.phone}
                            </div>
                            {customer.loyalty_tier && (
                              <div className="text-xs text-yellow-600 mt-0.5">
                                {customer.loyalty_tier}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {errors.customerId && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerId}
                    </p>
                  )}
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Channel *
                  </label>
                  <div className="relative">
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10"
                    >
                      {CHANNELS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.channel && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.channel}
                    </p>
                  )}
                </div>

                {/* Branch */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Branch
                  </label>
                  {userCanSwitchBranch ? (
                    <div className="relative">
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                        <img
                          src={dropdown_arrow_icon}
                          alt=""
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                      {branches.find((b: any) => b.id === user?.branch_id)
                        ?.branch_name || "My Branch"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                      errors.customerName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Auto-filled from customer"
                    readOnly
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                      errors.customerEmail
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Auto-filled from customer"
                    readOnly
                  />
                  {errors.customerEmail && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerEmail}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Phone *
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
                      errors.customerPhone
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Auto-filled from customer"
                    readOnly
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Shipping Address *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.shippingAddress
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Block, Street, House number, Area"
                  />
                  {errors.shippingAddress && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.shippingAddress}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    City *
                  </label>
                  <div className="relative">
                    <select
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10 ${
                        errors.shippingCity
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select City</option>
                      {KUWAIT_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.shippingCity && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.shippingCity}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    State/Governorate
                  </label>
                  <input
                    type="text"
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Al Asimah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Country *
                  </label>
                  <div className="relative">
                    <select
                      value={shippingCountry}
                      onChange={(e) => setShippingCountry(e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10 ${
                        errors.shippingCountry
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.shippingCountry && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.shippingCountry}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 13001"
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Products
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-blue-600">
                      ({selectedProducts.length} items)
                    </span>
                  )}
                </h2>
                <button
                  onClick={handleAddProduct}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <img src={add_icon} alt="" className="w-4 h-4" />
                  <span className="font-medium">Add Product</span>
                </button>
              </div>

              {selectedProducts.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                  <div className="xl:col-span-4 overflow-x-auto">
                    <div className="min-w-[768px] lg:min-w-full">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-y border-gray-200">
                          <tr>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Product
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                              SKU
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Qty
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Price
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                              Total
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedProducts.map((product: any) => {
                            const total = product.price * product.quantity;
                            return (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <img
                                      src={(() => {
                                        const imgSrc =
                                          product.image_url || product.image;
                                        if (
                                          imgSrc &&
                                          imgSrc.startsWith("/storage/")
                                        ) {
                                          const API_BASE_URL =
                                            import.meta.env.VITE_API_URL?.replace(
                                              "/api",
                                              "",
                                            ) ||
                                            "https://erp-backend.ttexpresskw.com";
                                          return `${API_BASE_URL}${imgSrc}`;
                                        }
                                        return (
                                          imgSrc ||
                                          "https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=100&auto=format&fit=crop"
                                        );
                                      })()}
                                      alt={product.name}
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://images.unsplash.com/photo-1541275055241-329bbdf9a191?w=100&auto=format&fit=crop";
                                      }}
                                    />
                                    <div>
                                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                                        {product.name}
                                      </div>
                                      <div className="text-xs text-gray-500 md:hidden mt-1">
                                        SKU: {product.sku}
                                      </div>
                                      {product.size &&
                                        product.size !== "Default" && (
                                          <div className="text-xs text-gray-500">
                                            Variant: {product.size}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                                  {product.sku}
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(
                                          product.id,
                                          product.quantity - 1,
                                        )
                                      }
                                      className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded"
                                    >
                                      <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                                        -
                                      </span>
                                    </button>
                                    <span className="w-6 sm:w-8 text-center font-medium text-sm">
                                      {product.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(
                                          product.id,
                                          product.quantity + 1,
                                        )
                                      }
                                      className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded"
                                    >
                                      <span className="font-semibold text-xs sm:text-sm">
                                        +
                                      </span>
                                    </button>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium">
                                  KWD {product.price.toFixed(3)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold">
                                  KWD {total.toFixed(3)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center">
                                  <button
                                    onClick={() =>
                                      handleRemoveProduct(product.id)
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <svg
                                      className="w-4 h-4 sm:w-5 sm:h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No products added yet. Click "Add Product" to get started.
                  </p>
                </div>
              )}
              {errors.products && (
                <p className="text-xs text-red-500 mt-1">{errors.products}</p>
              )}
            </div>
          </div>

          {/* Right Column - 1/3 width on desktop */}
          <div className="space-y-4 sm:space-y-6">
            {/* Payment */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Payment
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Payment Method *
                  </label>
                  <div className="relative">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter coupon code"
                  />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Shipping
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Shipping Method *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedShippingMethodId}
                      onChange={(e) => {
                        setSelectedShippingMethodId(e.target.value);
                        const method = methods.find(
                          (m: ShippingMethod) =>
                            m.id.toString() === e.target.value,
                        );
                        if (method) {
                          setShippingFee(
                            parseFloat(method.base_cost.toString()),
                          );
                        }
                      }}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 sm:pr-10 ${
                        errors.shippingMethod
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select a shipping method</option>
                      {methods.map((method: ShippingMethod) => (
                        <option key={method.id} value={method.id}>
                          {method.method_name} — KWD{" "}
                          {parseFloat(method.base_cost.toString()).toFixed(3)}
                          {method.estimated_days_min &&
                            method.estimated_days_max &&
                            ` (${method.estimated_days_min}-${method.estimated_days_max} days)`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                      <img
                        src={dropdown_arrow_icon}
                        alt=""
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                    </div>
                  </div>
                  {errors.shippingMethod && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.shippingMethod}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                    Shipping Fee (KWD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={shippingFee}
                    onChange={(e) =>
                      setShippingFee(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    KWD {subtotal.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-gray-900">
                    KWD {shippingFee.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium text-gray-900">
                    KWD {taxAmount.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 sm:pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">
                    Grand Total
                  </span>
                  <span className="text-base sm:text-lg font-bold text-blue-600">
                    KWD {grandTotal.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            <div className="bg-white rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                Notes
              </h2>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Customer instructions or notes..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-6 sm:pb-8">
          <button
            onClick={() => navigate(`${basePath}/sales/orders`)}
            className="py-2.5 sm:py-3.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="py-2.5 sm:py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
          >
            {isCreating ? "Creating Order..." : "Create Order"}
          </button>
        </div>
      </div>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </DashboardLayout>
  );
}
