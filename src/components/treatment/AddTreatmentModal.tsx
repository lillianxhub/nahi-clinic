"use client";

import { useState, useEffect } from "react";
import { X, FileText, Calendar, Search, User, Plus } from "lucide-react";
import { medicineService } from "@/services/medicine";
import { Medicine } from "@/interface/medicine";
import { treatmentService } from "@/services/treatment";
import { CreateTreatmentDTO } from "@/interface/treatment";
import { patientService } from "@/services/patient";
import { Patient } from "@/interface/patient";
import { useDebounce } from "@/hooks/useDebounce";
import AddPatientModal from "../patient/AddPatientModal";

interface AddTreatmentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTreatmentModal({
    open,
    onClose,
    onSuccess,
}: AddTreatmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patient_id: "",
        visit_date: new Date().toISOString().split("T")[0],
        symptom: "",
        diagnosis: "",
    });

    // Patient Search States
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
        null,
    );
    const [openAddPatient, setOpenAddPatient] = useState(false);

    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>("cash");

    // Drug Search States
    const [drugSearchTerm, setDrugSearchTerm] = useState("");
    const debouncedDrugSearch = useDebounce(drugSearchTerm, 500);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [searchingMedicines, setSearchingMedicines] = useState(false);
    const [showDrugDropdown, setShowDrugDropdown] = useState(false);

    const totalAmount = selectedItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
    );

    useEffect(() => {
        const fetchPatients = async () => {
            if (debouncedSearch.length < 2) {
                setPatients([]);
                return;
            }

            try {
                setSearching(true);
                const res = await patientService.getPatients({
                    q: debouncedSearch,
                    pageSize: 5,
                });
                setPatients(res.data);
            } catch (error) {
                console.error("ค้นหาผู้ป่วยล้มเหลว", error);
            } finally {
                setSearching(false);
            }
        };

        fetchPatients();
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchMedicines = async () => {
            if (debouncedDrugSearch.length < 2) {
                setMedicines([]);
                return;
            }

            try {
                setSearchingMedicines(true);
                const res = await medicineService.getMedicines({
                    q: debouncedDrugSearch,
                    pageSize: 5,
                    status: "active",
                });
                setMedicines(res.data);
            } catch (error) {
                console.error("ค้นหายาล้มเหลว", error);
            } finally {
                setSearchingMedicines(false);
            }
        };

        fetchMedicines();
    }, [debouncedDrugSearch]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setFormData((prev) => ({ ...prev, patient_id: patient.patient_id }));
        setSearchTerm(`${patient.fullName} (${patient.hospital_number})`);
        setShowDropdown(false);
    };

    const handleSelectMedicine = (medicine: Medicine) => {
        const existingItem = selectedItems.find(
            (item) => item.drug_id === medicine.drug_id,
        );

        if (existingItem) {
            setSelectedItems(
                selectedItems.map((item) =>
                    item.drug_id === medicine.drug_id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                ),
            );
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    item_type: "drug",
                    drug_id: medicine.drug_id,
                    description: medicine.drug_name,
                    quantity: 1,
                    unit_price: medicine.sell_price,
                },
            ]);
        }
        setDrugSearchTerm("");
        setShowDrugDropdown(false);
    };

    const handleRemoveItem = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, quantity: number) => {
        if (quantity < 1) return;
        const newItems = [...selectedItems];
        newItems[index].quantity = quantity;
        setSelectedItems(newItems);
    };

    const handleAddPatientSuccess = (newPatient: Patient) => {
        handleSelectPatient(newPatient);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            await treatmentService.createTreatment({
                ...formData,
                payment_method: paymentMethod,
                items: selectedItems,
            } as CreateTreatmentDTO);

            // Reset form
            setFormData({
                patient_id: "",
                visit_date: new Date().toISOString().split("T")[0],
                symptom: "",
                diagnosis: "",
            });
            setSelectedPatient(null);
            setSearchTerm("");
            setSelectedItems([]);
            setPaymentMethod("cash");

            onSuccess();
            onClose();
        } catch (error) {
            console.error("สร้างการรักษาไม่สำเร็จ", error);
            alert("เกิดข้อผิดพลาด: " + String(error));
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isFormValid =
        formData.patient_id.trim() &&
        formData.visit_date &&
        formData.symptom.trim() &&
        formData.diagnosis.trim();

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div
                    className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with gradient */}
                    <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FileText className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    บันทึกการรักษา
                                </h2>
                                <p className="text-white/80 text-sm">
                                    กรอกข้อมูลการรักษาผู้ป่วย
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

                    {/* Form Content */}
                    <form
                        onSubmit={handleSubmit}
                        className="p-6 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto"
                    >
                        {/* Patient Name Search */}
                        <div className="space-y-1.5 relative">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <User size={16} className="text-primary" />
                                ชื่อผู้ป่วย{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อหรือรหัสผู้ป่วย..."
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowDropdown(true);
                                        if (
                                            selectedPatient &&
                                            e.target.value !==
                                                selectedPatient.fullName
                                        ) {
                                            setSelectedPatient(null);
                                            setFormData((prev) => ({
                                                ...prev,
                                                patient_id: "",
                                            }));
                                        }
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    required
                                />
                            </div>

                            {/* Patient Dropdown */}
                            {showDropdown &&
                                (searchTerm.length >= 2 ||
                                    patients.length > 0) && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {searching ? (
                                            <div className="p-4 text-center text-muted text-sm">
                                                กำลังค้นหา...
                                            </div>
                                        ) : patients.length > 0 ? (
                                            <div className="py-1">
                                                {patients.map((p) => (
                                                    <button
                                                        key={p.patient_id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                                        onClick={() =>
                                                            handleSelectPatient(
                                                                p,
                                                            )
                                                        }
                                                    >
                                                        <div>
                                                            <div className="font-medium text-foreground group-hover:text-primary">
                                                                {p.fullName}
                                                            </div>
                                                            <div className="text-xs text-muted">
                                                                HN:{" "}
                                                                {
                                                                    p.hospital_number
                                                                }{" "}
                                                                |{" "}
                                                                {p.phone ||
                                                                    "ไม่มีเบอร์โทร"}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-muted text-sm">
                                                ไม่พบข้อมูลผู้ป่วย
                                            </div>
                                        )}

                                        {/* Add New Patient Option */}
                                        <div className="border-t border-gray-100 p-1">
                                            <button
                                                type="button"
                                                className="w-full flex items-center justify-center gap-2 py-2 text-primary hover:bg-primary/5 rounded-md font-medium text-sm transition-colors"
                                                onClick={() => {
                                                    setOpenAddPatient(true);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <Plus size={16} />
                                                เพิ่มผู้ป่วยใหม่
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Visit Date */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                วันที่ <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                name="visit_date"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={formData.visit_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Symptom */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                อาการ <span className="text-danger">*</span>
                            </label>
                            <textarea
                                name="symptom"
                                placeholder="อธิบายอาการของผู้ป่วย"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                rows={3}
                                value={formData.symptom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Diagnosis */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                การวินิจฉัย{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <textarea
                                name="diagnosis"
                                placeholder="ผลการวินิจฉัยของแพทย์"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                rows={3}
                                value={formData.diagnosis}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-3 pt-4 border-t">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Plus size={18} /> รายการยาและค่าบริการ
                            </h3>

                            {/* ส่วนค้นหาและเลือกยา/บริการ */}
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อยาหรือบริการ..."
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={drugSearchTerm}
                                    onChange={(e) => {
                                        setDrugSearchTerm(e.target.value);
                                        setShowDrugDropdown(true);
                                    }}
                                    onFocus={() => setShowDrugDropdown(true)}
                                />

                                {/* Drug Dropdown */}
                                {showDrugDropdown &&
                                    (drugSearchTerm.length >= 2 ||
                                        medicines.length > 0) && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {searchingMedicines ? (
                                                <div className="p-4 text-center text-muted text-sm">
                                                    กำลังค้นหา...
                                                </div>
                                            ) : medicines.length > 0 ? (
                                                <div className="py-1">
                                                    {medicines.map((m) => (
                                                        <button
                                                            key={m.drug_id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                                            onClick={() =>
                                                                handleSelectMedicine(
                                                                    m,
                                                                )
                                                            }
                                                        >
                                                            <div>
                                                                <div className="font-medium text-foreground group-hover:text-primary">
                                                                    {
                                                                        m.drug_name
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-muted">
                                                                    ราคา:{" "}
                                                                    {m.sell_price.toLocaleString()}{" "}
                                                                    บาท |
                                                                    คงเหลือ:{" "}
                                                                    {m.stock
                                                                        ?.total ??
                                                                        0}{" "}
                                                                    {m.unit}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-muted text-sm">
                                                    ไม่พบข้อมูลยา/บริการ
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* ตารางสรุปรายการ */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-muted uppercase text-xs">
                                            <th className="text-left py-2 font-semibold">
                                                รายการ
                                            </th>
                                            <th className="text-center py-2 font-semibold w-24">
                                                จำนวน
                                            </th>
                                            <th className="text-right py-2 font-semibold w-24">
                                                ราคา/หน่วย
                                            </th>
                                            <th className="text-right py-2 font-semibold w-24">
                                                รวม
                                            </th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedItems.length > 0 ? (
                                            selectedItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="py-3 font-medium">
                                                        {item.description}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateQuantity(
                                                                        index,
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 1,
                                                                    )
                                                                }
                                                                className="w-16 border rounded text-center py-1"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        {item.unit_price.toLocaleString()}
                                                    </td>
                                                    <td className="py-3 text-right font-semibold">
                                                        {(
                                                            item.quantity *
                                                            item.unit_price
                                                        ).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveItem(
                                                                    index,
                                                                )
                                                            }
                                                            className="text-danger hover:text-danger-dark p-1"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-8 text-center text-muted italic"
                                                >
                                                    ยังไม่มีรายการ
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* เลือกวิธีชำระเงิน */}
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <select
                                    value={paymentMethod}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                    className="border rounded px-2 py-1"
                                >
                                    <option value="cash">เงินสด</option>
                                    <option value="transfer">โอนเงิน</option>
                                    <option value="credit">บัตรเครดิต</option>
                                </select>
                                <div className="text-lg font-bold text-primary">
                                    รวมทั้งสิ้น: {totalAmount.toLocaleString()}{" "}
                                    บาท
                                </div>
                            </div>
                        </div>
                    </form>

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
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading || !isFormValid}
                            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
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

            <AddPatientModal
                open={openAddPatient}
                onClose={() => setOpenAddPatient(false)}
                onSuccess={handleAddPatientSuccess}
            />
        </>
    );
}
