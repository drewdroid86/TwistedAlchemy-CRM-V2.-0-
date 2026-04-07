# Twisted Alchemy CRM 🪵✨

A modern, "Warm Organic" management system designed for artisanal woodworkers and furniture refurbishers. This application serves two interconnected brands: **Twisted Twig** (Cosmetic Refurbishment) and **Wood Grain Alchemist** (Custom Manufacturing & Structural Repair).

## 🎨 Aesthetic: Warm Organic
The UI is built using the **Warm Organic** design recipe, featuring:
- **Typography:** `Cormorant Garamond` (Serif) for an editorial feel and `Inter` (Sans) for utility.
- **Palette:** Warm Off-White (`#f5f5f0`), Olive Accent (`#5A5A40`), and Dark Olive (`#3D3D2B`).
- **Components:** Large rounded corners (32px), subtle shadows, and smooth animations via `motion/react`.

## 🚀 Key Features

### 1. Dashboard (The Shop Floor)
- **Real-time Stats:** Active projects, WIP value, total revenue, and inventory alerts.
- **Shop Notes:** A digital whiteboard for team communication on the shop floor.
- **Activity Feed:** Quick view of active work orders and low-stock items.

### 2. Inventory Management
- **Multi-Brand Support:** Track materials and pieces for both Twisted Twig and WGA.
- **Categorization:** Manage "Raw Materials" (board-foot tracking), "Furniture Pieces", and "Supplies".
- **Visual Documentation:** Snap and store "Before" photos for furniture acquisitions.

### 3. Project Kanban Board
- **Workflow Triage:** Move projects through stages: Intake → Assessment → Structural Repair → Finishing → Complete.
- **Pricing Calculator:** Built-in tool for Cost-Plus, Competitive, and Value-Added pricing strategies.
- **Work Logs:** Detailed history of actions taken on each piece.
- **Project Gallery:** Document the craft with progress and "After" photos.

### 4. Purchasing & Receipt AI
- **Snap & Save:** Upload receipt photos and let Gemini AI automatically extract vendor, date, and line items.
- **PO System:** Track shop expenses and material acquisitions effortlessly.

### 5. Reports & BI
- **Digital & Physical:** Export data to CSV for accounting or print beautiful monthly review reports.
- **Visual Analytics:** Interactive charts for sales trends, inventory health, and customer value.

### 6. AI Assistant & Guide
- **Ask Gemini:** An integrated AI assistant trained on the shop's specific workflows to answer usage questions or provide woodworking advice.
- **Interactive Walkthrough:** A step-by-step guide for new users to learn the "Intake to Sale" lifecycle.

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Animations:** Motion (formerly Framer Motion)
- **Icons:** Lucide React
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** Google Gemini API (`@google/genai`)

## ⚙️ Setup Instructions

### 1. Environment Variables
Create a `.env` file with the following:
```env
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Firebase Configuration
Ensure `firebase-applet-config.json` is populated with your Firebase project credentials.

### 3. Enable Firebase Services
- **Authentication:** Enable Google Sign-In.
- **Firestore:** Create a database and deploy the provided `firestore.rules`.
- **Storage:** Enable Firebase Storage to support photo uploads.

### 4. Installation
```bash
npm install
npm run dev
```

## 📐 Business Logic
- **Twisted Twig:** Focuses on "Cosmetic Refurbishment". Items requiring structural work are triaged to WGA.
- **Wood Grain Alchemist:** Handles custom builds from raw lumber and structural repairs for Twisted Twig.
- **Financials:** Net profit is calculated per piece by subtracting acquisition and material costs from the final sale price.

---
*Crafted for the shop floor. Built for the business.*
