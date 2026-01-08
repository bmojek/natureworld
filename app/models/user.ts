export type UserRole = "user" | "admin";

export interface UserModel {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
