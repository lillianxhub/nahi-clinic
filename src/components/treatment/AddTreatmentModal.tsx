"use client";

import { useState, useEffect } from "react";
import {
    X,
    FileText,
    Calendar,
    Search,
    User,
    Plus,
    Clock,
    Activity,
    Pill,
    Trash2,
    Edit3,
    AlertCircle,
    Package,
} from "lucide-react";
import { medicineService } from "@/services/medicine";
import { Medicine } from "@/interface/medicine";
import { treatmentService } from "@/services/treatment";
import { CreateTreatmentDTO } from "@/interface/treatment";
import { patientService } from "@/services/patient";
import { Patient } from "@/interface/patient";
import { useDebounce } from "@/hooks/useDebounce";
import AddPatientModal from "../patient/AddPatientModal";
import { procedureService } from "@/services/procedure";
import { Procedure } from "@/interface/procedure";
import AddProcedureModal from "./AddProcedureModal";
import { formatLocalDate, getLocalTime } from "@/utils/dateUtils";
import UnifiedDrugDropdown from "../UnifiedDrugDropdown";
import { DateTimePicker24hour } from "@/components/ui/datetime-picker";

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
    const now = new Date();
    const [formData, setFormData] = useState({
        patient_id: "",
        visit_date: formatLocalDate(now),
        hour: getLocalTime(now).hour,
        minute: getLocalTime(now).minute,
        symptom: "",
        diagnosis: "",
        blood_pressure: "",
        heart_rate: "",
        weight: "",
        height: "",
        note: "",
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

    // Procedure Search States
    const [procedureSearchTerm, setProcedureSearchTerm] = useState("");
    const debouncedProcedureSearch = useDebounce(procedureSearchTerm, 500);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [searchingProcedures, setSearchingProcedures] = useState(false);
    const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);
    const [openAddProcedure, setOpenAddProcedure] = useState(false);

    // Supply Search States
    const [supplySearchTerm, setSupplySearchTerm] = useState("");
    const debouncedSupplySearch = useDebounce(supplySearchTerm, 500);
    const [supplies, setSupplies] = useState<Medicine[]>([]);
    const [searchingSupplies, setSearchingSupplies] = useState(false);
    const [showSupplyDropdown, setShowSupplyDropdown] = useState(false);

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
                try {
                    setSearchingMedicines(true);
                    const res = await medicineService.getMedicines({
                        pageSize: 10,
                        status: "active",
                    });
                    setMedicines(res.data);
                } catch (error) {
                    console.error("ดึงข้อมูลยาล้มเหลว", error);
                } finally {
                    setSearchingMedicines(false);
                }
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

    useEffect(() => {
        const fetchProcedures = async () => {
            if (debouncedProcedureSearch.length < 2) {
                // Fetch all active procedures if search is empty or short?
                // Or just show nothing. User said "dropdown".
                // Usually we want to show some initial options if it's a small list.
                try {
                    setSearchingProcedures(true);
                    const res = await procedureService.getProcedures({
                        pageSize: 10,
                    });
                    setProcedures(res.data);
                } catch (error) {
                    console.error("ดึงข้อมูลหัตถการล้มเหลว", error);
                } finally {
                    setSearchingProcedures(false);
                }
                return;
            }

            try {
                setSearchingProcedures(true);
                const res = await procedureService.getProcedures({
                    q: debouncedProcedureSearch,
                    pageSize: 10,
                });
                setProcedures(res.data);
            } catch (error) {
                console.error("ค้นหาหัตถการล้มเหลว", error);
            } finally {
                setSearchingProcedures(false);
            }
        };

        fetchProcedures();
    }, [debouncedProcedureSearch]);

    useEffect(() => {
        const fetchSupplies = async () => {
            if (debouncedSupplySearch.length < 2) {
                try {
                    setSearchingSupplies(true);
                    const res = await medicineService.getSupplies({
                        pageSize: 10,
                        status: "active",
                    });
                    setSupplies(res.data);
                } catch (error) {
                    console.error("ดึงข้อมูลเวชภัณฑ์ล้มเหลว", error);
                } finally {
                    setSearchingSupplies(false);
                }
                return;
            }

            try {
                setSearchingSupplies(true);
                const res = await medicineService.getSupplies({
                    q: debouncedSupplySearch,
                    pageSize: 5,
                    status: "active",
                });
                setSupplies(res.data);
            } catch (error) {
                console.error("ค้นหาเวชภัณฑ์ล้มเหลว", error);
            } finally {
                setSearchingSupplies(false);
            }
        };

        fetchSupplies();
    }, [debouncedSupplySearch]);

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
                    unit_price: Number(medicine.sell_price),
                    instruction: "",
                },
            ]);
        }
        setDrugSearchTerm("");
        setShowDrugDropdown(false);
    };

    const handleSelectProcedure = (procedure: Procedure) => {
        setSelectedItems([
            ...selectedItems,
            {
                item_type: "service",
                procedure_id: procedure.procedure_id,
                name: procedure.procedure_name,
                description: procedure.procedure_name,
                quantity: 1,
                unit_price: Number(procedure.price),
                instruction: "",
            },
        ]);
        setProcedureSearchTerm("");
        setShowProcedureDropdown(false);
    };

    const handleSelectSupply = (supply: Medicine) => {
        const existingItem = selectedItems.find(
            (item) => item.drug_id === supply.drug_id,
        );

        if (existingItem) {
            setSelectedItems(
                selectedItems.map((item) =>
                    item.drug_id === supply.drug_id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                ),
            );
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    item_type: "supply",
                    drug_id: supply.drug_id,
                    description: supply.drug_name,
                    quantity: 1,
                    unit_price: Number(supply.sell_price),
                    instruction: "",
                },
            ]);
        }
        setSupplySearchTerm("");
        setShowSupplyDropdown(false);
    };

    const handleAddService = (
        name: string,
        price: number,
        instruction?: string,
        type: "service" | "procedure" = "service",
    ) => {
        setSelectedItems([
            ...selectedItems,
            {
                item_type: type,
                name: name,
                description: name,
                quantity: 1,
                unit_price: price,
                instruction: instruction || "",
            },
        ]);
    };

    const handleUpdateDescription = (index: number, description: string) => {
        const newItems = [...selectedItems];
        newItems[index].description = description;
        setSelectedItems(newItems);
    };

    const handleUpdatePrice = (index: number, price: number) => {
        setSelectedItems(
            selectedItems.map((item, idx) =>
                idx === index ? { ...item, unit_price: price } : item,
            ),
        );
    };

    const handleUpdateInstruction = (index: number, instruction: string) => {
        const newItems = [...selectedItems];
        newItems[index].instruction = instruction;
        setSelectedItems(newItems);
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

            const isoDateTime = new Date(
                `${formData.visit_date}T${formData.hour}:${formData.minute}:00`,
            ).toISOString();

            await treatmentService.createTreatment({
                ...formData,
                visit_date: isoDateTime,
                payment_method: paymentMethod,
                items: selectedItems.map((item) => ({
                    ...item,
                    product_id: item.drug_id || item.procedure_id,
                    description:
                        (item.item_type === "drug" ||
                            item.item_type === "service" ||
                            item.item_type === "supply") &&
                        item.instruction
                            ? `${item.description} : ${item.instruction}`
                            : item.description,
                })),
                heart_rate: formData.heart_rate
                    ? Number(formData.heart_rate)
                    : undefined,
                weight: formData.weight ? Number(formData.weight) : undefined,
                height: formData.height ? Number(formData.height) : undefined,
            } as CreateTreatmentDTO);

            // Reset form
            const resetNow = new Date();
            setFormData({
                patient_id: "",
                visit_date: formatLocalDate(resetNow),
                hour: getLocalTime(resetNow).hour,
                minute: getLocalTime(resetNow).minute,
                symptom: "",
                diagnosis: "",
                blood_pressure: "",
                heart_rate: "",
                weight: "",
                height: "",
                note: "",
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

    const isBpValid = (bp: string) => !bp || /^\d+\/\d+$/.test(bp);

    const isFormValid =
        formData.patient_id.trim() &&
        formData.visit_date &&
        formData.symptom.trim() &&
        formData.diagnosis.trim() &&
        isBpValid(formData.blood_pressure);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div
                    className="bg-card w-full max-w-4xl lg:max-w-5xl rounded-2xl shadow-2xl overflow-hidden"
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
                        className="p-6 lg:p-8 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start max-h-[calc(100vh-200px)] overflow-y-auto"
                    >
                        {/* Left Column: Clinical Info */}
                        <div className="space-y-5">
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
                                        onBlur={() =>
                                            setTimeout(() => {
                                                setShowDropdown(false);
                                            }, 200)
                                        }
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
                                                                    | เลขบัตร:{" "}
                                                                    {p.citizen_number ||
                                                                        "-"}{" "}
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

                            {/* Allergy Alert */}
                            {selectedPatient?.allergy?.trim() &&
                                selectedPatient.allergy.trim() !== "ไม่มี" &&
                                selectedPatient.allergy.trim() !== "-" && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <AlertCircle
                                            className="text-red-500 shrink-0 mt-0.5"
                                            size={18}
                                        />
                                        <div>
                                            <p className="text-red-800 text-xs font-bold uppercase tracking-wider mb-0.5">
                                                ประวัติการแพ้ยา/แพ้อื่นๆ
                                            </p>
                                            <p className="text-red-700 sm:text-sm text-xs font-medium">
                                                {selectedPatient.allergy}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {/* Visit Date & Time */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FileText
                                        size={16}
                                        className="text-primary"
                                    />
                                    วันที่และเวลา{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <DateTimePicker24hour
                                    date={
                                        new Date(
                                            `${formData.visit_date}T${formData.hour}:${formData.minute}:00`,
                                        )
                                    }
                                    setDate={(date) => {
                                        if (date) {
                                            setFormData((prev) => ({
                                                ...prev,
                                                visit_date:
                                                    formatLocalDate(date),
                                                hour: date
                                                    .getHours()
                                                    .toString()
                                                    .padStart(2, "0"),
                                                minute: date
                                                    .getMinutes()
                                                    .toString()
                                                    .padStart(2, "0"),
                                            }));
                                        }
                                    }}
                                />
                            </div>

                            {/* Symptom */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FileText
                                        size={16}
                                        className="text-primary"
                                    />
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

                            {/* Vital Signs Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Blood Pressure */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-primary"
                                        />
                                        ความดันโลหิต (mmHg)
                                    </label>
                                    <input
                                        type="text"
                                        name="blood_pressure"
                                        placeholder="เช่น 120/80"
                                        className={`w-full border rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 transition-all ${
                                            formData.blood_pressure &&
                                            !isBpValid(formData.blood_pressure)
                                                ? "border-danger focus:ring-danger/20"
                                                : "border-gray-300 focus:ring-primary focus:border-transparent"
                                        }`}
                                        value={formData.blood_pressure}
                                        onChange={handleChange}
                                    />
                                    {formData.blood_pressure &&
                                        !isBpValid(formData.blood_pressure) && (
                                            <p className="text-[10px] text-danger mt-1">
                                                รูปแบบไม่ถูกต้อง (เช่น 120/80)
                                            </p>
                                        )}
                                </div>

                                {/* Heart Rate */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-primary"
                                        />
                                        อัตราการเต้นหัวใจ (bpm)
                                    </label>
                                    <input
                                        type="number"
                                        name="heart_rate"
                                        placeholder="เช่น 80"
                                        min="1"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.heart_rate}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Weight */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-primary"
                                        />
                                        น้ำหนัก (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="weight"
                                        placeholder="เช่น 65.5"
                                        min="0.1"
                                        step="0.1"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.weight}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Height */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-primary"
                                        />
                                        ส่วนสูง (cm)
                                    </label>
                                    <input
                                        type="number"
                                        name="height"
                                        placeholder="เช่น 170"
                                        min="1"
                                        step="0.1"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.height}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Diagnosis */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FileText
                                        size={16}
                                        className="text-primary"
                                    />
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

                            {/* Note */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FileText
                                        size={16}
                                        className="text-muted"
                                    />
                                    บันทึกเพิ่มเติม
                                </label>
                                <textarea
                                    name="note"
                                    placeholder="บันทึกข้อมูลเพิ่มเติม (ถ้ามี)"
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                    rows={2}
                                    value={formData.note}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        {/* Right Column: Treatment Items & Payment */}
                        <div className="space-y-6">
                            {/* Section A: Procedures */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Activity
                                            size={18}
                                            className="text-primary"
                                        />
                                        รายการหัตถการ
                                    </h3>
                                </div>

                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาหรือเลือกหัตถการ..."
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                                        value={procedureSearchTerm}
                                        onChange={(e) => {
                                            setProcedureSearchTerm(
                                                e.target.value,
                                            );
                                            setShowProcedureDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowProcedureDropdown(true)
                                        }
                                        onBlur={() =>
                                            setTimeout(() => {
                                                setShowProcedureDropdown(false);
                                            }, 200)
                                        }
                                    />
                                    {showProcedureDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {searchingProcedures ? (
                                                <div className="p-4 text-center text-muted text-sm">
                                                    กำลังค้นหา...
                                                </div>
                                            ) : procedures.length > 0 ? (
                                                <div className="py-1">
                                                    {procedures.map((p) => (
                                                        <button
                                                            key={p.procedure_id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                                            onClick={() =>
                                                                handleSelectProcedure(
                                                                    p,
                                                                )
                                                            }
                                                        >
                                                            <div>
                                                                <div className="font-medium text-foreground group-hover:text-primary">
                                                                    {
                                                                        p.procedure_name
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-muted">
                                                                    ฿
                                                                    {Number(
                                                                        p.price,
                                                                    ).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <Plus
                                                                size={14}
                                                                className="text-gray-300 group-hover:text-primary"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-muted text-sm">
                                                    ไม่พบข้อมูลหัตถการ
                                                </div>
                                            )}

                                            <div className="border-t border-gray-100 p-1">
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-center gap-2 py-2 text-primary hover:bg-primary/5 rounded-md font-medium text-sm transition-colors"
                                                    onClick={() => {
                                                        setOpenAddProcedure(
                                                            true,
                                                        );
                                                        setShowProcedureDropdown(
                                                            false,
                                                        );
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                    สร้างหัตถการใหม่
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedItems.filter(
                                    (i) => i.item_type === "service",
                                ).length > 0 && (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-semibold">
                                                        หัตถการ
                                                    </th>
                                                    <th className="text-right px-4 py-2 font-semibold w-24">
                                                        ราคา
                                                    </th>
                                                    <th className="w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedItems.map(
                                                    (item, index) =>
                                                        item.item_type ===
                                                            "service" && (
                                                            <tr
                                                                key={index}
                                                                className="bg-white"
                                                            >
                                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                                    <div className="space-y-1">
                                                                        <div className="font-bold text-gray-800">
                                                                            {item.name ||
                                                                                item.description}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Edit3
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-gray-400"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="รายละเอียดเพิ่มเติม (เช่น ตำแหน่ง)"
                                                                                value={
                                                                                    item.instruction ||
                                                                                    ""
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    handleUpdateInstruction(
                                                                                        index,
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none text-xs text-gray-600 transition-all p-0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <span className="text-gray-400 text-xs">
                                                                            ฿
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={
                                                                                item.unit_price
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleUpdatePrice(
                                                                                    index,
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                )
                                                                            }
                                                                            className="w-20 text-right bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none font-medium text-gray-800 transition-all p-0"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleRemoveItem(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Section B: Supplies */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Package
                                        size={18}
                                        className="text-primary"
                                    />
                                    รายการเวชภัณฑ์
                                </h3>

                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาเวชภัณฑ์..."
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 h-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={supplySearchTerm}
                                        onChange={(e) => {
                                            setSupplySearchTerm(e.target.value);
                                            setShowSupplyDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowSupplyDropdown(true)
                                        }
                                        onBlur={() =>
                                            setTimeout(() => {
                                                setShowSupplyDropdown(false);
                                            }, 200)
                                        }
                                    />

                                    <UnifiedDrugDropdown
                                        isOpen={showSupplyDropdown}
                                        searchTerm={supplySearchTerm}
                                        items={supplies}
                                        isSearching={searchingSupplies}
                                        displayMode="inventory"
                                        onSelect={handleSelectSupply}
                                    />
                                </div>

                                {selectedItems.filter(
                                    (i) => i.item_type === "supply",
                                ).length > 0 && (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-semibold">
                                                        เวชภัณฑ์
                                                    </th>
                                                    <th className="text-center px-4 py-2 font-semibold w-24">
                                                        จำนวน
                                                    </th>
                                                    <th className="text-right px-4 py-2 font-semibold w-24">
                                                        ราคา
                                                    </th>
                                                    <th className="w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedItems.map(
                                                    (item, index) =>
                                                        item.item_type ===
                                                            "supply" && (
                                                            <tr
                                                                key={index}
                                                                className="bg-white"
                                                            >
                                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                                    {item.name ||
                                                                        item.description}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleUpdateQuantity(
                                                                                index,
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    1,
                                                                            )
                                                                        }
                                                                        className="w-full text-center bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    ฿
                                                                    {(
                                                                        item.quantity *
                                                                        item.unit_price
                                                                    ).toLocaleString()}
                                                                </td>
                                                                <td className="px-2 py-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleRemoveItem(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Section C: Medications */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Pill size={18} className="text-primary" />
                                    รายการยา
                                </h3>

                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                    />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อยาเพื่อเพิ่ม..."
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 h-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={drugSearchTerm}
                                        onChange={(e) => {
                                            setDrugSearchTerm(e.target.value);
                                            setShowDrugDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowDrugDropdown(true)
                                        }
                                        onBlur={() =>
                                            setTimeout(() => {
                                                setShowDrugDropdown(false);
                                            }, 200)
                                        }
                                    />

                                    <UnifiedDrugDropdown
                                        isOpen={showDrugDropdown}
                                        searchTerm={drugSearchTerm}
                                        items={medicines}
                                        isSearching={searchingMedicines}
                                        displayMode="inventory"
                                        onSelect={handleSelectMedicine}
                                    />
                                </div>

                                {selectedItems.filter(
                                    (i) => i.item_type === "drug",
                                ).length > 0 && (
                                    <div className="space-y-3">
                                        {selectedItems.map(
                                            (item, index) =>
                                                item.item_type === "drug" && (
                                                    <div
                                                        key={index}
                                                        className="p-4 border border-gray-200 rounded-xl bg-white space-y-3 shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="font-bold text-gray-800">
                                                                    {
                                                                        item.description
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted">
                                                                    ราคาต่อหน่วย:
                                                                    ฿
                                                                    {Number(
                                                                        item.unit_price,
                                                                    ).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveItem(
                                                                        index,
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2
                                                                    size={16}
                                                                />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-12 gap-4 items-end">
                                                            <div className="col-span-4 space-y-1">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase">
                                                                    จำนวน
                                                                </label>
                                                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleUpdateQuantity(
                                                                                index,
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    1,
                                                                            )
                                                                        }
                                                                        className="w-full text-center text-sm font-semibold focus:outline-none bg-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-8 space-y-1">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                                                    <Edit3
                                                                        size={
                                                                            10
                                                                        }
                                                                    />{" "}
                                                                    วิธีใช้ /
                                                                    หมายเหตุ
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="เช่น 1x3 หลังอาหาร, ทาบริเวณแผล"
                                                                    value={
                                                                        item.instruction ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleUpdateInstruction(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 transition-all font-medium"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end pt-1">
                                                            <p className="text-sm font-bold text-primary">
                                                                รวม: ฿
                                                                {(
                                                                    item.quantity *
                                                                    item.unit_price
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ),
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Summary */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200/50">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            วิธีชำระเงิน
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) =>
                                                setPaymentMethod(e.target.value)
                                            }
                                            className="block w-full text-sm font-semibold text-gray-700 bg-transparent border-none focus:ring-0 p-0"
                                        >
                                            <option value="cash">
                                                เงินสด (Cash)
                                            </option>
                                            <option value="transfer">
                                                เงินโอน (Transfer)
                                            </option>
                                            <option value="credit">
                                                บัตรเครดิต (Credit)
                                            </option>
                                        </select>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-500 uppercase">
                                            ยอดรวมสุทธิ
                                        </p>
                                        <p className="text-2xl font-black text-primary">
                                            ฿{totalAmount.toLocaleString()}
                                        </p>
                                    </div>
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

            <AddProcedureModal
                open={openAddProcedure}
                onClose={() => setOpenAddProcedure(false)}
                onSuccess={(newProcedure) => {
                    handleSelectProcedure(newProcedure);
                }}
            />

            <AddPatientModal
                open={openAddPatient}
                onClose={() => setOpenAddPatient(false)}
                onSuccess={handleAddPatientSuccess}
            />
        </>
    );
}
