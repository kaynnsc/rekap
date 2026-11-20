import React from "react";
import ReactDOM from "react-dom/client";

// The app is loaded dynamically on purpose: if something throws while the
// modules load (most commonly missing Firebase env vars in a deployed build),
// we can show a readable message instead of a blank white page.

document.body.style.margin = "0";
const root = ReactDOM.createRoot(document.getElementById("root"));

function ErrorScreen({ error }) {
  const message = String(error?.message || error || "Unknown error");
  const looksLikeConfig = /project ?id|api ?key|firebase|import\.meta/i.test(message);
  const font = "'Nunito', system-ui, sans-serif";
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#D9DFF5", fontFamily: font, color: "#26304F" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#FDFCF8", border: "2px solid #232B5E", borderRadius: 16, boxShadow: "5px 5px 0 #232B5E", overflow: "hidden" }}>
        <div style={{ background: "#FFE76B", color: "#232B5E", borderBottom: "2px solid #232B5E", padding: "10px 14px", fontSize: 20, fontWeight: 800 }}>
          Nota couldn’t start
        </div>
        <div style={{ padding: 16, fontSize: 14, lineHeight: 1.5 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700 }}>Something failed while loading the app:</p>
          <pre style={{ margin: "0 0 12px", padding: "8px 10px", background: "#FFC8D6", border: "2px solid #232B5E", borderRadius: 8, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12.5 }}>{message}</pre>
          {looksLikeConfig && (
            <div style={{ margin: "0 0 12px" }}>
              <b>This usually means the Firebase settings are missing from the deployed build.</b> In your host (for example Cloudflare Pages → Settings → Variables and Secrets), add these, then trigger a new deploy (the values are baked in at build time):
              <pre style={{ margin: "8px 0 0", padding: "8px 10px", background: "#fff", border: "2px dashed #232B5E", borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap" }}>{`VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID`}</pre>
            </div>
          )}
          <button onClick={() => window.location.reload()} style={{ minHeight: 44, padding: "0 16px", background: "#232B5E", color: "#FDFCF8", border: "2px solid #232B5E", borderRadius: 12, fontWeight: 800, fontFamily: font, cursor: "pointer", boxShadow: "3px 3px 0 #FFE76B" }}>
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() { return this.state.error ? <ErrorScreen error={this.state.error} /> : this.props.children; }
}

import("./App.jsx")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error(error);
    root.render(<ErrorScreen error={error} />);
  });
