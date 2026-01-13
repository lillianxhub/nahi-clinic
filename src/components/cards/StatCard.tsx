import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
    icon: any;
    title: string;
    value: string;
    trend?: "up" | "down";
    trendValue?: string;
}

export default function StatCard({
    icon: Icon,
    title,
    value,
    trend,
    trendValue,
}: StatCardProps) {
    return (
        <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex justify-between mb-4">
                <Icon className="text-primary" />
                {trend && (
                    <div
                        className={`flex items-center gap-1 text-sm ${trend === "up" ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-muted text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-primary">{value}</h3>
        </div>
    );
}
