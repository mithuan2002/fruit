import { Link } from "wouter";
import { ArrowRight, Users, MessageCircle, Gift, BarChart3, Zap, Shield, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Fruitbox</span>
          </div>
          <Link href="/auth">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Sign In
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Supercharge Your Business by 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Rewarding Customers</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Turn your customers into brand ambassadors. Create powerful referral campaigns, track engagement, and grow your business through automated WhatsApp messaging and reward systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth" data-testid="button-get-started">
              <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
            <button className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg" data-testid="button-book-demo">
              Book Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-xl text-gray-600">Comprehensive tools for Rewarding Customers</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Management</h3>
            <p className="text-gray-600">Organize and track your customer database with detailed referral history and engagement metrics.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp Integration</h3>
            <p className="text-gray-600">Automated WhatsApp messaging for welcome messages, reward notifications, and campaign updates.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reward System</h3>
            <p className="text-gray-600">Create flexible reward programs with points, coupons, and custom incentives to drive referrals.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Reports</h3>
            <p className="text-gray-600">Track campaign performance, referral rates, and ROI with comprehensive analytics dashboard.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Campaign Management</h3>
            <p className="text-gray-600">Design and launch targeted referral campaigns with custom goals, budgets, and timeframes.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Reliable</h3>
            <p className="text-gray-600">Enterprise-grade security with reliable infrastructure to protect your customer data.</p>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="container mx-auto px-6 py-20 bg-white/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Perfect for Every Industry</h2>
          <p className="text-xl text-gray-600">Trusted by businesses across various sectors</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { name: "Food & Dining", icon: "🍽️" },
            { name: "Fashion", icon: "👗" },
            { name: "Electronics", icon: "📱" },
            { name: "Beauty", icon: "💄" },
            { name: "Services", icon: "🔧" },
            { name: "Others", icon: "🏪" }
          ].map((industry) => (
            <div key={industry.name} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{industry.icon}</div>
              <h3 className="text-sm font-medium text-gray-900">{industry.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of businesses using Fruitbox to drive growth through referrals</p>
          <Link href="/auth" data-testid="button-get-started-cta">
            <button className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors transform hover:scale-105 shadow-lg">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Fruitbox</span>
          </div>
          <div className="flex items-center space-x-6 text-gray-600">
            <Globe className="w-4 h-4" />
            <span className="text-sm">Referral Marketing Made Simple</span>
          </div>
        </div>
      </footer>
    </div>
  );
}