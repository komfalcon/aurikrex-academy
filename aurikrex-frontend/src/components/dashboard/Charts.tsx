import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const subjects = [
  { name: "Mathematics", progress: 75, color: "bg-blue-500" },
  { name: "Physics", progress: 60, color: "bg-purple-500" },
  { name: "Chemistry", progress: 85, color: "bg-green-500" },
  { name: "Biology", progress: 45, color: "bg-orange-500" },
];

export default function Charts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Learning Progress by Subject</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{subject.name}</span>
                <span className="text-sm text-muted-foreground font-semibold">
                  {subject.progress}%
                </span>
              </div>
              <div className="relative">
                <Progress value={subject.progress} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full ${subject.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${subject.progress}%` }}
                />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
