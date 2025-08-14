import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ExternalLink } from "lucide-react";
import Header from "@/components/layout/header";

export default function POSIntegrationPage() {
  const handleFormRedirect = () => {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSckwAtjHom2zF_fYpFi7RLU0ZHbMsMx51xNjWSaCZL3c4b47g/viewform?pli=1", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title="POS Integration"
        description="Connect your Point of Sale system for automated customer management"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">POS Integration</h1>
          <p className="text-gray-600 dark:text-gray-400">
            For POS integration, fill the form below
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                POS Integration Setup Request
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="space-y-6">
                <div className="text-lg text-gray-700 dark:text-gray-300">
                  Please fill this form, we will reach out ASAP!
                </div>

                <Button
                  onClick={handleFormRedirect}
                  className="inline-flex items-center gap-2 px-8 py-4 text-lg"
                  size="lg"
                  data-testid="button-google-form"
                >
                  <ExternalLink className="h-5 w-5" />
                  Fill POS Integration Form
                </Button>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This will open Google Forms in a new tab
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}