export interface ForgotPasswordRequest {
  email: string;
}

export interface OTPRequest extends ForgotPasswordRequest {
  code: string;
}

export interface ForgotPasswordRequestManager {
  phone: string;
}

export interface OTPRequestManager extends ForgotPasswordRequestManager {
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordRequestManager {
  phone: string;
  code: string;
  new_code: string;
  confirm_code: string;
}