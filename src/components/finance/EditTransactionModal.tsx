"use client";

import { useState, useEffect, useMemo } from "react";
import {
    X,
    DollarSign,
    Calendar,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Tag,
    CreditCard,
    Save,
    Loader2,
    Trash2,
    Plus,
    Minus,
} from "lucide-react";
import {
    TransactionItem,
    Income,
    Expense,
    CreateIncomePayload,
    CreateExpensePayload,
    PaymentMethod,
} from "@/interface/finance";
import { financeService } from "@/services/finance";
import { patientService } from "@/services/patient";
import { Medicine } from "@/interface/medicine";
import { medicineService } from "@/services/medicine";
import { Patient } from "@/interface/patient";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, User, Calendar as CalendarIcon } from "lucide-react";
import { formatLocalDate } from "@/utils/dateUtils";
import UnifiedDrugDropdown from "../UnifiedDrugDropdown";
import { DateTimePicker24hour } from "@/components/ui/datetime-picker";

interface SelectedItem {
    item_type: "drug" | "service";
    drug_id?: string;
    description?: string;
    quantity: number;
    unit_price: number;
}

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionItem | null;
    onSuccess: () => void;
}

export default function EditTransactionModal({
    isOpen,
    onClose,
    transaction,
    onSuccess,
}: EditTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    // Patient Search States
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchingPatients, setSearchingPatients] = useState(false);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
        null,
    );

    // Visit States
    const [visits, setVisits] = useState<any[]>([]);
    const [loadingVisits, setLoadingVisits] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState("");

    // Drug Search States
    const [drugSearchTerm, setDrugSearchTerm] = useState("");
    const debouncedDrugSearch = useDebounce(drugSearchTerm, 500);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [searchingMedicines, setSearchingMedicines] = useState(false);
    const [showDrugDropdown, setShowDrugDropdown] = useState(false);

    // Selected Items for "ค่ายา"
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // Calculate total amount from items
    const totalFromItems = useMemo(() => {
        return selectedItems.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
        );
    }, [selectedItems]);

    // Update amount if category is "ค่ายา"
    useEffect(() => {
        if (formData?.category === "ค่ายา") {
            setFormData((prev: any) => ({
                ...prev,
                amount: totalFromItems.toFixed(2),
            }));
        }
    }, [totalFromItems, formData?.category]);

    useEffect(() => {
        const fetchMedicines = async () => {
            if (!debouncedDrugSearch || debouncedDrugSearch.length < 2) {
                setMedicines([]);
                return;
            }

            try {
                setSearchingMedicines(true);
                const res = await medicineService.getMedicines({
                    q: debouncedDrugSearch,
                    pageSize: 5,
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

    const handleSelectMedicine = (medicine: Medicine) => {
        const existingIndex = selectedItems.findIndex(
            (item) => item.drug_id === medicine.drug_id,
        );
        if (existingIndex > -1) {
            const newItems = [...selectedItems];
            newItems[existingIndex].quantity += 1;
            setSelectedItems(newItems);
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    item_type: "drug",
                    drug_id: medicine.drug_id,
                    description: medicine.drug_name,
                    quantity: 1,
                    unit_price: Number(medicine.sell_price),
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

    useEffect(() => {
        const fetchPatients = async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                setPatients([]);
                return;
            }

            try {
                setSearchingPatients(true);
                const res = await patientService.getPatients({
                    q: debouncedSearch,
                    pageSize: 5,
                });
                setPatients(res.data);
            } catch (error) {
                console.error("ค้นหาผู้ป่วยล้มเหลว", error);
            } finally {
                setSearchingPatients(false);
            }
        };

        fetchPatients();
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            if (!selectedPatient) {
                setVisits([]);
                // Only reset visit ID if we're not in the middle of initial load
                if (formData) setSelectedVisitId("");
                return;
            }

            try {
                setLoadingVisits(true);
                const res = await patientService.getPatientById(
                    selectedPatient.patient_id,
                );
                // @ts-ignore
                const patientVisits = res.visits || [];
                setVisits(patientVisits);
                // If it's a new patient selection, select the first visit
                if (
                    formData &&
                    !patientVisits.some(
                        (v: any) => v.visit_id === selectedVisitId,
                    )
                ) {
                    if (patientVisits.length > 0) {
                        setSelectedVisitId(patientVisits[0].visit_id);
                    }
                }
            } catch (error) {
                console.error("ดึงข้อมูลการเข้าตรวจล้มเหลว", error);
            } finally {
                setLoadingVisits(false);
            }
        };

        fetchPatientDetails();
    }, [selectedPatient]);

    useEffect(() => {
        if (isOpen && transaction) {
            fetchDetails();
        } else {
            // Reset states when closed
            setVisits([]);
            setSelectedVisitId("");
            setSelectedItems([]);
            setDrugSearchTerm("");
        }
    }, [isOpen, transaction]);

    const fetchDetails = async () => {
        if (!transaction) return;
        setFetching(true);
        try {
            if (transaction.type === "income") {
                const res = await financeService.getIncomeById(transaction.id);
                const dateObj = new Date(res.income_date);
                setFormData({
                    ...res,
                    date: formatLocalDate(dateObj),
                    hour: dateObj.getHours().toString().padStart(2, "0"),
                    minute: dateObj.getMinutes().toString().padStart(2, "0"),
                    amount: Number(res.amount),
                    category: res.income_category || "ค่าตรวจรักษา",
                });
                setSelectedVisitId(res.visit_id);

                // @ts-ignore - visit and patient are included now
                if (res.visit?.patient) {
                    // @ts-ignore
                    setSelectedPatient(res.visit.patient);
                    // @ts-ignore
                    setSearchTerm(res.visit.patient.fullName || "");

                    // Set initial items from visit details
                    if (res.visit.visitDetails) {
                        setSelectedItems(
                            res.visit.visitDetails.map((vd: any) => ({
                                item_type: vd.item_type,
                                drug_id: vd.drug_id,
                                description: vd.description,
                                quantity: vd.quantity,
                                unit_price: Number(vd.unit_price),
                            })),
                        );
                    }
                }
            } else {
                const res = await financeService.getExpenseById(transaction.id);
                const dateObj = new Date(res.expense_date);
                setFormData({
                    ...res,
                    date: formatLocalDate(dateObj),
                    hour: dateObj.getHours().toString().padStart(2, "0"),
                    minute: dateObj.getMinutes().toString().padStart(2, "0"),
                    amount: Number(res.amount),
                });
            }
        } catch (error) {
            console.error("Failed to fetch details:", error);
            alert("ไม่สามารถดึงข้อมูลรายการได้");
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction || !formData) return;

        if (transaction.type === "income" && !selectedVisitId) {
            alert("กรุณาเลือกการเข้าตรวจ (Visit) สำหรับรายรับ");
            return;
        }

        setLoading(true);
        try {
            const isoDateTime = new Date(
                `${formData.date}T${formData.hour}:${formData.minute}:00`,
            ).toISOString();

            if (transaction.type === "income") {
                const payload: Partial<CreateIncomePayload> = {
                    income_date: isoDateTime,
                    amount: Number(formData.amount),
                    payment_method: formData.payment_method as PaymentMethod,
                    receipt_no: formData.receipt_no,
                    visit_id: selectedVisitId,
                    income_category: formData.category,
                    items:
                        formData.category === "ค่ายา"
                            ? selectedItems
                            : undefined,
                };
                await financeService.updateIncome(transaction.id, payload);
            } else {
                const payload: Partial<CreateExpensePayload> = {
                    expense_date: isoDateTime,
                    expense_type: formData.expense_type,
                    amount: Number(formData.amount),
                    description: formData.description,
                    receipt_no: formData.receipt_no,
                };
                await financeService.updateExpense(transaction.id, payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update transaction:", error);
            alert("ไม่สามารถบันทึกข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !transaction) return null;

    const isIncome = transaction.type === "income";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <FileText className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                แก้ไขรายการ
                            </h2>
                            <p className="text-white/80 text-sm">
                                {isIncome ? "รายรับ" : "รายจ่าย"} •{" "}
                                {transaction.id}
                            </p>
                        </div>
                    </div>
                </div>

                {fetching || !formData ? (
                    <div className="p-20 flex justify-center flex-col items-center gap-4">
                        <Loader2
                            className="animate-spin text-primary"
                            size={40}
                        />
                        <p className="text-muted text-sm animate-pulse">
                            กำลังดึงข้อมูล...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Patient & Visit Selection (for Income) */}
                            {isIncome && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="relative">
                                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                                            ค้นหาผู้ป่วย{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                size={18}
                                            />
                                            <input
                                                type="text"
                                                placeholder="ค้นหาด้วยชื่อ สกุล หรือเบอร์โทรศัพท์..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(
                                                        e.target.value,
                                                    );
                                                    setShowPatientDropdown(
                                                        true,
                                                    );
                                                }}
                                                onFocus={() =>
                                                    setShowPatientDropdown(true)
                                                }
                                                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                                            />
                                        </div>

                                        {showPatientDropdown &&
                                            (searchTerm?.length ?? 0) >= 2 && (
                                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                    {searchingPatients ? (
                                                        <div className="p-4 text-center text-gray-500 text-sm">
                                                            กำลังค้นหา...
                                                        </div>
                                                    ) : patients.length > 0 ? (
                                                        patients.map(
                                                            (patient) => (
                                                                <button
                                                                    key={
                                                                        patient.patient_id
                                                                    }
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedPatient(
                                                                            patient,
                                                                        );
                                                                        setSearchTerm(
                                                                            patient.fullName,
                                                                        );
                                                                        setShowPatientDropdown(
                                                                            false,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                        <User
                                                                            size={
                                                                                20
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800">
                                                                            {
                                                                                patient.fullName
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            HN:{" "}
                                                                            {
                                                                                patient.hospital_number
                                                                            }{" "}
                                                                            |
                                                                            โทร:{" "}
                                                                            {
                                                                                patient.phone
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            ),
                                                        )
                                                    ) : (
                                                        <div className="p-4 text-center text-gray-500 text-sm">
                                                            ไม่พบข้อมูลผู้ป่วย
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </div>

                                    {selectedPatient && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                                                เลือกการเข้าตรวจ (Visit){" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            {loadingVisits ? (
                                                <div className="text-sm text-gray-500 animate-pulse flex items-center gap-2 py-2">
                                                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                                    กำลังโหลดข้อมูลการเข้าตรวจ...
                                                </div>
                                            ) : visits.length > 0 ? (
                                                <div className="relative">
                                                    <Calendar
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                        size={18}
                                                    />
                                                    <select
                                                        value={selectedVisitId}
                                                        onChange={(e) =>
                                                            setSelectedVisitId(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white appearance-none text-sm"
                                                    >
                                                        {visits.map((visit) => (
                                                            <option
                                                                key={
                                                                    visit.visit_id
                                                                }
                                                                value={
                                                                    visit.visit_id
                                                                }
                                                            >
                                                                {new Date(
                                                                    visit.visit_date,
                                                                ).toLocaleDateString(
                                                                    "th-TH",
                                                                    {
                                                                        year: "numeric",
                                                                        month: "short",
                                                                        day: "numeric",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}{" "}
                                                                -{" "}
                                                                {visit.symptom ||
                                                                    "ไม่มีระบุอาการ"}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 12 12"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M2.5 4.5L6 8L9.5 4.5"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                                                    <X size={16} />
                                                    ไม่พบประวัติการเข้าตรวจสำหรับผู้ป่วยรายนี้
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Date & Time */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <CalendarIcon
                                        size={16}
                                        className="text-primary"
                                    />
                                    วันที่และเวลา{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <DateTimePicker24hour
                                    date={
                                        formData.date
                                            ? new Date(
                                                  `${formData.date}T${formData.hour}:${formData.minute}:00`,
                                              )
                                            : undefined
                                    }
                                    setDate={(date) => {
                                        if (date) {
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                date: formatLocalDate(date),
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

                            {/* Type Specific Fields */}
                            {isIncome ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Tag
                                                size={16}
                                                className="text-primary"
                                            />
                                            หมวดหมู่รายการ{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                            value={formData?.category || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    category: e.target.value,
                                                })
                                            }
                                            required
                                        >
                                            <option value="">
                                                เลือกหมวดหมู่
                                            </option>
                                            <option value="ค่าตรวจรักษา">
                                                ค่าตรวจรักษา
                                            </option>
                                            <option value="ค่ายา">ค่ายา</option>
                                            <option value="ค่าบริการ">
                                                ค่าบริการ
                                            </option>
                                            <option value="วัคซีน">
                                                วัคซีน
                                            </option>
                                        </select>
                                    </div>

                                    {formData?.category === "ค่ายา" && (
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="relative">
                                                <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                                                    เพิ่มรายการยา{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <Search
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                        size={18}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="ค้นหายาด้วยชื่อ..."
                                                        value={drugSearchTerm}
                                                        onChange={(e) => {
                                                            setDrugSearchTerm(
                                                                e.target.value,
                                                            );
                                                            setShowDrugDropdown(
                                                                true,
                                                            );
                                                        }}
                                                        onFocus={() =>
                                                            setShowDrugDropdown(
                                                                true,
                                                            )
                                                        }
                                                        className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                                                    />
                                                </div>

                                                <UnifiedDrugDropdown
                                                    isOpen={showDrugDropdown}
                                                    searchTerm={drugSearchTerm}
                                                    items={medicines}
                                                    isSearching={
                                                        searchingMedicines
                                                    }
                                                    displayMode="inventory"
                                                    onSelect={(m) =>
                                                        handleSelectMedicine(m)
                                                    }
                                                />
                                            </div>

                                            {/* Medicine Table */}
                                            <div className="overflow-hidden border border-gray-200 rounded-lg bg-white shadow-sm">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr className="text-gray-500 font-semibold">
                                                            <th className="p-3 text-left">
                                                                รายการ
                                                            </th>
                                                            <th className="p-3 text-center">
                                                                จำนวน
                                                            </th>
                                                            <th className="p-3 text-right">
                                                                ราคาหน่วย
                                                            </th>
                                                            <th className="p-3 text-right">
                                                                รวม
                                                            </th>
                                                            <th className="p-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {selectedItems.length >
                                                        0 ? (
                                                            selectedItems.map(
                                                                (
                                                                    item,
                                                                    index,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="hover:bg-gray-50/50 transition-colors"
                                                                    >
                                                                        <td className="p-3">
                                                                            <p className="font-semibold text-gray-800">
                                                                                {
                                                                                    item.description
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                        <td className="p-3">
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
                                                                                            0,
                                                                                    )
                                                                                }
                                                                                className="w-12 text-center border-b border-gray-200 focus:border-primary outline-none py-0.5 bg-transparent font-semibold"
                                                                            />
                                                                        </td>
                                                                        <td className="p-3 text-right text-gray-600 tabular-nums">
                                                                            ฿
                                                                            {Number(
                                                                                item.unit_price,
                                                                            ).toLocaleString()}
                                                                        </td>
                                                                        <td className="p-3 text-right font-bold text-primary tabular-nums">
                                                                            ฿
                                                                            {(
                                                                                item.quantity *
                                                                                Number(
                                                                                    item.unit_price,
                                                                                )
                                                                            ).toLocaleString()}
                                                                        </td>
                                                                        <td className="p-3">
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
                                                                                        16
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan={5}
                                                                    className="p-8 text-center text-gray-400 bg-white italic"
                                                                >
                                                                    ยังไม่มีรายการที่เลือก
                                                                    กรุณาค้นหายาด้านบน
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    {selectedItems.length >
                                                        0 && (
                                                        <tfoot className="bg-gray-50/50 border-t border-gray-200">
                                                            <tr>
                                                                <td
                                                                    colSpan={3}
                                                                    className="p-3 text-right font-semibold text-gray-600"
                                                                >
                                                                    ราคารวมทั้งสิ้น:
                                                                </td>
                                                                <td className="p-3 text-right text-lg font-bold text-primary tabular-nums">
                                                                    ฿
                                                                    {totalFromItems.toLocaleString()}
                                                                </td>
                                                                <td></td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <CreditCard
                                                size={16}
                                                className="text-primary"
                                            />
                                            วิธีการชำระเงิน{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="w-full h-10 border border-gray-300 rounded-lg px-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                                            value={
                                                formData?.payment_method || ""
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    payment_method:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                        >
                                            <option value="cash">เงินสด</option>
                                            <option value="transfer">
                                                เงินโอน
                                            </option>
                                            <option value="credit">
                                                บัตรเครดิต
                                            </option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Tag
                                            size={16}
                                            className="text-primary"
                                        />
                                        หมวดหมู่รายการ{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="w-full h-10 border border-gray-300 rounded-lg px-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                                        value={formData?.expense_type || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                expense_type: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="drug">
                                            ค่ายา/เวชภัณฑ์
                                        </option>
                                        <option value="utility">
                                            ค่าเช่า/สาธารณูปโภค
                                        </option>
                                        <option value="general">
                                            ค่าใช้จ่ายอื่นๆ
                                        </option>
                                    </select>
                                </div>
                            )}

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <DollarSign
                                        size={16}
                                        className="text-primary"
                                    />
                                    จำนวนเงิน (บาท){" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`w-full h-10 border border-gray-300 rounded-lg px-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                                        formData?.category === "ค่ายา"
                                            ? "bg-gray-50 text-primary font-bold cursor-not-allowed border-primary/20"
                                            : "focus:border-primary"
                                    }`}
                                    placeholder="0.00"
                                    value={formData?.amount || ""}
                                    readOnly={formData?.category === "ค่ายา"}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amount: e.target.value,
                                        })
                                    }
                                    required
                                />
                                {formData?.category === "ค่ายา" && (
                                    <p className="text-xs text-muted mt-1 px-1">
                                        * คำนวณอัตโนมัติจากรายการยาและเวชภัณฑ์
                                    </p>
                                )}
                            </div>

                            {/* Description (Only for Expense) */}
                            {!isIncome && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText
                                            size={16}
                                            className="text-primary"
                                        />
                                        รายละเอียด
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                                        rows={3}
                                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                        value={formData?.description || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            {/* Receipt No */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FileText
                                        size={16}
                                        className="text-primary"
                                    />
                                    เลขที่ใบเสร็จ (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    className="w-full h-10 border border-gray-300 rounded-lg px-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    placeholder="ระบุเลขที่ใบเสร็จ"
                                    value={formData?.receipt_no || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            receipt_no: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 h-10 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 h-10 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            className="animate-spin"
                                            size={18}
                                        />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        บันทึกการแก้ไข
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
