import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    PieLabelRenderProps
} from "recharts";

const renderLabel = ({ percent }: PieLabelRenderProps) =>
    percent ? `${Math.round(percent * 100)}%` : "";

export default function PieWithLegend({
    title,
    data,
}: {
    title?: string;
    data: { name?: string; value?: number; color?: string }[];
}) {
    return (
        <>
            <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>

            <div className="flex gap-6">
                <ResponsiveContainer width="50%" height={260}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            innerRadius={50}
                            outerRadius={80}
                            label={renderLabel}
                            labelLine={false}
                        >
                            {data.map((d, i) => (
                                <Cell key={i} fill={d.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v?: number) => v ? `${v}%` : ""} />
                    </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col justify-center gap-3">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                            <span className="text-sm text-muted">{item.name}</span>
                            <span className="ml-auto font-medium text-primary">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
