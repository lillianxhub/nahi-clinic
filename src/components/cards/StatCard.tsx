import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: any;
    title: string;
    value: string;
    subtitle?: string;
    trend?: "up" | "down";
    trendValue?: string;
    color?: string;
}

export default function StatCard({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendValue,
    color,
}: StatCardProps) {
    return (
        <Card className="rounded-xl border shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row justify-between pb-2 space-y-0">
                <div
                    className="rounded-xl p-3"
                    style={color ? { backgroundColor: `${color}10` } : {}}
                >
                    <Icon
                        className={cn(!color && "text-primary")}
                        size={24}
                        style={color ? { color } : {}}
                    />
                </div>
                {trend && (
                    <div
                        className={cn(
                            "flex items-center gap-1 text-sm font-medium",
                            trend === "up" ? "text-green-600" : "text-red-600",
                        )}
                    >
                        {trend === "up" ? (
                            <TrendingUp size={16} />
                        ) : (
                            <TrendingDown size={16} />
                        )}
                        {trendValue}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-muted text-sm mb-1">{title}</p>
                <CardTitle
                    className="text-3xl font-bold mb-1"
                    style={color ? { color } : {}}
                >
                    {value}
                </CardTitle>
                {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}
