import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
