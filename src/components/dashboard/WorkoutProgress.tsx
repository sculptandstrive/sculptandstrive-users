import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Flame, Target, Trophy, Check, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const achievementsList = [
  { icon: Flame, label: "7-Day Streak", color: "text-orange-500", goal: 7 },
  { icon: Trophy, label: "Goal Crusher", color: "text-[#2dd4bf]", goal: 4 },
  { icon: Target, label: "Perfect Week", color: "text-green-500", goal: 7 },
];

export default function WorkoutProgress() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      if (data) {
        
        const normalizedData = data.reduce((acc: any[], current: any) => {
          const exists = acc.find(item => item.day_name === current.day_name);
          if (!exists) {
            return [...acc, current];
          }
          return acc;
        }, []);

        setWeeklyData(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // re-normalize data on every update
    const channel = supabase
      .channel('schema-db-changes-progress')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'workouts',
        filter: `user_id=eq.${user?.id}` 
      }, fetchStats)
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user?.id]);

  const resetWeeklyProgress = async () => {
    if (!user) return;

    // Optimistic UI update
    setWeeklyData(prev => prev.map(day => ({ ...day, completed: false })));
    
    const { error } = await supabase
      .from('workouts')
      .update({ completed: false } as any)
      .eq('user_id', user.id); // Targeted reset for current user only

    if (error) {
      toast({ title: "Reset Failed", variant: "destructive" });
      fetchStats();
    } else {
      toast({ title: "Weekly Progress Reset" });
    }
  };

  const completedDays = weeklyData.filter((d) => d.completed).length;
  const totalCalories = weeklyData.reduce((acc, curr) => acc + (Number(curr.calories_burned) || 0), 0);

  if (loading) return (
    <div className="bg-[#161b22] rounded-2xl border border-slate-800 p-6 flex justify-center items-center h-[300px]">
      <Loader2 className="w-8 h-8 animate-spin text-[#2dd4bf]/50" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#161b22] rounded-2xl border border-slate-800 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#2dd4bf]" />
          <h3 className="text-[16px] font-bold tracking-tight text-white">Weekly Progress</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetWeeklyProgress}
          className="h-8 text-[11px] font-bold text-slate-500 hover:text-white hover:bg-slate-800 gap-1.5"
        >
          <RotateCcw className="w-3 h-3" /> RESET ALL
        </Button>
      </div>

      {/* 7-Day Visual Tracker */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weeklyData.map((day, index) => (
          <div key={day.id || index} className="text-center">
            <div
              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1.5 transition-all ${
                day.completed
                  ? "bg-[#2dd4bf] text-black shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                  : "bg-[#0d1117] text-slate-500 border border-slate-800"
              }`}
            >
              {day.completed ? (
                <Check className="w-5 h-5 stroke-[3px]" />
              ) : (
                <span className="text-[12px] font-bold">
                {day.day_name ? day.day_name[0] : (index + 1)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {day.day_name?.substring(0, 3) || `Day ${index + 1}`}
            </span>
          </div>
        ))}
      </div>

      {/* Stats Summary Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d1117] border border-slate-800 mb-6">
        <div>
          <p className="text-2xl font-bold text-[#2dd4bf] leading-none mb-1">
            {completedDays}/{weeklyData.length || 7}
          </p>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Workouts Done</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white leading-none mb-1">
            {totalCalories.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Kcal Burned</p>
        </div>
      </div>

      {/* Dynamic Achievement Badges */}
      <div className="flex flex-wrap gap-2">
        {achievementsList.map((achievement) => {
          const isUnlocked = completedDays >= achievement.goal;
          return (
            <Badge 
              key={achievement.label} 
              variant="secondary" 
              className={`px-3 py-1.5 gap-1.5 border font-bold text-[10px] rounded-lg transition-all ${
                isUnlocked 
                ? "bg-[#2dd4bf]/10 border-[#2dd4bf]/20 text-white" 
                : "bg-[#0d1117] border-slate-800 text-slate-500 opacity-50"
              }`}
            >
              <achievement.icon className={`w-3.5 h-3.5 ${isUnlocked ? achievement.color : "text-slate-600"}`} />
              {achievement.label}
            </Badge>
          );
        })}
      </div>
    </motion.div>//
  );
}