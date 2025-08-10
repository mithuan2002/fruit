import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description: string;
  onCreateClick?: () => void;
  createButtonText?: string;
  showCreateButton?: boolean;
}

export default function Header({ 
  title, 
  description, 
  onCreateClick, 
  createButtonText = "New Campaign",
  showCreateButton = true 
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-error rounded-full flex items-center justify-center text-xs text-white">
                  3
                </span>
              </button>
            </div>
            {/* Quick Actions */}
            {showCreateButton && onCreateClick && (
              <Button onClick={onCreateClick} className="bg-primary hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                {createButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
