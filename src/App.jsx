import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "@/lib/PageNotFound";
import Dashboard from "@/pages/dashboard";
import { ModeProvider } from "@/lib/ModeContext";

function App() {
  return (
    <ModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </ModeProvider>
  );
}

export default App;
