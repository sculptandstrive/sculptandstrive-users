import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function FitnessAppFlow() {
  const [step, setStep] = useState("auth"); // auth -> questions -> dashboard
  const [answers, setAnswers] = useState({ goal: "", activity: "", diet: "" });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      {step === "auth" && <AuthStep onNext={() => setStep("questions")} />}
      {step === "questions" && (
        <QuestionStep
          answers={answers}
          setAnswers={setAnswers}
          onNext={() => setStep("dashboard")}
        />
      )}
      {step === "dashboard" && <Dashboard />}
    </div>
  );
}

function AuthStep({ onNext }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="w-[360px] rounded-2xl shadow-md">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">Login / Sign Up</h1>
          <Input placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button className="w-full" onClick={onNext}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuestionStep({ answers, setAnswers, onNext }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="w-[420px] rounded-2xl shadow-md">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Tell us about yourself</h2>
          <Input
            placeholder="Your fitness goal"
            value={answers.goal}
            onChange={(e) => setAnswers({ ...answers, goal: e.target.value })}
          />
          <Input
            placeholder="Activity level (Low / Medium / High)"
            value={answers.activity}
            onChange={(e) =>
              setAnswers({ ...answers, activity: e.target.value })
            }
          />
          <Input
            placeholder="Diet preference"
            value={answers.diet}
            onChange={(e) => setAnswers({ ...answers, diet: e.target.value })}
          />
          <Button className="w-full" onClick={onNext}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Dashboard() {
  return (
    <motion.div
      className="w-full max-w-5xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-2xl font-bold mb-6">Your Fitness Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Metric title="Starting Weight" value="85 kg" />
        <Metric title="Current Weight" value="80.5 kg" />
        <Metric title="Weight Lost" value="-4.5 kg" />
        <Metric title="Body Fat" value="18.8%" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Metric title="Chest" value="102 cm" change="-2 cm" />
        <Metric title="Waist" value="82 cm" change="-6 cm" />
        <Metric title="Hips" value="98 cm" change="-2 cm" />
        <Metric title="Arms" value="38 cm" change="+2 cm" />
        <Metric title="Thighs" value="—" />
      </div>
    </motion.div>
  );
}

function Metric({ title, value, change }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
        {change && <p className="text-sm text-gray-400">{change}</p>}
      </CardContent>
    </Card>
  );
}
