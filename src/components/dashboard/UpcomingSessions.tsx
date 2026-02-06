import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function UpcomingSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSessions();
  }, []);

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetches sessions all or specifically assigned to any user ID
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_assignments!left(client_id)
        `)
        .or(`admin_is_mass.eq.true, session_assignments.client_id.eq.${user.id}`)
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Filter out duplicate session objects 
      const uniqueSessions = Array.from(new Map(data.map(s => [s.id, s])).values());
      setSessions(uniqueSessions);

    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      toast.error("Could not sync sessions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center animate-pulse text-muted-foreground">Syncing your schedule...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      {/* Header section  */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Your Schedule</h3>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'} Available
        </Badge>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-muted rounded-xl bg-muted/10">
             <p className="text-sm text-muted-foreground">No sessions assigned to you yet.</p>
          </div>
        ) : (
          sessions.map((session, index) => {
            const isWhatsApp = session.platform === 'whatsapp';
            
            // timestamp from the 'start_time' 
            const startTime = session.start_time 
              ? new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "TBD";

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/60 transition-all border border-transparent hover:border-primary/10"
              >
                <Avatar className="w-12 h-12 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {session.instructor?.[0] || "S"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate text-sm">{session.title}</h4>
                    {session.type === "live" && (
                      <Badge className="bg-red-500/10 text-red-500 border-none text-[10px] h-5 px-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">with Coach {session.instructor || 'Staff'}</p>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{startTime}</span>
                </div>

                <Button 
                  size="sm" 
                  className={isWhatsApp ? "bg-[#25D366] hover:bg-[#128C7E] text-white" : "bg-primary"}
                  onClick={() => {
                    const link = session.meeting_link;
                    if (!link) return toast.error("Meeting link not available yet");

                    if (isWhatsApp) {
                        //  direct WhatsApp redirection
                        const phone = link.replace(/\D/g, '');
                        window.open(`https://wa.me/${phone}`, '_blank');
                    } else {
                        //  link opens in new tab with proper protocol
                        const url = link.startsWith('http') ? link : `https://${link}`;
                        window.open(url, '_blank');
                    }
                  }}
                >
                  {isWhatsApp ? (
                    <><MessageCircle className="w-4 h-4 mr-1" /> Contact</>
                  ) : (
                    <><Video className="w-4 h-4 mr-1" /> Join</>
                  )}
                </Button>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}