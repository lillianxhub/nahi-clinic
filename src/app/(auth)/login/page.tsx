"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Toast, { ToastType } from "@/components/Toast";
import { login } from "@/services/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
    } | null>(null);

    const handleLogin = async () => {
        setLoading(true);

        try {
            await login({ username, password });

            router.push("/dashboard")
        } catch (error: unknown) {
            let message = "เกิดข้อผิดพลาด";

            if (error instanceof Error) {
                message = error.message;
            }

            setToast({
                message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <div className="w-full max-w-md px-4">
                <h1 className="text-white text-center text-2xl font-semibold mb-8">
                    เข้าสู่ระบบ
                </h1>

                {/* Username */}
                <input
                    type="text"
                    placeholder="ชื่อผู้ใช้"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full mb-4 rounded-lg px-4 py-3 bg-light text-black placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary"
                />

                {/* Password */}
                <div className="relative mb-6">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="รหัสผ่าน"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg px-4 py-3 bg-light text-black placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary"
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer"
                    >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading || !username || !password}
                    className="cursor-pointer w-full rounded-lg py-3 bg-secondary text-black font-semibold hover:opacity-90 transition"
                >
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

            </div>
            {
                toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )
            }
        </>
    );
}
