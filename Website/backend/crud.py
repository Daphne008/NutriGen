from sqlalchemy.orm import Session
import models, security
from pydantic import BaseModel

# Input Data Schemas
class UserCreate(BaseModel):
    name: str
    institution: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        institution=user.institution,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
