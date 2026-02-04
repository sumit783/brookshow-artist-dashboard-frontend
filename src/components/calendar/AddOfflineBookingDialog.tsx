import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export interface ServiceOption {
  id: string;
  category: string;
}

export interface OfflineBookingData {
  serviceId: string;
  totalPrice: string;
  // Other fields can be added here if needed in future
  title?: string;
  clientName?: string;
  startTime?: string;
  endTime?: string;
}

interface AddOfflineBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceOption[];
  loadingServices: boolean;
  onSubmit: (data: OfflineBookingData) => Promise<void>;
}

export function AddOfflineBookingDialog({
  open,
  onOpenChange,
  services,
  loadingServices,
  onSubmit,
}: AddOfflineBookingDialogProps) {
  const [data, setData] = useState<OfflineBookingData>({
    serviceId: "",
    totalPrice: "",
  });

  const handleSubmit = async () => {
    await onSubmit(data);
    // Reset form after successful submission (handled by parent managing open state usually, 
    // but good to reset state here if needed, or rely on effect when open changes)
  };

  // Reset data when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setData({ serviceId: "", totalPrice: "" });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Offline Booking</DialogTitle>
          <DialogDescription>
            Create a booking manually and block it on your calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="serviceId">Service Category *</Label>
            {loadingServices ? (
              <div className="p-3 text-sm text-muted-foreground border rounded-md">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground border rounded-md">
                No services available
              </div>
            ) : (
              <>
                <Select
                  value={data.serviceId}
                  onValueChange={(value) => setData((prev) => ({ ...prev, serviceId: value }))}
                  disabled={loadingServices}
                >
                  <SelectTrigger id="serviceId" className="w-full">
                    <SelectValue placeholder="Select a service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="cursor-pointer">
                        <span className="font-medium">{service.category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {data.serviceId && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium text-foreground">
                      Selected: {services.find((s) => s.id === data.serviceId)?.category}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {services.length} service{services.length !== 1 ? "s" : ""} available
                </p>
              </>
            )}
          </div>

          <div>
            <Label htmlFor="totalPrice">Total Price (₹) *</Label>
            <Input
              id="totalPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g., 2500"
              value={data.totalPrice}
              onChange={(e) => setData((prev) => ({ ...prev, totalPrice: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!data.serviceId || !data.totalPrice || loadingServices}
          >
            Create Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
