import React from 'react';
import CustomerDashboard from './customer-dashboard';

export default function CustomerApp() {
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('customerId');

  if (!customerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Customer ID Required</h1>
          <p className="text-gray-600">Please provide a valid customer ID to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return <CustomerDashboard customerId={customerId} />;
}