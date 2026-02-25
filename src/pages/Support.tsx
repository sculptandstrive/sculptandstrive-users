import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Search,
  MessageCircle,
  BookOpen,
  Video,
  ChevronRight,
  Send,
  Clock,
  Frown,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// FAQ 
const faqs = [
  {
    category: "Classes & Sessions",
    questions: [
      {
        q: "How do I join a live session?",
        a: "Navigate to the Sessions page, find your scheduled class, and click 'Join Now' when the session is live. You'll be connected via our integrated video platform.",
      },
      {
        q: "Can I watch recorded sessions later?",
        a: "Yes! All live sessions are available in the Recorded Library within 24 hours.",
      },
      {
        q: "How do I reschedule a session?",
        a: "Go to Sessions > My Schedule, find the session you want to change, and click 'Reschedule'. You can change up to 4 hours before the class starts..",
      },
    ],
  },
  {
    category: "Workouts & Fitness",
    questions: [
      {
        q: "How do I log a custom workout?",
        a: "On the Fitness page, click 'Log Workout' and either choose from preset exercises or add custom ones with sets, reps, and weights.",
      },
      {
        q: "Can I sync with my fitness tracker?",
        a: "Yes! Go to Settings > Integrations and connect your Google Fit, Apple Health, or Fitbit account to sync workout data automatically.",
      },
    ],
  },
  {
    category: "Nutrition & Diet",
    questions: [
      {
        q: "How accurate is the calorie tracking?",
        a: "Our food database includes verified nutritional information for thousands of foods. For best accuracy, use barcode scanning or select exact portions.",
      },
      {
        q: "Can I create custom meal plans?",
        a: "Premium members can create custom meal plans. Go to Nutrition > Meal Plans > Create New to build your personalized diet plan.",
      },

    ],
  },

];

export default function Support() { 
  const {user} = useAuth();
  // console.log(user)
  const isTrialUser = user?.user_metadata?.plan_role === 'trial_user';
  // console.log(role)
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [activeTab, setActiveTab] = useState("faq");

  // --- Database States ---
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Tutorials 
  const fetchData = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      // Fetch Tutorials
      const { data: tutorialsData, error: tutorialsError } = await supabase
        .from("tutorials")
        .select("*")
        .order("created_at", { ascending: false });

      if (tutorialsError) throw tutorialsError;
      setTutorials(tutorialsData || []);

      //  User's Ticket History

      const { data: historyData, error: historyError } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_email", "User")
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;
      setTicketHistory(historyData || []);

    } catch (error: any) {
      console.error("Database Error:", error.message);
      setDbError(`Database Error: ${error.message}. Please check your table column names.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering for FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    return faqs
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [searchQuery]);

  //  Filtering for Tutorials
  const filteredTutorials = useMemo(() => {
    return tutorials.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tutorials]);

  
  const handleVideoSelect = async (tutorial: any) => {
    setSelectedVideo(tutorial);
    const { error } = await supabase
      .from("tutorials")
      .update({ views: (tutorial.views || 0) + 1 })
      .eq("id", tutorial.id);

    if (!error) {
      setTutorials(prev => prev.map(t => t.id === tutorial.id ? { ...t, views: (t.views || 0) + 1 } : t));
    }
  };

  //  SEND MESSAGE & UPDATE HISTORY
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSending) return;

    setIsSending(true);
    try {

      const { data, error } = await supabase.from("tickets").insert([
        {
          message: chatMessage,
          user_email: "User",
          status: "open",
          created_at: new Date().toISOString(),
        },
      ]).select();

      if (error) throw error;

      if (data) setTicketHistory(prev => [data[0], ...prev]);

      setChatMessage("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert(`Error: ${err.message || "Connection failed"}`);
    } finally {
      setIsSending(false);
    }
  };

  // const handleActiveTab = () => {
  //   if(!item.haveAccess){
  //       title: "Unauthorized Access",
  //               description: "Please Upgrade Your Plan For Access",
  //               variant: "destructive",
  //   } 
  // }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Network Error Alert */}
      {dbError && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{dbError}</p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={fetchData}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-2">How can we help?</h1>
        <p className="text-muted-foreground mb-6">
          Search for answers or reach out to our admin team directly.
        </p>
        <div className="relative max-w-sm md:max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-10 md:h-12 text-base md:text-lg bg-muted border-border"
          />
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        {[
          {
            icon: BookOpen,
            title: "Documentation",
            tab: "faq",
            haveAccess: true,
          },
          {
            icon: Video,
            title: "Video Tutorials",
            tab: "tutorials",
            haveAccess: true,
          },
          {
            icon: MessageCircle,
            title: "Support Ticket",
            tab: "chat",
            haveAccess: isTrialUser ? false : true,
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              if (!item.haveAccess) {
                toast({
                  title: "Unauthorized Access",
                  description: "Please Upgrade Your Plan For Access",
                  variant: "destructive",
                });
                return;
              }
              setActiveTab(item.tab);
            }}
            className={`bg-card border rounded-xl p-3 md:p-6 hover:border-primary/50 transition-all  group ${
              activeTab === item.tab
                ? "border-primary ring-1 ring-primary/20"
                : "border-border"
            }
            ${item.haveAccess ? "cursor-pointer" : "cursor-not-allowed"}
            `}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20">
                <item.icon className="w-4 h-6 md:w-6 md:h-6 text-primary" />
              </div>
              <h3 className="font-semibold flex-1">{item.title}</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-muted flex-wrap h-auto gap-2 p-2">
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger
            value="chat"
            disabled={isTrialUser}
            className={isTrialUser ? "opacity-40 cursor-not-allowed" : ""}
          >
            Contact Support
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faq">
          <div className="space-y-6">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, index) => (
                <div
                  key={category.category}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="font-semibold text-lg mb-4">
                    {category.category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((faq, i) => (
                      <AccordionItem key={i} value={`${index}-${i}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            ) : (
              <div className="text-center py-12 opacity-50">
                <Frown className="mx-auto mb-2" /> No matches found.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground italic flex flex-col items-center gap-2">
              <RefreshCw className="animate-spin w-6 h-6" />
              Fetching latest tutorials...
            </div>
          ) : filteredTutorials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTutorials.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  className="p-4 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => handleVideoSelect(tutorial)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20">
                      <Video className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{tutorial.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {tutorial.duration}
                        </span>
                        {/* VIEW COUNT REMOVED FROM HERE */}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 opacity-50">
              <Frown className="mx-auto mb-2" /> No tutorials found.
            </div>
          )}
        </TabsContent>

        {/* Contact Support Tab (WITH HISTORY) */}
        <TabsContent value="chat">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* New Ticket Form */}
            <Card className="lg:col-span-3 overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <p className="font-medium">Direct Admin Support</p>
                <p className="text-xs text-muted-foreground">
                  Submit a ticket and we'll get back to you.
                </p>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-10 text-center"
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-bold">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-muted-foreground max-w-xs mb-4">
                        Our admin has received your ticket.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowSuccess(false)}
                      >
                        Send Another
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <Textarea
                        placeholder="Please describe your issue..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="min-h-[150px] resize-none text-lg bg-background"
                        disabled={isSending}
                      />
                      <Button
                        type="submit"
                        className="w-full h-12 text-lg"
                        disabled={isSending}
                      >
                        {isSending ? (
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 mr-2" />
                        )}
                        {isSending ? "Sending..." : "Submit Ticket"}
                      </Button>
                    </form>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Support History Sidebar */}
            <Card className="lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent History
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchData}
                  className="h-8 w-8"
                >
                  <RefreshCw
                    className={`h-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                {ticketHistory.length > 0 ? (
                  ticketHistory.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-lg border bg-card text-sm space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ticket.status === "open"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground/80 line-clamp-2">
                        {ticket.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-xs italic">
                    {loading
                      ? "Loading history..."
                      : "No ticket history found."}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- VIDEO PLAYER MODAL --- */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-card rounded-2xl overflow-hidden shadow-2xl"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white bg-black/20 hover:bg-white/20"
                onClick={() => setSelectedVideo(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="aspect-video bg-black">
                <iframe
                  src={
                    selectedVideo.url.includes("watch?v=")
                      ? selectedVideo.url
                          .replace("watch?v=", "embed/")
                          .split("&")[0]
                      : selectedVideo.url
                  }
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              </div>
              <div className="p-6 bg-card border-t">
                <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Duration: {selectedVideo.duration}
                </p>
                {/* VIEW COUNT REMOVED FROM MODAL AS WELL */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}