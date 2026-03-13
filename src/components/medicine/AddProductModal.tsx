"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    Pill,
    Package,
    DollarSign,
    Calendar,
    Tag,
    Layers,
    Plus,
    Trash2,
} from "lucide-react";
import { medicineService } from "@/services/medicine";
import { DrugCategory, Medicine } from "@/interface/medicine";
import AddCategoryModal from "@/components/medicine/AddCategoryModal";
import AddSupplierModal from "@/components/medicine/AddSupplierModal";
import UnifiedDrugDropdown from "../UnifiedDrugDropdown";
import SupplierDropdown from "@/components/medicine/SupplierDropdown";
import { Button } from "@/components/ui/button";
import swal from "sweetalert2";
import { formatLocalDate } from "@/utils/dateUtils";
import { useDebounce } from "@/hooks/useDebounce";

interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ProductFormData {
    medicine_name: string;
    product_type: string;
    category_id: string;
    buy_unit: string;
    conversion_factor: string;
    unit: string;
    quantity: string;
    buy_price: string;
    sell_price: string;
    received_date: string;
    expiry_date: string;
    lot_no: string;
    supplier_id: string;      // Added supplier fields
    supplier_name: string;
    category_name?: string; // For display
}

export default function AddProductModal({
    open,
    onClose,
    onSuccess,
}: AddProductModalProps) {
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<DrugCategory[]>([]);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [searchingSuppliers, setSearchingSuppliers] = useState(false);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const supplierDropdownRef = useRef<HTMLDivElement>(null);

    const [products, setProducts] = useState<ProductFormData[]>([]);

    // Auto-complete states
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [searchingMedicines, setSearchingMedicines] = useState(false);
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getTodayStr = () => formatLocalDate(new Date());

    const generateLotNo = (dateStr: string) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `LOT-${year}${month}-${day}`;
    };

    const initialFormData: ProductFormData = {
        medicine_name: "",
        product_type: "drug",
        category_id: "",
        buy_unit: "",
        conversion_factor: "",
        unit: "",
        quantity: "",
        buy_price: "",
        sell_price: "",
        received_date: getTodayStr(),
        expiry_date: "",
        lot_no: generateLotNo(getTodayStr()),
        supplier_id: "",
        supplier_name: "",
    };

    const [formData, setFormData] = useState<ProductFormData>(initialFormData);

    const debouncedMedicineSearch = useDebounce(formData.medicine_name, 500);
    const debouncedSupplierSearch = useDebounce(supplierSearchTerm, 500);

    useEffect(() => {
        const fetchMedicines = async () => {
            if (
                !debouncedMedicineSearch ||
                debouncedMedicineSearch.length < 2
            ) {
                try {
                    setSearchingMedicines(true);
                    const res = await medicineService.getMedicines({
                        pageSize: 10,
                        activeStatus: "active",
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
                    q: debouncedMedicineSearch,
                    pageSize: 5,
                    activeStatus: "active",
                });
                setMedicines(res.data);
            } catch (error) {
                console.error("ค้นหายาล้มเหลว", error);
            } finally {
                setSearchingMedicines(false);
            }
        };

        if (showMedicineDropdown) {
            fetchMedicines();
        }
    }, [debouncedMedicineSearch, showMedicineDropdown]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setSearchingSuppliers(true);
                const res = await medicineService.getSuppliers({
                    q: debouncedSupplierSearch,
                });
                setSuppliers(res.data);
            } catch (error) {
                console.error("ค้นหาซัพพลายเออร์ล้มเหลว", error);
            } finally {
                setSearchingSuppliers(false);
            }
        };

        if (showSupplierDropdown) {
            fetchSuppliers();
        }
    }, [debouncedSupplierSearch, showSupplierDropdown]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowMedicineDropdown(false);
            }
            if (
                supplierDropdownRef.current &&
                !supplierDropdownRef.current.contains(event.target as Node)
            ) {
                setShowSupplierDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (open) {
            fetchCategories();
            const today = getTodayStr();
            setFormData((prev) => ({
                ...prev,
                received_date: today,
                lot_no: generateLotNo(today),
            }));
            setProducts([]);
        }
    }, [open]);

    const fetchCategories = async (type?: string) => {
        try {
            const response = await medicineService.getCategories(type);
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    // Auto-fetch categories when product type changes
    useEffect(() => {
        if (open) {
            fetchCategories(formData.product_type);
        }
    }, [formData.product_type, open]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;

        if (name === "category_id" && value === "add_newCategory") {
            setShowAddCategory(true);
            return;
        }

        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            if (name === "category_id") {
                const category = categories.find(
                    (c) => c.category_id === value,
                );
                if (category) newData.category_name = category.category_name;
            }

            // Auto-update lot number if received_date changes
            if (name === "received_date") {
                newData.lot_no = generateLotNo(value);
            }

            return newData;
        });
    };

    const handleAddToList = (e: React.FormEvent) => {
        e.preventDefault();

        // Find category name if not already set
        const selectedCategory = categories.find(
            (c) => c.category_id === formData.category_id,
        );
        const itemToAdd = {
            ...formData,
            category_name: selectedCategory?.category_name || "ไม่ระบุหมวดหมู่",
        };

        setProducts([...products, itemToAdd]);
        setFormData({
            ...initialFormData,
            received_date: getTodayStr(),
            lot_no: generateLotNo(getTodayStr()),
        });
    };

    const removeProduct = (index: number) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        setProducts(newProducts);
    };

    const handleSaveAll = async () => {
        if (products.length === 0) return;

        const result = await swal.fire({
            title: "ยืนยันการเพิ่มรายการ",
            text: `คุณต้องการเพิ่มสินค้าทั้งหมด ${products.length} รายการหรือไม่?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "var(--primary)",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "บันทึกข้อมูล",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);

            // Execute all creation promises
            await Promise.all(
                products.map((item) =>
                    medicineService.createMedicine({
                        product_name: item.medicine_name,
                        product_type: item.product_type,
                        category_id: item.category_id,
                        buy_unit: item.buy_unit,
                        conversion_factor: item.conversion_factor
                            ? Number(item.conversion_factor)
                            : 1,
                        unit: item.unit,
                        quantity: Number(item.quantity),
                        buy_price: Number(item.buy_price),
                        sell_price: Number(item.sell_price),
                        received_date: item.received_date,
                        expiry_date: item.expiry_date,
                        lot_no: item.lot_no,
                        supplier_id: item.supplier_id, // Important fix
                    }),
                ),
            );

            await swal.fire({
                title: "บันทึกสำเร็จ",
                text: "เพิ่มสินค้าเข้าระบบเรียบร้อยแล้ว",
                icon: "success",
                confirmButtonText: "ตกลง",
                timer: 1500,
                showConfirmButton: false,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("บันทึกข้อมูลไม่สำเร็จ", error);

            swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                icon: "error",
                confirmButtonText: "ตกลง",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isFormValid =
        formData.medicine_name.trim() &&
        formData.category_id &&
        formData.buy_unit.trim() &&
        formData.conversion_factor &&
        formData.unit.trim() &&
        formData.quantity &&
        Number(formData.buy_price) > 0 &&
        Number(formData.sell_price) > 0 &&
        formData.expiry_date &&
        formData.supplier_name.trim(); // Changed from supplier_id to allow new suppliers implicitly or explicitly

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-card w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-linear-to-r from-primary to-primary-light px-6 py-5 relative shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Package className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                เพิ่มสินค้าหลายรายการ
                            </h2>
                            <p className="text-white/80 text-sm">
                                เพิ่มยาหรือเวชภัณฑ์เข้าสู่รายการก่อนบันทึกทีเดียว
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

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
                    {/* Form Section */}
                    <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100 lg:w-1/2">
                        <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <Pill size={20} className="text-primary" />
                            ข้อมูลสินค้า
                        </h3>
                        <form onSubmit={handleAddToList} className="space-y-4">
                            {/* Medicine Name */}
                            <div
                                className="space-y-1.5 relative"
                                ref={dropdownRef}
                            >
                                {/* Supplier Name */}
                                <div
                                    className="space-y-1.5 relative"
                                    ref={supplierDropdownRef}
                                >
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        ซัพพลายเออร์{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="supplier_name"
                                            placeholder="ค้นหาหรือกรอกชื่อซัพพลายเออร์"
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                            value={supplierSearchTerm}
                                            onChange={(e) => {
                                                setSupplierSearchTerm(e.target.value);
                                                setFormData(prev => ({ ...prev, supplier_id: "", supplier_name: e.target.value }));
                                                setShowSupplierDropdown(true);
                                            }}
                                            onFocus={() =>
                                                setShowSupplierDropdown(true)
                                            }
                                            required
                                        />

                                        {/* Supplier Dropdown */}
                                        <SupplierDropdown
                                            isOpen={showSupplierDropdown}
                                            searchTerm={supplierSearchTerm}
                                            items={suppliers}
                                            isSearching={searchingSuppliers}
                                            onSelect={(s) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    supplier_id: s.supplier_id,
                                                    supplier_name: s.supplier_name,
                                                }));
                                                setSupplierSearchTerm(s.supplier_name);
                                                setShowSupplierDropdown(false);
                                            }}
                                            onAddNew={() => {
                                                setShowSupplierDropdown(false);
                                                setShowAddSupplier(true);
                                            }}
                                        />
                                    </div>
                                </div>
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    ชื่อสินค้า{" "}
                                    <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="medicine_name"
                                        placeholder="กรอกชื่อสินค้า"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.medicine_name}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setShowMedicineDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowMedicineDropdown(true)
                                        }
                                        required
                                    />

                                    {/* Medicine Dropdown */}
                                    <UnifiedDrugDropdown
                                        isOpen={showMedicineDropdown}
                                        searchTerm={formData.medicine_name}
                                        items={medicines}
                                        isSearching={searchingMedicines}
                                        displayMode="category"
                                        onSelect={(m) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                medicine_name: m.product_name,
                                                product_type:
                                                    m.product_type || "drug",
                                                category_id:
                                                    m.category?.category_id ||
                                                    "",
                                                unit: m.unit,
                                                sell_price: m.sell_price
                                                    ? m.sell_price.toString()
                                                    : "",
                                                buy_price:
                                                    m.lots && m.lots.length > 0
                                                        ? m.lots[0].buy_price.toString()
                                                        : prev.buy_price,
                                            }));
                                            setShowMedicineDropdown(false);
                                        }}
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                {/* Product Type */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        ประเภท{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="product_type"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                                        value={formData.product_type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="drug">ยา</option>
                                        <option value="supply">เวชภัณฑ์</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        หมวดหมู่{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="category_id"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">เลือกหมวดหมู่</option>
                                        {categories.map((cat) => (
                                            <option
                                                key={cat.category_id}
                                                value={cat.category_id}
                                            >
                                                {cat.category_name}
                                            </option>
                                        ))}
                                        <option
                                            value="add_newCategory"
                                            className="text-primary font-medium"
                                        >
                                            + เพิ่มหมวดหมู่
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Buy Quantity */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        จำนวนที่ซื้อ{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        placeholder="0"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                    />
                                </div>

                                {/* Buy Unit */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        หน่วยซื้อเข้า{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="buy_unit"
                                        placeholder="กล่อง, แผง"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.buy_unit}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Conversion Factor */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        จำนวนหน่วยย่อย/หน่วยซื้อ{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="conversion_factor"
                                        placeholder="เช่น 10"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.conversion_factor}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                    />
                                </div>

                                {/* Unit */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        หน่วยย่อย{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="unit"
                                        placeholder="เม็ด, ขวด"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Buy Price */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        ทุน/หน่วย{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="buy_price"
                                        placeholder="0.00"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.buy_price}
                                        onChange={handleChange}
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>

                                {/* Sell Price */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        ขาย/หน่วย{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="sell_price"
                                        placeholder="0.00"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.sell_price}
                                        onChange={handleChange}
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Received Date */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        วันนำเข้า{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="received_date"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.received_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Expiry Date */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        วันหมดอายุ{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="expiry_date"
                                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={formData.expiry_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Lot No */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    เลขล็อต (Lot No.)
                                </label>
                                <input
                                    type="text"
                                    name="lot_no"
                                    placeholder="ระบุเลขล็อต"
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={formData.lot_no}
                                    onChange={handleChange}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={!isFormValid}
                                className="w-full cursor-pointer flex justify-center items-center gap-2 py-2 mt-4"
                            >
                                <Plus size={18} />
                                เพิ่มเข้ารายการ
                            </Button>
                        </form>
                    </div>

                    {/* List Section */}
                    <div className="flex-1 p-6 bg-gray-50 flex flex-col lg:w-1/2 overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                                <Layers size={20} className="text-primary" />
                                รายการที่เตรียมเพิ่ม ({products.length})
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-sm min-h-50">
                            {products.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 p-6 text-center">
                                    <Package
                                        size={48}
                                        className="text-gray-200"
                                    />
                                    <p>ยังไม่มีรายการสินค้า</p>
                                    <p className="text-sm">
                                        โปรดกรอกข้อมูลทางด้านซ้ายและกด
                                        &quot;เพิ่มเข้ารายการ&quot;
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Group products by supplier */}
                                    {Array.from(new Set(products.map((p) => p.supplier_name))).map(
                                        (supplierName) => (
                                            <div key={supplierName} className="mb-4 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-sm font-semibold text-gray-700 flex items-center justify-between">
                                                    <span>ซัพพลายเออร์: {supplierName || "ไม่ระบุ"}</span>
                                                    <span className="text-xs font-normal text-muted-foreground">
                                                        {products.filter((p) => p.supplier_name === supplierName).length} รายการ
                                                    </span>
                                                </div>
                                                <ul className="divide-y divide-gray-100">
                                                    {products
                                                        .map((item, index) => ({ item, index }))
                                                        .filter((data) => data.item.supplier_name === supplierName)
                                                        .map(({ item, index }) => (
                                                            <li
                                                                key={index}
                                                                className="p-4 hover:bg-gray-50/50 transition-colors"
                                                            >
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div className="space-y-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-medium text-gray-900 truncate">
                                                                                {item.medicine_name}
                                                                            </span>
                                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary whitespace-nowrap">
                                                                                {item.product_type ===
                                                                                    "supply"
                                                                                    ? "เวชภัณฑ์"
                                                                                    : "ยา"}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                                {item.category_name}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex gap-4 text-sm flex-wrap text-gray-600 mt-1">
                                                                            <span>
                                                                                Lot:{" "}
                                                                                <span className="text-gray-800">
                                                                                    {item.lot_no}
                                                                                </span>
                                                                            </span>
                                                                            <span>
                                                                                จำนวนที่ซื้อ:{" "}
                                                                                <span className="text-gray-800">
                                                                                    {item.quantity}{" "}
                                                                                    {item.buy_unit}
                                                                                </span>
                                                                            </span>
                                                                            <span>
                                                                                รวมทั้งสิ้น:{" "}
                                                                                <span className="text-gray-800">
                                                                                    {Number(
                                                                                        item.quantity,
                                                                                    ) *
                                                                                        Number(
                                                                                            item.conversion_factor,
                                                                                        )}{" "}
                                                                                    {item.unit}
                                                                                </span>
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex gap-4 text-sm flex-wrap text-gray-600">
                                                                            <span>
                                                                                ทุน:{" "}
                                                                                <span className="text-gray-800">
                                                                                    ฿
                                                                                    {Number(
                                                                                        item.buy_price,
                                                                                    ).toLocaleString()}
                                                                                </span>
                                                                            </span>
                                                                            <span>
                                                                                ขาย:{" "}
                                                                                <span className="text-gray-800">
                                                                                    ฿
                                                                                    {Number(
                                                                                        item.sell_price,
                                                                                    ).toLocaleString()}
                                                                                </span>
                                                                            </span>
                                                                            <span className="text-orange-600">
                                                                                หมดอายุ:{" "}
                                                                                {new Date(
                                                                                    item.expiry_date,
                                                                                ).toLocaleDateString(
                                                                                    "th-TH",
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() =>
                                                                            removeProduct(index)
                                                                        }
                                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                                                        title="ลบรายการ"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-light px-6 py-4 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-5 py-2 border border-gray-300 rounded-lg font-medium text-foreground hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={loading || products.length === 0}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 cursor-pointer"
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
                            `บันทึกทั้งหมด (${products.length})`
                        )}
                    </button>
                </div>
            </div>

            <AddCategoryModal
                open={showAddCategory}
                onClose={() => {
                    setShowAddCategory(false);
                    setFormData({ ...formData, category_id: "" });
                }}
                onSuccess={() => fetchCategories(formData.product_type)}
            />
            <AddSupplierModal
                open={showAddSupplier}
                initialData={{ supplier_name: supplierSearchTerm }}
                onClose={() => setShowAddSupplier(false)}
                onSuccess={(newSupplier) => {
                    setFormData((prev) => ({
                        ...prev,
                        supplier_id: newSupplier.supplier_id,
                        supplier_name: newSupplier.supplier_name,
                    }));
                    setSupplierSearchTerm(newSupplier.supplier_name);
                }}
            />
        </div>
    );
}
