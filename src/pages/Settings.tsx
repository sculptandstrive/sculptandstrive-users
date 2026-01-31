import { useState } from "react";
import { motion } from "framer-motion";
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

const notificationSettings = [
  { id: "workout", label: "Workout Reminders", description: "Get reminded about scheduled workouts", enabled: true },
  { id: "diet", label: "Diet & Meal Reminders", description: "Receive meal logging reminders", enabled: true },
  { id: "water", label: "Water Intake Alerts", description: "Hourly hydration reminders", enabled: false },
  { id: "sessions", label: "Live Session Alerts", description: "Notifications before classes start", enabled: true },
  { id: "progress", label: "Progress Updates", description: "Weekly progress summaries", enabled: true },
  { id: "tips", label: "Fitness Tips", description: "Daily motivation and tips", enabled: false },
];

const privacySettings = [
  { id: "profile", label: "Profile Visibility", description: "Who can see your profile", options: ["Public", "Private", "Friends Only"] },
  { id: "photos", label: "Progress Photos", description: "Who can see your progress photos", options: ["Private", "Trainer Only", "Public"] },
  { id: "activity", label: "Activity Status", description: "Show when you're active", enabled: true },
];

export default function Settings() {
  const [showPassword, setShowPassword] = useState(false);

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
          <TabsTrigger value="account" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lock className="w-4 h-4 mr-2" />
            Security
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
              <h3 className="font-display font-semibold text-lg mb-6">Profile Information</h3>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200" />
                    <AvatarFallback className="text-2xl">JD</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" className="bg-muted border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" className="bg-muted border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" defaultValue="john@example.com" className="bg-muted border-border pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" defaultValue="+91 98765 43210" className="bg-muted border-border pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" defaultValue="1990-05-15" className="bg-muted border-border mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select defaultValue="male">
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
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Logout Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Session Management</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Logout from all devices</p>
                  <p className="text-sm text-muted-foreground">
                    This will sign you out from all active sessions
                  </p>
                </div>
                <Button variant="outline">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">Notification Preferences</h3>
            <div className="space-y-6">
              {notificationSettings.map((setting, index) => (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch defaultChecked={setting.enabled} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">Privacy Settings</h3>
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
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {"options" in setting ? (
                      <Select defaultValue={setting.options[0].toLowerCase().replace(" ", "-")}>
                        <SelectTrigger className="w-40 bg-muted border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options.map((opt) => (
                            <SelectItem key={opt} value={opt.toLowerCase().replace(" ", "-")}>
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
              <h3 className="font-display font-semibold text-lg mb-6">Data Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Export Your Data</p>
                    <p className="text-sm text-muted-foreground">Download all your fitness data</p>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive">Delete Fitness History</p>
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
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all your
                          workout history, nutrition logs, and progress data.
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
              <h3 className="font-display font-semibold text-lg mb-6">Change Password</h3>
              <div className="max-w-md space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      className="bg-muted border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" className="bg-muted border-border mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" className="bg-muted border-border mt-1" />
                </div>
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  Update Password
                </Button>
              </div>
            </div>

            {/* 2FA */}
            <div className="bg-card border border-border rounded-xl p-6">
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
            </div>

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
                        This action is permanent and cannot be undone. All your data,
                        including workouts, nutrition logs, progress photos, and personal
                        information will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                        Yes, Delete My Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
