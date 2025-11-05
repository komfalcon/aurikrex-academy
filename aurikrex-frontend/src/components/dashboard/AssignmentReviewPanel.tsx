import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

const assignments = [
  {
    id: 1,
    title: "Calculus Problem Set",
    subject: "Mathematics",
    status: "completed",
    score: 92,
    aiReview: "Excellent work! Strong understanding of derivatives.",
  },
  {
    id: 2,
    title: "Newton's Laws Lab Report",
    subject: "Physics",
    status: "pending",
    dueDate: "2 days",
    aiReview: "Awaiting submission...",
  },
  {
    id: 3,
    title: "Chemical Bonding Quiz",
    subject: "Chemistry",
    status: "review",
    score: 85,
    aiReview: "Good progress. Review covalent bonds section.",
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "Completed",
  },
  pending: {
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    label: "Pending",
  },
  review: {
    icon: AlertCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "In Review",
  },
};

export default function AssignmentReviewPanel() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Assignment Reviews
          <Badge variant="secondary" className="ml-auto">
            {assignments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.map((assignment, index) => {
          const config = statusConfig[assignment.status as keyof typeof statusConfig];
          const Icon = config.icon;

          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 rounded-lg border border-border bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                </div>
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {config.label}
                </Badge>
                {assignment.score && (
                  <span className="text-sm font-semibold text-primary">
                    Score: {assignment.score}%
                  </span>
                )}
                {assignment.dueDate && (
                  <span className="text-sm text-muted-foreground">Due in {assignment.dueDate}</span>
                )}
              </div>

              <div className="p-3 rounded-md bg-background/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1 font-medium">AI Feedback:</p>
                <p className="text-sm">{assignment.aiReview}</p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
