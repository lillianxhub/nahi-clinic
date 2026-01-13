export default function ChartCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
            {children}
        </div>
    );
}
