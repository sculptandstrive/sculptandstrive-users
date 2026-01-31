import { motion } from "framer-motion";
import { Dumbbell, Flame, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const weeklyData = [
  { day: "Mon", completed: true, workout: "Upper Body" },
  { day: "Tue", completed: true, workout: "Cardio" },
  { day: "Wed", completed: true, workout: "Lower Body" },
  { day: "Thu", completed: false, workout: "Rest Day" },
  { day: "Fri", completed: true, workout: "Full Body" },
  { day: "Sat", completed: false, workout: "HIIT" },
  { day: "Sun", completed: false, workout: "Yoga" },
];

const achievements = [
  { icon: Flame, label: "7-Day Streak", color: "text-accent" },
  { icon: Trophy, label: "Goal Crusher", color: "text-primary" },
  { icon: Target, label: "Perfect Week", color: "text-success" },
];

export function WorkoutProgress() {
  const completedDays = weeklyData.filter((d) => d.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Dumbbell className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Weekly Workout Progress</h3>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weeklyData.map((day, index) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="text-center"
          >
            <div
              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1 transition-all ${
                day.completed
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {day.completed ? "✓" : index + 1}
            </div>
            <span className="text-xs text-muted-foreground">{day.day}</span>
          </motion.div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20 mb-6">
        <div>
          <p className="text-2xl font-display font-bold text-primary">
            {completedDays}/{weeklyData.length}
          </p>
          <p className="text-sm text-muted-foreground">Workouts Completed</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold">1,850</p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </div>
      </div>

      {/* Recent Achievements */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Recent Achievements</p>
        <div className="flex flex-wrap gap-2">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Badge variant="secondary" className="px-3 py-1.5 gap-1.5">
                <achievement.icon className={`w-3.5 h-3.5 ${achievement.color}`} />
                {achievement.label}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
