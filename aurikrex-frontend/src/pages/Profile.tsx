/**
 * Profile Page Component
 * 
 * A comprehensive profile page for Aurikrex Academy users.
 * 
 * DATA SOURCE DOCUMENTATION:
 * ===========================
 * 
 * Fields prefilled from Auth Provider (non-editable):
 * - Full Name: From OAuth provider (Google, Microsoft, GitHub)
 * - Auth Provider: Detected from the OAuth flow
 * - Email: From OAuth provider (private by default)
 * 
 * Editable Fields (stored in backend/local state):
 * - Profile Picture: User can upload their own
 * - Username: User-chosen display name
 * - Class/Level: Educational level
 * - School/Institution: User's educational institution
 * - Course/Program: User's enrolled program
 * - Field of Interest: User's academic/professional interests
 * - Courses Offered: Multi-select of available university courses
 * - Preferred Learning Style: How the user prefers to learn
 * - Skills: User's skills (multi-select/tags)
 * - Languages Spoken: Multi-select of world languages
 * - Short Self Description: Bio/about section
 * 
 * MULTI-SELECT DROPDOWNS:
 * =======================
 * For handling multi-select dropdowns (courses and languages):
 * - Uses the custom MultiSelect component
 * - Stores selected values as string arrays
 * - Course dropdown includes all major university courses worldwide
 * - Language dropdown includes all spoken languages in the world
 * - Both support search/filter functionality
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  User,
  Mail,
  School,
  BookOpen,
  GraduationCap,
  Globe,
  Lightbulb,
  FileText,
  Save,
  ArrowLeft,
  Camera,
  Shield,
  Tag,
  Languages,
  Heart,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

// ============================================================================
// DATA: World Languages (comprehensive list)
// ============================================================================
const WORLD_LANGUAGES: MultiSelectOption[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese (Mandarin)" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
  { value: "bn", label: "Bengali" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "de", label: "German" },
  { value: "ko", label: "Korean" },
  { value: "it", label: "Italian" },
  { value: "tr", label: "Turkish" },
  { value: "vi", label: "Vietnamese" },
  { value: "th", label: "Thai" },
  { value: "pl", label: "Polish" },
  { value: "uk", label: "Ukrainian" },
  { value: "nl", label: "Dutch" },
  { value: "el", label: "Greek" },
  { value: "he", label: "Hebrew" },
  { value: "sv", label: "Swedish" },
  { value: "no", label: "Norwegian" },
  { value: "da", label: "Danish" },
  { value: "fi", label: "Finnish" },
  { value: "cs", label: "Czech" },
  { value: "ro", label: "Romanian" },
  { value: "hu", label: "Hungarian" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "tl", label: "Filipino (Tagalog)" },
  { value: "sw", label: "Swahili" },
  { value: "fa", label: "Persian (Farsi)" },
  { value: "ur", label: "Urdu" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "pa", label: "Punjabi" },
  { value: "ne", label: "Nepali" },
  { value: "si", label: "Sinhala" },
  { value: "my", label: "Burmese" },
  { value: "km", label: "Khmer" },
  { value: "lo", label: "Lao" },
  { value: "am", label: "Amharic" },
  { value: "yo", label: "Yoruba" },
  { value: "ig", label: "Igbo" },
  { value: "ha", label: "Hausa" },
  { value: "zu", label: "Zulu" },
  { value: "xh", label: "Xhosa" },
  { value: "af", label: "Afrikaans" },
  { value: "ca", label: "Catalan" },
  { value: "eu", label: "Basque" },
  { value: "gl", label: "Galician" },
  { value: "cy", label: "Welsh" },
  { value: "ga", label: "Irish" },
  { value: "gd", label: "Scottish Gaelic" },
  { value: "is", label: "Icelandic" },
  { value: "lv", label: "Latvian" },
  { value: "lt", label: "Lithuanian" },
  { value: "et", label: "Estonian" },
  { value: "mt", label: "Maltese" },
  { value: "sq", label: "Albanian" },
  { value: "mk", label: "Macedonian" },
  { value: "bg", label: "Bulgarian" },
  { value: "sr", label: "Serbian" },
  { value: "hr", label: "Croatian" },
  { value: "bs", label: "Bosnian" },
  { value: "sl", label: "Slovenian" },
  { value: "sk", label: "Slovak" },
  { value: "be", label: "Belarusian" },
  { value: "ka", label: "Georgian" },
  { value: "hy", label: "Armenian" },
  { value: "az", label: "Azerbaijani" },
  { value: "kk", label: "Kazakh" },
  { value: "uz", label: "Uzbek" },
  { value: "ky", label: "Kyrgyz" },
  { value: "tg", label: "Tajik" },
  { value: "tk", label: "Turkmen" },
  { value: "mn", label: "Mongolian" },
  { value: "bo", label: "Tibetan" },
  { value: "dz", label: "Dzongkha" },
  { value: "ps", label: "Pashto" },
  { value: "ku", label: "Kurdish" },
].sort((a, b) => a.label.localeCompare(b.label));

// ============================================================================
// DATA: University Courses (comprehensive worldwide list with strength info)
// ============================================================================
const UNIVERSITY_COURSES: MultiSelectOption[] = [
  // Engineering & Technology
  { value: "comp-sci", label: "Computer Science", description: "High demand" },
  { value: "software-eng", label: "Software Engineering", description: "High demand" },
  { value: "data-science", label: "Data Science", description: "High demand" },
  { value: "ai-ml", label: "Artificial Intelligence & ML", description: "Very high demand" },
  { value: "cybersecurity", label: "Cybersecurity", description: "High demand" },
  { value: "elec-eng", label: "Electrical Engineering", description: "Moderate demand" },
  { value: "mech-eng", label: "Mechanical Engineering", description: "Moderate demand" },
  { value: "civil-eng", label: "Civil Engineering", description: "Moderate demand" },
  { value: "chem-eng", label: "Chemical Engineering", description: "Moderate demand" },
  { value: "aero-eng", label: "Aerospace Engineering", description: "Moderate demand" },
  { value: "biomed-eng", label: "Biomedical Engineering", description: "High demand" },
  { value: "env-eng", label: "Environmental Engineering", description: "Growing demand" },
  { value: "ind-eng", label: "Industrial Engineering", description: "Moderate demand" },
  { value: "materials-eng", label: "Materials Engineering", description: "Moderate demand" },
  { value: "nuclear-eng", label: "Nuclear Engineering", description: "Specialized" },
  { value: "robotics", label: "Robotics Engineering", description: "High demand" },
  
  // Sciences
  { value: "physics", label: "Physics", description: "Research focused" },
  { value: "chemistry", label: "Chemistry", description: "Research focused" },
  { value: "biology", label: "Biology", description: "Moderate demand" },
  { value: "math", label: "Mathematics", description: "Research focused" },
  { value: "statistics", label: "Statistics", description: "High demand" },
  { value: "biochemistry", label: "Biochemistry", description: "Research focused" },
  { value: "microbiology", label: "Microbiology", description: "Research focused" },
  { value: "genetics", label: "Genetics", description: "Research focused" },
  { value: "neuroscience", label: "Neuroscience", description: "Research focused" },
  { value: "astronomy", label: "Astronomy", description: "Research focused" },
  { value: "geology", label: "Geology", description: "Moderate demand" },
  { value: "env-science", label: "Environmental Science", description: "Growing demand" },
  { value: "marine-bio", label: "Marine Biology", description: "Specialized" },
  
  // Medical & Health
  { value: "medicine", label: "Medicine (MBBS/MD)", description: "Very high demand" },
  { value: "nursing", label: "Nursing", description: "High demand" },
  { value: "pharmacy", label: "Pharmacy", description: "Moderate demand" },
  { value: "dentistry", label: "Dentistry", description: "High demand" },
  { value: "veterinary", label: "Veterinary Medicine", description: "Moderate demand" },
  { value: "public-health", label: "Public Health", description: "Growing demand" },
  { value: "physiotherapy", label: "Physiotherapy", description: "Moderate demand" },
  { value: "psychology", label: "Psychology", description: "High demand" },
  { value: "nutrition", label: "Nutrition & Dietetics", description: "Growing demand" },
  { value: "optometry", label: "Optometry", description: "Moderate demand" },
  
  // Business & Economics
  { value: "business-admin", label: "Business Administration", description: "High demand" },
  { value: "finance", label: "Finance", description: "High demand" },
  { value: "accounting", label: "Accounting", description: "Moderate demand" },
  { value: "economics", label: "Economics", description: "Moderate demand" },
  { value: "marketing", label: "Marketing", description: "Moderate demand" },
  { value: "management", label: "Management", description: "Moderate demand" },
  { value: "int-business", label: "International Business", description: "Moderate demand" },
  { value: "entrepreneurship", label: "Entrepreneurship", description: "Growing demand" },
  { value: "hr", label: "Human Resources", description: "Moderate demand" },
  { value: "supply-chain", label: "Supply Chain Management", description: "Growing demand" },
  
  // Law & Political Science
  { value: "law", label: "Law (LLB/JD)", description: "Moderate demand" },
  { value: "pol-sci", label: "Political Science", description: "Moderate demand" },
  { value: "int-relations", label: "International Relations", description: "Moderate demand" },
  { value: "public-admin", label: "Public Administration", description: "Moderate demand" },
  
  // Arts & Humanities
  { value: "english-lit", label: "English Literature", description: "Moderate demand" },
  { value: "history", label: "History", description: "Moderate demand" },
  { value: "philosophy", label: "Philosophy", description: "Moderate demand" },
  { value: "linguistics", label: "Linguistics", description: "Moderate demand" },
  { value: "sociology", label: "Sociology", description: "Moderate demand" },
  { value: "anthropology", label: "Anthropology", description: "Moderate demand" },
  { value: "archaeology", label: "Archaeology", description: "Specialized" },
  { value: "religious-studies", label: "Religious Studies", description: "Specialized" },
  { value: "classics", label: "Classics", description: "Specialized" },
  
  // Creative Arts & Design
  { value: "fine-arts", label: "Fine Arts", description: "Moderate demand" },
  { value: "graphic-design", label: "Graphic Design", description: "High demand" },
  { value: "ux-design", label: "UX/UI Design", description: "Very high demand" },
  { value: "animation", label: "Animation", description: "High demand" },
  { value: "fashion-design", label: "Fashion Design", description: "Moderate demand" },
  { value: "interior-design", label: "Interior Design", description: "Moderate demand" },
  { value: "architecture", label: "Architecture", description: "Moderate demand" },
  { value: "film-studies", label: "Film & Media Studies", description: "Moderate demand" },
  { value: "photography", label: "Photography", description: "Moderate demand" },
  { value: "music", label: "Music", description: "Moderate demand" },
  { value: "theatre", label: "Theatre & Drama", description: "Moderate demand" },
  { value: "game-design", label: "Game Design", description: "High demand" },
  
  // Communication & Media
  { value: "journalism", label: "Journalism", description: "Moderate demand" },
  { value: "mass-comm", label: "Mass Communication", description: "Moderate demand" },
  { value: "public-relations", label: "Public Relations", description: "Moderate demand" },
  { value: "advertising", label: "Advertising", description: "Moderate demand" },
  { value: "digital-media", label: "Digital Media", description: "High demand" },
  
  // Education
  { value: "education", label: "Education", description: "Moderate demand" },
  { value: "early-childhood", label: "Early Childhood Education", description: "Moderate demand" },
  { value: "special-ed", label: "Special Education", description: "High demand" },
  { value: "edu-tech", label: "Educational Technology", description: "Growing demand" },
  
  // Agriculture & Environment
  { value: "agriculture", label: "Agriculture", description: "Moderate demand" },
  { value: "agri-business", label: "Agribusiness", description: "Moderate demand" },
  { value: "forestry", label: "Forestry", description: "Moderate demand" },
  { value: "food-science", label: "Food Science", description: "Moderate demand" },
  { value: "horticulture", label: "Horticulture", description: "Specialized" },
  
  // Other
  { value: "hospitality", label: "Hospitality Management", description: "Moderate demand" },
  { value: "tourism", label: "Tourism Management", description: "Moderate demand" },
  { value: "sports-science", label: "Sports Science", description: "Growing demand" },
  { value: "social-work", label: "Social Work", description: "Moderate demand" },
  { value: "library-science", label: "Library Science", description: "Specialized" },
  { value: "urban-planning", label: "Urban Planning", description: "Moderate demand" },
].sort((a, b) => a.label.localeCompare(b.label));

// ============================================================================
// DATA: Learning Styles
// ============================================================================
const LEARNING_STYLES = [
  { value: "visual", label: "Visual (learn by seeing)" },
  { value: "auditory", label: "Auditory (learn by hearing)" },
  { value: "reading-writing", label: "Reading/Writing (learn by text)" },
  { value: "kinesthetic", label: "Kinesthetic (learn by doing)" },
  { value: "multimodal", label: "Multimodal (combination of styles)" },
];

// ============================================================================
// DATA: Skills (comprehensive list)
// ============================================================================
const SKILLS: MultiSelectOption[] = [
  // Technical Skills
  { value: "programming", label: "Programming" },
  { value: "web-dev", label: "Web Development" },
  { value: "mobile-dev", label: "Mobile Development" },
  { value: "database", label: "Database Management" },
  { value: "cloud", label: "Cloud Computing" },
  { value: "devops", label: "DevOps" },
  { value: "ml", label: "Machine Learning" },
  { value: "data-analysis", label: "Data Analysis" },
  { value: "ui-ux", label: "UI/UX Design" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "video-editing", label: "Video Editing" },
  { value: "3d-modeling", label: "3D Modeling" },
  { value: "cad", label: "CAD Design" },
  { value: "excel", label: "Advanced Excel" },
  { value: "seo", label: "SEO" },
  { value: "digital-marketing", label: "Digital Marketing" },
  
  // Soft Skills
  { value: "communication", label: "Communication" },
  { value: "leadership", label: "Leadership" },
  { value: "teamwork", label: "Teamwork" },
  { value: "problem-solving", label: "Problem Solving" },
  { value: "critical-thinking", label: "Critical Thinking" },
  { value: "time-management", label: "Time Management" },
  { value: "project-management", label: "Project Management" },
  { value: "presentation", label: "Presentation Skills" },
  { value: "negotiation", label: "Negotiation" },
  { value: "research", label: "Research" },
  { value: "writing", label: "Technical Writing" },
  { value: "creative-writing", label: "Creative Writing" },
  { value: "public-speaking", label: "Public Speaking" },
  { value: "mentoring", label: "Mentoring" },
  { value: "adaptability", label: "Adaptability" },
  { value: "emotional-intel", label: "Emotional Intelligence" },
].sort((a, b) => a.label.localeCompare(b.label));

// ============================================================================
// PROFILE FORM INTERFACE
// ============================================================================
interface ProfileFormData {
  // User-uploaded
  profilePicture: string | null;
  profilePictureFile: File | null;
  
  // Editable fields
  username: string;
  classLevel: string;
  schoolInstitution: string;
  courseProgram: string;
  fieldOfInterest: string;
  coursesOffered: string[];
  preferredLearningStyle: string;
  skills: string[];
  languagesSpoken: string[];
  shortDescription: string;
}

// ============================================================================
// PROFILE PAGE COMPONENT
// ============================================================================
export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state - editable fields
  const [formData, setFormData] = useState<ProfileFormData>({
    profilePicture: user?.photoURL || null,
    profilePictureFile: null,
    username: "",
    classLevel: "",
    schoolInstitution: "",
    courseProgram: "",
    fieldOfInterest: "",
    coursesOffered: [],
    preferredLearningStyle: "",
    skills: [],
    languagesSpoken: [],
    shortDescription: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  // ============================================================================
  // AUTH PROVIDER DATA (Non-editable)
  // These fields come from the OAuth provider (Google, Microsoft, GitHub)
  // ============================================================================
  const authProviderData = {
    fullName: user?.displayName || user?.firstName 
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() 
      : "Not provided",
    email: user?.email || "Not provided",
    authProvider: user?.provider 
      ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1) 
      : "Unknown",
  };

  // Handle profile picture upload
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        profilePicture: previewUrl,
        profilePictureFile: file,
      }));
    }
  };

  // Update form field
  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (formData.username && formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (formData.username && formData.username.length > 30) {
      newErrors.username = "Username must be less than 30 characters";
    }

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (formData.shortDescription && formData.shortDescription.length > 500) {
      newErrors.shortDescription = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSaving(true);
    
    try {
      // TODO: Implement actual API call to save profile
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Profile saved successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get display name for avatar
  const displayName = user?.displayName || user?.firstName || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16 md:h-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">My Profile</h1>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Profile Picture
              </CardTitle>
              <CardDescription>
                Click on the avatar to upload a new profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <motion.div
                whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
                whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
                className="relative cursor-pointer group"
                onClick={handleProfilePictureClick}
              >
                <Avatar className="w-32 h-32 border-4 border-primary/20">
                  <AvatarImage src={formData.profilePicture || ""} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Upload profile picture"
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: JPEG, PNG, GIF (max 5MB)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Information (from Auth Provider - non-editable) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>
                {/* Comment: These fields are prefilled from the OAuth provider and cannot be edited */}
                These details are provided by your authentication provider and cannot be changed here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name - From Auth Provider (non-editable) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                  <Badge variant="secondary" className="text-xs">From {authProviderData.authProvider}</Badge>
                </Label>
                <Input
                  value={authProviderData.fullName}
                  disabled
                  className="bg-muted/50"
                />
              </div>

              {/* Email - From Auth Provider (non-editable) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                  <Badge variant="secondary" className="text-xs">Private</Badge>
                </Label>
                <Input
                  value={authProviderData.email}
                  disabled
                  className="bg-muted/50"
                />
              </div>

              {/* Auth Provider (non-editable) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Authentication Provider
                </Label>
                <Input
                  value={authProviderData.authProvider}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Editable Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                {/* Comment: These are editable fields that the user can modify */}
                Update your profile details below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Username (editable) */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className={errors.username ? "border-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              {/* Class/Level (editable) */}
              <div className="space-y-2">
                <Label htmlFor="classLevel" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Class/Level
                </Label>
                <Input
                  id="classLevel"
                  placeholder="e.g., Freshman, Sophomore, Graduate"
                  value={formData.classLevel}
                  onChange={(e) => updateField("classLevel", e.target.value)}
                />
              </div>

              {/* School/Institution (editable) */}
              <div className="space-y-2">
                <Label htmlFor="schoolInstitution" className="flex items-center gap-2">
                  <School className="w-4 h-4" />
                  School/Institution
                </Label>
                <Input
                  id="schoolInstitution"
                  placeholder="Your school or institution name"
                  value={formData.schoolInstitution}
                  onChange={(e) => updateField("schoolInstitution", e.target.value)}
                />
              </div>

              {/* Course/Program (editable) */}
              <div className="space-y-2">
                <Label htmlFor="courseProgram" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course/Program
                </Label>
                <Input
                  id="courseProgram"
                  placeholder="e.g., Computer Science, Business Administration"
                  value={formData.courseProgram}
                  onChange={(e) => updateField("courseProgram", e.target.value)}
                />
              </div>

              {/* Field of Interest (editable) */}
              <div className="space-y-2">
                <Label htmlFor="fieldOfInterest" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Field of Interest
                </Label>
                <Input
                  id="fieldOfInterest"
                  placeholder="e.g., Artificial Intelligence, Finance"
                  value={formData.fieldOfInterest}
                  onChange={(e) => updateField("fieldOfInterest", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Courses Offered (Multi-select) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Courses Offered
              </CardTitle>
              <CardDescription>
                {/* Comment: Multi-select dropdown for courses
                    - Uses MultiSelect component
                    - Options include university courses worldwide with demand/strength info
                    - Selected values stored as string array */}
                Select the courses you're interested in or currently taking (strength/demand shown in parentheses)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={UNIVERSITY_COURSES}
                selected={formData.coursesOffered}
                onChange={(selected) => updateField("coursesOffered", selected)}
                placeholder="Select courses..."
                searchPlaceholder="Search courses..."
                emptyMessage="No courses found."
                maxHeight={300}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning & Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Learning & Skills
              </CardTitle>
              <CardDescription>
                Tell us about your learning preferences and skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preferred Learning Style (dropdown) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Preferred Learning Style
                </Label>
                <Select
                  value={formData.preferredLearningStyle}
                  onValueChange={(value) => updateField("preferredLearningStyle", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your learning style" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNING_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills (Multi-select) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Skills
                </Label>
                <MultiSelect
                  options={SKILLS}
                  selected={formData.skills}
                  onChange={(selected) => updateField("skills", selected)}
                  placeholder="Select your skills..."
                  searchPlaceholder="Search skills..."
                  emptyMessage="No skills found."
                  maxHeight={250}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Languages Spoken (Multi-select) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" />
                Languages Spoken
              </CardTitle>
              <CardDescription>
                {/* Comment: Multi-select dropdown for languages
                    - Uses MultiSelect component
                    - Comprehensive list of world languages
                    - Selected values stored as string array */}
                Select all the languages you speak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiSelect
                options={WORLD_LANGUAGES}
                selected={formData.languagesSpoken}
                onChange={(selected) => updateField("languagesSpoken", selected)}
                placeholder="Select languages..."
                searchPlaceholder="Search languages..."
                emptyMessage="No languages found."
                maxHeight={300}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* About Me */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                About Me
              </CardTitle>
              <CardDescription>
                Write a short description about yourself
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="shortDescription"
                  placeholder="Tell us about yourself, your goals, and what you're passionate about..."
                  value={formData.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  className={`min-h-[120px] ${errors.shortDescription ? "border-destructive" : ""}`}
                />
                <div className="flex justify-between text-sm">
                  {errors.shortDescription && (
                    <p className="text-destructive">{errors.shortDescription}</p>
                  )}
                  <p className="text-muted-foreground ml-auto">
                    {formData.shortDescription.length}/500 characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button (Mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="md:hidden pb-4"
        >
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-xl py-6 text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
