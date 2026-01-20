export enum Gender {
  male = "male",
  female = "female",
  other = "other",
}

export const GenderLabelTH: Record<Gender, "ชาย" | "หญิง" | "อื่นๆ"> = {
  [Gender.male]: "ชาย",
  [Gender.female]: "หญิง",
  [Gender.other]: "อื่นๆ",
};
