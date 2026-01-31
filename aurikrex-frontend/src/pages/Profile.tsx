/**
 * Profile Page Component
 * 
 * A comprehensive profile page for Aurikrex users.
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
 * - Course dropdown includes 400+ courses (primary/secondary/university/professional)
 * - Language dropdown includes 300+ languages (global, African, Nigerian, sign languages)
 * - Skills dropdown includes 200+ digital skills (programming, design, marketing, etc.)
 * - All support search/filter functionality
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  User,
  Mail,
  School,
  BookOpen,
  GraduationCap,
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
import { MultiSelect } from "@/components/ui/multi-select";
import { apiRequest } from "@/utils/api";
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_PATTERN, isUsernameValid } from "@/utils/username";

// Import comprehensive data from data files
import { WORLD_LANGUAGES } from "@/data/languages";
import { COURSES as UNIVERSITY_COURSES } from "@/data/courses";
import { SKILLS } from "@/data/skills";

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

const USERNAME_DEBOUNCE_DELAY = 400;


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
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const usernameRequestRef = useRef(0);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "available" | "unavailable">("idle");

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

  useEffect(() => {
    const requestId = ++usernameRequestRef.current;
    const trimmedUsername = formData.username.trim();
    const isValidUsername = isUsernameValid(trimmedUsername);

    if (!trimmedUsername || !isValidUsername) {
      if (usernameTimeoutRef.current !== null) {
        window.clearTimeout(usernameTimeoutRef.current);
        usernameTimeoutRef.current = null;
      }
      setUsernameStatus("idle");
      return;
    }

    const isCurrentRequest = () => requestId === usernameRequestRef.current;

    const checkAvailability = async () => {
      try {
        const params = new URLSearchParams({ username: trimmedUsername });
        if (user?.uid) {
          params.append("excludeUserId", user.uid);
        }

        const response = await apiRequest(`/users/check-username?${params.toString()}`);
        if (!isCurrentRequest()) {
          return;
        }
        if (!response.ok) {
          setUsernameStatus("idle");
          return;
        }

        const data = await response.json();
        if (!isCurrentRequest()) {
          return;
        }

        if (data?.success) {
          setUsernameStatus(data.data?.available ? "available" : "unavailable");
          return;
        }

        setUsernameStatus("idle");
      } catch {
        if (isCurrentRequest()) {
          setUsernameStatus("idle");
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void checkAvailability();
    }, USERNAME_DEBOUNCE_DELAY);
    usernameTimeoutRef.current = timeoutId;

    return () => {
      if (usernameTimeoutRef.current !== null) {
        window.clearTimeout(usernameTimeoutRef.current);
        usernameTimeoutRef.current = null;
      }
    };
  }, [formData.username, user?.uid]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (formData.username && formData.username.length < USERNAME_MIN_LENGTH) {
      newErrors.username = `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
    }

    if (formData.username && formData.username.length > USERNAME_MAX_LENGTH) {
      newErrors.username = `Username must be less than ${USERNAME_MAX_LENGTH} characters`;
    }

    if (formData.username && !USERNAME_PATTERN.test(formData.username)) {
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
  const renderUsernameAvailability = () => {
    if (usernameStatus === "available") {
      return <p className="text-sm text-emerald-600">Username available</p>;
    }
    if (usernameStatus === "unavailable") {
      return <p className="text-sm text-destructive">Username not available</p>;
    }
    return null;
  };

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
                <Avatar className="w-32 h-32 ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-lg">
                  <AvatarImage src={formData.profilePicture || ""} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-4xl font-bold">
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

        {/* Username / Display Name Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Display Name
              </CardTitle>
              <CardDescription>
                This is the name that FalkeAI and other users will see. Choose a unique username.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="username-main" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">Required</Badge>
                </Label>
                {renderUsernameAvailability()}
                <Input
                  id="username-main"
                  placeholder="Choose a username (e.g., alex_johnson)"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className={`text-lg ${errors.username ? "border-destructive focus:ring-destructive" : ""}`}
                />
                {errors.username ? (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.username}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Only letters, numbers, and underscores allowed. 3-30 characters.
                  </p>
                )}
              </div>
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
                {renderUsernameAvailability()}
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
