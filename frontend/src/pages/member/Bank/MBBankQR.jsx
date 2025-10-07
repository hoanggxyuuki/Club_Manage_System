import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QRPay, BanksObject } from "vietnam-qr-pay";
import { AlertCircle, Copy, Check } from "lucide-react";

const MBBankQR = ({ accountNumber, username, amount = 20000, onError }) => {
  const [qrString, setQrString] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const MB_BANK_BIN = "970422";

  const generateQRCode = () => {
    try {
      if (!accountNumber || !username) {
        throw new Error("Missing account number or username");
      }

      const qrPay = QRPay.initVietQR({
        bankBin: MB_BANK_BIN,
        bankNumber: accountNumber.toString().trim(),
        amount: amount.toString(),
        purpose: `IUPTIT ${username}`.trim(),
      });

      const qrString = qrPay.build();

      if (!qrString || typeof qrString !== "string") {
        throw new Error("Invalid QR code generation");
      }

      setQrString(qrString);
      setError(null);
    } catch (err) {
      console.error("QR Generation Error:", err);
      setError(err.message);
      onError?.(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    generateQRCode();
  }, [accountNumber, username, amount]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span>Thất bại khi tạo mã QR: {error}</span>
      </div>
    );
  }

  if (!qrString) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <QRCodeSVG
            value={qrString}
            size={240}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="text-sm text-gray-500 text-center">
          Quét với app MBBank hoặc bất kì ngân hàng nào
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Chi tiết QR</div>
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
            title={copied ? "Copied!" : "Copy QR string"}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-gray-600">Ngân hàng</span>
            <span className="font-medium">MB Bank</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-gray-600">Tài khoản</span>
            <span className="font-medium">{accountNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-gray-600">Số tiền</span>
            <span className="font-medium">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(amount)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-gray-600">Nội dung</span>
            <span className="font-medium">IUPTIT {username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MBBankQR;
