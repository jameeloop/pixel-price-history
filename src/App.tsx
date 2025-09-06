import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import History from "./pages/History";
import ControlPanel from "./pages/ControlPanel";
import PostView from "./pages/PostView";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

const App = () => (
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
);

export default App;
