# React + Vite

## Run the frontend with the NestJS backend

Open two terminals from the workspace:

```powershell
cd backend
npm run start:dev
```

```powershell
cd ecommerce_application
npm run dev
```

The frontend calls `http://localhost:3000/health` and shows the API connection
status in the storefront header. The backend allows the Vite origin
`http://localhost:5173` by default. If either app uses a different address, set
`VITE_API_URL` for the frontend and `FRONTEND_URL` for the backend.

This connection currently verifies backend availability only. Product, cart,
and account data still use the frontend's local demo storage; those features
need corresponding API endpoints and persistence before they are backed by
NestJS.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
