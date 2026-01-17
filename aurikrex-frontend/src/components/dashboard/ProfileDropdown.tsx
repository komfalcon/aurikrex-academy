/**
 * ProfileDropdown Component
 * 
 * A dropdown menu for the profile icon in the dashboard header.
 * Structure:
 * - Profile → Opens the profile page
 * - Settings → Nested under Profile
 * - Sign out → Nested under Settings
 * 
 * This component uses Radix UI DropdownMenu for accessibility and responsive design.
 */

import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

interface ProfileDropdownProps {
  userName?: string;
  userAvatar?: string;
}

export function ProfileDropdown({ userName, userAvatar }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Get display name from auth context or props
  const displayName = user?.displayName || user?.firstName || userName || "User";
  const avatarUrl = user?.photoURL || userAvatar || "";

  const handleNavigateToProfile = () => {
    navigate("/profile");
  };

  const handleNavigateToSettings = () => {
    // Navigate to profile page - profile settings are managed there
    // TODO: Future enhancement could add a dedicated settings page or tab within profile
    navigate("/profile");
  };

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
          whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
          aria-label="Open profile menu"
        >
          <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-56 rounded-xl p-2"
        sideOffset={8}
      >
        {/* Profile Menu Item with nested Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-48 rounded-xl p-2" sideOffset={8}>
            {/* View Profile */}
            <DropdownMenuItem 
              onClick={handleNavigateToProfile}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            {/* Settings nested under Profile */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="w-48 rounded-xl p-2" sideOffset={8}>
                {/* Settings option */}
                <DropdownMenuItem 
                  onClick={handleNavigateToSettings}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                {/* Sign out nested under Settings */}
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileDropdown;
