import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from app.db.session import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admission_id = Column(String, unique=True, index=True, nullable=True)  # e.g. "RU-2026-98124"
    full_name = Column(String, nullable=False)
    phone = Column(String, index=True, nullable=False)
    gender = Column(String, nullable=False)  # "MALE", "FEMALE", "OTHER"
    institution = Column(String, nullable=True)
    group_category = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    guardians = orm_relationship("Guardian", back_populates="student", cascade="all, delete-orphan")
    booking_passengers = orm_relationship("BookingPassenger", back_populates="student")


class Guardian(Base):
    __tablename__ = "guardians"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relation_type = Column("relationship", String, nullable=False)  # "FATHER", "MOTHER", "BROTHER", "SISTER", "UNCLE", "OTHER"
    gender = Column(String, nullable=False)                         # "MALE", "FEMALE"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    student = orm_relationship("Student", back_populates="guardians")
    booking_passengers = orm_relationship("BookingPassenger", back_populates="guardian")
