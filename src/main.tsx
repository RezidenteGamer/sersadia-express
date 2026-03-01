import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { configureStatusBar } from "./lib/native";

configureStatusBar();

createRoot(document.getElementById("root")!).render(<App />);
