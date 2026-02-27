import { useState, useEffect } from "react";
import {
    X,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    User,
    Calendar,
} from "lucide-react";
import { financeService } from "@/services/finance";
import { patientService } from "@/services/patient";
import { Patient } from "@/interface/patient";
import { useDebounce } from "@/hooks/useDebounce";
import { formatLocalDate, getLocalTime } from "@/utils/dateUtils";

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
        category: "",
        amount: "",
        description: "",
        status: "completed",
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
                if (patientVisits.length > 0) {
                    setSelectedVisitId(patientVisits[0].visit_id);
                }
            } catch (error) {
                console.error("ดึงข้อมูลการเข้าตรวจล้มเหลว", error);
            } finally {
                setLoadingVisits(false);
            }
        };

        fetchPatientDetails();
    }, [selectedPatient]);

    const handleSave = async () => {
        if (!formData.amount || !formData.category) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (transactionType === "income" && !selectedVisitId) {
            alert("กรุณาเลือกการเข้าตรวจ (Visit) สำหรับรายรับ");
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
                    payment_method: "cash",
                    visit_id: selectedVisitId,
                });
            } else {
                let expenseType = "general";
                if (formData.category === "ค่ายา/เวชภัณฑ์")
                    expenseType = "drug";
                if (formData.category === "ค่าเช่า/สาธารณูปโภค")
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
                category: "",
                amount: "",
                description: "",
                status: "completed",
            });
            setSelectedPatient(null);
            setSearchTerm("");
            setVisits([]);
            setSelectedVisitId("");
        } catch (error) {
            console.error("Failed to save transaction:", error);
            alert("ไม่สามารถบันทึกข้อมูลได้");
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
                                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 group ${transactionType === "income"
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
                                className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 group ${transactionType === "expense"
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
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                                    />
                                </div>

                                {showPatientDropdown &&
                                    (searchTerm?.length ?? 0) >= 2 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
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
                                                                patient.fullName,
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
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white appearance-none"
                                            >
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
                                        <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                                            <X size={16} />
                                            ไม่พบประวัติการเข้าตรวจสำหรับผู้ป่วยรายนี้
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5 flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    วันที่
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            date: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <div className="w-48">
                                <label className="block text-sm font-semibold text-gray-700">
                                    เวลา
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={formData.hour}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                hour: e.target.value,
                                            })
                                        }
                                        className="flex-1 px-2 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-center"
                                    >
                                        {Array.from({ length: 24 }).map(
                                            (_, i) => (
                                                <option
                                                    key={i}
                                                    value={i
                                                        .toString()
                                                        .padStart(2, "0")}
                                                >
                                                    {i
                                                        .toString()
                                                        .padStart(2, "0")}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <span className="font-bold text-gray-400">
                                        :
                                    </span>
                                    <select
                                        value={formData.minute}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                minute: e.target.value,
                                            })
                                        }
                                        className="flex-1 px-2 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-center"
                                    >
                                        {Array.from({ length: 60 }).map(
                                            (_, i) => (
                                                <option
                                                    key={i}
                                                    value={i
                                                        .toString()
                                                        .padStart(2, "0")}
                                                >
                                                    {i
                                                        .toString()
                                                        .padStart(2, "0")}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                หมวดหมู่
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                            >
                                <option value="">เลือกหมวดหมู่</option>
                                {transactionType === "income" ? (
                                    <>
                                        <option value="ค่าตรวจรักษา">
                                            ค่าตรวจรักษา
                                        </option>
                                        <option value="ค่ายา">ค่ายา</option>
                                        <option value="ค่าบริการ">
                                            ค่าบริการ
                                        </option>
                                        <option value="วัคซีน">วัคซีน</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="ค่ายา/เวชภัณฑ์">
                                            ค่ายา/เวชภัณฑ์
                                        </option>
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

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            จำนวนเงิน (บาท)
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                ฿
                            </div>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        amount: e.target.value,
                                    })
                                }
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {transactionType === "expense" && (
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                รายละเอียด
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="ระบุรายละเอียดการใช้จ่าย..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
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
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        >
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="pending">รอดำเนินการ</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`px-10 py-2.5 rounded-xl text-white font-semibold transition-all shadow-lg flex items-center gap-2 ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-primary hover:bg-primary-dark shadow-primary/20"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                "บันทึกข้อมูล"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
