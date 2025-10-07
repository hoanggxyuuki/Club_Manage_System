import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getMemberPayments, getAccountNo } from "../../../services/bank";
import moment from "moment";
import MBBankQR from "./MBBankQR";

const BankDeposits = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountNo, setAccountNo] = useState(null);
  const { userData } = useAuth();
  const user = userData;

  const fetchAccountNo = useCallback(async () => {
    try {
      const response = await getAccountNo();
      if (response.success) {
        setAccountNo(response.data.accountNo);
      } else {
        setError("Failed to fetch account number");
      }
    } catch (err) {
      console.error("Error fetching account number:", err);
      setError("Failed to fetch account number");
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMemberPayments(user?._id);
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
  }, [user?._id]);

  useEffect(() => {
    fetchAccountNo();
    fetchPayments();
    const interval = setInterval(fetchPayments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPayments, fetchAccountNo]);

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
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Tiền gửi quỹ</h2>
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm text-blue-600 font-medium">
                  Tổng số tiền đã nạp
                </h3>
                <p className="text-2xl font-bold text-blue-800">
                  {formatAmount(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm text-green-600 font-medium">
                  Lần nạp gần đây
                </h3>
                <p className="text-2xl font-bold text-green-800">
                  {payments.length > 0
                    ? formatDate(payments[0].transactionDate)
                    : "Không có"}
                </p>
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
                Thử lại
              </button>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Nạp nhanh</h3>
            <div className="p-6 bg-gray-50 rounded-lg">
              {accountNo && user?.username ? (
                <MBBankQR
                  accountNumber={accountNo}
                  username={user?.username}
                  amount={20000}
                  onError={(err) => setError(err.message)}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  Loading payment information...
                </div>
              )}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy lịch sử nạp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tham chiếu giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.transactionRef}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.transactionRef}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {payment.username}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Cách chuyển tiền</h3>
        <div className="prose">
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium mb-2">Cách 1: Quét mã QR </h4>
              <p className="text-gray-600">
                Chỉ có thể quét mã QR bằng ngân hàng
              </p>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-2">Cách 2</h4>
              <ol className="list-decimal ml-6 space-y-2">
                <li>
                  Chuyển tới tài khoản MBBank:{" "}
                  <span className="font-mono text-blue-600">{accountNo}</span>
                </li>
                <li>
                  Nhập nội dung "IUPTIT{" "}
                  <span className="font-mono text-blue-600">
                    {user?.username}
                  </span>
                  "{" "}
                </li>
                <li>Hệ thống sẽ tự động cộng trong vài phút</li>
                <li>Tiền của bạn sẽ xuất hiện ở bảng sau khi xử lý</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800">
                <strong>Quan trọng:</strong>Đảm bảo bao gồm chính xác "IUPTIT"
                theo sau là tên người dùng của bạn trong mô tả chuyển khoản. Ví
                dụ: "IUPTIT {user?.username}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDeposits;
