import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Clock } from "lucide-react";

const lessons = [
  {
    id: 1,
    title: "Advanced Integration Techniques",
    subject: "Mathematics",
    difficulty: "Advanced",
    duration: "45 min",
    aiMatch: 95,
    reason: "Based on your recent calculus performance",
  },
  {
    id: 2,
    title: "Quantum Mechanics Basics",
    subject: "Physics",
    difficulty: "Intermediate",
    duration: "60 min",
    aiMatch: 88,
    reason: "Recommended after Newton's Laws completion",
  },
  {
    id: 3,
    title: "Organic Chemistry Reactions",
    subject: "Chemistry",
    difficulty: "Advanced",
    duration: "50 min",
    aiMatch: 82,
    reason: "Strengthens understanding of bonding concepts",
  },
];

const difficultyColors = {
  Beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  Intermediate: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Advanced: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function SmartLessonPanel() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI-Recommended Lessons
        </CardTitle>
        <p className="text-sm text-muted-foreground">Personalized based on your progress</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.15 }}
            className="p-4 rounded-lg border border-border bg-gradient-to-br from-accent/30 to-accent/10 hover:from-accent/40 hover:to-accent/20 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {lesson.title}
                </h4>
                <p className="text-sm text-muted-foreground">{lesson.subject}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-primary">{lesson.aiMatch}% match</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={difficultyColors[lesson.difficulty as keyof typeof difficultyColors]}
              >
                {lesson.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {lesson.duration}
              </div>
            </div>

            <div className="p-3 mb-3 rounded-md bg-background/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Why this lesson?</p>
              <p className="text-sm">{lesson.reason}</p>
            </div>

            <Button className="w-full" variant="default">
              Start Lesson
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
