import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";

export default function RevenueExpenseChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                    type="monotone"
                    dataKey="รายรับ"
                    stroke="#3F7C87"
                    fill="#3F7C8720"
                />
                <Area
                    type="monotone"
                    dataKey="รายจ่าย"
                    stroke="#A5DBDD"
                    fill="#A5DBDD20"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
