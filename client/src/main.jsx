import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import "./index.css";
import { persistor, store } from "./redux/store.js";
import { LanguageProvider } from "./i18n.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </PersistGate>
  </Provider>
);
