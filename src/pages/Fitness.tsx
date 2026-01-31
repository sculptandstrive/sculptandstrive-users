import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Plus,
  Flame,
  Timer,
  Target,
  TrendingUp,
  ChevronRight,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const todayWorkout = {
  name: "Upper Body Strength",
  duration: "45 min",
  calories: 320,
  exercises: [
    { name: "Bench Press", sets: 4, reps: 12, weight: "60kg", completed: true },
    { name: "Shoulder Press", sets: 3, reps: 10, weight: "40kg", completed: true },
    { name: "Lat Pulldown", sets: 4, reps: 12, weight: "50kg", completed: false },
    { name: "Bicep Curls", sets: 3, reps: 15, weight: "15kg", completed: false },
    { name: "Tricep Dips", sets: 3, reps: 12, weight: "BW", completed: false },
  ],
};

const weeklyPlan = [
  { day: "Monday", workout: "Upper Body", completed: true },
  { day: "Tuesday", workout: "Cardio HIIT", completed: true },
  { day: "Wednesday", workout: "Lower Body", completed: true },
  { day: "Thursday", workout: "Rest Day", completed: false, isRest: true },
  { day: "Friday", workout: "Full Body", completed: false },
  { day: "Saturday", workout: "HIIT", completed: false },
  { day: "Sunday", workout: "Yoga & Stretch", completed: false },
];

const bodyStats = [
  { label: "Weight", value: "80.5", unit: "kg", change: -0.3 },
  { label: "Body Fat", value: "18.2", unit: "%", change: -0.5 },
  { label: "Muscle Mass", value: "34.8", unit: "kg", change: 0.2 },
  { label: "BMI", value: "24.1", unit: "", change: -0.1 },
];

export default function Fitness() {
  const completedExercises = todayWorkout.exercises.filter((e) => e.completed).length;
  const progress = (completedExercises / todayWorkout.exercises.length) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Fitness Tracking</h1>
          <p className="text-muted-foreground">
            Log workouts, track progress, and crush your goals
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Log Workout
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {bodyStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold">{stat.value}</span>
              <span className="text-muted-foreground">{stat.unit}</span>
            </div>
            <span
              className={`text-xs ${
                stat.change > 0
                  ? stat.label === "Muscle Mass"
                    ? "text-success"
                    : "text-destructive"
                  : stat.label === "Muscle Mass"
                  ? "text-destructive"
                  : "text-success"
              }`}
            >
              {stat.change > 0 ? "+" : ""}
              {stat.change} from last week
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-lg">Today's Workout</h3>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {todayWorkout.name}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {completedExercises}/{todayWorkout.exercises.length} exercises completed
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Exercise List */}
          <div className="space-y-3">
            {todayWorkout.exercises.map((exercise, index) => (
              <motion.div
                key={exercise.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  exercise.completed
                    ? "bg-success/10 border border-success/20"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <button
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    exercise.completed
                      ? "bg-success text-success-foreground"
                      : "border-2 border-muted-foreground hover:border-primary"
                  }`}
                >
                  {exercise.completed && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      exercise.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {exercise.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight}
                  </p>
                </div>
                {!exercise.completed && (
                  <Button variant="ghost" size="sm">
                    Start
                  </Button>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground">
              <Timer className="w-4 h-4 mr-2" />
              Continue Workout
            </Button>
            <Button variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </motion.div>

        {/* Weekly Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Weekly Plan</h3>
          </div>

          <div className="space-y-3">
            {weeklyPlan.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  day.completed
                    ? "bg-success/10 border border-success/20"
                    : day.isRest
                    ? "bg-muted/30"
                    : "bg-muted/50"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{day.day}</p>
                  <p className="text-xs text-muted-foreground">{day.workout}</p>
                </div>
                {day.completed && (
                  <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                    <Check className="w-3 h-3 text-success-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            Edit Plan
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
