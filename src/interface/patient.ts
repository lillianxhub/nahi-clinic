export interface Patient {
  id: number;
  citizenId: string;
  fullName: string;
  gender: "ชาย" | "หญิง";
  birthDate: string;
  phone: string;
}
