# 🧾 Bill Gram — Billing & Inventory Management

> A robust, offline-first **desktop billing and inventory management application** for small businesses. Built as a cross-platform **Electron app**, it features a local React frontend, a Node.js backend, and a SQLite database.

---

## 🌟 Overview

Bill Gram is a comprehensive Windows desktop application that centralizes business management without requiring an active internet connection. Core capabilities include:
- **Invoicing**: Generate and print GST-compliant purchase and sales invoices.
- **Inventory**: End-to-end product tracking with batch management, barcodes, and MRP.
- **Master Data**: Manage suppliers, customers, salesmen, and regional data in one place.
- **Reporting**: Export professional PDF and Excel reports for sales, purchases, and GST filing.
- **Data Security**: Automated local and Google Drive cloud backups.

---

## 🛠️ Tech Stack

- **Desktop Shell**: Electron (v28)
- **Frontend**: React (v19), TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Redux Toolkit
- **Backend**: Node.js, Express, Puppeteer (PDFs), ExcelJS (Excel)
- **Database & ORM**: SQLite + Prisma

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) and **npm**
- **Git**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anvian-io/Bill_gram.git
   cd Bill_gram
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up Environment Variables**
   - Copy `.env.example` to `.env` in the root, `client/`, and `server/` directories.

4. **Initialize the Database**
   ```bash
   cd server
   npm run prisma:migrate
   cd ..
   ```

5. **Run the Development Servers**
   ```bash
   npm run dev
   ```
   *This concurrently starts the Express backend, Vite frontend, and the Electron desktop window.*

---

## 📦 Building for Production

To compile the application and package it into a distributable Windows installer (NSIS):

```bash
# Build the client and server code
npm run build

# Package into a Windows setup executable
npm run dist
```
The installer will be generated in the `dist/` directory.

---

## 📁 Project Structure

- `electron/`: The Electron main process and secure IPC bridge.
- `client/`: The React frontend codebase.
- `server/`: The Node.js + Express backend and PDF generation logic.
- `server/prisma/`: The SQLite database schema and migration scripts.
- `assets/`: App icons and static build resources.

---

<div align="center">
  <p>Built with ❤️ for small businesses</p>
  <p><strong>Electron</strong> · <strong>React</strong> · <strong>Node.js</strong> · <strong>Prisma</strong> · <strong>SQLite</strong></p>
</div>
