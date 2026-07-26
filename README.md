markdown
# <img src="public/logo.png" alt="logo" width="50"> MEDCRUSH Blockchain Hospital – Health Consultation Booking App

A decentralized health consultation booking platform that stores **sensitive data off‑chain** (in a PostgreSQL database) while using a lightweight Ethereum smart contract for appointment confirmation and completion.

> **Privacy‑first**: Patient names, symptoms, and descriptions **never** touch the blockchain – only appointment IDs and statuses are on‑chain.

---

## 📖 Overview

This application allows patients to book consultations with doctors.

### Workflow

1. **Doctor** signs up and creates availability slots (date + time ranges).
2. **Patient** connects their wallet (via Privy), views available slots, and books an appointment.
3. The **smart contract** records the appointment on‑chain:
   - Appointment ID
   - Patient wallet
   - Doctor wallet
   - Appointment date
   - Status (`isConfirmed`, `isCompleted`)
     
4. **PostgreSQL** stores off‑chain data:
   - Patient name
   - Description / symptoms
   - Doctor comments
   - Prescriptions (future)
   - Ratings (future)
   
5. **Doctor** confirms or completes the appointment via the dashboard.
   
7. The **frontend** combines on‑chain status with off‑chain data.

---

## ✨ Features

### User Features

- **Doctor Registration & Profile** – doctors sign up and edit their profile (specialty, hospital, bio, etc.).
- **Availability Slots** – doctors create time slots that patients can book.
- **Patient Booking** – patients select a doctor and an available slot, then book an appointment.
- **On‑Chain Status** – appointment status (Pending, Confirmed, Completed) is stored on‑chain.
- **Off‑Chain Data** – patient name, description, and other sensitive info are stored in PostgreSQL.
- **Doctor Dashboard** – doctors view appointments, confirm/reject, and manage slots.
- **Patient Dashboard** – patients view their appointments and status.
- **Role Selector** – users choose "Patient" or "Doctor" role on landing.
- **Responsive UI** – works on both desktop and mobile (Tailwind CSS).
- **Dark / Light Theme** – toggle between themes.
- **Privy Authentication** – email, social, or wallet login.
- **ENS Name Resolution** – display ENS names when available.
- **Smart Contract** – deployed on Sepolia testnet, verified on Sourcify.
- **Real‑Time Updates** – appointments refresh after status changes.
- **Health Tips** – daily health tips displayed on the homepage.
- **Delete Appointments** – doctors can delete appointments (with confirmation).
- **Clear All** – doctors can clear all appointments (with confirmation).
- **Doctor Comments** – doctors can add a comment when confirming, completing, or rejecting an appointment.
- **Transaction History** – the latest transaction hash and block number are stored for each appointment.

### Admin Features

- **Secure Admin Panel** – protected by wallet whitelist (multi‑admin support).
- **Doctor Management** – add, edit, delete, toggle active/inactive.
- **Hospital Settings** – manage hospital name, email, phone, address, social links.
- **Admin Wallet Whitelist** – add/remove admin wallets via the settings page.
- **Statistics Dashboard** – view total appointments, pending, confirmed, completed, cancelled counts.
- **User Overview** – view total doctors and patients.

---

## 🛠 Tech Stack
Layer	Technology

Blockchain	Solidity, Foundry (Sepolia testnet)

Frontend	Next.js 14 (App Router), React, TypeScript, Tailwind CSS

Authentication	Privy (email, social, wallet)

Web3	Wagmi v2, Viem, @privy-io/wagmi

Database	PostgreSQL (Neon) with Prisma ORM

# Prerequisites

Node.js v18+ and npm

Foundry – install guide (check contracts folder)

A PostgreSQL instance – we recommend Neon (free tier)

A Privy account (free) – for authentication

# Git

🔧 Installation & Setup
Clone the repository:

```
git clone https://github.com/tosinchukwu/tcc7-t9-hcbookingapp.git
```

```
cd tcc7-t9-hcbookingapp
```


<i> for contract deployment, check README file in contracts folder for guide </i>


🗄️ Database (PostgreSQL)
Uses Prisma ORM. The schema is in prisma/schema.prisma.
Push the Prisma schema to your database:

```
npx prisma generate
npx prisma db push
Run the development server:
```

# Install necessary dependencies
npm install

# Test the app onL Localhost
```
npm run dev
```
Open http://localhost:3000 in your browser.

🔐 Authentication with Privy
We use Privy to handle authentication (email, social, or wallet login). This replaces WalletConnect and provides a smooth onboarding experience.

Supported Login Methods
Email

Google

External wallet (MetaMask, Rabby, Coinbase Wallet, etc.)

Privy Configuration
Create an app at Privy Console.

Copy your App ID and set PRIVY_APP_ID in the .env.

In Privy Dashboard Domains settings, add your Vercel domain (https://your-app.vercel.app) or localhost.

Provider Setup
The app/providers.tsx file sets up Privy with Wagmi.

⛽ Gas Sponsorship for Google Login (Testnet)
To make onboarding even smoother, gas fees are sponsored for users who log in with Google on the Sepolia testnet. This means:

Users do not need to hold any test ETH to create their first appointment.

The sponsorship is handled automatically by Privy's paymaster feature.

Only applies to testnet – mainnet transactions will require gas as usual.

To enable this, ensure your Privy app has Paymaster enabled and configured for Sepolia in the Privy dashboard and set your PRIVY_APP_SECRET=
in the .env

🛡️ Admin Dashboard
The admin dashboard provides a secure interface for managing the platform.

The environment variable NEXT_PUBLIC_ADMIN_WALLET is used as a fallback if no admin wallets are set.


🏃 Running Locally
bash
npm run dev
Open http://localhost:3000.


🧪 Troubleshooting
Wallet Pop‑Up Not Appearing
If using Privy embedded wallet (email login): Open the Privy modal (click your profile icon) and confirm the pending transaction there.

If using an external wallet (Rabby, MetaMask): Open the wallet extension and check the "Activity" tab for a pending transaction.

Ensure your wallet is on Sepolia and you have test ETH for gas.

Pop‑ups blocked: Allow pop‑ups for your site in browser settings.

Privy Domains: Add your Vercel domain to Allowed Origins in the Privy dashboard.

RPC Connection Issues
If you see 404 Not Found or connection errors, update NEXT_PUBLIC_RPC_URL to a working endpoint:

https://sepolia.gateway.tenderly.co ✅ (recommended)

Database Connection
Use the pooled connection string from Neon (contains -pooler).

If you see relation does not exist, run npx prisma db push to sync the schema.

Profile Update Fails
Ensure yearsExperience is a number – the API parses it correctly.

All required fields (name, specialty) must be provided.

Slots Not Showing for Patients
Slots are stored in the database and do not disappear when the doctor disconnects.

Check that the doctor's id (UUID) is correctly passed from the doctor list.

Refresh the appointment form after the doctor creates slots.

BigInt Serialization Error
If you see Do not know how to serialize a BigInt, the API responses have been fixed to convert BigInt to string. Ensure app/api/appointments/route.ts uses the serializeBigInt helper.

Admin Dashboard Access
Ensure NEXT_PUBLIC_ADMIN_WALLET is set to your wallet address (or add your wallet via the admin settings).

Connect with the same wallet to access /admin.

🤝 Contributing
This project is developed by a team of 4. Please follow the standard Git flow:

