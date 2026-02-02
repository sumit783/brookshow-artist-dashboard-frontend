import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiClient } from "../services/apiClient";
import { WalletStats, WalletTransaction, BankDetail } from "../types";
import { Loader2, ArrowUpRight, ArrowDownLeft, Building2, Download } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { BankDetailsDialog } from "../components/BankDetailsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";

export default function Wallet() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBankDetailsOpen, setIsBankDetailsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankDetail | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [statsData, transactionsData] = await Promise.all([
        apiClient.wallet.getStats(),
        apiClient.wallet.getTransactions(),
      ]);
      setStats(statsData);
      setTransactions(transactionsData);
      
      // Also fetch bank details to set default for withdrawal
      const bankData = await apiClient.bankDetails.getBankDetails();
      if (bankData.length > 0) {
        setSelectedBank(bankData.find(b => b.isPrimary) || bankData[0]);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = () => {
    if (!selectedBank) {
      toast({
        title: "No Bank Account",
        description: "Please add a bank account first.",
        action: <Button variant="outline" size="sm" onClick={() => setIsBankDetailsOpen(true)}>Add Method</Button>
      });
      return;
    }
    setIsWithdrawOpen(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (stats && Number(withdrawAmount) > stats.balance) {
      toast({ title: "Insufficient Funds", description: "Withdrawal amount exceeds available balance", variant: "destructive" });
      return;
    }
    if (!selectedBank) return;

    setWithdrawing(true);
    try {
      await apiClient.wallet.requestWithdrawal(Number(withdrawAmount));
      toast({ title: "Success", description: "Withdrawal request submitted" });
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      fetchWalletData(); // Refresh data
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast({ title: "Error", description: "Failed to request withdrawal", variant: "destructive" });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBankDetailsOpen(true)}>
            <Building2 className="mr-2 h-4 w-4" /> Bank Details
          </Button>
          <Button onClick={handleWithdrawClick}>
            <Download className="mr-2 h-4 w-4" /> Withdraw
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <span className="text-2xl font-bold">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalIncome || 0)}</div>
            <p className="text-xs text-muted-foreground">Life-time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.totalWithdrawn || 0)}</div>
            <p className="text-xs text-muted-foreground">Successfully withdrawn</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent wallet activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type === "credit" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                      {tx.type === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`font-bold ${tx.type === "credit" ? "text-green-600" : "text-orange-600"}`}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </div>
                    <Badge 
                      variant={
                        tx.status === "completed" ? "default" : 
                        tx.status === "pending" ? "outline" : 
                        "destructive"
                      }
                      className="text-[10px] h-4 py-0"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Dialog */}
      <BankDetailsDialog
        isOpen={isBankDetailsOpen}
        onClose={() => setIsBankDetailsOpen(false)}
        onSelect={(bank) => {
           setSelectedBank(bank);
           // Optionally auto-open withdraw dialog if we were trying to withdraw
        }}
      />

      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Withdraw funds to your bank account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="p-3 border rounded bg-muted/20">
              <p className="text-sm font-medium">To Account:</p>
              <div className="flex justify-between items-center mt-1">
                <div>
                   <p className="text-sm font-bold">{selectedBank?.type === "bank" ? selectedBank.bankName : "UPI ID"}</p>
                   <p className="text-xs text-muted-foreground">
                    {selectedBank?.type === "bank" 
                      ? `****${selectedBank.accountNumber?.slice(-4)}` 
                      : selectedBank?.upiId
                    }
                   </p>
                </div>
                <Button type="button" variant="link" size="sm" onClick={() => { setIsWithdrawOpen(false); setIsBankDetailsOpen(true); }}>
                  Change
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Available: {formatCurrency(stats?.balance || 0)})</Label>
              <Input
                id="amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={withdrawing}>
                {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Withdraw
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
