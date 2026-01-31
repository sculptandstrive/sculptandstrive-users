-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table (individual exercises within a workout)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 1,
  reps INTEGER,
  weight_kg DECIMAL(5,2),
  duration_seconds INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nutrition_logs table
CREATE TABLE public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g DECIMAL(5,1) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(5,1) NOT NULL DEFAULT 0,
  fats_g DECIMAL(5,1) NOT NULL DEFAULT 0,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create water_intake table (separate for easier tracking)
CREATE TABLE public.water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress_records table
CREATE TABLE public.progress_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2),
  body_fat_percent DECIMAL(4,1),
  muscle_mass_kg DECIMAL(5,2),
  bmi DECIMAL(4,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for workouts
CREATE POLICY "Users can view their own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exercises
CREATE POLICY "Users can view their own exercises" ON public.exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for nutrition_logs
CREATE POLICY "Users can view their own nutrition logs" ON public.nutrition_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs" ON public.nutrition_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs" ON public.nutrition_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs" ON public.nutrition_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for water_intake
CREATE POLICY "Users can view their own water intake" ON public.water_intake
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake" ON public.water_intake
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake" ON public.water_intake
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for progress_records
CREATE POLICY "Users can view their own progress" ON public.progress_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.progress_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.progress_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON public.progress_records
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_nutrition_logs_updated_at
  BEFORE UPDATE ON public.nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_progress_records_updated_at
  BEFORE UPDATE ON public.progress_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(workout_date);
CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX idx_nutrition_logs_user_id ON public.nutrition_logs(user_id);
CREATE INDEX idx_nutrition_logs_date ON public.nutrition_logs(log_date);
CREATE INDEX idx_water_intake_user_date ON public.water_intake(user_id, log_date);
CREATE INDEX idx_progress_records_user_id ON public.progress_records(user_id);
CREATE INDEX idx_progress_records_date ON public.progress_records(record_date);