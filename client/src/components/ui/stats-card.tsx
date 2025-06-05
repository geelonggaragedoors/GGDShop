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
  iconColor = "text-white",
  iconBg = "bg-gradient-to-br from-blue-500 to-blue-600"
}: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</p>
            </div>
            <p className="text-4xl font-black text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">{value}</p>
            {description && (
              <p className="text-sm text-gray-600 font-semibold">{description}</p>
            )}
            {trend && (
              <p className={`text-sm font-bold mt-2 ${trend.includes('+') ? 'text-emerald-600' : 'text-gray-500'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/20 to-transparent rounded-full translate-y-10 -translate-x-10"></div>
        </div>
      </CardContent>
    </Card>
  );
}
