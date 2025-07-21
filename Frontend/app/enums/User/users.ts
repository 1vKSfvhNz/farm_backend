import { Pagination } from "../pagination";

export interface ManagerLogin {
  phone: string;
  code: string;
}

export interface UserBase {
  username: string;
  phone: string;
}

export interface UserManagerCreate extends UserBase {
  key: string;
  code: string;
}

export interface UserManager extends UserBase {}

export interface UserCreate extends UserBase {
  email: string;
  password: string;
  code?: string;
}

export interface UserResponseBase extends UserBase {
  id: number;
  role: string;
  created_at: string;
  last_login?: string;
}

export interface UserResponseManager extends UserResponseBase {}

export interface UserResponse extends UserResponseBase {
  id: number;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
}

export interface UsersResponse {
  users: UserResponse[];
  pagination: Pagination;
}