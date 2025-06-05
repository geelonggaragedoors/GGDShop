import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-100"
}: StatsCardProps) {
  return (
    <Card className="bg-white rounded-xl shadow-sm border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
            {trend && (
              <p className={`text-sm ${trend.includes('+') ? 'text-green-600' : 'text-gray-500'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
