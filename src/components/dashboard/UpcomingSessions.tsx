import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, MessageCircle, RefreshCw } from "lucide-react";
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

    // REAL-TIME SYNC: Listen for changes in both tables so the dashboard 
    // updates the moment an admin assigns a session.
    const channel = supabase
      .channel('upcoming-sessions-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions' }, 
        () => fetchUserSessions() 
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'session_assignments' }, 
        () => fetchUserSessions() 
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // FIX 1: Sort by ID DESC so the newest sessions appear at the top.
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_assignments!left(client_id)
        `)
        .order("id", { ascending: false });
      console.log(data);
      if (error) throw error;

      const visibleSessions = (data || []).filter(session => {
        const isMass = session.admin_is_mass === true;
        
        // FIX 2: Strict String normalization for UUID comparison.
        const isAssigned = session.session_assignments?.some(
          (a: any) => String(a.client_id) === String(user.id)
        );
        
        return isMass || isAssigned;
      });

      // Show the most relevant 3 sessions
      setSessions(visibleSessions.slice(0, 3));

    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      toast.error("Could not sync sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionJoin = async (session: any) => {
    const link = session.meeting_link;
    if (!link) {
      return toast.error("Meeting link not available yet");
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Record attendance/assignment interaction
        await supabase
          .from("session_assignments")
          .upsert({ 
            session_id: session.id, 
            client_id: user.id 
          });
      }

      if (session.platform === 'whatsapp') {
        const phone = link.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
      } else {
        const url = link.startsWith('http') ? link : `https://${link}`;
        window.open(url, '_blank');
      }
      
      toast.success("Joining session...");
    } catch (err) {
      window.open(link, '_blank');
    }
  };

  if (loading) return (
    <div className="bg-card rounded-xl border border-border p-6 h-[200px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-primary/50" />
        <p className="text-sm text-muted-foreground">Syncing your schedule...</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Your Schedule</h3>
        </div>
        <Badge variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-none">
          {sessions.length} Available
        </Badge>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-muted rounded-xl bg-muted/5">
              <p className="text-sm text-muted-foreground">No sessions assigned today.</p>
          </div>
        ) : (
          <AnimatePresence>
            {sessions.map((session, index) => {
              const isWhatsApp = session.platform === 'whatsapp';
              const startTime = session.start_time 
                ? new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Live";

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-primary/10"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarFallback className="bg-background text-primary text-xs font-bold">
                      {session.instructor?.[0] || "S"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold truncate text-sm">{session.title}</h4>
                      {session.type === "live" && (
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Coach {session.instructor || 'Staff'}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground mr-2 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{startTime}</span>
                  </div>

                  <Button 
                    size="sm" 
                    className={`h-8 px-3 text-xs ${isWhatsApp ? "bg-[#25D366] hover:bg-[#128C7E]" : "bg-primary"}`}
                    onClick={() => handleSessionJoin(session)} 
                  >
                    {isWhatsApp ? "Contact" : "Join"}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}