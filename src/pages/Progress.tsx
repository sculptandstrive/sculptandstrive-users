import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Ruler,
  Activity,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type ProgressPhoto = {
  date: string;
  imagePath: string | null;
};

type MeasurementData = {
  weight_kg: number;
  height_cm: number;
  chest_cm: number;
  waist_cm: number;
  hips_cm: number;
  arms_cm: number;
  thighs_cm: number;
  body_fat_percentage?: number;
  created_at: string;
};

type Stats = {
  startingWeight: number;
  currentWeight: number;
  weightLost: number;
  bodyFat: number | null;
};

type Measurement = {
  label: string;
  current: number;
  previous: number;
  unit: string;
};

type WorkoutChartData = {
  date: string;
  day: string;
  workouts: number;
  calories: number;
};

export default function Progress() {
  const [uploading, setUploading] = useState(false);
  const [imageLimit, setImageLimit] = useState(3);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([
    { date: "Week 1", imagePath: null },
    { date: "Week 2", imagePath: null },
    { date: "Week 3", imagePath: null },
  ]);
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    startingWeight: 0,
    currentWeight: 0,
    weightLost: 0,
    bodyFat: null,
  });
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [bodyFatData, setBodyFatData] = useState<any[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentWeekRange = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  useEffect(() => {
    const getUserData = async () => {
      if (!user) return;

      try {
        const { data: allMeasurements, error: measurementsError } =
          await supabase
            .from("current_measurements")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        const { data: initialMeasurements } = await supabase
          .from("starting_measurements")
          .select("*")
          .eq("user_id", user.id);

        const { data: profileData } = await supabase
          .from("profile_details")
          .select("gender, age")
          .eq("user_id", user.id)
          .single();

        if (
          measurementsError ||
          !allMeasurements ||
          allMeasurements.length === 0
        ) {
          setLoading(false);
          return;
        }

        const startingMeasurement = initialMeasurements[0];
        const currentMeasurement = allMeasurements[allMeasurements.length - 1];

        const calculateBodyFat = (
          weight: number,
          height: number,
          age: number,
          gender: string,
        ): number => {
          const heightInMeters = height / 100;
          const bmi = weight / (heightInMeters * heightInMeters);
          let bodyFat: number;
          if (
            gender?.toLowerCase() === "female" ||
            gender?.toLowerCase() === "woman"
          ) {
            bodyFat = 1.2 * bmi + 0.23 * age - 5.4;
          } else {
            bodyFat = 1.2 * bmi + 0.23 * age - 16.2;
          }
          return Math.max(0, parseFloat(bodyFat.toFixed(1)));
        };

        const userGender = profileData?.gender || "male";
        const userAge = profileData?.age || 25;
        const currentBodyFat = calculateBodyFat(
          currentMeasurement.weight_kg,
          currentMeasurement.height_cm,
          userAge,
          userGender,
        );
        const weightLost =
          startingMeasurement.weight_kg - currentMeasurement.weight_kg;

        setStats({
          startingWeight: startingMeasurement.weight_kg,
          currentWeight: currentMeasurement.weight_kg,
          weightLost,
          bodyFat: currentBodyFat,
        });

        setMeasurements([
          {
            label: "Chest",
            current: currentMeasurement.chest_cm,
            previous: startingMeasurement.chest_cm,
            unit: "cm",
          },
          {
            label: "Waist",
            current: currentMeasurement.waist_cm,
            previous: startingMeasurement.waist_cm,
            unit: "cm",
          },
          {
            label: "Hips",
            current: currentMeasurement.hips_cm,
            previous: startingMeasurement.hips_cm,
            unit: "cm",
          },
          {
            label: "Arms",
            current: currentMeasurement.arms_cm,
            previous: startingMeasurement.arms_cm,
            unit: "cm",
          },
          {
            label: "Thighs",
            current: currentMeasurement.thighs_cm,
            previous: startingMeasurement.thighs_cm,
            unit: "cm",
          },
        ]);

        setWeightData(
          allMeasurements.map((m) => ({
            date: new Date(m.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            weight: m.weight_kg,
          })),
        );

        setBodyFatData(
          allMeasurements.map((m) => ({
            date: new Date(m.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: calculateBodyFat(
              m.weight_kg,
              m.height_cm,
              userAge,
              userGender,
            ),
          })),
        );

        const { monday } = getCurrentWeekRange();
        const { data: workouts, error: workoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("order_index", { ascending: true });

        if (!workoutsError && workouts) {
          const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const fullDayNames = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const workoutChartData: WorkoutChartData[] = [];

          for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const fullDayName = fullDayNames[i];
            const dayWorkout = workouts.find(
              (w: any) => w.day_name === fullDayName,
            );
            let completedExercisesCount = 0;

            if (dayWorkout?.id) {
              const { data: exercises, error: exercisesError } = await supabase
                .from("exercises")
                .select("*")
                .eq("workout_id", dayWorkout.id);
              if (!exercisesError && exercises) {
                completedExercisesCount = exercises.filter(
                  (ex: any) => ex.completed,
                ).length;
              }
            }

            workoutChartData.push({
              date: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              day: daysOfWeek[i],
              workouts: completedExercisesCount,
              calories: completedExercisesCount * 20,
            });
          }
          setWorkoutData(workoutChartData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in getUserData:", error);
        setLoading(false);
      }
    };

    getUserData();
  }, [user]);

  useEffect(() => {
    const getProgressPhotos = async () => {
      if (!user) return;

      const { data: photos, error: photosError } = await supabase
        .from("progress_photos")
        .select("image_path, label, taken_at")
        .eq("user_id", user.id);

      if (photosError || !photos || photos.length === 0) return;

      const sortedPhotos = [...photos].sort((a, b) => {
        const weekA = parseInt(a.label.split(" ")[1]);
        const weekB = parseInt(b.label.split(" ")[1]);
        return weekA - weekB;
      });

      const lastWeek = parseInt(
        sortedPhotos[sortedPhotos.length - 1].label.split(" ")[1],
      );
      let newSlots = [...progressPhotos];

      if (lastWeek > 3) {
        const extra = [];
        let i = 4;
        for (; i <= lastWeek; i++) {
          if (!newSlots.find((s) => s.date === `Week ${i}`)) {
            extra.push({ date: `Week ${i}`, imagePath: null });
          }
        }
        newSlots = [...newSlots, ...extra];
        setImageLimit(i - 1);
      }

      const updatedPhotos = await Promise.all(
        newSlots.map(async (slot) => {
          const match = photos.find((p) => p.label == slot.date);
          if (!match) return slot;
          const { data: signed } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(match.image_path, 60 * 60);
          return { ...slot, imagePath: signed?.signedUrl ?? null };
        }),
      );

      setProgressPhotos(updatedPhotos);
    };
    getProgressPhotos();
  }, [user]);

  const handleAddProgressPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${progressPhotos[index].date}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("progress-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload Failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("progress_photos").upsert({
      user_id: user.id,
      image_path: filePath,
      label: progressPhotos[index].date,
      taken_at: new Date().toISOString(),
    });

    if (dbError) {
      toast({
        title: "Database Error",
        description: dbError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: signed } = await supabase.storage
      .from("progress-photos")
      .createSignedUrl(filePath, 60 * 60);
    setProgressPhotos((photos) =>
      photos.map((photo, i) =>
        i == index ? { ...photo, imagePath: signed?.signedUrl } : photo,
      ),
    );
    toast({
      title: "Image Uploaded",
      description: "You have uploaded image successfully",
    });
    setUploading(false);
  };

  const handleRemoveProgressPhoto = async (index: number) => {
    if (!user) return;
    const photo = progressPhotos[index];
    if (!photo?.imagePath) return;

    try {
      setUploading(true);
      const { data: photoData } = await supabase
        .from("progress_photos")
        .select("image_path")
        .eq("user_id", user.id)
        .eq("label", photo.date)
        .single();

      if (photoData?.image_path) {
        const { error: storageError } = await supabase.storage
          .from("progress-photos")
          .remove([photoData.image_path]);
        if (storageError) {
          toast({
            title: "Delete Failed",
            description: storageError.message,
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      }

      const { error: dbError } = await supabase
        .from("progress_photos")
        .delete()
        .eq("user_id", user.id)
        .eq("label", photo.date);
      if (dbError) {
        toast({
          title: "Database Error",
          description: dbError.message,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      setProgressPhotos((photos) =>
        photos.map((p, i) => (i === index ? { ...p, imagePath: null } : p)),
      );
      toast({
        title: "Image Removed",
        description: "Progress Image Deleted Successfully",
      });
      setUploading(false);
    } catch (err) {
      console.error("Error removing photo:", err);
      setUploading(false);
    }
  };

  const handleAddMorePhotos = () => {
    setProgressPhotos([
      ...progressPhotos,
      { date: `Week ${imageLimit + 1}`, imagePath: null },
    ]);
    setImageLimit(imageLimit + 1);
  };

  const statsDisplay = [
    {
      label: "Starting Weight",
      value: `${stats.startingWeight} kg`,
      icon: Scale,
    },
    {
      label: "Current Weight",
      value: `${stats.currentWeight} kg`,
      icon: Scale,
    },
    {
      label: "Weight Lost",
      value: `${stats.weightLost > 0 ? "-" : "+"}${Math.abs(stats.weightLost).toFixed(1)} kg`,
      icon: stats.weightLost > 0 ? TrendingDown : TrendingUp,
      highlight: stats.weightLost > 0 ? 1 : -1,
    },
    {
      label: "Body Fat",
      value: stats.bodyFat ? `${stats.bodyFat}%` : "N/A",
      icon: Activity,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2dd4bf]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0 sm:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
          Progress Tracking
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visualize your fitness journey and celebrate your wins
        </p>
      </motion.div>

      {/* Stats Grid — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsDisplay.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card border rounded-xl p-3 sm:p-4 ${
              stat.highlight === 1
                ? "border-success/50 bg-success/5 shadow-glow"
                : stat.highlight === -1
                  ? "border-warning/50 bg-warning/5 shadow-glow-accent"
                  : "border-border"
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              <stat.icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                  stat.highlight === 1
                    ? "text-success"
                    : stat.highlight === -1
                      ? "text-warning"
                      : "text-muted-foreground"
                }`}
              />
              <span className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {stat.label}
              </span>
            </div>
            <p
              className={`text-lg sm:text-2xl font-display font-bold ${
                stat.highlight === 1
                  ? "text-success"
                  : stat.highlight === -1
                    ? "text-warning"
                    : ""
              }`}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="weight" className="space-y-4 md:space-y-6">
        {/* Scrollable tab list on mobile */}
        {/* Replace the tab wrapper with this */}
        <div className="w-full overflow-x-auto">
          <TabsList className="bg-muted  flex-wrap h-auto gap-2 p-2">
            <TabsTrigger
              value="weight"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2.5 sm:px-4 whitespace-nowrap"
            >
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Weight
            </TabsTrigger>
            <TabsTrigger
              value="body"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2.5 sm:px-4 whitespace-nowrap"
            >
              <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Measurements
            </TabsTrigger>
            <TabsTrigger
              value="workouts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2.5 sm:px-4 whitespace-nowrap"
            >
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Workouts
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2.5 sm:px-4 whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Photos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Weight Tab */}
        <TabsContent value="weight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {/* Weight Trend Chart */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-display font-semibold text-base sm:text-lg">
                  Weight Trend
                </h3>
                {stats.weightLost < 0 ? (
                  <Badge className="bg-warning/10 text-warning text-xs">
                    <TrendingUp className="w-3 h-3 mr-1 text-warning" />
                    {Math.abs(stats.weightLost).toFixed(1)} kg
                  </Badge>
                ) : (
                  <Badge className="bg-success/10 text-success text-xs">
                    <TrendingDown className="w-3 h-3 mr-1 text-success" />
                    {stats.weightLost.toFixed(1)} kg
                  </Badge>
                )}
              </div>
              {weightData.length > 0 ? (
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                      <defs>
                        <linearGradient
                          id="weightGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(174 72% 46%)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(174 72% 46%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222 20% 20%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                      />
                      <YAxis
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                        domain={["dataMin - 2", "dataMax + 2"]}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222 25% 12%)",
                          border: "1px solid hsl(222 20% 20%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(174 72% 46%)"
                        strokeWidth={3}
                        fill="url(#weightGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 sm:h-72 flex items-center justify-center text-muted-foreground text-sm">
                  No weight data available
                </div>
              )}
            </div>

            {/* Body Fat Chart */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h3 className="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6">
                Body Fat %
              </h3>
              {bodyFatData.length > 0 ? (
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bodyFatData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222 20% 20%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                      />
                      <YAxis
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }}
                        domain={["dataMin - 2", "dataMax + 2"]}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222 25% 12%)",
                          border: "1px solid hsl(222 20% 20%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(38 92% 55%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(38 92% 55%)", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 sm:h-72 flex items-center justify-center text-muted-foreground text-sm">
                  No body fat data available
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="body">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <h3 className="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6">
              Body Measurements
            </h3>
            {measurements.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {measurements.map((m, index) => {
                  const change = m.current - m.previous;
                  const isPositive =
                    m.label === "Arms" || m.label === "Thighs"
                      ? change > 0
                      : change < 0;
                  return (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 sm:p-4 rounded-xl bg-muted/50 text-center"
                    >
                      <Ruler className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2 text-primary" />
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                        {m.label}
                      </p>
                      <p className="text-xl sm:text-2xl font-display font-bold">
                        {m.current === 500 ? "NA" : m.current}{" "}
                        <span className="text-xs sm:text-sm font-normal">
                          {m.current !== 500 ? m.unit : ""}
                        </span>
                      </p>
                      <span
                        className={`text-xs ${isPositive ? "text-success" : "text-destructive"}`}
                      >
                        {m.current !== 500 ? (change > 0 ? "+" : "") : ""}
                        {m.current !== 500 ? change.toFixed(1) : ""}{" "}
                        {m.current !== 500 ? m.unit : ""}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No measurement data available
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <h3 className="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6">
              This Week's Exercise Activity (Mon–Sun)
            </h3>
            {workoutData.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="h-52 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workoutData}
                      margin={{ left: -10, right: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222 20% 20%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                      />
                      <YAxis
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                        allowDecimals={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222 25% 12%)",
                          border: "1px solid hsl(222 20% 20%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelFormatter={(value, payload) => {
                          if (payload && payload.length > 0)
                            return payload[0].payload.date;
                          return value;
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === "workouts")
                            return [value, "Exercises Completed"];
                          if (name === "calories")
                            return [value, "Calories Burned"];
                          return [value, name];
                        }}
                      />
                      <Bar
                        dataKey="workouts"
                        fill="hsl(174 72% 46%)"
                        radius={[4, 4, 0, 0]}
                        name="Exercises Completed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary stats — 3 cols on all sizes */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      Total Exercises
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {workoutData.reduce((sum, day) => sum + day.workouts, 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      Total Calories
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {workoutData.reduce((sum, day) => sum + day.calories, 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      Days Active
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {workoutData.filter((day) => day.workouts > 0).length}/7
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-52 sm:h-72 flex items-center justify-center text-muted-foreground text-sm">
                No workout data available for this week
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6"
          >
            <h3 className="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6">
              Progress Photos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
              {progressPhotos.map((photo, index) =>
                photo.imagePath ? (
                  <motion.div
                    key={photo.date}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-[3/4] rounded-xl overflow-hidden border relative group"
                  >
                    <img
                      src={photo.imagePath}
                      alt={photo.date}
                      className="w-full h-full object-cover"
                    />
                    {/* Label */}
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {photo.date}
                    </div>
                    {/* Remove button — always visible on mobile, hover on desktop */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-3 bg-white/90 hover:bg-white border-0"
                        onClick={() => handleRemoveProgressPhoto(index)}
                        disabled={uploading}
                      >
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={photo.date}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-[3/4] rounded-xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center gap-2 px-2"
                  >
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
                    <p className="font-medium text-xs sm:text-sm text-center">
                      {photo.date}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`progress-${index}`}
                      onChange={(e) => handleAddProgressPhoto(e, index)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-3"
                      onClick={() =>
                        document.getElementById(`progress-${index}`)?.click()
                      }
                      disabled={uploading}
                    >
                      Add Photo
                    </Button>
                  </motion.div>
                ),
              )}

              {/* Add more slot */}
              {imageLimit < 12 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-[3/4] rounded-xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center gap-2 px-2"
                >
                  <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-3"
                    onClick={handleAddMorePhotos}
                  >
                    Add More
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
