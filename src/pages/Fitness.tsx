import { useState, useEffect, useMemo } from "react";
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
  Search,
  Coffee,
  Calendar,
  Settings2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

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
  { day_name: "Monday", workout_name: "Push Day", order_index: 0 },
  { day_name: "Tuesday", workout_name: "Pull Day", order_index: 1 },
  { day_name: "Wednesday", workout_name: "Rest Day", order_index: 2 },
  { day_name: "Thursday", workout_name: "Legs & Core", order_index: 3 },
  { day_name: "Friday", workout_name: "Upper Body", order_index: 4 },
  { day_name: "Saturday", workout_name: "Lower Body", order_index: 5 },
  { day_name: "Sunday", workout_name: "Rest Day", order_index: 6 },
];

export default function Fitness() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<any[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null);
  const [restTime, setRestTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [selectedRestDuration, setSelectedRestDuration] = useState(60);
  const [showRestOptions, setShowRestOptions] = useState(false);

  // Body Stats Logic 
  const [stats, setStats] = useState({
    weight: "0",
    bmi: "0",
    bodyFat: "18.2", // Placeholder as no table column found yet
    muscleMass: "34.8" // Placeholder
  });

  const bodyStats = useMemo(() => [
    { label: "Weight", value: stats.weight, unit: "kg", change: -0.3 },
    { label: "Body Fat", value: stats.bodyFat, unit: "%", change: -0.5 },
    { label: "Muscle Mass", value: stats.muscleMass, unit: "kg", change: 0.2 },
    { label: "BMI", value: stats.bmi, unit: "", change: -0.1 },
  ], [stats]);

  const fetchBodyStats = async (userId: string) => {
    try {
      // Fetching from starting_measurements
      const { data, error } = await supabase
        .from("starting_measurements")
        .select("weight_kg, height_cm")
        .eq("user_id", userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.height_cm > 0) {
        // Dynamic BMI Calculation
        const heightMeters = data.height_cm / 100;
        const bmi = (data.weight_kg / (heightMeters * heightMeters)).toFixed(1);

        setStats(prev => ({
          ...prev,
          weight: data.weight_kg.toString(),
          bmi: bmi
        }));
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  //  Existing Date Helpers 
  const todayDayName = useMemo(() => 
    new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), []
  );

  const weekDates = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const diffToMonday = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        isToday: d.toDateString() === now.toDateString()
      };
    });
  }, []);

  const weekRangeLabel = `${weekDates[0].fullDate} - ${weekDates[6].fullDate}`;

  const getRecommendedRest = (workoutName: string) => {
    const name = workoutName?.toLowerCase() || "";
    if (name.includes("legs") || name.includes("lower") || name.includes("deadlift")) return 90;
    if (name.includes("rest")) return 0;
    if (name.includes("core") || name.includes("abs")) return 30;
    return 60;
  };

  //  Effects 
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (restTime > 0) {
      interval = setInterval(() => setRestTime((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [restTime]);

  useEffect(() => {
    let unsub: any = null;
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await fetchWorkoutData();
        await fetchBodyStats(authData.user.id);
      } else {
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            fetchWorkoutData();
            fetchBodyStats(session.user.id);
          }
        });
        unsub = subscription;
      }
    };
    init();
    return () => { if (unsub?.unsubscribe) unsub.unsubscribe(); };
  }, []);

  //  Core CRUD Logic 
  const fetchExercisesForWorkout = async (workoutId: string) => {
    const { data: exData, error: exError } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", workoutId)
      .order("created_at", { ascending: true });

    if (!exError) setExercises(exData || []);
  };

  const fetchWorkoutData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      let { data: plan } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      let mappedPlan: any[] = [];

      if (!plan || plan.length === 0) {
        const rowsToInsert = DEFAULT_WEEKLY_PLAN.map((d) => ({
          name: d.workout_name,
          user_id: user.id,
          day_name: d.day_name,
          order_index: d.order_index,
          completed: false,
        }));
        const { data: created, error } = await supabase.from("workouts").insert(rowsToInsert as any).select();
        if (!error && created) mappedPlan = created.map(d => ({ ...d, workout_name: d.name }));
      } else {
        mappedPlan = plan.map(p => ({ ...p, workout_name: p.name }));
      }

      setWeeklyPlan(mappedPlan);
      const todayWorkout = mappedPlan.find((p: any) => p.day_name === todayDayName);
      const workoutToShow = todayWorkout || mappedPlan[0];

      if (workoutToShow?.id) {
        setActiveWorkoutId(workoutToShow.id);
        setSelectedRestDuration(getRecommendedRest(workoutToShow.workout_name || ""));
        await fetchExercisesForWorkout(workoutToShow.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateExerciseField = async (id: string, field: string, value: string) => {
    let numValue = parseInt(value) || 0;
    if ((field === 'sets' || field === 'reps') && numValue <= 0) numValue = 1;
    if (field === 'weight_kg' && numValue < 0) numValue = 0;

    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: numValue } : ex));
    await supabase.from('exercises').update({ [field]: numValue }).eq('id', id);
  };

  const handleSwitchDay = async (workoutId: string) => {
    if (isEditingPlan) return;
    setActiveWorkoutId(workoutId);
    const day = weeklyPlan.find(d => d.id === workoutId);
    if (day) setSelectedRestDuration(getRecommendedRest(day.workout_name));
    await fetchExercisesForWorkout(workoutId);
    setRestTime(0);
    setFocusedExerciseId(null);
  };

  const toggleExercise = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: nextStatus } : ex));
    await supabase.from('exercises').update({ completed: nextStatus }).eq('id', id);

    if (activeWorkoutId) {
      const updatedExs = exercises.map(ex => ex.id === id ? { ...ex, completed: nextStatus } : ex);
      const allDone = updatedExs.length > 0 && updatedExs.every(e => e.completed);
      await supabase.from('workouts').update({ completed: allDone } as any).eq('id', activeWorkoutId);
      setWeeklyPlan(prev => prev.map(d => d.id === activeWorkoutId ? { ...d, completed: allDone } : d));
    }
  };

  const addExercise = async (template: typeof exerciseLibrary[0]) => {
    if (isAdding || !activeWorkoutId) return;
    setIsAdding(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return setIsAdding(false);

    const { data, error } = await supabase.from('exercises').insert([{ 
      ...template, 
      completed: false, 
      user_id: authData.user.id, 
      workout_id: activeWorkoutId 
    }]).select();

    if (!error && data) {
      setExercises(prev => [...prev, ...data]);
      setIsLogOpen(false);
      setSearchTerm("");
    }
    setIsAdding(false);
  };

  const handleReset = async () => {
    if (!activeWorkoutId) return;
    setExercises(prev => prev.map(ex => ({ ...ex, completed: false })));
    await supabase.from('exercises').update({ completed: false }).eq('workout_id', activeWorkoutId);
    await supabase.from('workouts').update({ completed: false } as any).eq('id', activeWorkoutId);
    setWeeklyPlan(prev => prev.map(d => d.id === activeWorkoutId ? { ...d, completed: false } : d));
    toast({ title: "Workout Reset" });
  };

  const deleteSingleExercise = async (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    await supabase.from('exercises').delete().eq('id', id);
  };

  const progress = exercises.length > 0 ? (exercises.filter(e => e.completed).length / exercises.length) * 100 : 0;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0f13]">
      <Loader2 className="w-8 h-8 animate-spin text-[#2dd4bf]" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-[#0b0f13] min-h-screen text-white font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Fitness Tracking</h1>
          <p className="text-[14px] text-slate-400">Log workouts and crush your goals</p>
        </div>
        <Button
          onClick={() => setIsLogOpen(true)}
          className="bg-[#2dd4bf] hover:bg-[#26b4a2] text-black font-bold h-10 px-6 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
      </div>

      {/* Body Stats Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Workout Panel */}
        <div className="lg:col-span-2 bg-[#161b22] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[#2dd4bf]">
              <Dumbbell className="w-5 h-5" />
              <h3 className="font-bold text-[16px] tracking-tight">
                {weeklyPlan.find(d => d.id === activeWorkoutId)?.day_name}'s Workout
              </h3>
            </div>
            {restTime > 0 ? (
              <Badge className="bg-orange-500/20 text-orange-500 border-none cursor-pointer" onClick={() => setRestTime(0)}>
                Rest: {restTime}s
              </Badge>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase">
                <Settings2 className="w-3.5 h-3.5" /> Rest: {selectedRestDuration}s
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-slate-400 font-medium">
                {exercises.filter(e => e.completed).length}/{exercises.length} sets done
              </span>
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
                  className={`group flex items-center gap-4 p-4 rounded-xl border ${
                    exercise.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d1117] border-slate-800"
                  }`}
                >
                  <button
                    onClick={() => toggleExercise(exercise.id, exercise.completed)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      exercise.completed ? "bg-emerald-500 text-black border-emerald-500" : "border-slate-700"
                    }`}
                  >
                    {exercise.completed ? <Check className="w-5 h-5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-[15px] font-bold ${exercise.completed ? "text-slate-500 line-through" : "text-white"}`}>
                      {exercise.name}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Sets</span>
                        <Input type="number" className="h-7 w-12 bg-[#161b22] border-slate-800 text-[12px] text-center" 
                          value={exercise.sets} onChange={(e) => updateExerciseField(exercise.id, 'sets', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Reps</span>
                        <Input type="number" className="h-7 w-12 bg-[#161b22] border-slate-800 text-[12px] text-center" 
                          value={exercise.reps} onChange={(e) => updateExerciseField(exercise.id, 'reps', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Weight (kg)</span>
                        <Input type="number" className="h-7 w-16 bg-[#161b22] border-slate-800 text-[12px] text-center" 
                          value={exercise.weight_kg} onChange={(e) => updateExerciseField(exercise.id, 'weight_kg', e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteSingleExercise(exercise.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => setRestTime(selectedRestDuration)} disabled={exercises.length === 0 || restTime > 0}
              className="flex-1 bg-[#2dd4bf] text-black font-bold h-12 rounded-xl text-[13px] uppercase">
              {restTime > 0 ? "Resting..." : <><Timer className="w-4 h-4 mr-2" /> Start Rest</>}
            </Button>
            <Button variant="outline" onClick={handleReset} className="h-12 border-slate-800 text-slate-400 font-bold uppercase px-6 rounded-xl hover:text-red-500">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        {/* Weekly Plan Sidebar */}
        <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2dd4bf]" />
              <h3 className="font-bold text-[16px]">Weekly Plan</h3>
            </div>
            <button onClick={() => setIsEditingPlan(!isEditingPlan)} className={`p-2 rounded-lg ${isEditingPlan ? "bg-[#2dd4bf] text-black" : "text-slate-500"}`}>
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {weeklyPlan.map((day) => (
              <div
                key={day.id}
                onClick={() => handleSwitchDay(day.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeWorkoutId === day.id ? "border-[#2dd4bf] bg-[#2dd4bf]/5" : "bg-[#0d1117] border-slate-800/40"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className={`text-[12px] font-bold ${activeWorkoutId === day.id ? "text-[#2dd4bf]" : "text-slate-400"}`}>
                    {day.day_name}
                  </p>
                  {day.day_name === todayDayName && (
                    <span className="bg-[#2dd4bf] text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Today</span>
                  )}
                </div>
                <p className="text-[13px] font-medium">{day.workout_name || 'Rest Day'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {isLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#161b22] border border-slate-800 p-6 w-full max-w-md rounded-2xl relative shadow-2xl">
              <button onClick={() => setIsLogOpen(false)} className="absolute top-4 right-4 text-slate-500"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4">Add Exercise</h3>
              <Input placeholder="Search library..." className="mb-4 bg-[#0d1117] border-slate-800" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                {exerciseLibrary.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                  <div key={item.name} className="p-4 bg-[#0d1117] border border-slate-800 rounded-xl hover:border-[#2dd4bf] cursor-pointer" onClick={() => addExercise(item)}>
                    <p className="font-bold text-[14px]">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.sets} Sets • {item.reps} Reps</p>
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