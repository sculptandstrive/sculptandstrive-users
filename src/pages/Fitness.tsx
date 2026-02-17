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

//  CONFIGURATION & TYPES

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

  //  BODY STATS STATE 
  const [stats, setStats] = useState({
    weight: "---",
    weightChange: 0,
    bmi: "---",
    bmiChange: 0,
    bodyFat: "---",
    bodyFatChange: 0,
    muscleMass: "---",
    muscleMassChange: 0
  });

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

  //  TIMER LOGIC 
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTime]);

  //  UTILS 
  const getRecommendedRest = (workoutName: string) => {
    const name = workoutName?.toLowerCase() || "";
    if (name.includes("legs") || name.includes("lower") || name.includes("deadlift")) return 90;
    if (name.includes("rest")) return 0;
    if (name.includes("core") || name.includes("abs")) return 30;
    return 60;
  };

  //  DATA FETCHING
  const fetchBodyStats = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("starting_measurements")
        .select("*")
        .eq("user_id", userId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (data && data.length > 0) {
        const latest = data[0];
        const prev = data.length > 1 ? data[1] : latest;

        const calculateBF = (row: any) => {
          if (row.body_fat_percentage > 0) return row.body_fat_percentage;
          if (!row.waist_cm || !row.neck_cm || !row.height_cm) return 0;
          const bf = 495 / (1.03248 - 0.19077 * Math.log10(row.waist_cm - row.neck_cm) + 0.15456 * Math.log10(row.height_cm)) - 450;
          return Math.max(0, bf); 
        };

        const currentBF = calculateBF(latest);
        const currentWeight = latest.weight_kg || 0;
        const prevWeight = prev.weight_kg || currentWeight;
        const currentMuscle = currentWeight * (1 - (currentBF / 100));

        setStats({
          weight: currentWeight > 0 ? currentWeight.toString() : "---",
          weightChange: Number((currentWeight - prevWeight).toFixed(1)),
          bmi: (latest.height_cm > 0 ? (currentWeight / ((latest.height_cm / 100) ** 2)) : 0).toFixed(1),
          bmiChange: 0,
          bodyFat: currentBF > 0 ? currentBF.toFixed(1) : "---",
          bodyFatChange: 0,
          muscleMass: currentMuscle > 0 ? currentMuscle.toFixed(1) : "---",
          muscleMassChange: 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExercisesForWorkout = async (workoutId: string) => {
    const { data: exData, error: exError } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", workoutId)
      .order("created_at", { ascending: true });
      // console.log(exData);

    if (!exError) setExercises(exData || []);
  };

  const createDefaultWorkoutsForUser = async (userId: string) => {
    try {
      const rowsToInsert = DEFAULT_WEEKLY_PLAN.map((d) => ({
        name: d.workout_name,
        user_id: userId,
        day_name: d.day_name,
        order_index: d.order_index,
        completed: false,
      }));

      const { data, error } = await supabase.from("workouts").insert(rowsToInsert as any).select();
      if (error) return null;
      return data?.sort((a: any, b: any) => a.order_index - b.order_index).map(d => ({ 
        ...d, 
        workout_name: (d as any).name 
      })) || null;
    } catch (err) {
      return null;
    }
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
        const created = await createDefaultWorkoutsForUser(user.id);
        if (created) mappedPlan = created;
      } else {
        mappedPlan = plan.map(p => ({ ...p, workout_name: (p as any).name }));
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

  //  HANDLERS 
  const updateExerciseField = async (id: string, field: string, value: string) => {
    let numValue = parseInt(value) || 0;
    if ((field === 'sets' || field === 'reps') && numValue <= 0) numValue = 1;
    if (field === 'weight_kg' && numValue < 0) numValue = 0;

    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: numValue } : ex));
    const { error } = await supabase.from('exercises').update({ [field]: numValue }).eq('id', id);
    if (error) toast({ title: "Failed to update", variant: "destructive" });
  };

  const handleSwitchDay = async (workoutId: string) => {
    if (isEditingPlan) return;
    setActiveWorkoutId(workoutId);
    const day = weeklyPlan.find(d => d.id === workoutId);
    if (day) setSelectedRestDuration(getRecommendedRest(day.workout_name));
    await fetchExercisesForWorkout(workoutId);
    setRestTime(0);
    setFocusedExerciseId(null);
    setShowRestOptions(false);
  };

  const toggleExercise = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: nextStatus } : ex));
    if (nextStatus) setFocusedExerciseId(null);

    await supabase.from('exercises').update({ completed: nextStatus }).eq('id', id);

    if (activeWorkoutId) {
      const updatedExs = exercises.map(ex => ex.id === id ? { ...ex, completed: nextStatus } : ex);
      const allCompleted = updatedExs.length > 0 && updatedExs.every(e => e.completed);
      await supabase.from('workouts').update({ completed: allCompleted } as any).eq('id', activeWorkoutId);
      setWeeklyPlan(prev => prev.map(day => day.id === activeWorkoutId ? { ...day, completed: allCompleted } : day));
    }
  };

  const addExercise = async (template: typeof exerciseLibrary[0]) => {
    if (isAdding || !activeWorkoutId) return;
    const isAlreadyAdded = exercises.some((ex) => ex.name.trim().toLowerCase() === template.name.trim().toLowerCase());
    if (isAlreadyAdded) {
      toast({ title: "Already Added", description: `${template.name} is already in your list.`, variant: "destructive" });
      return;
    }

    setIsAdding(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) { setIsAdding(false); return; }
    
    const { data, error } = await supabase.from('exercises').insert([{ 
      ...template, 
      completed: false, 
      user_id: authData.user.id, 
      workout_id: activeWorkoutId 
    }]).select();

    if (!error && data) {
      setExercises(prev => [...prev, ...data]);
      setSearchTerm("");
      toast({ title: `${template.name} added!` });
      setIsLogOpen(false);
    } else {
      toast({ title: "Error adding exercise", variant: "destructive" });
    }
    setIsAdding(false);
  };

  const handleReset = async () => {
    if (!activeWorkoutId || exercises.length === 0) return;
    setRestTime(0);
    setFocusedExerciseId(null);
    setExercises(prev => prev.map(ex => ({ ...ex, completed: false })));
    await supabase.from('exercises').update({ completed: false }).eq('workout_id', activeWorkoutId);
    await supabase.from('workouts').update({ completed: false } as any).eq('id', activeWorkoutId);
    setWeeklyPlan(prev => prev.map(day => day.id === activeWorkoutId ? { ...day, completed: false } : day));
    toast({ title: "Progress reset" });
  };

  const handleContinue = () => {
    const nextItem = exercises.find(ex => !ex.completed);
    if (nextItem) {
      setFocusedExerciseId(nextItem.id);
      setRestTime(selectedRestDuration);
      setShowRestOptions(false);
      toast({ title: "Rest Started", description: `Next up: ${nextItem.name}` });
    } else {
      toast({ title: "Workout Complete!" });
    }
  };

  const updateDayWorkout = async (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingDayId(null);
      return;
    }

    setWeeklyPlan((prev) =>
      prev.map((day) => (day.id === id ? { ...day, workout_name: newName } : day))
    );
    setEditingDayId(null);

    try {
      const { error } = await supabase
        .from("workouts")
        .update({ name: newName })
        .eq("id", id);
      if (error) throw error;
      if (id === activeWorkoutId) {
        setSelectedRestDuration(getRecommendedRest(newName));
      }
    } catch (err) {
      toast({ title: "Sync Failed", variant: "destructive" });
    }
  };

  const deleteSingleExercise = async (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    await supabase.from('exercises').delete().eq('id', id);
    toast({ title: "Exercise removed" });
  };

  const progress = exercises.length > 0 ? (exercises.filter(e => e.completed).length / exercises.length) * 100 : 0;

  const bodyStatsDisplay = [
    { label: "Weight", value: stats.weight, unit: "kg", change: stats.weightChange },
    { label: "Body Fat", value: stats.bodyFat, unit: "%", change: stats.bodyFatChange },
    { label: "Muscle Mass", value: stats.muscleMass, unit: "kg", change: stats.muscleMassChange },
    { label: "BMI", value: stats.bmi, unit: "", change: stats.bmiChange },
  ];

  const filteredLibrary = exerciseLibrary.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0b0f13]">
      <Loader2 className="w-8 h-8 animate-spin text-[#2dd4bf]" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto  space-y-8 min-h-screen text-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Fitness Tracking</h1>
          <p className="text-[14px] text-slate-400">Log workouts and crush your goals</p>
        </div>
        <Button
          onClick={() => setIsLogOpen(true)}
          className="bg-[#2dd4bf] hover:bg-[#26b4a2] text-black font-bold h-10 px-6 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {bodyStatsDisplay.map((stat) => (
          <div key={stat.label} className="bg-[#161b22] border border-slate-800 p-4 md:p-5 rounded-xl">
            <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl md:text-2xl font-bold">{stat.value}</span>
              <span className="text-[12px] md:text-[13px] text-slate-500 font-bold">{stat.unit}</span>
            </div>
            <p className={`text-[10px] md:text-[11px] font-bold mt-2 truncate ${
                stat.label === "Muscle Mass" 
                ? (stat.change >= 0 ? "text-blue-500" : "text-red-400")
                : (stat.change <= 0 ? "text-emerald-500" : "text-red-400")
            }`}>
              {stat.change > 0 ? "+" : ""}{stat.change} this week
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Main Workout Panel */}
        <div className="lg:col-span-2 bg-[#161b22] border border-slate-800 rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[#2dd4bf]">
              <Dumbbell className="w-5 h-5" />
              <h3 className="font-bold text-[15px] md:text-[16px] tracking-tight">
                {weeklyPlan.find(d => d.id === activeWorkoutId)?.day_name === todayDayName ? "Today's" : weeklyPlan.find(d => d.id === activeWorkoutId)?.day_name}'s Workout
              </h3>
            </div>
            {restTime > 0 ? (
              <Badge
                className="bg-orange-500/20 text-orange-500 border-none cursor-pointer hover:bg-orange-500/30 transition-colors animate-pulse"
                onClick={() => setRestTime(0)}
              >
                Rest: {restTime}s
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest">Rest: {selectedRestDuration}s</span>
              </div>
            )}
          </div>

          <div className="mb-6">
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all border ${
                    focusedExerciseId === exercise.id
                      ? "border-[#2dd4bf] ring-1 ring-[#2dd4bf]"
                      : exercise.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d1117] border-slate-800"
                  }`}
                >
                  <button
                    onClick={() => toggleExercise(exercise.id, exercise.completed)}
                    className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      exercise.completed ? "bg-emerald-500 text-black border-emerald-500" : "border-2 border-slate-700 hover:border-[#2dd4bf]"
                    }`}
                  >
                    {exercise.completed ? <Check className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] md:text-[15px] font-bold truncate ${exercise.completed ? "text-slate-500 line-through" : "text-white"}`}>
                      {exercise.name}
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4 mt-1.5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Sets</span>
                        <Input 
                          type="number" 
                          className="h-7 w-10 md:w-12 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                          value={exercise.sets}
                          onChange={(e) => updateExerciseField(exercise.id, 'sets', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col shrink-0">
                        <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase mb-0.5">Reps</span>
                        <Input 
                          type="number" 
                          className="h-7 w-10 md:w-12 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                          value={exercise.reps}
                          onChange={(e) => updateExerciseField(exercise.id, 'reps', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col shrink-0">
                        <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase mb-0.5">Weight (kg)</span>
                        <Input 
                          type="number" 
                          className="h-7 w-14 md:w-16 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                          value={exercise.weight_kg}
                          onChange={(e) => updateExerciseField(exercise.id, 'weight_kg', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSingleExercise(exercise.id)}
                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}

              {exercises.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  {weeklyPlan.find(d => d.id === activeWorkoutId)?.workout_name?.toLowerCase().includes("rest") 
                    ? <><Coffee className="w-10 h-10 mb-3 opacity-20 text-[#2dd4bf]" /> <p>It's a Rest Day! Take it easy.</p></>
                    : (
                      <>
                        <Dumbbell className="w-10 h-10 mb-3 opacity-20" /> 
                        <p className="mb-4 text-sm px-4">No exercises added for this day.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsLogOpen(true)}
                          className="border-[#2dd4bf]/30 text-[#2dd4bf] hover:bg-[#2dd4bf]/10"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Exercise
                        </Button>
                      </>
                    )
                  }
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 md:mt-8 space-y-4">
            <AnimatePresence>
              {showRestOptions && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-wrap items-center gap-2 p-3 bg-[#0d1117] rounded-xl border border-slate-800"
                >
                  <div className="flex flex-wrap gap-2">
                    {[30, 45, 60, 90, 120].map((sec) => (
                      <Button
                        key={sec}
                        variant="ghost"
                        onClick={() => {
                          setSelectedRestDuration(sec);
                          setShowRestOptions(false);
                        }}
                        className={`h-9 text-[11px] font-bold px-3 rounded-lg border transition-all ${
                          selectedRestDuration === sec 
                            ? "border-[#2dd4bf] text-[#2dd4bf] bg-[#2dd4bf]/5" 
                            : "border-slate-800 text-slate-500 hover:border-slate-700"
                        }`}
                      >
                        {sec}s
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 ml-auto border-l border-slate-800 pl-4 h-9">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                      Custom
                    </span>
                    <div className="relative flex items-center">
                      <Input 
                        type="number" 
                        className="w-16 h-9 bg-black/40 border-slate-800 text-[12px] text-center font-mono focus-visible:ring-[#2dd4bf] focus-visible:border-[#2dd4bf] pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={selectedRestDuration}
                        onChange={(e) => setSelectedRestDuration(Math.max(0, parseInt(e.target.value) || 0))}
                      />
                      <span className="absolute right-2 text-[10px] text-slate-600 pointer-events-none font-bold">
                        s
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-2 md:flex-0 flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col md:flex-row gap-2">
                 <Button
                  onClick={handleContinue}
                  disabled={exercises.length === 0 || restTime > 0}
                  className="flex-1 bg-[#2dd4bf] hover:bg-[#26b4a2] text-black font-bold h-12 rounded-xl text-[12px] md:text-[13px] uppercase tracking-wider"
                >
                  {restTime > 0 ? `Resting (${restTime}s)...` : <><Timer className="w-4 h-4 mr-2" /> Start Rest Timer</>}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowRestOptions(!showRestOptions)}
                  className={`h-12 w-12 p-0 rounded-xl border-slate-800 shrink-0 ${showRestOptions ? "text-[#2dd4bf] border-[#2dd4bf]/50" : "text-slate-500"}`}
                >
                  <Settings2 className="w-5 h-5" />
                </Button>
              </div>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className=" h-12 px-6 rounded-xl border-slate-800 font-bold text-slate-400 text-[13px] uppercase hover:text-red-500"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Weekly Plan Sidebar */}
        <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2dd4bf]" />
              <h3 className="font-bold text-[16px]">Weekly Plan</h3>
            </div>
            <button 
                onClick={() => setIsEditingPlan(!isEditingPlan)}
                className={`p-2 rounded-lg transition-colors ${isEditingPlan ? "bg-[#2dd4bf] text-black" : "text-slate-500 hover:text-white"}`}
            >
                <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-black/40 rounded-lg border border-slate-800/50 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{weekRangeLabel}</span>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar min-h-[300px]">
            {weeklyPlan.map((day) => {
              const dateInfo = weekDates.find(wd => wd.dayName === day.day_name);
              const isToday = dateInfo?.isToday;
              
              return (
                <div
                  key={day.id || day.day_name}
                  onClick={() => isEditingPlan ? setEditingDayId(day.id) : handleSwitchDay(day.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group/day ${
                    activeWorkoutId === day.id
                      ? "border-[#2dd4bf] bg-[#2dd4bf]/5 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                      : isToday ? "border-slate-700 bg-slate-800/20" : day.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d1117] border-slate-800/40"
                  } ${isEditingPlan ? "border-dashed border-slate-600 hover:border-[#2dd4bf]" : "hover:border-slate-700"}`}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-2">
                      <p className={`text-[12px] font-bold ${day.completed ? "text-emerald-500" : (activeWorkoutId === day.id ? "text-[#2dd4bf]" : isToday ? "text-white" : "text-slate-400")}`}>
                        {day.day_name}
                      </p>
                      {isToday && (
                        <span className="bg-[#2dd4bf] text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          Today
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold ${isToday ? "text-[#2dd4bf]" : "text-slate-600"}`}>
                      {dateInfo?.fullDate}
                    </span>
                  </div>
                  
                  {editingDayId === day.id ? (
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            autoFocus
                            className="bg-[#0d1117] border border-[#2dd4bf] rounded px-2 py-1 text-[13px] outline-none text-white w-full"
                            defaultValue={day.workout_name}
                            onBlur={(e) => updateDayWorkout(day.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateDayWorkout(day.id, (e.currentTarget as any).value)}
                        />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                        <p className={`text-[13px] font-medium ${activeWorkoutId === day.id ? "text-white" : "text-slate-300"}`}>
                        {day.workout_name || 'Rest Day'}
                        </p>
                        {isEditingPlan && <ChevronRight className="w-3 h-3 text-slate-600 group-hover/day:text-[#2dd4bf]" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-4 text-center shrink-0">
            {isEditingPlan ? "Click a workout name to rename it." : "Select a day to view its workout."}
          </p>
        </div>
      </div>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {isLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#161b22] border border-slate-800 p-6 w-full max-w-md rounded-2xl relative shadow-2xl"
            >
              <button
                onClick={() => setIsLogOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-bold mb-4">Add Exercise</h3>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search library..." 
                  className="pl-10 bg-[#0d1117] border-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredLibrary.map((ex) => (
                  <button
                    key={ex.name}
                    onClick={() => addExercise(ex)}
                    disabled={isAdding}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-slate-800 hover:border-[#2dd4bf] hover:bg-[#2dd4bf]/5 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-[14px] group-hover:text-[#2dd4bf]">{ex.name}</p>
                      <p className="text-[11px] text-slate-500">{ex.sets} sets • {ex.reps} reps</p>
                    </div>
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Plus className="w-4 h-4 text-slate-500 group-hover:text-[#2dd4bf]" />}
                  </button>
                ))}
                {filteredLibrary.length === 0 && (
                  <p className="text-center py-8 text-slate-500 text-sm">No exercises found.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}