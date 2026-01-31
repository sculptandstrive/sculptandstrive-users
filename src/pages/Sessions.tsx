import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  Users,
  Play,
  Star,
  Filter,
  Search,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const liveSessions = [
  {
    id: 1,
    title: "HIIT Cardio Blast",
    trainer: "Sarah Johnson",
    trainerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    time: "10:00 AM",
    date: "Today",
    duration: "45 min",
    participants: 24,
    rating: 4.8,
    isLive: true,
  },
  {
    id: 2,
    title: "Power Yoga Flow",
    trainer: "Emily Davis",
    trainerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    time: "2:00 PM",
    date: "Today",
    duration: "60 min",
    participants: 18,
    rating: 4.9,
    isLive: false,
  },
  {
    id: 3,
    title: "Strength Training Pro",
    trainer: "Mike Chen",
    trainerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    time: "5:30 PM",
    date: "Today",
    duration: "50 min",
    participants: 32,
    rating: 4.7,
    isLive: false,
  },
];

const recordedSessions = [
  {
    id: 4,
    title: "Core Strength Basics",
    trainer: "Lisa Park",
    trainerImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
    duration: "30 min",
    views: 1250,
    rating: 4.6,
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  },
  {
    id: 5,
    title: "Full Body Stretch",
    trainer: "Emily Davis",
    trainerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    duration: "25 min",
    views: 890,
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
  },
  {
    id: 6,
    title: "Boxing Cardio",
    trainer: "Jake Wilson",
    trainerImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    duration: "40 min",
    views: 2100,
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400",
  },
];

export default function Sessions() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Sessions</h1>
          <p className="text-muted-foreground">
            Join live classes or watch recorded workouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-muted border-border"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Video className="w-4 h-4 mr-2" />
            Live Sessions
          </TabsTrigger>
          <TabsTrigger value="recorded" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Play className="w-4 h-4 mr-2" />
            Recorded Library
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            My Schedule
          </TabsTrigger>
        </TabsList>

        {/* Live Sessions Tab */}
        <TabsContent value="live" className="space-y-4">
          {liveSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={session.trainerImage} />
                  <AvatarFallback>{session.trainer[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-lg">
                      {session.title}
                    </h3>
                    {session.isLive && (
                      <Badge className="bg-success text-success-foreground">
                        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1 animate-pulse" />
                        LIVE NOW
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{session.trainer}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{session.time} • {session.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{session.participants} joined</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span>{session.rating}</span>
                  </div>
                </div>

                <Button
                  className={session.isLive ? "bg-success hover:bg-success/90" : "bg-primary hover:bg-primary/90"}
                >
                  {session.isLive ? "Join Now" : "Set Reminder"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* Recorded Sessions Tab */}
        <TabsContent value="recorded" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordedSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all group cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={session.thumbnail}
                    alt={session.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary-foreground fill-current" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-black/60">
                    {session.duration}
                  </Badge>
                </div>

                <div className="p-4">
                  <h3 className="font-display font-semibold mb-2">{session.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={session.trainerImage} />
                      <AvatarFallback>{session.trainer[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{session.trainer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{session.views.toLocaleString()} views</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span>{session.rating}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-semibold text-xl mb-2">
              Your Scheduled Sessions
            </h3>
            <p className="text-muted-foreground mb-4">
              You have 3 upcoming sessions this week
            </p>
            <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
              View Calendar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
