import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Edit2 } from "lucide-react";
import { CustomerForm } from "./CustomerForm";
import { CustomerStatusBadge, TierBadge } from "./CustomerStatusBadge";
import {
  closeCustomerModal,
  openCustomerModal,
} from "../../../../features/crm/crmSlice";
import { useGetCustomerByIdQuery } from "../../../../services/crmApi";
import type { RootState } from "../../../../app/store";

export const CustomerModal = () => {
  const dispatch = useDispatch();
  const { isCustomerModalOpen, customerModalMode, selectedCustomer } =
    useSelector((s: RootState) => s.crm);

  if (!isCustomerModalOpen) return null;

  if (customerModalMode === "create" || customerModalMode === "edit") {
    return (
      <CustomerForm
        mode={customerModalMode}
        customer={selectedCustomer}
        onClose={() => dispatch(closeCustomerModal())}
      />
    );
  }

  return <CustomerViewModal />;
};

const CustomerViewModal = () => {
  const dispatch = useDispatch();
  const { selectedCustomer: customer } = useSelector((s: RootState) => s.crm);
  const { data } = useGetCustomerByIdQuery(customer?.id!, {
    skip: !customer?.id,
  });
  const c = data?.data ?? customer;

  if (!c) return null;

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) =>
    value ? (
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 font-medium break-words">{value}</p>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
              {c.full_name}
            </h2>
            <CustomerStatusBadge status={c.status} />
            <TierBadge tier={c.loyalty_tier} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                dispatch(openCustomerModal({ mode: "edit", customer: c }))
              }
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => dispatch(closeCustomerModal())}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            {[
              { label: "Orders", value: c.total_orders },
              {
                label: "Total Spent",
                value: `$${c.total_spent?.toLocaleString() ?? 0}`,
              },
              {
                label: "Avg Order",
                value: `$${c.average_order_value?.toLocaleString() ?? 0}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {value}
                </p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Personal */}
          <Section title="Personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Field label="Email" value={c.email} />
              <Field label="Phone" value={c.phone} />
              <Field label="Alt Phone" value={c.alternative_phone} />
              <Field label="Gender" value={c.gender} />
              <Field label="DOB" value={c.date_of_birth} />
              <Field label="Nationality" value={c.nationality} />
              <Field label="ID Type" value={c.id_type} />
              <Field label="ID Number" value={c.id_number} />
            </div>
          </Section>

          {/* Address */}
          {(c.city || c.address) && (
            <Section title="Address">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <Field label="Address" value={c.address} />
                <Field label="City" value={c.city} />
                <Field label="State" value={c.state} />
                <Field label="Country" value={c.country} />
                <Field label="Postal Code" value={c.postal_code} />
              </div>
            </Section>
          )}

          {/* Company */}
          {(c.company_name || c.job_title) && (
            <Section title="Company">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <Field label="Company" value={c.company_name} />
                <Field label="VAT" value={c.company_vat} />
                <Field label="Job Title" value={c.job_title} />
              </div>
            </Section>
          )}

          {/* Preferences */}
          {(c.preferred_contact_method || c.preferred_language) && (
            <Section title="Preferences">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Field
                  label="Preferred Contact"
                  value={c.preferred_contact_method}
                />
                <Field
                  label="Preferred Language"
                  value={c.preferred_language}
                />
              </div>
            </Section>
          )}

          {/* Notes */}
          {c.notes && (
            <Section title="Notes">
              <p className="text-sm text-gray-600 break-words">{c.notes}</p>
            </Section>
          )}

          {/* Loyalty */}
          <Section title="Loyalty">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Field
                label="Points"
                value={c.loyalty_points?.toLocaleString()}
              />
              <Field
                label="Lifetime Points"
                value={c.lifetime_points?.toLocaleString()}
              />
              <Field label="Tier" value={c.loyalty_tier} />
              <Field label="Enrolled" value={c.loyalty_enrolled_date} />
            </div>
          </Section>

          {/* Meta */}
          <Section title="Account Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Field
                label="Created At"
                value={new Date(c.created_at).toLocaleDateString()}
              />
              <Field
                label="Last Order"
                value={
                  c.last_order_date
                    ? new Date(c.last_order_date).toLocaleDateString()
                    : undefined
                }
              />
              <Field label="Verified" value={c.is_verified ? "Yes" : "No"} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </h3>
    {children}
  </div>
);
