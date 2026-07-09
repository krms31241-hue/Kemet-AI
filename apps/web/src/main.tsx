import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/typography.css";
import "./styles/animations.css";
import "./styles/utilities.css";

import App from "./app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
