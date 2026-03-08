"use client";

import { useEffect, useState } from "react";
import {
    X,
    User,
    Phone,
    Calendar,
    Droplet,
    MapPin,
    Pencil,
    Clock,
} from "lucide-react";
import { patientService } from "@/services/patient";
import { Patient } from "@/interface/patient";
import { GenderLabelTH } from "@/constants/gender";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface ViewPatientModalProps {
    open: boolean;
    onClose: () => void;
    patientId: string | null;
    onEdit: (patient: Patient) => void;
}

export default function ViewPatientModal({
    open,
    onClose,
    patientId,
    onEdit,
}: ViewPatientModalProps) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && patientId) {
            fetchPatient();
        }
    }, [open, patientId]);

    const fetchPatient = async () => {
        try {
            setLoading(true);
            const data = await patientService.getPatientById(patientId!);
            setPatient(data);
        } catch (error) {
            console.error("โหลดข้อมูลผู้ป่วยไม่สำเร็จ", error);
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
                            <User size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">
                            {patient?.fullName || "กำลังโหลด..."}
                        </h2>
                        <div className="flex gap-2">
                            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                                <span className="opacity-80">HN:</span>
                                <span>{patient?.hospital_number || "-"}</span>
                            </div>
                            {/* <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                                <span className="opacity-80">
                                    เลขบัตรประชาชน:
                                </span>
                                <span>{patient?.citizen_number || "-"}</span>
                            </div> */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                                    <User size={18} className="text-primary" />
                                    ข้อมูลทั่วไป
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted font-medium uppercase tracking-wider">
                                            เลขบัตรประชาชน
                                        </label>
                                        <p className="text-foreground font-medium">
                                            {patient?.citizen_number || "-"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted font-medium uppercase tracking-wider">
                                            เพศ
                                        </label>
                                        <p className="text-foreground font-medium">
                                            {patient
                                                ? GenderLabelTH[patient.gender]
                                                : "-"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted font-medium uppercase tracking-wider">
                                            วันเกิด
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                size={16}
                                                className="text-primary"
                                            />
                                            <p className="text-foreground font-medium">
                                                {patient?.birthDate
                                                    ? format(
                                                          new Date(
                                                              patient.birthDate,
                                                          ),
                                                          "d MMMM yyyy",
                                                          { locale: th },
                                                      )
                                                    : "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted font-medium uppercase tracking-wider">
                                            เบอร์โทรศัพท์
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Phone
                                                size={16}
                                                className="text-primary"
                                            />
                                            <p className="text-foreground font-medium">
                                                {patient?.phone || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                                    <MapPin
                                        size={18}
                                        className="text-primary"
                                    />
                                    ที่อยู่และแพ้ยา
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted font-medium uppercase tracking-wider">
                                            ที่อยู่
                                        </label>
                                        <p className="text-foreground font-medium leading-relaxed">
                                            {patient?.address || "-"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-muted font-medium uppercase tracking-wider">
                                            ประวัติการแพ้ยา
                                        </label>
                                        <div className="flex items-start gap-2 bg-danger/5 p-3 rounded-lg border border-danger/10">
                                            <Droplet
                                                size={16}
                                                className="text-danger mt-1 shrink-0"
                                            />
                                            <p className="text-danger-dark font-semibold">
                                                {patient?.allergy ||
                                                    "ไม่มีประวัติการแพ้ยา"}
                                            </p>
                                        </div>
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
                        ข้อมูลล่าสุดเมื่อ{" "}
                        {new Date().toLocaleDateString("th-TH")}
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
                                if (patient) {
                                    onEdit(patient);
                                }
                            }}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
                            disabled={!patient}
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
