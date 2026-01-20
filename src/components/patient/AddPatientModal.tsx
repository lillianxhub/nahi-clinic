"use client";

import { useState } from "react";
import { X, User, Phone, Calendar, Droplet } from "lucide-react";
import { patientService } from "@/services/patient";
import { Patient, PatientApiResponse } from "@/interface/patient";
import { Gender, GenderLabelTH } from "@/constants/gender";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: (patient: Patient) => void;
}

export function mapPatientFromApi(
    api: PatientApiResponse
): Patient {
    return {
        id: api.patient_id,
        hospital_number: api.hospital_number,
        fullName: `${api.first_name} ${api.last_name}`,
        gender: api.gender,
        birthDate: api.birth_date,
        phone: api.phone,
        address: api.address,
        allergy: api.allergy,
    };
}

export default function AddPatientModal({
    open,
    onClose,
    onSuccess,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        gender: Gender.male,
        birth_date: "",
        phone: "",
        allergies: "",
    });

    if (!open) return null;

    const submit = async () => {
        try {
            setLoading(true);

            const patient = await patientService.createPatient({
                ...form,
                birth_date: form.birth_date || undefined,
                phone: form.phone || undefined,
                allergy: form.allergies || undefined,
            });

            onSuccess(patient);
            onClose();
        } catch (e: unknown) {
            console.error("เพิ่มผู้ป่วยไม่สำเร็จ", e);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = form.first_name.trim() && form.last_name.trim();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-5 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <User className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">เพิ่มผู้ป่วยใหม่</h2>
                            <p className="text-white/80 text-sm">กรอกข้อมูลผู้ป่วยเพื่อเพิ่มเข้าระบบ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={22} className="cursor-pointer"/>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                ชื่อ <span className="text-danger">*</span>
                            </label>
                            <input
                                placeholder="กรอกชื่อ"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={form.first_name}
                                onChange={(e) =>
                                    setForm({ ...form, first_name: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                นามสกุล <span className="text-danger">*</span>
                            </label>
                            <input
                                placeholder="กรอกนามสกุล"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={form.last_name}
                                onChange={(e) =>
                                    setForm({ ...form, last_name: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                            เพศ
                        </label>
                        <div className="relative">
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                                value={form.gender}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        gender: e.target.value as Gender,
                                    })
                                }
                            >
                                {Object.values(Gender).map((g) => (
                                    <option key={g} value={g}>
                                        {GenderLabelTH[g]}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            วันเกิด
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={form.birth_date}
                            onChange={(e) =>
                                setForm({ ...form, birth_date: e.target.value })
                            }
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Phone size={16} className="text-primary" />
                            เบอร์โทรศัพท์
                        </label>
                        <input
                            placeholder="0xx-xxx-xxxx"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                        />
                    </div>

                    {/* Allergies */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Droplet size={16} className="text-danger" />
                            ประวัติแพ้ยา/อาหาร
                        </label>
                        <textarea
                            placeholder="ระบุประวัติการแพ้ยาหรืออาหาร (ถ้ามี)"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                            rows={3}
                            value={form.allergies}
                            onChange={(e) =>
                                setForm({ ...form, allergies: e.target.value })
                            }
                        />
                        {form.allergies && (
                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                                <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-warning font-medium">มีประวัติการแพ้ โปรดตรวจสอบก่อนให้ยา</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-light px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={submit}
                        disabled={loading || !isFormValid}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                กำลังบันทึก...
                            </span>
                        ) : (
                            "บันทึกข้อมูล"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}