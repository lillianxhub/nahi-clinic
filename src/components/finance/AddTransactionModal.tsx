import { useState, useEffect, useMemo } from "react";
import {
    X,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    Search,
    User,
    Calendar,
    Trash2,
    Plus,
    Minus,
} from "lucide-react";
import { financeService } from "@/services/finance";
import { patientService } from "@/services/patient";
import { Medicine } from "@/interface/medicine";
import { Patient } from "@/interface/patient";
import { PaymentMethod } from "@/interface/finance";
import { medicineService } from "@/services/medicine";
import { serviceService } from "@/services/service";
import { Service } from "@/interface/service";
import { useDebounce } from "@/hooks/useDebounce";
import { formatLocalDate, getLocalTime } from "@/utils/dateUtils";
import UnifiedDrugDropdown from "../UnifiedDrugDropdown";
import AddServiceModal from "../treatment/AddServiceModal";
import { DateTimePicker24hour } from "@/components/ui/datetime-picker";

interface SelectedItem {
    item_type: "drug" | "service";
    product_id?: string;
    description?: string;
    quantity: number;
    unit_price: number;
}

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialType?: "income" | "expense";
}

export default function AddTransactionModal({
    isOpen,
    onClose,
    onSuccess,
    initialType = "income",
}: AddTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState(initialType);

    const now = new Date();
    const [formData, setFormData] = useState({
        date: formatLocalDate(now),
        hour: getLocalTime(now).hour,
        minute: getLocalTime(now).minute,
        income_type: "",
        amount: "",
        description: "",
        status: "completed",
        payment_method: "cash" as PaymentMethod,
    });

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

    // Service Search States
    const [serviceSearchTerm, setServiceSearchTerm] = useState("");
    const debouncedServiceSearch = useDebounce(serviceSearchTerm, 500);
    const [services, setServices] = useState<Service[]>([]);
    const [searchingServices, setSearchingServices] = useState(false);
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [openAddService, setOpenAddService] = useState(false);

    // Selected Items
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    const clearSelectedItems = () => {
        setSelectedItems([]);
    };

    // Calculate total amount from items
    const totalFromItems = useMemo(() => {
        return selectedItems.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
        );
    }, [selectedItems]);

    // Update amount if category is "ค่ายา" or "ค่าบริการ"
    useEffect(() => {
        if (
            formData.income_type === "drug" ||
            formData.income_type === "service"
        ) {
            setFormData((prev) => ({
                ...prev,
                amount: totalFromItems.toString(),
            }));
        }
    }, [totalFromItems, formData.income_type]);

    const isFormValid = useMemo(() => {
        if (!formData.income_type) return false;
        if (Number(formData.amount) <= 0) return false;

        if (transactionType === "income") {
            const needsPatient = ["drug", "service", "supply", "other"].includes(
                formData.income_type,
            );
            if (needsPatient && !selectedPatient) return false;

            if (
                ["drug", "service"].includes(formData.income_type) &&
                selectedItems.length === 0
            )
                return false;
        }

        return true;
    }, [formData, transactionType, selectedPatient, selectedItems]);

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
                setSelectedVisitId("");
                return;
            }

            try {
                setLoadingVisits(true);
                const res = await patientService.getPatientById(
                    selectedPatient.patient_id,
                );
                // @ts-ignore - visits is included in the res from getPatientById
                const patientVisits = res.visits || [];
                setVisits(patientVisits);
                // ไม่ auto-select visit — ให้ผู้ใช้เลือกเอง หรือไม่เลือก (walk-in)
                setSelectedVisitId("");
            } catch (error) {
                console.error("ดึงข้อมูลการเข้าตรวจล้มเหลว", error);
            } finally {
                setLoadingVisits(false);
            }
        };

        fetchPatientDetails();
    }, [selectedPatient]);

    useEffect(() => {
        const fetchMedicines = async () => {
            if (!debouncedDrugSearch || debouncedDrugSearch.length < 2) {
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
        const fetchServices = async () => {
            if (
                !debouncedServiceSearch ||
                debouncedServiceSearch.length < 2
            ) {
                try {
                    setSearchingServices(true);
                    const res = await serviceService.getServices({
                        pageSize: 10,
                    });
                    setServices(res.data);
                } catch (error) {
                    console.error("ดึงข้อมูลบริการล้มเหลว", error);
                } finally {
                    setSearchingServices(false);
                }
                return;
            }

            try {
                setSearchingServices(true);
                const res = await serviceService.getServices({
                    q: debouncedServiceSearch,
                    pageSize: 10,
                });
                setServices(res.data);
            } catch (error) {
                console.error("ค้นหาบริการล้มเหลว", error);
            } finally {
                setSearchingServices(false);
            }
        };

        fetchServices();
    }, [debouncedServiceSearch]);

    const handleSelectService = (service: Service) => {
        const existingIndex = selectedItems.findIndex(
            (item) => item.product_id === service.service_id,
        );
        if (existingIndex > -1) {
            const newItems = [...selectedItems];
            newItems[existingIndex].quantity += 1;
            setSelectedItems(newItems);
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    item_type: "service",
                    product_id: service.service_id,
                    description: service.service_name,
                    quantity: 1,
                    unit_price: Number(service.price),
                },
            ]);
        }
        setServiceSearchTerm("");
        setShowServiceDropdown(false);
    };

    const handleSelectMedicine = (medicine: Medicine) => {
        const existingIndex = selectedItems.findIndex(
            (item) => item.product_id === medicine.product_id,
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
                    product_id: medicine.product_id,
                    description: medicine.product_name,
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

    const handleSave = async () => {
        if (!formData.income_type) {
            alert("กรุณาเลือกหมวดหมู่");
            return;
        }

        // Allow saving without selectedVisitId if it's a walk-in (has selectedPatient) or other income categories
        if (
            transactionType === "income" &&
            !selectedVisitId &&
            !selectedPatient &&
            (formData.income_type === "drug" ||
                formData.income_type === "service" ||
                formData.income_type === "supply" ||
                formData.income_type === "other")
        ) {
            alert("กรุณาเลือกผู้ป่วยหรือการเข้าตรวจสำหรับรายรับประเภทนี้");
            return;
        }

        try {
            setLoading(true);
            const isoDateTime = new Date(
                `${formData.date}T${formData.hour}:${formData.minute}:00`,
            ).toISOString();

            if (transactionType === "income") {
                await financeService.createIncome({
                    income_date: isoDateTime,
                    amount: Number(formData.amount),
                    payment_method: formData.payment_method,
                    visit_id: selectedVisitId || undefined,
                    patient_id:
                        !selectedVisitId && selectedPatient
                            ? selectedPatient.patient_id
                            : undefined,
                    income_type: formData.income_type,
                    description: formData.description || undefined,
                    items:
                        formData.income_type === "drug" ||
                        formData.income_type === "service"
                            ? selectedItems
                            : undefined,
                });
            } else {
                let expenseType = "general";
                if (formData.income_type === "ค่ายา/เวชภัณฑ์")
                    expenseType = "drug";
                if (formData.income_type === "ค่าเช่า/สาธารณูปโภค")
                    expenseType = "utility";

                await financeService.createExpense({
                    expense_date: isoDateTime,
                    expense_type: expenseType as any,
                    amount: Number(formData.amount),
                    description: formData.description,
                });
            }
            onSuccess();
            onClose();
            // Reset form
            const resetNow = new Date();
            setFormData({
                date: formatLocalDate(resetNow),
                hour: getLocalTime(resetNow).hour,
                minute: getLocalTime(resetNow).minute,
                payment_method: "cash",
                income_type: "",
                amount: "",
                description: "",
                status: "completed",
            });
            setSelectedPatient(null);
            setSearchTerm("");
            setVisits([]);
            setSelectedVisitId("");
            setSelectedItems([]);
        } catch (error: any) {
            console.error("Failed to save transaction:", error);
            alert(
                "ไม่สามารถบันทึกข้อมูลได้: " +
                    (error.message || "Unknown error"),
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-primary">
                        เพิ่มรายการใหม่
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-primary transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-3 text-gray-700">
                            ประเภทรายการ
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setTransactionType("income")}
                                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 group ${
                                    transactionType === "income"
                                        ? "border-green-500 bg-green-50 shadow-inner"
                                        : "border-gray-100 hover:border-gray-200"
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-lg ${transactionType === "income" ? "bg-green-100" : "bg-gray-50 group-hover:bg-gray-100"}`}
                                >
                                    <ArrowUpRight
                                        size={24}
                                        className={
                                            transactionType === "income"
                                                ? "text-green-600"
                                                : "text-gray-400"
                                        }
                                    />
                                </div>
                                <p
                                    className={`font-semibold ${transactionType === "income" ? "text-green-700" : "text-gray-500"}`}
                                >
                                    รายรับ
                                </p>
                            </button>
                            <button
                                onClick={() => setTransactionType("expense")}
                                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 group ${
                                    transactionType === "expense"
                                        ? "border-red-500 bg-red-50 shadow-inner"
                                        : "border-gray-100 hover:border-gray-200"
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-lg ${transactionType === "expense" ? "bg-red-100" : "bg-gray-50 group-hover:bg-gray-100"}`}
                                >
                                    <ArrowDownRight
                                        size={24}
                                        className={
                                            transactionType === "expense"
                                                ? "text-red-600"
                                                : "text-gray-400"
                                        }
                                    />
                                </div>
                                <p
                                    className={`font-semibold ${transactionType === "expense" ? "text-red-700" : "text-gray-500"}`}
                                >
                                    รายจ่าย
                                </p>
                            </button>
                        </div>
                    </div>

                    {transactionType === "income" && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="relative">
                                <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                                    ค้นหาผู้ป่วย{" "}
                                    <span className="text-red-500">*</span>
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
                                            setSearchTerm(e.target.value);
                                            setShowPatientDropdown(true);
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
                                                patients.map((patient) => (
                                                    <button
                                                        key={patient.patient_id}
                                                        onClick={() => {
                                                            setSelectedPatient(
                                                                patient,
                                                            );
                                                            setSearchTerm(
                                                                `${patient.fullName} (${patient.hospital_number})`,
                                                            );
                                                            setShowPatientDropdown(
                                                                false,
                                                            );
                                                        }}
                                                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                            <User size={20} />
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
                                                                | เลขบัตร:{" "}
                                                                {patient.citizen_number ||
                                                                    "-"}{" "}
                                                                | โทร:{" "}
                                                                {patient.phone}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
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
                                        <span className="text-red-500">*</span>
                                    </label>

                                    {/* Allergy Alert */}
                                    {selectedPatient?.allergy?.trim() &&
                                        selectedPatient.allergy.trim() !==
                                            "ไม่มี" &&
                                        selectedPatient.allergy.trim() !==
                                            "-" && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 mt-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <AlertCircle
                                                    className="text-red-500 shrink-0 mt-0.5"
                                                    size={18}
                                                />
                                                <div>
                                                    <p className="text-red-800 text-xs font-bold uppercase tracking-wider mb-0.5">
                                                        ประวัติการแพ้ยา/แพ้อื่นๆ
                                                    </p>
                                                    <p className="text-red-700 sm:text-sm text-xs font-medium">
                                                        {
                                                            selectedPatient.allergy
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                    {loadingVisits ? (
                                        <div className="text-sm text-gray-500 animate-pulse flex items-center gap-2 py-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                            กำลังโหลดข้อมูลการเข้าตรวจ...
                                        </div>
                                    ) : (
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
                                                <option value="">
                                                    — ไม่เลือก Visit (จะสร้าง
                                                    walk-in อัตโนมัติ)
                                                </option>
                                                {visits.map((visit) => (
                                                    <option
                                                        key={visit.visit_id}
                                                        value={visit.visit_id}
                                                    >
                                                        {new Date(
                                                            visit.visit_date,
                                                        ).toLocaleDateString(
                                                            "th-TH",
                                                            {
                                                                timeZone:
                                                                    "Asia/Bangkok",
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
                                    )}
                                    {!selectedVisitId && !loadingVisits && (
                                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                            <span>⚠️</span>
                                            จะสร้าง Visit walk-in อัตโนมัติ
                                            เพื่อผูกรายการยาและตัดสต็อก
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                วันที่และเวลา{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <DateTimePicker24hour
                                date={
                                    new Date(
                                        `${formData.date}T${formData.hour}:${formData.minute}:00`,
                                    )
                                }
                                setDate={(date) => {
                                    if (date) {
                                        setFormData((prev) => ({
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

                        <div className="">
                            <label className="block text-sm font-semibold text-gray-700">
                                หมวดหมู่
                            </label>
                            <select
                                value={formData.income_type}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        income_type: e.target.value,
                                        description: "",
                                    });
                                    clearSelectedItems();
                                }}
                                className="w-full h-10 px-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                            >
                                <option value="">เลือกหมวดหมู่</option>
                                {transactionType === "income" ? (
                                    <>
                                        <option value="service">ค่าบริการ/หัตถการ</option>
                                        <option value="drug">ค่ายา</option>
                                        <option value="supply">เวชภัณฑ์</option>
                                        <option value="other">รายได้อื่นๆ</option>
                                    </>
                                ) : (
                                    <>
                                        {/* <option value="ค่ายา">
                                            ค่ายา
                                        </option> */}
                                        <option value="เงินเดือนพนักงาน">
                                            เงินเดือนพนักงาน
                                        </option>
                                        <option value="ค่าเช่า/สาธารณูปโภค">
                                            ค่าเช่า/สาธารณูปโภค
                                        </option>
                                        <option value="อื่นๆ">อื่นๆ</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {transactionType === "income" &&
                        formData.income_type === "service" && (
                            <div className="space-y-4 pt-4 border-t animate-in fade-in duration-300">
                                <div className="space-y-1.5 relative">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Plus size={16} />{" "}
                                        ค้นหาบริการ
                                    </label>
                                    <div className="relative">
                                        <Search
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type="text"
                                            placeholder="ค้นหาหรือเลือกบริการ..."
                                            value={serviceSearchTerm}
                                            onChange={(e) => {
                                                setServiceSearchTerm(
                                                    e.target.value,
                                                );
                                                setShowServiceDropdown(true);
                                            }}
                                            onFocus={() =>
                                                setShowServiceDropdown(true)
                                            }
                                            onBlur={() =>
                                                setTimeout(() => {
                                                    setShowServiceDropdown(
                                                        false,
                                                    );
                                                }, 200)
                                            }
                                            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                                        />
                                        {showServiceDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {searchingServices ? (
                                                    <div className="p-4 text-center text-muted text-sm">
                                                        กำลังค้นหา...
                                                    </div>
                                                ) : services.length > 0 ? (
                                                    <div className="py-1">
                                                        {services.map((s) => (
                                                            <button
                                                                key={
                                                                    s.service_id
                                                                }
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                                                onClick={() =>
                                                                    handleSelectService(
                                                                        s,
                                                                    )
                                                                }
                                                            >
                                                                <div>
                                                                    <div className="font-medium text-foreground group-hover:text-primary">
                                                                        {
                                                                            s.service_name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-muted">
                                                                        ฿
                                                                        {Number(
                                                                            s.price,
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
                                                        ไม่พบข้อมูลบริการ
                                                    </div>
                                                )}

                                                <div className="border-t border-gray-100 p-1">
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center justify-center gap-2 py-2 text-primary hover:bg-primary/5 rounded-md font-medium text-sm transition-colors"
                                                        onClick={() => {
                                                            setOpenAddService(
                                                                true,
                                                            );
                                                            setShowServiceDropdown(
                                                                false,
                                                            );
                                                        }}
                                                    >
                                                        <Plus size={16} />
                                                        สร้างบริการใหม่
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    {transactionType === "income" &&
                        formData.income_type === "drug" && (
                            <div className="space-y-4 pt-4 border-t animate-in fade-in duration-300">
                                <div className="space-y-1.5 relative">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Plus size={16} /> ค้นหายาและเวชภัณฑ์
                                    </label>
                                    <div className="relative">
                                        <Search
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type="text"
                                            placeholder="ค้นหาชื่อยา..."
                                            value={drugSearchTerm}
                                            onChange={(e) => {
                                                setDrugSearchTerm(
                                                    e.target.value,
                                                );
                                                setShowDrugDropdown(true);
                                            }}
                                            onFocus={() =>
                                                setShowDrugDropdown(true)
                                            }
                                            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                                        />
                                    </div>

                                    <UnifiedDrugDropdown
                                        isOpen={showDrugDropdown}
                                        searchTerm={drugSearchTerm}
                                        items={medicines}
                                        isSearching={searchingMedicines}
                                        displayMode="inventory"
                                        onSelect={handleSelectMedicine}
                                    />
                                </div>
                            </div>
                        )}

                    {transactionType === "income" &&
                        (formData.income_type === "drug" ||
                            formData.income_type === "service") && (
                            <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                                {/* สรุปรายการ Table */}
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-xs">
                                            <tr>
                                                <th className="text-left p-3 font-semibold">
                                                    รายการ
                                                </th>
                                                <th className="text-center p-3 font-semibold w-28">
                                                    จำนวน
                                                </th>
                                                <th className="text-right p-3 font-semibold w-24">
                                                    ราคา/หน่วย
                                                </th>
                                                <th className="text-right p-3 font-semibold w-24">
                                                    รวม
                                                </th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedItems.length > 0 ? (
                                                selectedItems.map(
                                                    (item, index) => (
                                                        <tr
                                                            key={index}
                                                            className="bg-white hover:bg-gray-50/50 transition-colors"
                                                        >
                                                            <td className="p-3 font-medium text-gray-800">
                                                                {
                                                                    item.description
                                                                }
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
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {selectedItems.length > 0 && (
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
                        <label className="block text-sm font-semibold text-gray-700">
                            จำนวนเงินรวม (บาท)
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                ฿
                            </div>
                            <input
                                type="number"
                                value={formData.amount}
                                readOnly={
                                    formData.income_type === "drug" ||
                                    formData.income_type === "service"
                                }
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        amount: e.target.value,
                                    })
                                }
                                placeholder="0.00"
                                className={`w-full pl-8 pr-4 h-10 border border-gray-200 rounded-lg outline-none transition-all ${
                                    formData.income_type === "drug" ||
                                    formData.income_type === "service"
                                        ? "bg-gray-50 text-primary font-bold border-primary/20 shadow-inner cursor-not-allowed"
                                        : "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                }`}
                            />
                        </div>
                        {(formData.income_type === "drug" ||
                            formData.income_type === "service") && (
                            <p className="text-xs text-muted mt-1 px-1">
                                * คำนวณอัตโนมัติจากรายการที่เลือก
                            </p>
                        )}
                    </div>

                    {(transactionType === "expense" ||
                        transactionType === "income") && (
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                รายละเอียด
                                <span className="text-gray-400 font-normal text-xs ml-1">
                                    (ถ้าไม่กรอกระบบจะสร้างอัตโนมัติ)
                                </span>
                            </label>
                            <textarea
                                rows={2}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder={
                                    transactionType === "expense"
                                        ? "ระบุรายละเอียดการใช้จ่าย..."
                                        : selectedPatient
                                          ? `ค่าเริ่มต้น: "${formData.income_type || "หมวดหมู่"}: ผู้ป่วย ${selectedPatient.fullName}"`
                                          : `ค่าเริ่มต้น: "${formData.income_type || "หมวดหมู่"}"`
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            สถานะ
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value,
                                })
                            }
                            className="w-full h-10 px-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                        >
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="pending">รอดำเนินการ</option>
                        </select>
                    </div>

                    {transactionType === "income" && (
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                วิธีการชำระเงิน
                            </label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        payment_method: e.target
                                            .value as PaymentMethod,
                                    })
                                }
                                className="w-full h-10 px-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                            >
                                <option value="cash">เงินสด</option>
                                <option value="transfer">เงินโอน</option>
                                <option value="credit">บัตรเครดิต</option>
                            </select>
                        </div>
                    )}
                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all font-inter"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || !isFormValid}
                            className={`flex-1 h-12 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 font-inter ${
                                transactionType === "income"
                                    ? "bg-green-600 shadow-green-200 hover:bg-green-700 disabled:bg-green-300"
                                    : "bg-red-600 shadow-red-200 hover:bg-red-700 disabled:bg-red-300"
                            }`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Plus size={20} />
                                    บันทึกรายการ
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <AddServiceModal
                open={openAddService}
                onClose={() => setOpenAddService(false)}
                onSuccess={(newService: any) => {
                    handleSelectService(newService);
                }}
            />
        </div>
    );
}
