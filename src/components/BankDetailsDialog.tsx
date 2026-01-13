import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { apiClient } from "../services/apiClient";
import { BankDetail } from "../types";
import { Loader2, Plus, Trash2 } from "lucide-react";
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

  const [newBankDetail, setNewBankDetail] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
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
    try {
      const addedDetail = await apiClient.bankDetails.addBankDetail({
        ...newBankDetail,
        artistId: "", // Backend should handle this or get from context
        isDefault: bankDetails.length === 0,
      });
      setBankDetails([...bankDetails, addedDetail]);
      setShowAddForm(false);
      setNewBankDetail({
        accountHolderName: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
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
                    <p className="text-center text-muted-foreground py-4">No bank accounts added yet.</p>
                  ) : (
                    bankDetails.map((detail) => (
                      <div
                        key={detail.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="cursor-pointer flex-1" onClick={() => onSelect && onSelect(detail)}>
                          <p className="font-medium">{detail.bankName}</p>
                          <p className="text-sm text-muted-foreground">
                            {detail.accountHolderName} • ****{detail.accountNumber.slice(-4)}
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
                  <Plus className="mr-2 h-4 w-4" /> Add New Bank Account
                </Button>
              </>
            ) : (
              <form onSubmit={handleAddBankDetail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={newBankDetail.accountHolderName}
                    onChange={(e) => setNewBankDetail({ ...newBankDetail, accountHolderName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={newBankDetail.bankName}
                    onChange={(e) => setNewBankDetail({ ...newBankDetail, bankName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={newBankDetail.accountNumber}
                    onChange={(e) => setNewBankDetail({ ...newBankDetail, accountNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={newBankDetail.ifscCode}
                    onChange={(e) => setNewBankDetail({ ...newBankDetail, ifscCode: e.target.value })}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={adding}>
                    {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
