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
    Pill,
} from "lucide-react";
import { treatmentService } from "@/services/treatment";
import { Treatment } from "@/interface/treatment";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface ViewTreatmentModalProps {
    open: boolean;
    onClose: () => void;
    treatmentId: string | null;
    onEdit: (treatment: Treatment) => void;
}

export default function ViewTreatmentModal({
    open,
    onClose,
    treatmentId,
    onEdit,
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
            setTreatment(data);
        } catch (error) {
            console.error("โหลดข้อมูลการรักษาไม่สำเร็จ", error);
        } finally {
            setLoading(false);
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
                                        <p className="text-foreground font-semibold text-xl">
                                            {treatment?.patient
                                                ? `${treatment.patient.first_name} ${treatment.patient.last_name}`
                                                : "-"}
                                        </p>
                                        <p className="text-m text-muted">
                                            HN:{" "}
                                            {treatment?.patient
                                                ?.hospital_number || "-"}
                                        </p>
                                        <div className="space-y-1">
                                            <label className="text-m text-muted font-medium uppercase">
                                                อายุ
                                            </label>
                                            <p className="text-foreground font-medium text-m">
                                                {treatment?.age_formatted ||
                                                    "-"}
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
                                        {/* Section A: Procedures */}
                                        {treatment?.visitDetails?.some(
                                            (i) =>
                                                i.item_type === "service" ||
                                                i.item_type === "procedure",
                                        ) && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                    <Activity size={14} />{" "}
                                                    รายการหัตถการและบริการ
                                                </h4>
                                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50/50 text-muted font-medium border-b border-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2.5 text-left">
                                                                    รายการหัตถการ/บริการ
                                                                </th>
                                                                <th className="px-4 py-2.5 text-right w-24">
                                                                    ราคา
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 bg-white">
                                                            {treatment.visitDetails.map(
                                                                (item, idx) =>
                                                                    (item.item_type ===
                                                                        "service" ||
                                                                        item.item_type ===
                                                                            "procedure") && (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="hover:bg-gray-50/30 transition-colors"
                                                                        >
                                                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                                                {
                                                                                    item.description
                                                                                }
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

                                        {/* Section B: Medications */}
                                        {treatment?.visitDetails?.some(
                                            (i) => i.item_type === "drug",
                                        ) && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                                    <Pill size={14} /> รายการยา
                                                </h4>
                                                <div className="grid gap-3">
                                                    {treatment.visitDetails.map(
                                                        (item, idx) => {
                                                            if (
                                                                item.item_type !==
                                                                "drug"
                                                            )
                                                                return null;

                                                            let description =
                                                                item.description ||
                                                                "";
                                                            let instruction =
                                                                "";
                                                            if (
                                                                description.includes(
                                                                    " : ",
                                                                )
                                                            ) {
                                                                const parts =
                                                                    description.split(
                                                                        " : ",
                                                                    );
                                                                description =
                                                                    parts[0];
                                                                instruction =
                                                                    parts
                                                                        .slice(
                                                                            1,
                                                                        )
                                                                        .join(
                                                                            " : ",
                                                                        );
                                                            }

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex justify-between items-start"
                                                                >
                                                                    <div className="space-y-1">
                                                                        <p className="font-bold text-gray-800">
                                                                            {
                                                                                description
                                                                            }
                                                                        </p>
                                                                        {instruction && (
                                                                            <div className="inline-flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold border border-primary/10">
                                                                                <FileText
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />{" "}
                                                                                {
                                                                                    instruction
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
                                                    {treatment?.visitDetails
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
                        <button
                            onClick={() => {
                                if (treatment) {
                                    onEdit(treatment);
                                }
                            }}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                            disabled={!treatment}
                        >
                            <Pencil size={18} />
                            แก้ไขข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
