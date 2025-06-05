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
  iconBg = "bg-blue-50"
}: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {description && (
              <p className="text-sm text-gray-500 font-medium">{description}</p>
            )}
            {trend && (
              <p className={`text-sm font-semibold mt-2 ${trend.includes('+') ? 'text-emerald-600' : 'text-gray-500'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-100/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        </div>
      </CardContent>
    </Card>
  );
}
