"use client";

import { useEffect, useState } from "react";
import {
    X,
    User,
    Calendar,
    Stethoscope,
    FileText,
    Pencil,
    Clock,
    ClipboardList,
    Activity,
    Package,
    Pill,
} from "lucide-react";
import { treatmentService } from "@/services/treatment";
import { Treatment } from "@/interface/treatment";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { GenderLabelTH } from "@/constants/gender";
import Swal from "sweetalert2";

interface ViewTreatmentModalProps {
    open: boolean;
    onClose: () => void;
    treatmentId: string | null;
    onEdit: (treatment: Treatment) => void;
    onSuccess?: () => void;
}

export default function ViewTreatmentModal({
    open,
    onClose,
    treatmentId,
    onEdit,
    onSuccess,
}: ViewTreatmentModalProps) {
    const [treatment, setTreatment] = useState<Treatment | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && treatmentId) {
            fetchTreatment();
        }
    }, [open, treatmentId]);

    const fetchTreatment = async () => {
        try {
            setLoading(true);
            const data = await treatmentService.getTreatmentById(treatmentId!);

            // Map data for UI compatibility
            if (data && data.items) {
                data.items = data.items.map((item: any) => ({
                    ...item,
                    item_type: item.service ? "service" : (item.product?.product_type || "service"),
                    item_name: item.service ? item.service.service_name : (item.product?.product_name || "ไม่มีชื่อรายการ"),
                    description: item.description || "",
                }));
            }

            setTreatment(data);
        } catch (error) {
            console.error("โหลดข้อมูลการรักษาไม่สำเร็จ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!treatmentId) return;

        const result = await Swal.fire({
            title: "ยืนยันการชำระเงิน?",
            html: `
                <div class="text-left space-y-4">
                    <p class="text-sm text-gray-600 mb-4">คุณต้องการยืนยันการชำระเงินใช่หรือไม่? ระบบจะทำการตัดสต็อกและบันทึกรายรับทันที</p>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">เลือกวิธีชำระเงิน</label>
                    <select id="payment-method-select" class="swal2-select w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none m-0">
                        <option value="cash">เงินสด (Cash)</option>
                        <option value="transfer">เงินโอน (Transfer)</option>
                        <option value="credit">บัตรเครดิต (Credit)</option>
                    </select>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ยืนยันการชำระเงิน",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
            preConfirm: () => {
                const select = document.getElementById('payment-method-select') as HTMLSelectElement;
                return select.value;
            }
        });

        if (result.isConfirmed) {
            const selectedPaymentMethod = result.value;
            try {
                setLoading(true);
                await treatmentService.updateTreatment(treatmentId, {
                    status: "completed" as any,
                    payment_method: selectedPaymentMethod,
                } as any);

                await Swal.fire({
                    title: "สำเร็จ!",
                    text: "ยืนยันการชำระเงินเรียบร้อยแล้ว",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });

                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            } catch (error) {
                console.error("ยืนยันการชำระเงินล้มเหลว", error);
                Swal.fire({
                    title: "เกิดข้อผิดพลาด",
                    text: "ไม่สามารถยืนยันการชำระเงินได้: " + String(error),
                    icon: "error",
                });
            } finally {
                setLoading(false);
            }
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col items-center text-center text-white">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-white/10">
                            <ClipboardList size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">
                            รายละเอียดการรักษา
                        </h2>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                            <span className="opacity-80">ID:</span>
                            <span>
                                {treatment?.visit_id.substring(0, 8) || "..."}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Basic Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                                <div className="space-y-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-m text-muted font-medium uppercase tracking-wider flex items-center gap-1.5">
                                            <User
                                                size={12}
                                                className="text-primary"
                                            />
                                            ผู้ป่วย
                                        </label>
                                        <p className="text-foreground font-semibold text-xl flex items-center gap-2">
                                            {treatment?.patient
                                                ? `${treatment.patient.first_name} ${treatment.patient.last_name}`
                                                : "-"}
                                            <span className="text-sm text-muted">
                                                (
                                                {treatment?.patient
                                                    ?.hospital_number || "-"}
                                                )
                                            </span>
                                        </p>
                                        <div className="space-y-1">
                                            <label className="text-m text-muted font-medium uppercase">
                                                เลขบัตรประชาชน
                                            </label>
                                            <p className="text-foreground font-medium text-m">
                                                {treatment?.patient
                                                    ?.citizen_number || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-right md:text-left">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-m text-muted font-medium uppercase tracking-wider flex items-center gap-1.5 md:justify-start">
                                            <Calendar
                                                size={12}
                                                className="text-primary"
                                            />
                                            วันที่รับบริการ
                                        </label>
                                        <p className="text-foreground font-medium">
                                            {treatment?.visit_date
                                                ? format(
                                                      new Date(
                                                          treatment.visit_date,
                                                      ),
                                                      "d MMMM yyyy HH:mm น.",
                                                      { locale: th },
                                                  )
                                                : "-"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-m text-muted font-medium uppercase">
                                            อายุ
                                        </label>
                                        <p className="text-foreground font-medium text-m">
                                            {treatment?.age_formatted || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vital Signs Section */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 -mt-9 border-b border-gray-100">
                                <div className="space-y-1">
                                    <label className="text-s text-muted font-medium uppercase">
                                        ความดันโลหิต
                                    </label>
                                    <p className="text-foreground font-medium text-sm">
                                        {treatment?.blood_pressure
                                            ? `${treatment.blood_pressure} mmHg`
                                            : "-"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-s text-muted font-medium uppercase">
                                        อัตราเต้นหัวใจ
                                    </label>
                                    <p className="text-foreground font-medium text-sm">
                                        {treatment?.heart_rate
                                            ? `${treatment.heart_rate} bpm`
                                            : "-"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-s text-muted font-medium uppercase">
                                        น้ำหนัก
                                    </label>
                                    <p className="text-foreground font-medium text-sm">
                                        {treatment?.weight
                                            ? `${treatment.weight} kg`
                                            : "-"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-s text-muted font-medium uppercase">
                                        ส่วนสูง
                                    </label>
                                    <p className="text-foreground font-medium text-sm">
                                        {treatment?.height
                                            ? `${treatment.height} cm`
                                            : "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Medical Info Section */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Stethoscope
                                                size={16}
                                                className="text-primary"
                                            />
                                            อาการเบื้องต้น
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-xl text-foreground whitespace-pre-wrap border border-gray-100 italic">
                                            {treatment?.symptom ||
                                                "ไม่ระบุอาการ"}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <FileText
                                                size={16}
                                                className="text-primary"
                                            />
                                            การวินิจฉัย
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-xl text-foreground whitespace-pre-wrap border border-gray-100 font-medium">
                                            {treatment?.diagnosis ||
                                                "ยังไม่ได้วินิจฉัย"}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <ClipboardList
                                            size={16}
                                            className="text-success"
                                        />
                                        รายการยาและค่าบริการ
                                    </h3>
                                    <div className="space-y-6">
                                        {/* Section A: Services */}
                                        {treatment?.items?.some(
                                            (i) =>
                                                i.item_type === "service",
                                        ) && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                    <Activity size={14} />{" "}
                                                    รายการบริการ
                                                </h4>
                                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50/50 text-muted font-medium border-b border-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2.5 text-left">
                                                                    รายการบริการ
                                                                </th>
                                                                <th className="px-4 py-2.5 text-right w-24">
                                                                    ราคา
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 bg-white">
                                                            {treatment.items.map(
                                                                (item, idx) =>
                                                                    (item.item_type ===
                                                                        "service") && (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="hover:bg-gray-50/30 transition-colors"
                                                                        >
                                                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                                                {
                                                                                    item.item_name
                                                                                }
                                                                                {item.description && (
                                                                                    <div className="text-xs text-muted font-normal mt-0.5 whitespace-pre-wrap">
                                                                                        {
                                                                                            item.description
                                                                                        }
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right text-gray-600">
                                                                                ฿
                                                                                {Number(
                                                                                    item.unit_price,
                                                                                ).toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Section B: Supplies */}
                                        {treatment?.items?.some(
                                            (i) => i.item_type === "supply",
                                        ) && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                    <Package size={14} />{" "}
                                                    รายการเวชภัณฑ์
                                                </h4>
                                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50/50 text-muted font-medium border-b border-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2.5 text-left">
                                                                    รายการเวชภัณฑ์
                                                                </th>
                                                                <th className="px-4 py-2.5 text-center w-24">
                                                                    จำนวน
                                                                </th>
                                                                <th className="px-4 py-2.5 text-right w-24">
                                                                    ราคา
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 bg-white">
                                                            {treatment.items.map(
                                                                (item, idx) =>
                                                                    item.item_type ===
                                                                        "supply" && (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="hover:bg-gray-50/30 transition-colors"
                                                                        >
                                                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                                                {
                                                                                    item.item_name
                                                                                }
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center text-gray-600">
                                                                                {
                                                                                    item.quantity
                                                                                }
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right text-gray-600">
                                                                                ฿
                                                                                {(
                                                                                    Number(
                                                                                        item.quantity,
                                                                                    ) *
                                                                                    Number(
                                                                                        item.unit_price,
                                                                                    )
                                                                                ).toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Section C: Medications */}
                                        {treatment?.items?.some(
                                            (i) => i.item_type === "drug",
                                        ) && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                    <Pill size={14} /> รายการยา
                                                </h4>
                                                <div className="grid gap-3">
                                                    {treatment.items.map(
                                                        (item, idx) => {
                                                            if (
                                                                item.item_type !==
                                                                "drug"
                                                            )
                                                                return null;

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex justify-between items-start"
                                                                >
                                                                    <div className="space-y-1">
                                                                        <p className="font-bold text-gray-800">
                                                                            {
                                                                                item.item_name
                                                                            }
                                                                        </p>
                                                                        {item.description && (
                                                                            <div className="inline-flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold border border-primary/10">
                                                                                <FileText
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />
                                                                                {
                                                                                    item.description
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-bold text-gray-500 uppercase">
                                                                            รวม
                                                                        </p>
                                                                        <p className="font-bold text-gray-900">
                                                                            {
                                                                                item.quantity
                                                                            }{" "}
                                                                            × ฿
                                                                            {Number(
                                                                                item.unit_price,
                                                                            ).toLocaleString()}{" "}
                                                                            = ฿
                                                                            {(
                                                                                Number(
                                                                                    item.quantity,
                                                                                ) *
                                                                                Number(
                                                                                    item.unit_price,
                                                                                )
                                                                            ).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Total Summary */}
                                        <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6 ring-4 ring-gray-100">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                                    Total Amount
                                                </p>
                                                <p className="text-xs text-gray-300">
                                                    ยอดรวมทั้งสิ้นสำหรับการรักษานี้
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-white">
                                                    ฿
                                                    {treatment?.items
                                                        ?.reduce(
                                                            (sum, item) =>
                                                                sum +
                                                                Number(
                                                                    item.quantity,
                                                                ) *
                                                                    Number(
                                                                        item.unit_price,
                                                                    ),
                                                            0,
                                                        )
                                                        .toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-muted"
                                        />
                                        บันทึกเพิ่มเติม
                                    </h3>
                                    <div className="bg-gray-50/50 p-4 rounded-xl text-muted text-sm border border-dashed border-gray-200">
                                        {treatment?.note ||
                                            "ไม่มีบันทึกเพิ่มเติม"}
                                    </div>
                                </div>
                            </div>

                            {treatment?.status === "draft" && (
                                <div className="mt-8 flex flex-col justify-center gap-4 w-full items-center">
                                    <button
                                        onClick={handleComplete}
                                        disabled={loading}
                                        className="w-full max-w-sm px-8 py-4 bg-success text-white rounded-2xl font-bold text-lg hover:bg-success-dark transition-all shadow-xl shadow-success/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Activity size={24} />
                                                ยืนยันการชำระเงินและการรักษา
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (treatment) {
                                                onEdit(treatment);
                                            }
                                        }}
                                        className="w-full max-w-sm px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-success-dark transition-all shadow-xl shadow-black/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                        disabled={!treatment}
                                    >
                                        <Pencil size={18} />
                                        แก้ไขข้อมูล
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-light px-8 py-5 flex justify-between items-center border-t border-gray-100">
                    <div className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} />
                        ข้อมูล ณ วันที่ {new Date().toLocaleDateString("th-TH")}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-medium text-foreground hover:bg-gray-100 transition-all border border-gray-200"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
