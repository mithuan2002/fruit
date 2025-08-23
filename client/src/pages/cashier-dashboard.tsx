import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  User, 
  CreditCard, 
  Gift, 
  CheckCircle, 
  Calculator,
  Clock,
  Receipt
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  points: number;
  pointsEarned: number;
  pointsRedeemed: number;
}

interface Cashier {
  id: string;
  name: string;
  employeeId: string | null;
  phoneNumber: string | null;
  isActive: boolean;
}

interface DiscountTransaction {
  id: string;
  pointsUsed: number;
  discountAmount: string;
  finalAmount: string | null;
  appliedAt: string;
}

export default function CashierDashboard() {
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCashier, setSelectedCashier] = useState("");
  const [pointsToUse, setPointsToUse] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [discountResult, setDiscountResult] = useState<DiscountTransaction | null>(null);
  const { toast } = useToast();

  // Get all cashiers
  const { data: cashiers = [] } = useQuery({
    queryKey: ["/api/cashiers"],
    queryFn: async () => {
      const response = await fetch("/api/cashiers");
      if (!response.ok) throw new Error("Failed to fetch cashiers");
      return response.json() as Promise<Cashier[]>;
    },
  });

  // Find customer by phone
  const findCustomerMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch(`/api/customers/phone/${phoneNumber}`);
      if (!response.ok) {
        throw new Error("Customer not found");
      }
      return response.json() as Promise<Customer>;
    },
    onSuccess: (customer) => {
      setSelectedCustomer(customer);
      toast({
        title: "Customer Found",
        description: `${customer.name} has ${customer.points} points available`,
      });
    },
    onError: () => {
      setSelectedCustomer(null);
      toast({
        title: "Customer Not Found",
        description: "Please check the phone number or ask customer to register first",
        variant: "destructive",
      });
    },
  });

  // Apply discount
  const applyDiscountMutation = useMutation({
    mutationFn: async (data: {
      customerId: string;
      cashierId: string;
      pointsToUse: number;
      originalAmount?: number;
      notes?: string;
    }) => {
      const response = await fetch("/api/cashier/apply-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to apply discount");
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setDiscountResult(result.transaction);
      // Update customer points locally
      if (selectedCustomer) {
        setSelectedCustomer({
          ...selectedCustomer,
          points: result.customer.newPointsBalance,
          pointsRedeemed: selectedCustomer.pointsRedeemed + parseInt(pointsToUse)
        });
      }
      
      toast({
        title: "Discount Applied Successfully! 🎉",
        description: `₹${result.transaction.discountAmount} discount applied. Customer's new balance: ${result.customer.newPointsBalance} points`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Apply Discount",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFindCustomer = () => {
    if (!customerPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = customerPhone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    findCustomerMutation.mutate(cleanPhone);
  };

  const handleApplyDiscount = () => {
    if (!selectedCustomer || !selectedCashier || !pointsToUse) {
      toast({
        title: "Missing Information",
        description: "Please select customer, cashier, and enter points to use",
        variant: "destructive",
      });
      return;
    }

    const points = parseInt(pointsToUse);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please enter a valid number of points",
        variant: "destructive",
      });
      return;
    }

    if (points > selectedCustomer.points) {
      toast({
        title: "Insufficient Points",
        description: `Customer only has ${selectedCustomer.points} points available`,
        variant: "destructive",
      });
      return;
    }

    const originalAmountNum = originalAmount ? parseFloat(originalAmount) : undefined;
    
    applyDiscountMutation.mutate({
      customerId: selectedCustomer.id,
      cashierId: selectedCashier,
      pointsToUse: points,
      originalAmount: originalAmountNum,
      notes: notes.trim() || undefined,
    });
  };

  const resetForm = () => {
    setCustomerPhone("");
    setSelectedCustomer(null);
    setPointsToUse("");
    setOriginalAmount("");
    setNotes("");
    setDiscountResult(null);
  };

  const calculateDiscount = () => {
    const points = parseInt(pointsToUse);
    const original = parseFloat(originalAmount);
    
    if (!isNaN(points) && !isNaN(original)) {
      const discount = points; // 1 point = ₹1 discount
      const final = Math.max(0, original - discount);
      return { discount, final };
    }
    return null;
  };

  const discountCalculation = calculateDiscount();

  if (discountResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Discount Applied Successfully!</CardTitle>
              <CardDescription className="text-green-600">
                Transaction completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Details */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-sm">Transaction Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Points Used</p>
                    <p className="font-bold text-red-600">-{discountResult.pointsUsed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Discount Amount</p>
                    <p className="font-bold text-green-600">₹{discountResult.discountAmount}</p>
                  </div>
                  {discountResult.finalAmount && (
                    <>
                      <div>
                        <p className="text-gray-600">Original Amount</p>
                        <p className="font-medium">₹{originalAmount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Final Amount</p>
                        <p className="font-bold text-blue-600">₹{discountResult.finalAmount}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-2">
                  <p className="text-gray-600 text-xs">Applied at</p>
                  <p className="font-medium text-xs">
                    {new Date(discountResult.appliedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedCustomer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center space-y-2">
                    <div className="font-semibold text-blue-800">{selectedCustomer.name}</div>
                    <p className="text-sm text-blue-600">
                      Remaining Points: <span className="font-bold">{selectedCustomer.points} points</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={resetForm} 
                  className="w-full"
                  data-testid="button-new-transaction"
                >
                  New Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
          <p className="text-gray-600">Apply customer discounts and manage points redemption</p>
        </div>

        {/* Cashier Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Cashier</CardTitle>
            <CardDescription>Choose your cashier account</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCashier} onValueChange={setSelectedCashier}>
              <SelectTrigger data-testid="select-cashier">
                <SelectValue placeholder="Select your cashier account" />
              </SelectTrigger>
              <SelectContent>
                {cashiers.map((cashier) => (
                  <SelectItem key={cashier.id} value={cashier.id}>
                    {cashier.name}
                    {cashier.employeeId && ` (${cashier.employeeId})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Customer Lookup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Find Customer</CardTitle>
            <CardDescription>Enter customer's phone number to check points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="Enter customer phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFindCustomer()}
                data-testid="input-customer-phone"
              />
              <Button 
                onClick={handleFindCustomer}
                disabled={findCustomerMutation.isPending}
                data-testid="button-find-customer"
              >
                {findCustomerMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Customer Info */}
            {selectedCustomer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Customer Found</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedCustomer.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Available Points</p>
                    <p className="font-bold text-2xl text-green-600">{selectedCustomer.points}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Points Earned/Redeemed</p>
                    <p className="font-medium text-sm">
                      <span className="text-green-600">+{selectedCustomer.pointsEarned}</span>
                      {" / "}
                      <span className="text-red-600">-{selectedCustomer.pointsRedeemed}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount Application */}
        {selectedCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Apply Discount</CardTitle>
              <CardDescription>Use customer points for discount (1 point = ₹1 discount)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Points to Use</Label>
                  <Input
                    id="points"
                    type="number"
                    placeholder="Enter points"
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(e.target.value)}
                    max={selectedCustomer.points}
                    data-testid="input-points-to-use"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max: {selectedCustomer.points} points
                  </p>
                </div>
                <div>
                  <Label htmlFor="amount">Original Amount (Optional)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter bill amount"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    data-testid="input-original-amount"
                  />
                </div>
              </div>

              {/* Discount Calculator */}
              {discountCalculation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800">Discount Preview</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Discount</p>
                      <p className="font-bold text-green-600">₹{discountCalculation.discount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Original</p>
                      <p className="font-medium">₹{originalAmount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Amount</p>
                      <p className="font-bold text-blue-600">₹{discountCalculation.final}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this transaction"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="textarea-notes"
                />
              </div>

              <Button 
                className="w-full"
                size="lg"
                onClick={handleApplyDiscount}
                disabled={!selectedCustomer || !selectedCashier || !pointsToUse || applyDiscountMutation.isPending}
                data-testid="button-apply-discount"
              >
                {applyDiscountMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying Discount...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Apply Discount
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="font-medium text-purple-900">How to use:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Select your cashier account from the dropdown</li>
                <li>• Enter customer's phone number to find their account</li>
                <li>• Enter points to use for discount (1 point = ₹1)</li>
                <li>• Optionally enter bill amount for final calculation</li>
                <li>• Apply discount and points are deducted immediately</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}