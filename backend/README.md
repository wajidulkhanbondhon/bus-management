# 🚀 ATOMS FastAPI SaaS Backend Engine

This is the dedicated **FastAPI (Python 3.10+)** enterprise backend for the ATOMS Bus Management & Online Pre-Booking SaaS Platform.

---

## 🌟 Key Features
- **⚡ High-Performance:** Built on FastAPI 0.115+, Uvicorn, and Pydantic v2.
- **🏢 Multi-Tenant SaaS Architecture:** Native `tenant_id` support across all database models for multi-company bus management.
- **🐘 PostgreSQL ORM:** SQLAlchemy 2.0 with connection pooling and ACID transactional seat booking.
- **⏱️ 15-Minute Live Payment Timer Engine:** Concurrency-safe seat locking and automatic timer expiration.
- **🔒 JWT & RBAC:** Multi-role access control (Super Admin, Company Admin, Manager, Booking Staff, Accountant).
- **🤖 AI Ready:** Built-in AI Assistant endpoints for natural language inquiries & OCR student admit card scanning.
- **📄 Interactive Swagger API Documentation:** Auto-generated at `http://localhost:8000/docs`.

---

## 🛠️ Quick Setup & Running Guide

### 1. Create Virtual Environment & Install Dependencies
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your PostgreSQL connection:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bus_management?sslmode=disable"
SECRET_KEY="your_super_secret_jwt_key"
```

### 3. Seed Database with Sample SaaS & Demo Data
```bash
python seed.py
```

### 4. Start the FastAPI Development Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📚 Interactive API Documentation
Once running, open your browser:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

---

## 🔑 Default Seeded Demo Accounts
- **👑 Super Admin:** `admin@transport.office` (Password: `admin1234`)
- **👔 Operations Manager:** `manager@transport.office` (Password: `admin1234`)
- **🎟️ Booking Desk Staff:** `staff@transport.office` (Password: `admin1234`)
- **💰 Chief Cashier / Accountant:** `accountant@transport.office` (Password: `admin1234`)
