import React, { useState, useEffect, useCallback } from "react";
import {
  setupBankAccount,
  resetBankAccount,
  getTransactionHistory,
  getMemberPaymentsAdmin,
  getAccountNo,
} from "../../../services/bank";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";
import * as XLSX from "xlsx";

const AdminBank = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: moment().startOf("month").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [setupForm, setSetupForm] = useState({
    username: "",
    password: "",
    accountNo: "",
  });
  const [setupStatus, setSetupStatus] = useState(null);
  const { user } = useAuth();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getMemberPaymentsAdmin();
      if (response.success) {
        setPayments(response.data);
      } else {
        setError("Failed to fetch payment history");
      }
    } catch (err) {
      setError(err.message || "Error fetching payment history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  useEffect(() => {
    if (payments.length) {
      const filtered = payments.filter((payment) => {
        const paymentDate = moment(payment.transactionDate);
        const isWithinRange = paymentDate.isBetween(
          moment(dateRange.startDate).startOf("day"),
          moment(dateRange.endDate).endOf("day"),
          "day",
          "[]",
        );
        const matchesSearch =
          searchTerm === "" ||
          payment.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCaseadserCase());
        return isWithinRange && matchesSearch;
      });
      setFilteredPayments(filtered);
    }
  }, [payments, dateRange, searchTerm]);

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayments.map((payment) => ({
        Date: formatDate(payment.transactionDate),
        "Member Name": payment.fullName,
        Amount: formatAmount(payment.amount),
        "Transaction Reference": payment.transactionRef,
      })),
    );
    const fileName = `Bank_Payments_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, fileName);
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    try {
      setSetupStatus({
        type: "loading",
        message: "Setting up bank account...",
      });
      const response = await setupBankAccount(setupForm);
      if (response.success) {
        setSetupStatus({
          type: "success",
          message: "Bank account setup successful",
        });
        setSetupForm({ username: "", password: "", accountNo: "" });

        await handleRefreshHistory();
      } else {
        setSetupStatus({
          type: "error",
          message: "Failed to setup bank account",
        });
      }
    } catch (err) {
      setSetupStatus({
        type: "error",
        message: err.message || "Error setting up bank account",
      });
    }
  };

  const handleInputChange = (e) => {
    setSetupForm({
      ...setupForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRefreshHistory = async () => {
    setLoading(true);
    const response = await getMemberPaymentsAdmin();
    if (response.success) {
      await fetchPayments();
      setSetupStatus({
        type: "success",
        message: "Transaction history updated",
      });
    } else {
      setError("Failed to refresh transaction history");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date) => {
    return moment(date).format("DD/MM/YYYY HH:mm:ss");
  };

  if (loading && !payments.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user.role === "admin" && (
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Bank Account Setup</h2>
            <form onSubmit={handleSetupSubmit} className="max-w-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MBBank Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={setupForm.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    MBBank Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={setupForm.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNo"
                    value={setupForm.accountNo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Setup Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">All Member Payments</h2>

          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm text-blue-600 font-medium">
                  Total Deposits
                </h3>
                <p className="text-2xl font-bold text-blue-800">
                  {formatAmount(
                    filteredPayments.reduce((sum, p) => sum + p.amount, 0),
                  )}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-sm text-indigo-600 font-medium">
                  Total Members
                </h3>
                <p className="text-2xl font-bold text-indigo-800">
                  {new Set(filteredPayments.map((p) => p.memberId)).size}
                </p>
              </div>
            </div>
          </div>

          {setupStatus && (
            <div
              className={`mb-4 p-4 rounded-md ${
                setupStatus.type === "success"
                  ? "bg-green-50 text-green-700"
                  : setupStatus.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {setupStatus.message}
            </div>
          )}

          <div className="mb-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800">
                <strong>Note:</strong> Members should include "IUPTIT username"
                in their transfer descriptions. For example: "IUPTIT johnsmith"
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex gap-2 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateRangeChange}
                      className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateRangeChange}
                      min={dateRange.startDate}
                      className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={handleRefreshHistory}
                    disabled={loading}
                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Refreshing..." : "Refresh History"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
              <button
                onClick={fetchPayments}
                className="ml-4 text-sm underline"
              >
                Try Again
              </button>
            </div>
          )}

          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {payments.length === 0
                ? "No payments found"
                : "No payments found for the selected filters"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Ref
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.transactionRef}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {payment.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.transactionRef}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBank;
