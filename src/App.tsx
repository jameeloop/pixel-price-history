import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import History from "./pages/History";
import ControlPanel from "./pages/ControlPanel";
import PostView from "./pages/PostView";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import PixelBlast from "./components/PixelBlast";

const App = () => (
  <div className="relative min-h-screen">
    {/* Animated Background */}
    <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
      <PixelBlast
        variant="circle"
        pixelSize={6}
        color="#B19EEF"
        patternScale={2}
        patternDensity={1.8}
        pixelSizeJitter={0.3}
        enableRipples
        rippleSpeed={0.6}
        rippleThickness={0.15}
        rippleIntensityScale={1.8}
        liquid={false}
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={1.2}
        edgeFade={0.2}
        transparent
      />
    </div>
    
    {/* Main Content */}
    <div className="relative z-10">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/history" element={<History />} />
          <Route path="/control" element={<ControlPanel />} />
          <Route path="/post/:id" element={<PostView />} />
          <Route path="/success" element={<Success />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  </div>
);

export default App;
