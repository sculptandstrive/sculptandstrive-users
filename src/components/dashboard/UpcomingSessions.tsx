import { motion } from "framer-motion";
import { Calendar, Clock, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const sessions = [
  {
    id: 1,
    title: "HIIT Cardio Blast",
    trainer: "Sarah Johnson",
    trainerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    time: "10:00 AM",
    duration: "45 min",
    type: "Live",
    participants: 24,
  },
  {
    id: 2,
    title: "Strength Training",
    trainer: "Mike Chen",
    trainerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    time: "2:00 PM",
    duration: "60 min",
    type: "Live",
    participants: 18,
  },
  {
    id: 3,
    title: "Yoga Flow",
    trainer: "Emily Davis",
    trainerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    time: "5:30 PM",
    duration: "30 min",
    type: "Recorded",
    participants: 42,
  },
];

export function UpcomingSessions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Upcoming Sessions</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={session.trainerImage} />
              <AvatarFallback>{session.trainer[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{session.title}</h4>
                <Badge
                  variant={session.type === "Live" ? "default" : "secondary"}
                  className={session.type === "Live" ? "bg-success text-success-foreground" : ""}
                >
                  {session.type === "Live" && <span className="w-1.5 h-1.5 bg-current rounded-full mr-1 animate-pulse" />}
                  {session.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{session.trainer}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{session.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{session.participants}</span>
              </div>
            </div>

            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Video className="w-4 h-4 mr-1" />
              Join
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
