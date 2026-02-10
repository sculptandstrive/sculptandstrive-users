import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Ruler,
  Activity,
  Camera,
  Calendar,
  Target,
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

const workoutData = [
  { week: "Week 1", workouts: 4, duration: 180 },
  { week: "Week 2", workouts: 5, duration: 225 },
  { week: "Week 3", workouts: 4, duration: 200 },
  { week: "Week 4", workouts: 6, duration: 300 },
  { week: "Week 5", workouts: 5, duration: 250 },
  { week: "Week 6", workouts: 5, duration: 275 },
];

export default function Progress() {
  const [uploading, setUploading] = useState(false);
  const [imageLimit, setImageLimit] = useState(3);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([
    { date: "Week 1", imagePath: null },
    { date: "Week 2", imagePath: null },
    { date: "Week 3", imagePath: null },
  ]);
  const { user } = useAuth();

  // State for dynamic data
  const [stats, setStats] = useState<Stats>({
    startingWeight: 0,
    currentWeight: 0,
    weightLost: 0,
    bodyFat: null,
  });
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [bodyFatData, setBodyFatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      if (!user) {
        return;
      }

      try {
        // Fetch all measurements ordered by date
        const { data: allMeasurements, error: measurementsError } =
          await supabase
            .from("current_measurements")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (measurementsError) {
          console.error("Error fetching measurements:", measurementsError);
          setLoading(false);
          return;
        }

        if (!allMeasurements || allMeasurements.length === 0) {
          setLoading(false);
          return;
        }

        // Get starting (first) and current (last) measurements
        const startingMeasurement = allMeasurements[0];
        const currentMeasurement = allMeasurements[allMeasurements.length - 1];

        // Calculate stats
        const weightLost =
          startingMeasurement.weight_kg - currentMeasurement.weight_kg;
        setStats({
          startingWeight: startingMeasurement.weight_kg,
          currentWeight: currentMeasurement.weight_kg,
          weightLost: weightLost,
          bodyFat: currentMeasurement.body_fat_percentage || null,
        });

        // Set measurements with changes from starting values
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

        // Prepare weight chart data
        const weightChartData = allMeasurements.map((m) => ({
          date: new Date(m.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weight: m.weight_kg,
        }));
        setWeightData(weightChartData);

        // Prepare body fat chart data (if available)
        const bodyFatChartData = allMeasurements
          .filter((m) => m.body_fat_percentage)
          .map((m) => ({
            date: new Date(m.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: m.body_fat_percentage,
          }));
        setBodyFatData(bodyFatChartData);

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
      if (!user) {
        return;
      }

      const { data: photos, error: photosError } = await supabase
        .from("progress_photos")
        .select("image_path, label, taken_at")
        .eq("user_id", user.id);

      if (photosError || !photos || photos.length === 0) return;

      // Sorting Photos According to Last Week Available
      const sortedPhotos = [...photos].sort((a, b) => {
        const weekA = parseInt(a.label.split(" ")[1]);
        const weekB = parseInt(b.label.split(" ")[1]);
        return weekA - weekB;
      });

      const lastWeek = parseInt(
        sortedPhotos[sortedPhotos.length - 1].label.split(" ")[1],
      );
      let newSlots = [...progressPhotos];

      // If Images Present more than Last Week then this function will run
      if (lastWeek > 3) {
        const extra = [];
        let i = 4;
        for (; i <= lastWeek; i++) {
          if (!newSlots.find((s) => s.date === `Week ${i}`)) {
            extra.push({
              date: `Week ${i}`,
              imagePath: null,
            });
          }
        }
        newSlots = [...newSlots, ...extra];
        setImageLimit(i - 1);
      }

      // If more than 3 Weeks Images Available
      const updatedPhotos = await Promise.all(
        newSlots.map(async (slot) => {
          const match = photos.find((p) => p.label == slot.date);

          if (!match) return slot;

          const { data: signed } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(match.image_path, 60 * 60);

          return {
            ...slot,
            imagePath: signed?.signedUrl ?? null,
          };
        }),
      );

      setProgressPhotos(updatedPhotos);
    };
    getProgressPhotos();
  }, [user]);

  // Handling New Photo Addition
  const handleAddProgressPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);

    if (!user) {
      setUploading(false);
      return;
    }

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
    const { error: UrlError } = await supabase.from("progress_photos").upsert({
      user_id: user.id,
      image_path: filePath,
      label: progressPhotos[index].date,
      taken_at: new Date(),
    });

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

      // Get the actual file path from database
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
      setUploading(false);
    }
  };

  const handleAddMorePhotos = () => {
    setProgressPhotos([
      ...progressPhotos,
      {
        date: `Week ${imageLimit + 1}`,
        imagePath: null,
      },
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
      highlight: stats.weightLost > 0,
    },
    {
      label: "Body Fat",
      value: stats.bodyFat ? `${stats.bodyFat}%` : "N/A",
      icon: Activity,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">
            Progress Tracking
          </h1>
          <p className="text-muted-foreground">
            Visualize your fitness journey and celebrate your wins
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsDisplay.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card border rounded-xl p-4 ${
              stat.highlight
                ? "border-success/50 bg-success/5 shadow-glow"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon
                className={`w-4 h-4 ${
                  stat.highlight ? "text-success" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p
              className={`text-2xl font-display font-bold ${
                stat.highlight ? "text-success" : ""
              }`}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="weight" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger
            value="weight"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Scale className="w-4 h-4 mr-2" />
            Weight
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Ruler className="w-4 h-4 mr-2" />
            Measurements
          </TabsTrigger>
          <TabsTrigger
            value="workouts"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Activity className="w-4 h-4 mr-2" />
            Workouts
          </TabsTrigger>
          <TabsTrigger
            value="photos"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Camera className="w-4 h-4 mr-2" />
            Photos
          </TabsTrigger>
        </TabsList>

        {/* Weight Tab */}
        <TabsContent value="weight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-lg">
                  Weight Trend
                </h3>
                <Badge className="bg-success/10 text-success">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {stats.weightLost.toFixed(1)} kg
                </Badge>
              </div>
              {weightData.length > 0 ? (
                <div className="h-72">
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
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                      />
                      <YAxis
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                        domain={["dataMin - 2", "dataMax + 2"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222 25% 12%)",
                          border: "1px solid hsl(222 20% 20%)",
                          borderRadius: "8px",
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
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  No weight data available
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">
                Body Fat %
              </h3>
              {bodyFatData.length > 0 ? (
                <div className="h-72">
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
                        tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                        domain={["dataMin - 2", "dataMax + 2"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222 25% 12%)",
                          border: "1px solid hsl(222 20% 20%)",
                          borderRadius: "8px",
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
                <div className="h-72 flex items-center justify-center text-muted-foreground">
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
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">
              Body Measurements
            </h3>
            {measurements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      className="p-4 rounded-xl bg-muted/50 text-center"
                    >
                      <Ruler className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground mb-1">
                        {m.label}
                      </p>
                      <p className="text-2xl font-display font-bold">
                        {m.current} {m.unit}
                      </p>
                      <span
                        className={`text-xs ${isPositive ? "text-success" : "text-destructive"}`}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)} {m.unit}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
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
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">
              Weekly Workout Summary
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(222 20% 20%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    stroke="hsl(215 20% 55%)"
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(215 20% 55%)"
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 25% 12%)",
                      border: "1px solid hsl(222 20% 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="workouts"
                    fill="hsl(174 72% 46%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">
              Progress Photos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {progressPhotos.map((photo, index) =>
                photo.imagePath ? (
                  <motion.div
                    key={photo.date}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-[3/4] rounded-xl overflow-hidden border relative"
                  >
                    <img
                      src={photo.imagePath}
                      alt={photo.date}
                      className="w-full h-full object-cover "
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="bottom-10 left-[30%] absolute z-100"
                      onClick={() => handleRemoveProgressPhoto(index)}
                      disabled={uploading}
                    >
                      Remove Photo
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={photo.date}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-[3/4] rounded-xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center"
                  >
                    <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="font-medium">{photo.date}</p>

                    {/* Hidden file input */}
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
                      className="mt-4"
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
              {imageLimit < 12 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-[3/4] rounded-xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center"
                >
                  <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => handleAddMorePhotos()}
                  >
                    Add More Images
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
