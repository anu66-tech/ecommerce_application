# E-commerce Application

A full-stack modern e-commerce platform built with React, NestJS, Prisma, and PostgreSQL.

## Project Structure

```text
Ecommerce_Application/
├── backend/                  # NestJS backend REST API & Prisma ORM
│   ├── prisma/               # Prisma schema & migrations
│   ├── src/                  # Application source code (controllers, services, modules)
│   ├── test/                 # End-to-end and unit tests
│   └── package.json
├── ecommerce_application/    # React frontend web client
│   ├── src/                  # React components, pages, Redux store, and hooks
│   ├── public/               # Static assets & icons
│   └── package.json
└── prisma-architecture.html  # Prisma architectural diagram & documentation
```

## Features

- **Storefront & Catalog**: Product listings, categories, filtering, and product details.
- **State Management**: Redux Toolkit for cart and global state.
- **Backend API**: Modular NestJS REST architecture.
- **Database & ORM**: PostgreSQL with Prisma ORM for type-safe database queries.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your PostgreSQL credentials
npx prisma generate
npm run start:dev
```

### 2. Frontend Setup

```bash
cd ecommerce_application
npm install
cp .env.example .env
# Update .env if necessary
npm run dev
```
