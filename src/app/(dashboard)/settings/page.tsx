"use client";

import { useEffect, useState } from "react";
import { Camera, Save, Lock } from "lucide-react";
import usePageTitle from "@/hooks/usePageTitle";

export default function SettingsPage() {
  usePageTitle("Settings");

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("/avatar-default.png");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    clinicName: "",
    clinicAddress: "",
    apiUrl: "",
  });

  useEffect(() => {
    // โหลดข้อมูล settings จาก localStorage
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFormData({
        firstName: settings.first_name || "",
        lastName: settings.last_name || "",
        email: settings.email || "",
        phone: settings.phone || "",
        clinicName: settings.clinic_name || "",
        clinicAddress: settings.clinic_address || "",
        apiUrl: localStorage.getItem("apiUrl") || "http://localhost:8000",
      });
      setProfileImage(settings.profile_image || "/avatar-default.png");
    } else {
      setFormData((prev) => ({
        ...prev,
        apiUrl: localStorage.getItem("apiUrl") || "http://localhost:8000",
      }));
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const settings = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        clinic_name: formData.clinicName,
        clinic_address: formData.clinicAddress,
        profile_image: profileImage,
      };

      // บันทึก settings ใน localStorage
      localStorage.setItem("userSettings", JSON.stringify(settings));
      localStorage.setItem("apiUrl", formData.apiUrl);

      alert("บันทึกข้อมูลเรียบร้อย");
    } catch (error) {
      console.error("บันทึกข้อมูลไม่สำเร็จ", error);
      alert("เกิดข้อผิดพลาด: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">จัดการบัญชีผู้ใช้</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Image */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">แก้ไขข้อมูลส่วนตัว</h2>

            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 mb-4">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-primary"
                />
                <label className="absolute bottom-0 right-0 bg-primary text-white p-3 rounded-full hover:bg-primary-dark cursor-pointer transition">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 text-center">
                คลิกไอคอนกล้องเพื่อเปลี่ยนรูป
              </p>
            </div>

            {/* Name Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="กรอกชื่อ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="กรอกนามสกุล"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - User Info & Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">เปลี่ยนรหัสผ่าน</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เปลี่ยนรหัสผ่าน
                </label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  placeholder="ยืนยันรหัสผ่าน"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="button"
                className="w-full px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-medium flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                อัปเดตรหัสผ่านใหม่
              </button>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลคลินิก</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อคลินิก
                </label>
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  placeholder="กรอกชื่อคลินิก"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่คลินิก
                </label>
                <textarea
                  name="clinicAddress"
                  value={formData.clinicAddress}
                  onChange={handleChange}
                  placeholder="กรอกที่อยู่คลินิก"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">ตั้งค่า API</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <input
                  type="text"
                  name="apiUrl"
                  value={formData.apiUrl}
                  onChange={handleChange}
                  placeholder="http://localhost:8000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-2">
                  ระบุ URL ของ Backend API ของคุณ
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">ติดต่อ</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเลขโทรศัพท์
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0xx-xxx-xxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2 text-lg"
          >
            <Save size={20} />
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูลทั้งหมด"}
          </button>
        </div>
      </form>
    </div>
  );
}