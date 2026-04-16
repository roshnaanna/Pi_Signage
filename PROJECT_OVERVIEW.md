# 📺 Pi Signage: Project Comprehensive Overview

## 🏁 Project Summary
Pi Signage is a professional, edge-first digital signage SaaS platform designed to transform standard monitors into high-impact digital displays. While optimized for Raspberry Pi, it is a hardware-agnostic solution that allows businesses to manage, schedule, and broadcast content (images, videos, and live websites) to screens globally from a unified dashboard.

---

## 🛠️ Tech Stack & Architecture

### **Frontend (Client-Side)**
- **Admin Dashboard**: Vanilla JavaScript (ES6+), CSS3 with CSS Variables, HTML5. Uses a glassmorphic design system for a premium feel.
- **Display Engine**: Specialized broadcast loop designed for kiosk mode. Uses hardware-accelerated CSS transforms for smooth right-to-left transitions.
- **Tools**: `Sortable.js` for drag-and-drop management.

### **Backend (Server-Side)**
- **Environment**: Node.js & Express.js.
- **Authentication**: Stateless JWT (JSON Web Tokens) with Secure HTTP-Only Cookies.
- **Encryption**: BCrypt for secondary password hashing.
- **API Architecture**: RESTful API for playlist orchestration and system discovery.

### **Data & Storage**
- **Database**: MongoDB (Mongoose ODM).
- **Cloud Storage**: Cloudinary integration for optimized image/video delivery.
- **Local Storage**: Local filesystem fallback for offline-resilient environments.

---

## 🔄 How It Works: The Operational Workflow

### 1. Hardware Boot & Onboarding
When the device (Pi) starts and navigates to the `/display` endpoint, it checks its local playlist. 
- **Empty Queue Discovery**: If no playlist exists, the screen displays a beautiful **Blue Onboarding Overlay** showing the device's local network IP address (e.g., `http://192.168.1.104:5000/admin`). This allows the user to find the admin panel without scanning the network.

### 2. Content Management
Admin logs in via `/login` and manages the playlist:
- **Media Upload**: Supports batch image/video uploads.
- **Kiosk Web Mode**: Add any live website URL to be displayed in a full-screen iframe.
- **Granular Scheduling**: Set start/end dates, specific times, and days of the week for every individual asset.
- **Orientation Control**: Rotate sideways assets 90°, 180°, or 270° with a single button. 

### 3. Synchronization (Real-Time Push)
- When the Admin clicks **"Push to Display"**, the server increments a global `displayVersion`.
- All display screens poll the `/api/playlist/version` endpoint every 3 seconds.
- Upon detecting a version change, the display screen fetches the latest data and transitions to the new playlist seamlessly without a page reload.

---

## 👥 Users & Access Control

### **1. Public Users (Customers)**
- **Access**: Root URL (`/`).
- **Vista**: Modern marketing landing page explaining the product.
- **Action**: "Contact Sales" workflow for registration.

### **2. Device Users (The Screen)**
- **Access**: `/display`.
- **Vista**: The live media loop.
- **Permissions**: Read-only (API access to the raw playlist).

### **3. Admin Users (The Controller)**
- **Access**: `/login` -> `/admin`.
- **Permissions**: Full CRUD (Create, Read, Update, Delete) on the playlist and system settings.
- **Security**: Protected by JWT middleware. Unauthorized access to `/admin` or playlist write APIs results in a 401/Redirect.

---

## 🔒 Security Model
- **Route Protection**: The `/admin` directory and all `POST`, `PATCH`, and `DELETE` API routes are strictly protected by an `authMiddleware`.
- **Stateless Sessions**: JWT tokens are used to avoid server-side session overhead, making the system scalable and faster on low-powered edge devices like a Pi.
- **Input Validation**: Mongoose schemas and API logic validate media types and rotation values before saving.

---

## 📈 Key Differentiators
- **Rotation Bulk Tool**: A "One-Click Rotate All" feature for switching between landscape and portrait monitors physical setups instantly.
- **Smart Aspect Ratios**: Intelligent CSS logic that automatically swaps width and height when a website is rotated, ensuring no squashing or layout brokenness.
- **Edge Discovery**: The IP-detection system removes the technical friction usually associated with headless Raspberry Pi deployments.

---

## 📂 Deployment Reference
- **Entry Point**: `server.js`
- **Models**: `/models/Media.js` (The heart of the playlist system)
- **Routes**: `/routes/playlistRoutes.js` (Synchronized version control logic)
- **Public Folder**: Discrete modules for `/landing`, `/admin`, `/display`, and `/login`.

