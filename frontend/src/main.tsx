import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "!rounded-[1.2rem] !border !border-white/70 !bg-white/92 !text-slate-900 !shadow-[0_20px_50px_rgba(15,23,32,0.14)]"
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
