import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installApiBaseFetchPatch } from "@/lib/runtimeConfig";

installApiBaseFetchPatch();

createRoot(document.getElementById("root")!).render(<App />);
