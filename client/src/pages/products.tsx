import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product, type InsertProduct } from "@shared/schema";

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<InsertProduct>({
    name: "",
    productCode: "",
    description: "",
    price: "0",
    sku: "",
    category: "",
    pointCalculationType: "inherit",
    fixedPoints: null,
    percentageRate: null,
    minimumQuantity: 1,
    bonusMultiplier: "1.00",
    isActive: true,
    stockQuantity: -1
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const createProductMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiRequest("/api/products", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive"
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => 
      apiRequest(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/products/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      productCode: "",
      description: "",
      price: "0",
      sku: "",
      category: "",
      pointCalculationType: "inherit",
      fixedPoints: null,
      percentageRate: null,
      minimumQuantity: 1,
      bonusMultiplier: "1.00",
      isActive: true,
      stockQuantity: -1
    });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      productCode: product.productCode || "",
      description: product.description || "",
      price: product.price,
      sku: product.sku || "",
      category: product.category || "",
      pointCalculationType: product.pointCalculationType || "inherit",
      fixedPoints: product.fixedPoints,
      percentageRate: product.percentageRate,
      minimumQuantity: product.minimumQuantity || 1,
      bonusMultiplier: product.bonusMultiplier || "1.00",
      isActive: product.isActive,
      stockQuantity: product.stockQuantity || -1
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Products</h1>
        </div>
        <div className="text-center py-12">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Products</h1>
          <Badge variant="secondary">{products.length}</Badge>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                Configure product details and point calculation rules
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    data-testid="input-product-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="productCode">Product Code *</Label>
                  <Input
                    id="productCode"
                    data-testid="input-product-code"
                    value={formData.productCode || ''}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="input-product-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    data-testid="input-product-price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    data-testid="input-product-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Point Calculation Rules</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pointCalculationType">Point Calculation Type</Label>
                    <Select
                      value={formData.pointCalculationType}
                      onValueChange={(value: any) => setFormData({ ...formData, pointCalculationType: value })}
                    >
                      <SelectTrigger data-testid="select-point-calculation-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit">Inherit from Campaign</SelectItem>
                        <SelectItem value="fixed">Fixed Points</SelectItem>
                        <SelectItem value="percentage">Percentage of Price</SelectItem>
                        <SelectItem value="tier">Tier-based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.pointCalculationType === "fixed" && (
                    <div>
                      <Label htmlFor="fixedPoints">Fixed Points per Sale</Label>
                      <Input
                        id="fixedPoints"
                        type="number"
                        min="0"
                        data-testid="input-fixed-points"
                        value={formData.fixedPoints || ""}
                        onChange={(e) => setFormData({ ...formData, fixedPoints: parseInt(e.target.value) || null })}
                      />
                    </div>
                  )}

                  {formData.pointCalculationType === "percentage" && (
                    <div>
                      <Label htmlFor="percentageRate">Percentage Rate (%)</Label>
                      <Input
                        id="percentageRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        data-testid="input-percentage-rate"
                        value={formData.percentageRate || ""}
                        onChange={(e) => setFormData({ ...formData, percentageRate: e.target.value || null })}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minimumQuantity">Minimum Quantity for Points</Label>
                      <Input
                        id="minimumQuantity"
                        type="number"
                        min="1"
                        data-testid="input-minimum-quantity"
                        value={formData.minimumQuantity}
                        onChange={(e) => setFormData({ ...formData, minimumQuantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bonusMultiplier">Bonus Multiplier</Label>
                      <Input
                        id="bonusMultiplier"
                        type="number"
                        step="0.01"
                        min="0"
                        data-testid="input-bonus-multiplier"
                        value={formData.bonusMultiplier}
                        onChange={(e) => setFormData({ ...formData, bonusMultiplier: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-submit-product"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first product to start setting up point calculations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: Product) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>
                      {product.sku && `SKU: ${product.sku} • `}
                      {product.productCode && `Code: ${product.productCode} • `}
                      ${parseFloat(product.price).toFixed(2)}
                    </CardDescription>
                  </div>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {product.category && (
                    <div>
                      <span className="font-medium">Category:</span> {product.category}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Points:</span>{" "}
                    {product.pointCalculationType === "inherit" && "Inherit from Campaign"}
                    {product.pointCalculationType === "fixed" && `${product.fixedPoints} fixed points`}
                    {product.pointCalculationType === "percentage" && `${product.percentageRate}% of price`}
                    {product.pointCalculationType === "tier" && "Tier-based"}
                  </div>
                  {product.bonusMultiplier && parseFloat(product.bonusMultiplier) !== 1.0 && (
                    <div>
                      <span className="font-medium">Bonus:</span> {product.bonusMultiplier}x multiplier
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => startEdit(product)}
                    data-testid={`button-edit-product-${product.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => deleteProductMutation.mutate(product.id)}
                    data-testid={`button-delete-product-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}