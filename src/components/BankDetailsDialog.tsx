import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { apiClient } from "../services/apiClient";
import { BankDetail } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Loader2, Plus, Trash2, CreditCard, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface BankDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (bankDetail: BankDetail) => void; // For withdrawal selection
}

export function BankDetailsDialog({ isOpen, onClose, onSelect }: BankDetailsDialogProps) {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const [newBankDetail, setNewBankDetail] = useState<{
    type: "bank" | "upi";
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
    isPrimary: boolean;
  }>({
    type: "bank",
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    upiId: "",
    isPrimary: false,
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankDetails();
    }
  }, [isOpen]);

  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const data = await apiClient.bankDetails.getBankDetails();
      setBankDetails(data);
    } catch (error) {
      console.error("Error fetching bank details:", error);
      toast({
        title: "Error",
        description: "Failed to load bank details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const isPrimary = newBankDetail.isPrimary || bankDetails.length === 0;
    
    // Construct payload based on type as requested by user
    const payload = newBankDetail.type === "bank" 
      ? {
          accountHolderName: newBankDetail.accountHolderName,
          accountNumber: newBankDetail.accountNumber,
          bankName: newBankDetail.bankName,
          ifscCode: newBankDetail.ifscCode,
          isPrimary
        }
      : {
          upiId: newBankDetail.upiId,
          isPrimary
        };

    try {
      const addedDetail = await apiClient.bankDetails.addBankDetail(payload as any);
      
      // If the new one is primary, refresh all to ensure only one is shown as default/primary
      if (isPrimary) {
        fetchBankDetails();
      } else {
        setBankDetails([...bankDetails, addedDetail]);
      }
      setShowAddForm(false);
      setNewBankDetail({
        type: "bank",
        accountHolderName: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        upiId: "",
        isPrimary: false,
      });
      toast({
        title: "Success",
        description: "Bank detail added successfully",
      });
    } catch (error) {
      console.error("Error adding bank detail:", error);
      toast({
        title: "Error",
        description: "Failed to add bank detail",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    try {
      await apiClient.bankDetails.deleteBankDetail(id);
      setBankDetails(bankDetails.filter((item) => item.id !== id));
      toast({
        title: "Success",
        description: "Bank detail deleted",
      });
    } catch (error) {
      console.error("Error deleting bank detail:", error);
      toast({
        title: "Error",
        description: "Failed to delete bank detail",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bank Details</DialogTitle>
          <DialogDescription>
            Manage your bank accounts for withdrawals.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {!showAddForm ? (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {bankDetails.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No payout methods added yet.</p>
                    ) : (
                      bankDetails.map((detail) => (
                        <div
                          key={detail.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="cursor-pointer flex-1" onClick={() => onSelect && onSelect(detail)}>
                            <div className="flex items-center space-x-2">
                              {detail.type === "bank" ? <CreditCard className="h-4 w-4 text-muted-foreground" /> : <Send className="h-4 w-4 text-muted-foreground" />}
                              <p className="font-medium">{detail.type === "bank" ? detail.bankName : "UPI ID"}</p>
                              {detail.isPrimary && <CheckCircle2 className="h-3 w-3 text-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {detail.type === "bank" 
                                ? `${detail.accountHolderName} • ****${detail.accountNumber?.slice(-4)}`
                                : detail.upiId
                              }
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(detail.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                </div>
                  <Button className="w-full" onClick={() => setShowAddForm(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Payout Method
                  </Button>
              </>
            ) : (
                <Tabs value={newBankDetail.type} onValueChange={(v) => setNewBankDetail({ ...newBankDetail, type: v as "bank" | "upi" })}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank">Bank Account</TabsTrigger>
                    <TabsTrigger value="upi">UPI ID</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleAddBankDetail} className="space-y-4 mt-4">
                    <TabsContent value="bank" className="space-y-4 m-0">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolderName">Account Holder Name</Label>
                        <Input
                          id="accountHolderName"
                          value={newBankDetail.accountHolderName}
                          onChange={(e) => setNewBankDetail({ ...newBankDetail, accountHolderName: e.target.value })}
                          required={newBankDetail.type === "bank"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={newBankDetail.bankName}
                          onChange={(e) => setNewBankDetail({ ...newBankDetail, bankName: e.target.value })}
                          required={newBankDetail.type === "bank"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={newBankDetail.accountNumber}
                          onChange={(e) => setNewBankDetail({ ...newBankDetail, accountNumber: e.target.value })}
                          required={newBankDetail.type === "bank"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input
                          id="ifscCode"
                          value={newBankDetail.ifscCode}
                          onChange={(e) => setNewBankDetail({ ...newBankDetail, ifscCode: e.target.value })}
                          required={newBankDetail.type === "bank"}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="upi" className="space-y-4 m-0">
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="username@bank"
                          value={newBankDetail.upiId}
                          onChange={(e) => setNewBankDetail({ ...newBankDetail, upiId: e.target.value })}
                          required={newBankDetail.type === "upi"}
                        />
                      </div>
                    </TabsContent>

                    <div className="flex items-center justify-between space-x-2 py-2 border-t mt-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="isPrimary">Set as primary</Label>
                        <p className="text-xs text-muted-foreground">Make this your default payout method.</p>
                      </div>
                      <Switch
                        id="isPrimary"
                        checked={newBankDetail.isPrimary}
                        onCheckedChange={(checked) => setNewBankDetail({ ...newBankDetail, isPrimary: checked })}
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1" disabled={adding}>
                        {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                    </div>
                  </form>
                </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
