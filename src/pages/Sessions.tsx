import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, 
  Play, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock,
  AlertCircle,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("live");

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel('session-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions' }, 
        () => fetchSessions() 
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'session_assignments' }, 
        () => fetchSessions() 
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log(user.id);
      if (!user) return;


      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_assignments!left(client_id)
        `)
        .order("id", { ascending: false });

      if (error) throw error;
      const visibleSessions = (data || []).filter(session => {
        const isMass = session.admin_is_mass === true;
        const isAssigned = session.session_assignments?.some(
          (a: any) => String(a.client_id) === String(user.id)
        );
        // if(isAssigned){
        //   console.log(true);
        //   console.log(session.title)
        // }
        return isMass || isAssigned;
      });

      // console.log(visibleSessions);

      setSessions(visibleSessions);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      toast.error("Failed to sync sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionJoin = async (session: any) => {
    const link = session.meeting_link;
    if (!link) {
      return toast.info("The meeting link is being generated. Please wait!");
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Upsert assignment as a way of tracking attendance
        const { error } = await supabase
          .from("session_assignments")
          .upsert({ 
            session_id: session.id, 
            client_id: user.id 
          });
        
        if (error) console.error("Database sync error:", error.message);
      }

      // Open link securely
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
      toast.success("Joining session...");

    } catch (err) {
      console.error("Attendance error:", err);
      window.open(link, '_blank');
    }
  };

  const filteredSessions = sessions
    .filter(
      (s) =>
        (s.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.instructor || "").toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .map((s) => {
      const now = new Date();
      const scheduled = new Date(s.scheduled_at);
      const endTime = new Date(scheduled.getTime() + 45 * 60 * 1000);

      const isSameDay =
        now.getFullYear() === scheduled.getFullYear() &&
        now.getMonth() === scheduled.getMonth() &&
        now.getDate() === scheduled.getDate();

      const isLiveTime = now >= scheduled && now <= endTime;
      return {
        ...s, 
        isLiveAvailable: isSameDay && isLiveTime,
        endTime,
      };
    })
    .filter((s) => new Date() <= s.endTime) 
    .map(({ endTime, ...s }) => s); 

  const liveSessions = filteredSessions.filter(s => s.type === 'live');
  const recordedSessions = filteredSessions.filter(s => s.type === 'recorded' || !s.type);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Sessions</h1>
          <p className="text-muted-foreground">
  {activeTab === "live" 
    ? `${liveSessions.length} live classes available` 
    : `${recordedSessions.length} recorded sessions available`
  }
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
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSessions}
            className={loading ? "opacity-50" : ""}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="live"onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger
            value="live"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Video className="w-4 h-4 mr-2" /> Live Sessions
          </TabsTrigger>
          <TabsTrigger
            value="recorded"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Play className="w-4 h-4 mr-2" /> Recorded Library
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
              Syncing studio data...
            </div>
          ) : (
            <>
              <TabsContent value="live" className="space-y-4 outline-none">
                {liveSessions.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
                    No active sessions found.
                  </div>
                ) : (
                  liveSessions.map((session) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={session.id}
                      className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-primary/20 transition-all shadow-sm"
                    >
                      <Avatar className="w-20 h-20 border-2 border-primary/10">
                        <AvatarImage src={session.trainer_image} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                          {session.instructor?.[0] || "S"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl">{session.title}</h3>
                          {!session.admin_is_mass && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/10 text-blue-600 border-none text-[10px] flex gap-1"
                            >
                              <UserCheck className="w-3 h-3" /> PERSONAL
                            </Badge>
                          )}
                          <Badge
                            className={`${session.isLiveAvailable ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"} border-none animate-pulse`}
                          >
                            {session.isLiveAvailable ? "LIVE" : "UPCOMING"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Coach {session.instructor || "Staff"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-medium text-primary flex items-center gap-1">
                          {/* <span>{session.scheduled_at.split("T")[0]}</span> */}
                          <Clock className="w-4 h-4" />{" "}
                          {session.duration || "45"}m
                        </span>

                        <Button
                          variant={session.meeting_link ? "default" : "outline"}
                          className={
                            session.meeting_link
                              ? "bg-primary hover:bg-primary/90"
                              : "opacity-60 cursor-not-allowed"
                          }
                          onClick={() => handleSessionJoin(session)}
                        >
                          {session.meeting_link
                            ? "Join Session"
                            : "Coming Soon"}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent
                value="recorded"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 outline-none"
              >
                {recordedSessions.map((session) => (
                  <motion.div
                    layout
                    key={session.id}
                    className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => handleSessionJoin(session)}
                  >
                    <div className="aspect-video bg-muted relative">
                      <div className="w-full h-full flex items-center justify-center">
                        <Play
                          className={`w-12 h-12 text-primary ${session.meeting_link ? "opacity-40 group-hover:opacity-100" : "opacity-10"} transition-opacity`}
                        />
                      </div>
                      {!session.meeting_link && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center flex-col gap-2">
                          <AlertCircle className="w-6 h-6 text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Uploading...
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold truncate">{session.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Coach {session.instructor}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            </>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}