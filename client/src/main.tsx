import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable Firebase auth persistence only in dev to avoid browser redirection issues
// during development in case Firebase auth is not yet fully configured
const disableAuthPersistenceInDev = process.env.NODE_ENV === 'development';
if (disableAuthPersistenceInDev) {
  localStorage.setItem('firebase:auth:persistence', 'none');
}

createRoot(document.getElementById("root")!).render(<App />);
