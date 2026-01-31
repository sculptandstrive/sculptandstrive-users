import { useState } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Search,
  MessageCircle,
  BookOpen,
  Video,
  Mail,
  ChevronRight,
  ChevronDown,
  Send,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        a: "Yes! All live sessions are recorded and available in the Recorded Library section within 24 hours of the class ending.",
      },
      {
        q: "How do I reschedule a session?",
        a: "Go to Sessions > My Schedule, find the session you want to change, and click 'Reschedule'. You can change up to 4 hours before the class starts.",
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

const tutorials = [
  { title: "Getting Started Guide", duration: "5 min", views: 12500 },
  { title: "Tracking Your First Workout", duration: "8 min", views: 8900 },
  { title: "Setting Up Nutrition Goals", duration: "6 min", views: 7200 },
  { title: "Joining Live Sessions", duration: "4 min", views: 15600 },
];

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-display font-bold mb-2">How can we help?</h1>
        <p className="text-muted-foreground mb-6">
          Search our help center or chat with our support team
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg bg-muted border-border"
          />
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, title: "Documentation", desc: "Browse detailed guides" },
          { icon: Video, title: "Video Tutorials", desc: "Watch step-by-step videos" },
          { icon: MessageCircle, title: "Live Chat", desc: "Talk to our team" },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="faq" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Video className="w-4 h-4 mr-2" />
            Tutorials
          </TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageCircle className="w-4 h-4 mr-2" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="trainer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-4 h-4 mr-2" />
            Ask Trainer
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faq">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {faqs.map((category, index) => (
              <div key={category.category} className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display font-semibold text-lg mb-4">{category.category}</h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((faq, i) => (
                    <AccordionItem key={i} value={`${index}-${i}`} className="border-border">
                      <AccordionTrigger className="text-left hover:text-primary">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {tutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium group-hover:text-primary transition-colors">
                      {tutorial.title}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tutorial.duration}
                      </span>
                      <span>{tutorial.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Live Chat Tab */}
        <TabsContent value="chat">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Live Support</p>
                  <p className="text-xs text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Online - typically replies in minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="h-80 p-4 bg-muted/30 flex flex-col items-center justify-center text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Start a conversation with our support team</p>
              <p className="text-sm text-muted-foreground">We're here to help 24/7</p>
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="resize-none bg-muted border-border"
                  rows={2}
                />
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Ask Trainer Tab */}
        <TabsContent value="trainer">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-accent/10">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Ask Your Trainer</h3>
                <p className="text-sm text-muted-foreground">
                  Send non-urgent questions to your assigned trainer
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input placeholder="Brief summary of your question" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Describe your question in detail..."
                  className="resize-none bg-muted border-border"
                  rows={4}
                />
              </div>
              <Button className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground">
                <Mail className="w-4 h-4 mr-2" />
                Send to Trainer
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
