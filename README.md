# 💰 FinanceBuddy

FinanceBuddy is a full-stack personal finance management web application that allows users to track expenses and visualize spending insights in real time.

---

## 🚀 Features

* 💳 Add, edit, and delete transactions
* 🗂️ Category-based expense tracking
* 📊 Monthly expense analytics & charts
* 🔐 Secure user authentication
* 🗄️ Persistent data storage

---

## 🛠️ Tech Stack

* **Frontend:** Next.js, React, Tailwind CSS
* **Backend:** Next.js API Routes
* **Database:** PostgreSQL + Prisma ORM
* **Authentication:** Clerk

---

## ⚙️ Setup

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Configure environment variables

```
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=

RESEND_API_KEY=

ARCJET_KEY=
```

Create a `.env` file:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### 3️⃣ Setup database

```bash
npx prisma generate
npx prisma db push
```

### 4️⃣ Run project

```bash
npm run dev
```

## 🎯 Purpose

This project demonstrates:

* Full-stack development skills
* Secure authentication implementation
* Database modeling with Prisma
* RESTful API design
* Data visualization and financial tracking
