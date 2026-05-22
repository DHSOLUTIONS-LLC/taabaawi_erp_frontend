// src/features/hr/pages/LeavePlannerPage.tsx
import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  useGetLeaveCalendarQuery,
  useGetTeamScheduleQuery,
  useGetLeaveConflictsQuery,
  useGetAvailabilityQuery,
} from "../../../services/hrApi";
import { useGetBranchesQuery } from "../../../services/superAdminApi";

type TabType = "calendar" | "team" | "conflicts" | "availability";

export default function LeavePlannerPage() {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  const { data: branchesData } = useGetBranchesQuery();
  const branches = Array.isArray(branchesData) ? branchesData : [];

  // Fetch calendar data
  const { data: calendarData, isLoading: calendarLoading } = useGetLeaveCalendarQuery({
    month: currentMonth,
    year: currentYear,
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    department: selectedDepartment || undefined,
  });

  // Fetch team schedule
  const { data: scheduleData, isLoading: scheduleLoading } = useGetTeamScheduleQuery({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    department: selectedDepartment || undefined,
  }, { skip: activeTab !== "team" });

  // Fetch conflicts
  const { data: conflictsData, isLoading: conflictsLoading } = useGetLeaveConflictsQuery({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    department: selectedDepartment || undefined,
    min_employees: 2,
  }, { skip: activeTab !== "conflicts" });

  // Fetch availability
  const { data: availabilityData, isLoading: availabilityLoading } = useGetAvailabilityQuery({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
    department: selectedDepartment || undefined,
  }, { skip: activeTab !== "availability" });

  const calendar = calendarData?.data;
  const schedule = scheduleData?.data;
  const conflicts = conflictsData?.data;
  const availability = availabilityData?.data;

  const departments = ["IT", "HR", "Sales", "Marketing", "Finance", "Operations"];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Render Calendar Tab
  const renderCalendarTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4   flex gap-4">
        <div className="relative w-full md:w-48">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-2 border  border-gray-300  rounded-lg"
          >
            <option value="">All Branches</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full md:w-48">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border  border-gray-300  rounded-lg"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        {(selectedBranch || selectedDepartment) && (
          <button
            onClick={() => {
              setSelectedBranch("");
              setSelectedDepartment("");
            }}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl p-4 border  border-gray-300 flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="px-4 py-2 border  border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Previous
        </button>
        <h2 className="text-xl font-semibold">{calendar?.month_name}</h2>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 border  border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      {calendarLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border  border-gray-300 ">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
            {calendar?.calendar.map((day) => (
              <div
                key={day.date}
                className={`bg-white p-3 min-h-[100px] ${
                  day.is_weekend ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm ${
                      day.is_weekend ? "text-red-500" : "text-gray-700"
                    }`}
                  >
                    {parseInt(day.date.split("-")[2])}
                  </span>
                  {day.leaves_count > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {day.leaves_count}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {day.leaves.slice(0, 2).map((leave) => (
                    <div
                      key={leave.id}
                      className="text-xs p-1 rounded bg-yellow-50 text-yellow-700 truncate"
                      title={`${leave.user_name} - ${leave.leave_type}`}
                    >
                      {leave.user_name}
                    </div>
                  ))}
                  {day.leaves_count > 2 && (
                    <div className="text-xs text-gray-500">
                      +{day.leaves_count - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Team Schedule Tab
  const renderTeamScheduleTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-300 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, start_date: e.target.value })
            }
            className="px-3 py-2 border  border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, end_date: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="relative w-full md:w-48">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-2 border  border-gray-300 rounded-lg mt-6"
          >
            <option value="">All Branches</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full md:w-48">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300  rounded-lg mt-6"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setSelectedBranch("");
            setSelectedDepartment("");
            setDateRange({
              start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString()
                .split("T")[0],
              end_date: new Date().toISOString().split("T")[0],
            });
          }}
          className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 mt-6"
        >
          Clear
        </button>
      </div>

      {/* Schedule Table */}
      {scheduleLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                    Leave Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Leave Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {schedule?.schedule.map((employee: any) => (
                  <tr key={employee.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{employee.user_name}</div>
                      <div className="text-xs text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4">{employee.department || "—"}</td>
                    <td className="px-6 py-4">{employee.branch || "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold">{employee.total_days}</span>
                      <span className="text-xs text-gray-500"> days</span>
                    </td>
                    <td className="px-6 py-4">
                      {employee.leaves.length > 0 ? (
                        <div className="space-y-1">
                          {employee.leaves.map((leave: any) => (
                            <div
                              key={leave.id}
                              className="text-xs bg-yellow-50 text-yellow-700 rounded px-2 py-1"
                            >
                              {leave.leave_type}: {leave.start_date} to{" "}
                              {leave.end_date} ({leave.days} days)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No leaves</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Render Conflicts Tab
  const renderConflictsTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-300 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, start_date: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, end_date: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Leave Conflicts</h3>
            <p className="text-sm text-gray-500">
              Dates with multiple employees on leave
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">
              {conflicts?.conflicts_found || 0}
            </div>
            <div className="text-xs text-gray-500">Conflicts Found</div>
          </div>
        </div>
      </div>

      {conflictsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts?.conflicts?.map((conflict: any) => (
            <div key={conflict.date} className="bg-white rounded-xl border border-gray-300 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">
                    {new Date(conflict.date).toLocaleDateString()}
                  </h4>
                  <p className="text-sm text-gray-500">{conflict.day_name}</p>
                </div>
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                  {conflict.employees_on_leave} employees on leave
                </div>
              </div>
              <div className="space-y-2">
                {conflict.employees.map((emp: any) => (
                  <div
                    key={emp.user_id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{emp.user_name}</div>
                      <div className="text-xs text-gray-500">
                        {emp.department} - {emp.leave_type}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        emp.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {conflicts?.conflicts_found === 0 && (
            <div className="text-center py-12 text-gray-500">
              No conflicts found in this period
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Availability Tab
  const renderAvailabilityTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-300 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, start_date: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) =>
              setDateRange({ ...dateRange, end_date: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-300">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold">{availability?.summary.total_employees || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-300">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-green-600">{availability?.summary.available || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-300">
          <p className="text-sm text-gray-500">On Leave</p>
          <p className="text-2xl font-bold text-yellow-600">{availability?.summary.on_leave || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-300">
          <p className="text-sm text-gray-500">Availability Rate</p>
          <p className="text-2xl font-bold text-blue-600">{availability?.summary.availability_percentage || 0}%</p>
        </div>
      </div>

      {availabilityLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Available Employees */}
          <div className="bg-white rounded-xl border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-green-50">
              <h3 className="font-semibold text-green-800">✓ Available Employees</h3>
            </div>
            <div className="divide-y">
              {availability?.available_employees.map((emp: any) => (
                <div key={emp.user_id} className="px-6 py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-sm text-gray-500">{emp.department} - {emp.branch}</div>
                  </div>
                  <span className="text-green-600 text-sm">✓ Available</span>
                </div>
              ))}
              {availability?.available_employees.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No available employees
                </div>
              )}
            </div>
          </div>

          {/* Employees on Leave */}
          <div className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b border-gray-300 bg-yellow-50">
              <h3 className="font-semibold text-yellow-800">⚠ Employees on Leave</h3>
            </div>
            <div className="divide-y">
              {availability?.employees_on_leave.map((emp: any) => (
                <div key={emp.user_id} className="px-6 py-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-gray-500">{emp.department} - {emp.branch}</div>
                    </div>
                    <span className="text-yellow-600 text-sm">On Leave</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {emp.leaves.map((leave: any, idx: number) => (
                      <div key={idx} className="text-xs">
                        {leave.start_date} to {leave.end_date} ({leave.days} days)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {availability?.employees_on_leave.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No employees on leave
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualize team leaves, detect conflicts, and manage schedules
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "calendar"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📅 Calendar View
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "team"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              👥 Team Schedule
            </button>
            <button
              onClick={() => setActiveTab("conflicts")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "conflicts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ⚠️ Conflicts
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "availability"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📊 Availability
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "calendar" && renderCalendarTab()}
        {activeTab === "team" && renderTeamScheduleTab()}
        {activeTab === "conflicts" && renderConflictsTab()}
        {activeTab === "availability" && renderAvailabilityTab()}
      </div>
    </DashboardLayout>
  );
}