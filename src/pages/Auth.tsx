import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Dumbbell } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import LogoImage from '../assets/logo.png'
import { supabase } from "@/integrations/supabase/client";

// const emailSchema = z.string().email("Please enter a valid email address");
// const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tempId, setTempId] = useState<string | null>(null);
  // const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fullNameRegex = /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const passwordRegex = /^.{6,12}$/

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/");
    }
    const getTempId = searchParams.get('tempId');
    getTempId ? setTempId(getTempId) : null;
    getTempId ? setIsLogin(false) : setIsLogin(true);

  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      if (isLogin) {
        if(email === ""){
          if(password === ""){
            toast({
              title: "Login Failed",
              description: "Enter Valid Email and Password",
              variant: "destructive"
            })
            return;
          }
          toast({
            title: "Login Failed",
            description: "Enter Valid Email",
            variant: "destructive"
          });
          return;
        }
        if(password === ""){
          toast({
            title: "Please Enter Correct Password",
            description: "Password should not be empty",
            variant: "destructive",
          });
          return;
        }

        if(!emailRegex.test(email)){
          toast({
            title: "Sign Up Failed",
            description: "Please Input Correct Email",
            variant: "destructive",
          });
          return;
        }
        else if(!passwordRegex.test(password)){
          toast({
            title: "Please enter correct password",
            description: "Password should be 6-12 characters",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          if(error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          navigate("/post-measurement");
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
        }
      } else {
        if(fullName === "")
        {
          if(email === ""){
            if(password === ""){
              toast({
                title: "Full Name Error",
                description: "Enter Valid input all field.",
                variant: "destructive",
              })
              return;
            }
            toast({
              title: "Sign Up Failed",
              description: "FullName and Email should not be blank",
              variant: "destructive",
            });
            return;
          }
          toast({
            title: "Sign Up Failed",
            description: "Full Name Field are not blank",
            variant: "destructive",
          });
           return;
        }

        if(!fullNameRegex.test(fullName)){
          if(!emailRegex.test(email) && !passwordRegex.test(password)){
            toast({
              title: "Sign Up Failed",
              description: "Enter Correct input all field.",
              variant: "destructive",
            });
            return;
          }
          toast({
            title: 'Full Name Error',
            description: "Special Characters or Numbers are not allowed",
            variant: 'destructive'
          })
          return;
        }

        if(!emailRegex.test(email)){
          toast({
            title: "Sign Up Failed",
            description: "Please Input Correct Email",
            variant: "destructive",
          });
          return;
        }
        if (!passwordRegex.test(password)) {
          toast({
            title: "Please enter correct password",
            description: "Password should be 6-12 characters",
            variant: "destructive",
          });
          return;
        }
        console.log(tempId);
        const userType = tempId ? 'trial_user' : "user" ;
        console.log(userType);
        const { error } = await signUp(email, password, fullName, userType);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }

        } else {
          if(error){
            console.log("Error is: ", error);
          }
          
          toast({
            title: "Account created!",
            description: "Welcome to Sculpt & Strive!",
          });
          navigate("/pre-measurement");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Enter email",
        description: "Please enter your email first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset link sent",
        description: "Check your email to continue",
      });
    }
  };

  const handleFullName = (e) => {
    if (e.target.value === ""){
      setFullName("");
      return;
    }
      if (e.target.value.length > 40) {
        toast({
          title: "Full Name Error",
          description: "Max Limit is 40 Letters",
          variant: "destructive",
        });
        return;
      }
    if (!/^[a-zA-Z\s]*$/.test(e.target.value)) {
      toast({
        title: "Full Name Error",
        description: "Only Alphabets are allowed",
        variant: "destructive",
      });
      return;
    }

    setFullName(e.target.value);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full  flex items-center justify-center">
            <img
              src={LogoImage}
              className="w-full h-full text-primary-foreground"
            />
            {/* <Dumbbell className="w-8 h-8 text-primary-foreground" /> */}
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">
            <span className="gradient-text">Sculpt</span> & Strive
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? "Welcome back! Log in to continue."
              : "Create an account to get started."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={handleFullName}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`pl-10`}
                />
              </div>
              {/* {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )} */}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm text-primary hover:underline"
                >
                  Reset Password
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`pl-10 pr-10`}
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
              {/* {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )} */}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Logging in..." : "Creating account..."}
                </span>
              ) : isLogin ? (
                "Log In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  // setErrors({});
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
