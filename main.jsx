import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

function showFatalError(err) {
  const root = document.getElementById("root");
  if (!root) return;
  const name = (err && err.name) || "Error";
  const message = (err && err.message) || String(err);
  const stack = (err && err.stack) || "(no stack)";
  root.innerHTML =
    '<div style="font-family: sans-serif; padding: 24px; color:#333; max-width:600px; margin:40px auto;">' +
    '<h1 style="color:#e11d48;">Oups, une erreur est survenue</h1>' +
    '<p style="font-weight:bold; font-size:16px;">' + name + ': ' + message + '</p>' +
    '<p>Fais une capture de ce texte et envoie-le à Claude :</p>' +
    '<pre style="white-space:pre-wrap; background:#f5f5f5; padding:16px; border-radius:8px; font-size:11px;">' +
    stack +
    '</pre></div>';
}

window.addEventListener("error", (e) => showFatalError(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => showFatalError(e.reason));

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  showFatalError(err);
}
