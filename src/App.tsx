import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CalculatorProvider } from "@/contexts/CalculatorContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import Fitness from "./pages/Fitness";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import PreQuestion from "./pages/PreQuestion";
import PostQuestion from "./pages/PostQuestion";
import Calculator from "./pages/Calculator";
import HFCalculator from "./pages/HFCalculator";
import {CATEGORIES} from './utils/Categories'
import BMICalculator from "./components/hf-calculator/BMICalculator";
import TDEECalculator from "./components/hf-calculator/TDEECalculator";
import BodyFatCalculator from "./components/hf-calculator/BodyFatCalculator";
import IdealWeightCalculator from "./components/hf-calculator/IdealWeightCalculator";
import PaceCalculator from "./components/hf-calculator/PaceCalculator";
import PregnancyCalculator from "./components/hf-calculator/PregnancyCalculator";
import MacroCalculator from "./components/hf-calculator/MacroCalculator";
import HFIndex from "./components/hf-calculator/HFIndex";
import BMRCalculator from "./components/hf-calculator/BMRCalculator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CalculatorProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pre-measurement" element={<PreQuestion />} />

              {/* Protected route WITHOUT dashboard layout */}
              <Route
                path="/post-measurement"
                element={
                  <ProtectedRoute>
                    <PostQuestion />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes WITH dashboard layout */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/sessions" element={<Sessions />} />
                        <Route path="/fitness" element={<Fitness />} />
                        <Route path="/nutrition" element={<Nutrition />} />
                        <Route path="/progress" element={<Progress />} />
                        <Route path="/calculator" element={<Calculator />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/hf-calculator" element={<HFCalculator />}>
                          <Route index element={<HFIndex />} />
                          <Route path="bmi" element={<BMICalculator />} />
                          <Route path="bmr" element={<BMRCalculator />} />
                          <Route path="tdee" element={<TDEECalculator />} />
                          <Route
                            path="body-fat"
                            element={<BodyFatCalculator />}
                          />
                          <Route
                            path="ideal-weight"
                            element={<IdealWeightCalculator />}
                          />
                          <Route path="pace" element={<PaceCalculator />} />
                          <Route
                            path="pregnancy"
                            element={<PregnancyCalculator />}
                          />
                          <Route path="macros" element={<MacroCalculator />} />
                        </Route>
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CalculatorProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
