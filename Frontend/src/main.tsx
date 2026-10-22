import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import InstallPrompt from "./components/InstallPrompt";
import { AppStoreProvider } from "./store/AppStore";
import { AuthProvider } from "./store/AuthContext";
import { registerServiceWorker } from "./lib/registerServiceWorker";
import "./index.css";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppStoreProvider>
        <AuthProvider>
          <App />
          <InstallPrompt />
        </AuthProvider>
      </AppStoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);