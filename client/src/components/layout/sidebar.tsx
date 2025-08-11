import { Link, useLocation } from "wouter";
import { Gift, BarChart3, Megaphone, Users, Ticket, MessageSquare, PieChart } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "WhatsApp", href: "/whatsapp", icon: MessageSquare },

];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Gift className="text-white h-4 w-4" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">Fruitbox</h1>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
              const Icon = item.icon;

              return (
                <Link key={item.name} href={item.href} className={`${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}>
                  <Icon className={`${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                  } mr-3 h-5 w-5`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Users className="text-white h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Sarah's Store</p>
                <p className="text-xs font-medium text-gray-500">Business Owner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}