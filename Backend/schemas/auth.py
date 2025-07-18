from pydantic import BaseModel

# ✅ Schéma pour la requête de récupération de mot de passe
class ForgotPasswordRequest(BaseModel):
    email: str

# Schéma pour la requête de récupération de code type OTP
class OTPRequest(ForgotPasswordRequest):
    code: str

# ✅ Schéma pour la requête de récupération de mot de passe
class ForgotPasswordRequestManager(BaseModel):
    phone: str

# Schéma pour la requête de récupération de code type OTP
class OTPRequestManager(ForgotPasswordRequestManager):
    code: str

# Schéma pour la requête de récupération de code type OTP
class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str
    confirm_password: str

class ResetPasswordRequestManager(BaseModel):
    phone: str
    code: str
    new_code: str
    confirm_code: str
