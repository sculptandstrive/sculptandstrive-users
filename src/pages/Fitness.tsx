import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Plus,
  Timer,
  Target,
  Check,
  RotateCcw,
  X,
  Loader2,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const exerciseLibrary = [
  { name: "Bench Press", sets: 4, reps: 12, weight_kg: 60 },
  { name: "Shoulder Press", sets: 3, reps: 10, weight_kg: 40 },
  { name: "Lat Pulldown", sets: 4, reps: 12, weight_kg: 50 },
  { name: "Bicep Curls", sets: 3, reps: 15, weight_kg: 15 },
  { name: "Tricep Dips", sets: 3, reps: 12, weight_kg: 0 },
  { name: "Squats", sets: 3, reps: 10, weight_kg: 80 },
  { name: "Deadlifts", sets: 3, reps: 8, weight_kg: 100 },
];

const DEFAULT_WEEKLY_PLAN = [
  { day_name: "Monday", workout_name: "Upper Body", order_index: 0 },
  { day_name: "Tuesday", workout_name: "Lower Body", order_index: 1 },
  { day_name: "Wednesday", workout_name: "Active Recovery", order_index: 2 },
  { day_name: "Thursday", workout_name: "Push Day", order_index: 3 },
  { day_name: "Friday", workout_name: "Pull Day", order_index: 4 },
  { day_name: "Saturday", workout_name: "Legs & Core", order_index: 5 },
  { day_name: "Sunday", workout_name: "Rest Day", order_index: 6 },
];

export default function Fitness() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<any[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  // --- UI STATES ---
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null);
  const [restTime, setRestTime] = useState(0);

  const bodyStats = [
    { label: "Weight", value: "80.5", unit: "kg", change: -0.3 },
    { label: "Body Fat", value: "18.2", unit: "%", change: -0.5 },
    { label: "Muscle Mass", value: "34.8", unit: "kg", change: 0.2 },
    { label: "BMI", value: "24.1", unit: "", change: -0.1 },
  ];

  // Timer 
  useEffect(() => {
    let interval: any;
    if (restTime > 0) {
      interval = setInterval(() => setRestTime((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [restTime]);

  const createDefaultWorkoutsForUser = async (userId: string) => {
    try {
      const rowsToInsert = DEFAULT_WEEKLY_PLAN.map((d) => ({
        name: d.workout_name,
        user_id: userId,
        day_name: d.day_name,
        order_index: d.order_index,
        completed: false,
      }));
      const { data, error } = await supabase.from("workouts").insert(rowsToInsert).select();
      if (error) {
        console.error("Error inserting default workouts:", error);
        return null;
      }
      return data?.map(d => ({ ...d, workout_name: d.name })) || null;
    } catch (err) {
      console.error("Unexpected error creating default workouts:", err);
      return null;
    }
  };

  const fetchWorkoutData = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) return;
      const user = authData?.user;
      if (!user) return;

      let { data: plan, error: planError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (planError) {
        setWeeklyPlan([]);
      } else {
        if (!plan || plan.length === 0) {
          const created = await createDefaultWorkoutsForUser(user.id);
          if (created) {
            setWeeklyPlan(created);
            plan = created;
          }
        } else {
          const mappedPlan = plan.map(p => ({
            ...p,
            workout_name: p.name
          }));
          setWeeklyPlan(mappedPlan);
        }
      }

      const firstWorkout = Array.isArray(plan) && plan.length > 0 ? plan[0] : null;
      if (firstWorkout?.id) {
        setActiveWorkoutId(firstWorkout.id);
        const { data: exData, error: exError } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_id", firstWorkout.id)
          .order("created_at", { ascending: true });

        if (!exError) setExercises(exData || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsub: any = null;
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await fetchWorkoutData();
      } else {
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) fetchWorkoutData();
        });
        unsub = subscription;
      }
    };
    init();
    return () => {
      if (unsub?.unsubscribe) unsub.unsubscribe();
    };
  }, []);

  const progress = exercises.length > 0 ? (exercises.filter(e => e.completed).length / exercises.length) * 100 : 0;

  // --- HANDLERS ---
  const toggleExercise = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: nextStatus } : ex));
    
    if (nextStatus) setFocusedExerciseId(null);
    
    await supabase.from('exercises').update({ completed: nextStatus }).eq('id', id);
  };

  const addExercise = async (template: typeof exerciseLibrary[0]) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user || !activeWorkoutId) return;
    const { data, error } = await supabase.from('exercises').insert([{ ...template, completed: false, user_id: user.id, workout_id: activeWorkoutId }]).select();
    if (!error && data) {
      setExercises(prev => [...prev, ...data]);
      setIsLogOpen(false);
      toast({ title: `${template.name} added!` });
    }
  };

  // stops timer
  const handleReset = async () => {
    if (!activeWorkoutId || exercises.length === 0) return;
    const previousExercises = [...exercises];
    setRestTime(0); 
    setFocusedExerciseId(null);
    setExercises(prev => prev.map(ex => ({ ...ex, completed: false })));
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ completed: false })
        .eq('workout_id', activeWorkoutId);

      if (error) {
        setExercises(previousExercises);
        toast({ title: "Reset failed", variant: "destructive" });
      } else {
        toast({ title: "Workout progress reset" });
      }
    } catch (err) {
      setExercises(previousExercises);
    }
  };

  const handleContinue = () => {
    const nextItem = exercises.find(ex => !ex.completed);
    if (nextItem) {
      setFocusedExerciseId(nextItem.id);
      setRestTime(60);
      toast({ title: "Rest Started", description: `Next: ${nextItem.name}` });
    } else {
      toast({ title: "Workout Complete!" });
    }
  };

  const updateDayWorkout = async (id: string, newName: string) => {
    setWeeklyPlan(prev => prev.map(day => day.id === id ? { ...day, workout_name: newName } : day));
    setEditingDayId(null);
    const { error } = await supabase
      .from('workouts')
      .update({ name: newName }) 
      .eq('id', id);

    if (error) {
      console.error("Update error:", error);
      toast({ title: "Failed to save", variant: "destructive" });
      fetchWorkoutData();
    } else {
      toast({ title: "Plan updated" });
    }
  };

  const deleteSingleExercise = async (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    await supabase.from('exercises').delete().eq('id', id);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0f13]">
      <Loader2 className="w-8 h-8 animate-spin text-[#2dd4bf]" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-[#0b0f13] min-h-screen text-white font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Fitness Tracking</h1>
          <p className="text-[14px] text-slate-400">Log workouts and crush your goals</p>
        </div>
        <Button onClick={() => setIsLogOpen(true)} className="bg-[#2dd4bf] hover:bg-[#26b4a2] text-black font-bold h-10 px-6 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Workout
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {bodyStats.map((stat) => (
          <div key={stat.label} className="bg-[#161b22] border border-slate-800 p-5 rounded-xl">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-[13px] text-slate-500 font-bold">{stat.unit}</span>
            </div>
            <p className={`text-[11px] font-bold mt-2 ${stat.change < 0 ? "text-emerald-500" : "text-blue-500"}`}>
              {stat.change > 0 ? "+" : ""}{stat.change} this week
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#161b22] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[#2dd4bf]">
              <Dumbbell className="w-5 h-5" />
              <h3 className="font-bold text-[16px] tracking-tight">Today's Workout</h3>
            </div>
            {restTime > 0 && (
              <Badge 
                className="bg-orange-500/20 text-orange-500 border-none cursor-pointer hover:bg-orange-500/30 transition-colors"
                onClick={() => setRestTime(0)}
              >
                Rest: {restTime}s
              </Badge>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-slate-400 font-medium">{exercises.filter(e => e.completed).length}/{exercises.length} sets done</span>
              <span className="text-[13px] font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-slate-800" />
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {exercises.map((exercise) => (
                <motion.div
                  key={exercise.id}
                  layout
                  className={`group flex items-center gap-4 p-4 rounded-xl transition-all border ${
                    focusedExerciseId === exercise.id 
                      ? "border-[#2dd4bf] ring-1 ring-[#2dd4bf]" 
                      : exercise.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d1117] border-slate-800"
                  }`}
                >
                  <button onClick={() => toggleExercise(exercise.id, exercise.completed)} className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${exercise.completed ? "bg-emerald-500 text-black" : "border-2 border-slate-700 hover:border-[#2dd4bf]"}`}>
                    {exercise.completed ? <Check className="w-5 h-5 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-[15px] font-bold ${exercise.completed ? "text-slate-500 line-through" : "text-white"}`}>{exercise.name}</p>
                    <p className="text-[11px] text-slate-500 uppercase font-bold">{exercise.sets} sets × {exercise.reps} reps • {exercise.weight_kg || 0}kg</p>
                  </div>
                  <button onClick={() => deleteSingleExercise(exercise.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-4 mt-8">
            <Button 
              onClick={handleContinue} 
              disabled={exercises.length === 0 || restTime > 0} 
              className="flex-1 bg-[#2dd4bf] hover:bg-[#26b4a2] text-black font-bold h-12 rounded-xl text-[13px] uppercase tracking-wider"
            >
              {restTime > 0 ? `Resting (${restTime}s)...` : <><Timer className="w-4 h-4 mr-2" /> Continue Workout</>}
            </Button>
            <Button onClick={handleReset} variant="outline" className="h-12 px-6 rounded-xl border-slate-800 font-bold text-slate-400 text-[13px] uppercase hover:text-red-500">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-8">
            <Target className="w-5 h-5 text-[#2dd4bf]" />
            <h3 className="font-bold text-[16px]">Weekly Plan</h3>
          </div>
          <div className="space-y-3">
            {weeklyPlan.map((day) => (
              <div key={day.id} onClick={() => isEditingPlan && setEditingDayId(day.id)} className={`p-4 rounded-xl border transition-all ${day.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d1117] border-transparent"} ${isEditingPlan ? "cursor-pointer border-dashed border-slate-700 hover:border-[#2dd4bf]" : ""}`}>
                <p className={`text-[13px] font-bold ${day.completed ? "text-emerald-500" : "text-white"}`}>{day.day_name}</p>
                {editingDayId === day.id ? (
                  <input autoFocus className="bg-transparent border-b border-[#2dd4bf] text-[11px] outline-none text-white w-full mt-1" defaultValue={day.workout_name} onBlur={(e) => updateDayWorkout(day.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateDayWorkout(day.id, e.currentTarget.value)} />
                ) : (
                  <p className="text-[11px] text-slate-500 uppercase font-bold">{day.workout_name || 'Rest Day'}</p>
                )}
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setIsEditingPlan(!isEditingPlan)} className="w-full mt-6 text-[12px] font-bold text-slate-500 hover:text-white">
            {isEditingPlan ? "Finish Editing" : "Edit Plan"} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#161b22] border border-slate-800 p-6 w-full max-w-md rounded-2xl relative shadow-2xl">
              <button onClick={() => setIsLogOpen(false)} className="absolute top-4 right-4 text-slate-500"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-6">Add Exercise</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {exerciseLibrary.map((item) => (
                  <div key={item.name} className="p-4 bg-[#0d1117] border border-slate-800 rounded-xl hover:border-[#2dd4bf] cursor-pointer" onClick={() => addExercise(item)}>
                    <p className="font-bold text-[14px]">{item.name}</p>
                    <p className="text-[11px] text-slate-500 uppercase">{item.sets} Sets • {item.reps} Reps</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}