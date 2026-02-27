import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast, useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Smartphone,
  LogOut,
  Camera,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  CircleDollarSign,
  Star,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

interface PasswordForm {
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
}

interface NotificationSetting {
  id: string,
  label: string,
  description: string,
  enabled: boolean
  rowName: string,
}

const notificationSettings = [
  // {
  //   id: "workout",
  //   label: "Workout Reminders",
  //   description: "Get reminded about scheduled workouts",
  //   enabled: true,
  //   rowName: "workout_reminders",
  // },
  {
    id: "diet",
    label: "Diet & Meal Reminders",
    description: "Receive meal logging reminders",
    enabled: true,
    rowName: "diet_meal_reminders",
  },
  // {
  //   id: "water",
  //   label: "Water Intake Alerts",
  //   description: "Hourly hydration reminders",
  //   enabled: true,
  //   rowName: "water_intake_alerts",
  // },
  {
    id: "sessions",
    label: "Live Session Alerts",
    description: "Notifications before classes start",
    enabled: true,
    rowName: "live_session_alerts",
  },
  // {
  //   id: "progress",
  //   label: "Progress Updates",
  //   description: "Weekly progress summaries",
  //   enabled: true,
  //   rowName: "progress_updates",
  // },
  // {
  //   id: "tips",
  //   label: "Fitness Tips",
  //   description: "Daily motivation and tips",
  //   enabled: true,
  //   rowName: "fitness_tips",
  // },
];

const privacySettings = [
  {
    id: "profile",
    label: "Profile Visibility",
    description: "Who can see your profile",
    options: ["Public", "Private", "Friends Only"],
  },
  {
    id: "photos",
    label: "Progress Photos",
    description: "Who can see your progress photos",
    options: ["Private", "Trainer Only", "Public"],
  },
  {
    id: "activity",
    label: "Activity Status",
    description: "Show when you're active",
    enabled: true,
  },
];

const plans = [
  {
    name: "Starter",
    price: 2999,
    period: "month",
    description: "Perfect for beginners ready to start their fitness journey",
    features: [
      "Access to 50+ basic workouts",
      "Basic nutrition tracking",
      "Progress dashboard",
      "Community access",
      "Email support",
    ],
    cta1: "Upgrade Now",
    cta2: "Subscribe Now",
    popular: false,
  },
  {
    name: "Transform",
    price: 5999,
    period: "month",
    description: "Our most popular plan for serious transformation",
    features: [
      "Access to 300+ workouts",
      "AI-powered program customization",
      "Advanced nutrition planning",
      "Postural assessment tools",
      "Group training access",
      "Priority trainer support",
      "Progress analytics",
      "Offline workout access",
    ],
    cta1: "Upgrade Now",
    cta2: "Subscribe Now",
    popular: true,
  },
  {
    name: "Elite",
    price: 9999,
    period: "month",
    description: "Premium experience with 1-on-1 expert guidance",
    features: [
      "Everything in Transform",
      "Weekly 1-on-1 trainer calls",
      "Custom meal plans",
      "Monthly body composition analysis",
      "VIP community access",
      "Priority scheduling",
      "Family account (up to 4)",
      "Exclusive workshops",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Settings() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<NotificationSetting[]>(notificationSettings);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const { toast } = useToast();
  const {user, signOut} = useAuth();
  
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    dob: "",
    email: "",
  });

  const fetchPlanDetails = () => {
    const expiry = new Date(user.user_metadata.expiry_at).getTime();
    // console.log(expiry)
    const interval = setInterval(() => {
      const now = Date.now();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft(`0d 0h 0m 0s`);
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }
  
  // console.log(user);
  // console.log(planExpiry);
  
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      setForm((prev) => ({ ...prev, email: user.email ?? "" }));
      
      const [profileRes, detailsRes, notifyRes] = await Promise.all([
        supabase
        .from("profiles")
        .select("avatar_url, date_of_birth")
        .eq("user_id", user.id)
        .maybeSingle(),
        
       supabase
         .from("profile_details")
         .select("first_name, last_name, phone, gender")
         .eq("user_id", user.id)
         .maybeSingle(),

       supabase
         .from("notification_preferences")
         .select(
           `
          workout_reminders,
          diet_meal_reminders,
          water_intake_alerts,
          live_session_alerts,
          progress_updates,
          fitness_tips
        `,
         )
         .eq("user_id", user.id)
         .maybeSingle(),
     ]);

     const notifyData = notifyRes.data;

     if (notifyData) {
       setSettings((prev) =>
         prev.map((s) => ({
           ...s,
           enabled: notifyData[s.rowName as keyof typeof notifyData],
         })),
       );
     }

     setAvatarUrl(
       profileRes.data?.avatar_url ??
         "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200",
     );

    //  console.log(profileRes);
    //  console.log(detailsRes);
     setForm((prev) => ({
       ...prev,
       dob: profileRes.data?.date_of_birth ?? "",
       firstName: detailsRes.data?.first_name ?? "",
       lastName: detailsRes.data?.last_name ?? "",
       phone: detailsRes.data?.phone ?? "",
       gender: detailsRes.data?.gender ?? "",
     }));

    // const session = await supabase.auth.getSession()
    // console.log(session)

     setLoading(false);
   }
   loadProfile();
    
   fetchPlanDetails();
  }, [user]);


  //  Notification Toggle Function
  const handleToggle = async (rowName: string, enabled: boolean) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      [rowName]: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    toast({
      title: "Update Failed",
      description: error.message,
      variant: "destructive",
    });
  }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported Image Type",
        description: "Image Format should be jpg/jpeg, png only",
        variant: 'destructive'
      })
      e.target.value = "";
      return;
    }

    if(file.size > maxSize) {
      toast({
        title: "Unsupported Image Size",
        description: "Image Size should be less than 5MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("user-images")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      toast({
        title: "Image Not Uploaded",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("user-images")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (authUpdateError) {
      toast({
        title: "Auth Update Error",
        description: authUpdateError.message,
        variant: "destructive",
      });
    }

    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  // Change Password Function
  const handleChangePassword = async () => {
    if (currentPassword.length < 6) {
      toast({
        title: "Password Change Failed",
        description: "Current Password does not matched",
        variant: "destructive",
      });
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Password Change Failed",
        description: "Please fill all the required fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Change Failed",
        description: "New Passwords Does not matched",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Change Failed",
        description: "New Password Length is too small",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);


    const {error: currPsdError} = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if(currPsdError){
      toast({
        title: "Password Change Failed",
        description: "Current Password Does not matched",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Changed Successfully",
        description: "New Password has been created Successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Delete Account Function
  const deleteAccount = async () => {
  try {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error("No active session");
        return;
      }

    const res = await fetch(
      "https://zoxqjjuokxiyxusqapvv.functions.supabase.co/delete-account",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // Ensure this is explicitly session.access_token
        },
      },
    );
    // ... rest of the function

      // console.log(res);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      await supabase.auth.signOut();
      toast({ title: "Account has been deleted successfully" });
      window.location.href = "/";
      setLoading(false);
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Updating User Details Function
  const handleUserDetails = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Auth error:", userError);
        toast({ title: "Authentication failed", variant: "destructive" });
        return;
      }

      const nameRegex = /^[A-Za-z\s]+$/;
      if(!form.firstName){
        throw new Error("First Name Cannot be empty");
      }
      if (form.firstName) {
          if (form.firstName.length <= 2) {
            throw new Error("First name must be at least 3 characters long.");
          }
          if(form.firstName.length >= 15){
            throw new Error("First name must be less than 15 characters long.");
          }
          if (!nameRegex.test(form.firstName)) {
            throw new Error(
              "First name should contain only alphabetic characters.",
            );
          }
      }

      if (form.lastName) {
        if (form.lastName.length <= 2) {
          throw new Error("Last name must be greater than 2 characters long");
        } else if (form.lastName.length > 30) {
          throw new Error("Last name must be less than 30 characters long");
        } else if (!nameRegex.test(form.lastName)) {
          throw new Error("Last name should only have Alphabets");
        }
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (form.phone.length > 0) {
        if (!phoneRegex.test(form.phone)) {
          throw new Error("Phone Number should only contain 10 Numbers");
        }
      }

      const [profileRes, detailsRes] = await Promise.all([
        supabase
          .from("profiles")
          .update({
            date_of_birth: form.dob || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id),

        supabase.from("profile_details").upsert(
          {
            user_id: user.id,
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            gender: form.gender,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        ),
      ]);

      if (profileRes.error || detailsRes.error) {
        throw new Error(profileRes.error?.message || detailsRes.error?.message);
      }

      await supabase.auth.updateUser({
        data: {
          full_name: `${form.firstName}${form.lastName ? " " + form.lastName : ""}`,
        },
      });

      toast({ title: "Updated Profile Section Successfully" });
    } catch (error) {
      console.error("Update failed:", error.message);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handling Logout
  const handleSignOut = async () => {
    toast({
      title: "Log Out",
      description: "Logged Out From All Devices succcessfully",
    });
    await signOut();
  };

  const getMaxDOB = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 10);
    return today.toISOString().split("T")[0];
  };

  const startPayment = async (price: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login again.",
          variant: "destructive",
        });
        return;
      }
      console.log("Calling backend...");
      // console.log(session.access_token)
      // console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
      const res = await fetch(
        "https://zoxqjjuokxiyxusqapvv.functions.supabase.co/create-razorpay-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ amount: price }),
        },
      );
      console.log("Backend response status:", res);


      if (!res.ok) {
        throw new Error("Failed to create order");
      }

      const order = await res.json();
      console.log("Order:", order);
      const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "Sculpt And Strive",
      description: "Premium Plan",
      method: {
        upi: true,
        card: true,
        netbanking: true,
        emi: false,
        wallet: false,
        paylater: false,
      },
        handler: async function (paymentResponse) {
          console.log("Payment success:", paymentResponse);

          const verifyRes = await fetch(
            "https://zoxqjjuokxiyxusqapvv.functions.supabase.co/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // Authorization: `Bearer ${session.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
              },
              body: JSON.stringify({ ...paymentResponse, 
                amount: price,
                user_id: session.user.id
              }),
            },
          );
          
          // console.log(verifyRes);
          const verifyData = await verifyRes.json()
          // console.log(verifyData);
          if(!verifyData.success){
            // console.log(verifyData);
            console.error("Verification failed:", verifyData);
            toast({
              title: "Payment Verification Failed",
              description: verifyData.error || "Invalid payment",
              variant: "destructive",
            });
            return;
          }

          await supabase.auth.refreshSession();

          toast({
            title: "Payment Successful",
            description: "Your plan has been upgraded.",
          });

          window.location.reload();
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } 
    catch (err) {
      // console.error(err);
      toast({
        title: "Payment Failed",
        description: "Something went wrong.",
        variant: "destructive",
    });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, notifications, and privacy preferences
        </p>
      </motion.div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-muted flex-wrap h-auto gap-2 p-2">
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          {/* <TabsTrigger
            value="privacy"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger> */}
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CircleDollarSign className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">
                Profile Information
              </h3>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl">JD</AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Change Photo"}
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name "
                      value={form.firstName}
                      className="bg-muted border-border mt-1"
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name "
                      value={form.lastName}
                      className="bg-muted border-border mt-1"
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={form.email}
                        readOnly // <--- Add this attribute
                        className="bg-muted border-border pl-10 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        className="bg-muted border-border pl-10"
                        placeholder="Enter Phone Number"
                        value={form.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D{0,10}/g, "");
                          setForm({ ...form, phone: value });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      placeholder="10/12/1980"
                      max={getMaxDOB()}
                      value={form.dob}
                      className="bg-muted border-border mt-1"
                      onChange={(e) =>
                        setForm({ ...form, dob: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={form.gender}
                      onValueChange={(value) =>
                        setForm({ ...form, gender: value })
                      }
                    >
                      <SelectTrigger className="bg-muted border-border mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                {!loading ? (
                  <Button
                    className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
                    onClick={handleUserDetails}
                  >
                    Save Changes
                  </Button>
                ) : (
                  <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                    Loading
                  </Button>
                )}
              </div>
            </div>

            {/* Logout Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-4">
                Session Management
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Logout from all devices</p>
                  <p className="text-sm text-muted-foreground">
                    This will sign you out from all active sessions
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Logout All</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Logout From All Accounts?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will remove all active sessions from your
                        devices.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleSignOut}
                      >
                        Yes, Logout All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            {settings.map((setting, index) => (
              <motion.div
                key={setting.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={(checked) => {
                    setSettings((prev) =>
                      prev.map((s) =>
                        s.id === setting.id ? { ...s, enabled: checked } : s,
                      ),
                    );
                    handleToggle(setting.rowName, checked);
                  }}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">
                Privacy Settings
              </h3>
              <div className="space-y-6">
                {privacySettings.map((setting, index) => (
                  <motion.div
                    key={setting.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    {"options" in setting ? (
                      <Select
                        defaultValue={setting.options[0]
                          .toLowerCase()
                          .replace(" ", "-")}
                      >
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt.toLowerCase().replace(" ", "-")}
                            >
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Switch defaultChecked={setting.enabled} />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">
                Data Management
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Export Your Data</p>
                    <p className="text-sm text-muted-foreground">
                      Download all your fitness data
                    </p>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive">
                      Delete Fitness History
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete all workout and nutrition data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete all your workout history, nutrition logs, and
                          progress data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                          Delete Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Password Change */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">
                Change Password
              </h3>
              <div className="max-w-md space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      className="bg-muted border-border pr-10"
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="bg-muted border-border mt-1"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-muted border-border mt-1"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>

            {/* 2FA */}
            {/* <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-success/10">
                    <Shield className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </div> */}

            {/* Account Deletion */}
            <div className="bg-card border border-destructive/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent and cannot be undone. All your
                        data, including workouts, nutrition logs, progress
                        photos, and personal information will be permanently
                        deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={deleteAccount}
                      >
                        Yes, Delete My Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-xl p-6">
              {(user?.user_metadata?.plan_role === "trial_user" || "user") &&
                user?.user_metadata?.expiry_at && (
                  <div className=" px-4 py-2 rounded-md text-base font-semibold">
                    {user?.user_metadata?.plan_role === "trial_user"
                      ? "Your Trial ends in "
                      : "Your Plan ends in "}
                    <span className="font-bold gradient-text">{timeLeft}</span>
                  </div>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={plan.name}
                  className={`p-8 relative animate-slide-up ${
                    plan.popular
                      ? "md:-mt-4 md:mb-4 ring-2 ring-primary shadow-glow"
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        <Star className="w-4 h-4 fill-current" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="text-center mb-8">
                    <h3
                      className={`font-display text-2xl font-bold mb-2 ${plan.popular ? "text-secondary-foreground" : ""}`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm mb-4 ${plan.popular ? "text-muted-foreground/90" : "text-muted-foreground"}`}
                    >
                      {plan.description}
                    </p>
                    <div
                      className={`flex items-end justify-center gap-1 ${plan.popular ? "gradient-text" : ""}`}
                    >
                      <span className="text-lg">₹</span>
                      <span className="font-display text-5xl font-bold">
                        {plan.price}
                      </span>
                      <span
                        className={`text-sm mb-2 ${plan.popular ? "gradient-text" : "text-muted-foreground"}`}
                      >
                        /{plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            plan.popular ? "bg-white/20" : "bg-primary/10"
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 ${plan.popular ? "text-white" : "text-primary"}`}
                          />
                        </div>
                        <span
                          className={`text-sm ${plan.popular ? "text-muted-foreground" : "text-muted-foreground"}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}

                  {plan.name === "Elite" ? (
                    <a
                      href="https://calendly.com/sculptandstrive/30min"
                      target="_blank"
                    >
                      <Button
                        variant={plan.popular ? "glass" : "hero"}
                        className={`w-full ${plan.popular ? "text-primary-foreground border-white/30 hover:bg-white/20" : ""}`}
                        size="lg"
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "hero"}
                      className={`w-full ${plan.popular ? "text-primary-foreground border-white/30 " : ""}`}
                      size="lg"
                      onClick={() => startPayment(plan.price)}

                      // onClick={() =>
                      //   (window.location.href = `https://users.sculptandstrive.com/auth?tempId=${tempId}`)
                      // }
                    >
                      {user?.user_metadata?.plan_role == 'trial_user' ? plan.cta1 : plan.cta2}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
