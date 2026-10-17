import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Route, Switch, Redirect, useLocation } from "wouter";
import TenXLaunch from "./TenXLaunch";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Members from "./Members";
import Admin from "./Admin";
import LivePops from "./LivePops";
import MusicPlayer from "./MusicPlayer";
import { LearnPage, GoldrockPage, TapToTradePage, CalculatorPage } from "./InfoPages";
import { trackPageview, captureRef } from "./api";
import { installPixels, pixelPageview } from "./pixels";
import "./index.css";

// The public, still-selling surfaces. /login, /register, /members and /admin are deliberately out.
const POPS_ON = new Set(["/", "/signup", "/learn", "/goldrock", "/tap-to-trade", "/calculator"]);

function App() {
  const [location] = useLocation();
  const firstView = useRef(true);
  // Capture a member's ?ref=<code> the moment anyone lands, so it rides along to signup. + pixels.
  useEffect(() => { captureRef(); installPixels(); }, []);
  // First-party pageview analytics + SPA pixel pageviews on every route.
  useEffect(() => {
    trackPageview(location);
    if (firstView.current) { firstView.current = false; return; }
    pixelPageview();
  }, [location]);
  return (
    <>
    <Switch>
      <Route path="/signup" component={TenXLaunch} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/members" component={Members} />
      <Route path="/admin" component={Admin} />
      <Route path="/learn" component={LearnPage} />
      <Route path="/goldrock" component={GoldrockPage} />
      <Route path="/tap-to-trade" component={TapToTradePage} />
      <Route path="/calculator" component={CalculatorPage} />
      <Route path="/" component={Home} />
      <Route><Redirect to="/" /></Route>
    </Switch>
    {/* Social-proof pops ride the public pages only — somebody already inside /members or /admin
        doesn't need converting, and a card jumping over the desk would just be in the way. */}
    {POPS_ON.has(location.replace(/\/+$/, "") || "/") && <><LivePops /><MusicPlayer /></>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
