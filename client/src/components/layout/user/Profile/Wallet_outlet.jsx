import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Clock,
  History,
} from "lucide-react";
import { FaRupeeSign } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const WalletPage = () => {
  const [wallet, setWallet] = useState({ balance: 0, updated_at: null });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchWalletData = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/wallet/?page=${pageNum}`);
      const {
        wallet: walletData,
        transactions: newTransactions,
        pagination,
      } = response.data;

      setWallet(walletData);
      setTransactions((prev) =>
        append ? [...prev, ...newTransactions] : newTransactions
      );
      setHasMore(pagination.next !== null);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setError("Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData(1, false);
  }, [fetchWalletData]);

  const loadMoreTransactions = useCallback(() => {
    if (!loading && hasMore) {
      fetchWalletData(page + 1, true);
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore, page, fetchWalletData]);

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, clientHeight, scrollHeight } = e.target;
      const bottom = scrollHeight - scrollTop <= clientHeight + 100;
      if (bottom) {
        loadMoreTransactions();
      }
    },
    [loadMoreTransactions]
  );

  const filteredTransactions = useMemo(() => {
    if (activeTab === "all") return transactions;
    return transactions.filter(
      (txn) => txn.transaction_type.toLowerCase() === activeTab.toLowerCase()
    );
  }, [transactions, activeTab]);

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post("/users/wallet/deposit/", {
        amount: parseFloat(amount),
      });
      setWallet(response.data.wallet);
      setTransactions((prev) => [response.data.transaction, ...prev]);
      setAmount("");
      setShowDepositDialog(false);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.error || "Deposit failed. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const TransactionItem = ({ transaction }) => {
    const isCredit = ["DEPOSIT", "REFUND"].includes(
      transaction.transaction_type
    );

    return (
      <div className="bg-[#2d2d42] rounded-lg p-4 mb-3 flex justify-between items-center">
        <div className="flex items-center">
          <div
            className={`p-3 rounded-full mr-4 ${
              isCredit
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {isCredit ? (
              <ArrowDownLeft size={20} />
            ) : (
              <ArrowUpRight size={20} />
            )}
          </div>
          <div>
            <h4 className="text-white font-medium capitalize">
              {transaction.transaction_type.toLowerCase()}
            </h4>
            <p className="text-gray-400 text-sm">
              {transaction.description || "No description"}
            </p>
            <div className="flex items-center text-gray-500 text-xs mt-1">
              <Clock size={14} className="mr-1" />
              <span>{formatDate(transaction.created_at)}</span>
            </div>
          </div>
        </div>
        <div
          className={`text-right ${
            isCredit ? "text-green-400" : "text-red-400"
          }`}
        >
          <div className="font-semibold flex items-center justify-end text-lg">
            <FaRupeeSign className="mr-1" size={15} />
            {Math.abs(transaction.amount).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            ID: {transaction.transaction_id.slice(0, 8)}
          </div>
        </div>
      </div>
    );
  };

  const TransactionSkeleton = () => (
    <div className="bg-[#2d2d42] rounded-lg p-4 mb-3 flex justify-between items-center">
      <div className="flex items-center">
        <Skeleton className="h-12 w-12 rounded-full mr-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-3 w-[150px]" />
          <Skeleton className="h-2 w-[120px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-[80px] ml-auto" />
        <Skeleton className="h-3 w-[60px] ml-auto" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1e1e2f] rounded-2xl p-6 shadow-xl">
      {/* Wallet Balance Card */}
      {loading && !wallet.updated_at ? (
        <div className="bg-gradient-to-r from-[#2d2d42] to-[#3a3a5a] rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-9 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          {/* <Skeleton className="h-9 w-[100px] mt-6" /> */}
          <div className="p-3 bg-[#00EF93]/10 rounded-full">
            <Wallet size={32} className="text-[#00EF93]" />
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#2d2d42] to-[#3a3a5a] rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-400 text-sm font-medium mb-1">
                Your Wallet Balance
              </h2>
              <div className="flex items-center">
                <FaRupeeSign className="text-3xl mr-2 text-white" />
                <span className="text-4xl font-bold text-white">
                  {parseFloat(wallet.balance || 0).toFixed(2)}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Last updated: {formatDate(wallet.updated_at)}
              </p>
            </div>
            <div className="p-3 bg-[#00EF93]/10 rounded-full">
              <Wallet size={32} className="text-[#00EF93]" />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button
              onClick={() => setShowDepositDialog(true)}
              className="bg-[#00EF93] hover:bg-[#00EF93]/90 text-black font-medium py-2 px-6 rounded-lg"
            >
              Deposit
            </Button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-[#2d2d42] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <History className="mr-2 text-blue-400" size={20} />
            Transaction History
          </h3>
          <div className="flex gap-2">
            {["all", "deposit", "payment", "refund"].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                className={`${
                  activeTab === tab ? "bg-[#00EF93] text-black" : "text-black"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                  fetchWalletData(1, false);
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div
          className="max-h-[500px] overflow-y-auto pr-2"
          onScroll={handleScroll}
        >
          {loading && transactions.length === 0 ? (
            <div className="space-y-3">
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#2d2d42] rounded-xl">
              <div className="text-gray-400 text-center">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-medium mb-1">
                  No transactions found
                </h3>
                <p className="text-gray-500">
                  {activeTab !== "all"
                    ? `You haven't made any ${activeTab.toLowerCase()} transactions yet`
                    : "Your transaction history is empty"}
                </p>
              </div>
            </div>
          )}
          {loading && transactions.length > 0 && (
            <div className="py-4">
              <Skeleton className="h-4 w-[200px] mx-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#2d2d42] text-gray-200 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Deposit to Wallet</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the amount you want to deposit
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Label
                htmlFor="depositAmount"
                className="text-right text-gray-300"
              >
                Amount (₹)
              </Label>
              <Input
                id="depositAmount"
                type="number"
                min="1"
                step="0.01"
                className="bg-[#3a3a5a] border-gray-600 text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleDeposit}
              className="bg-[#00EF93] hover:bg-[#00EF93]/90 text-black"
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;
