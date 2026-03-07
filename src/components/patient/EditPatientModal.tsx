"use client";

import { useEffect, useState } from "react";
import { X, User, Phone, Calendar, Droplet, MapPin, Save } from "lucide-react";
import { patientService } from "@/services/patient";
import { Patient, CreatePatientPayload } from "@/interface/patient";
import { Gender } from "@/constants/gender";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import { parseISO, format } from "date-fns";

interface EditPatientModalProps {
    open: boolean;
    onClose: () => void;
    patient: Patient | null;
    onSuccess: () => void;
}

export default function EditPatientModal({
    open,
    onClose,
    patient,
    onSuccess,
}: EditPatientModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<CreatePatientPayload>>({
        first_name: "",
        last_name: "",
        citizen_number: "",
        gender: Gender.male,
        phone: "",
        address: undefined,
        birth_date: "",
        allergy: "",
    });

    useEffect(() => {
        if (open && patient) {
            setFormData({
                first_name: patient.first_name || "",
                last_name: patient.last_name || "",
                citizen_number: patient.citizen_number || "",
                gender: patient.gender,
                phone: patient.phone || "",
                address: patient.address || "",
                birth_date: patient.birthDate
                    ? patient.birthDate.split("T")[0]
                    : "",
                allergy: patient.allergy || "",
            });
        }
    }, [open, patient]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patient) return;

        try {
            setLoading(true);
            await patientService.updatePatient(patient.patient_id, formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("แก้ไขข้อมูลผู้ป่วยไม่สำเร็จ", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-card w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <User className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                แก้ไขข้อมูลผู้ป่วย
                            </h2>
                            <p className="text-white/80 text-sm">
                                ปรับปรุงข้อมูลส่วนตัวของผู้ป่วย
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={22} className="cursor-pointer" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    ชื่อจริง{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    นามสกุล{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    เพศ <span className="text-danger">*</span>
                                </label>
                                <select
                                    name="gender"
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value={Gender.male}>ชาย</option>
                                    <option value={Gender.female}>หญิง</option>
                                    <option value={Gender.other}>อื่นๆ</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Phone size={16} className="text-primary" />
                                    เบอร์โทรศัพท์
                                </label>
                                <div className="relative">
                                    <Phone
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                    />
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Citizen Number */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                เลขบัตรประชาชน
                            </label>
                            <input
                                type="text"
                                required
                                name="citizen_number"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.citizen_number}
                                onChange={handleChange}
                            />
                        </div>

                        <DatePickerSimple
                            date={
                                formData.birth_date
                                    ? parseISO(formData.birth_date)
                                    : undefined
                            }
                            setDate={(date) =>
                                setFormData({
                                    ...formData,
                                    birth_date: date
                                        ? format(date, "yyyy-MM-dd")
                                        : "",
                                })
                            }
                            label="วันเกิด"
                            placeholder="เลือกวันเกิด"
                        />

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <MapPin size={16} className="text-primary" />
                                ที่อยู่
                            </label>
                            <textarea
                                name="address"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Droplet size={16} className="text-danger" />
                                ประวัติการแพ้ยา
                            </label>
                            <textarea
                                name="allergy"
                                placeholder="ระบุการแพ้ยา (ถ้ามี)"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent transition-all resize-none bg-danger/5 text-danger-dark font-medium"
                                rows={2}
                                value={formData.allergy}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="bg-light px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/30"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    กำลังบันทึก...
                                </span>
                            ) : (
                                <>
                                    <Save size={18} />
                                    บันทึกการแก้ไข
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
