import { useEffect, useState, useRef } from "react";
import { BreadcrumbWrapper } from "../custom_ui/CustomBreadCrumb";
import { User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { NotificationsDropdown } from "../Notifications/NotificationsDropdown";
import { useNavigate } from "react-router-dom";
// import { useTheme } from "../../contexts/ThemeProvider";

// Define types
interface TimeState {
  date: string;
  hours: string;
  minutes: string;
  seconds: string;
  ampm: string;
}

interface UserData {
  name?: string;
  email?: string;
  gmail?: string;
}

interface BreadcrumbPage {
  label: string;
  path?: string;
}

interface HeaderProps {
  isExpanded: boolean;
  pages: BreadcrumbPage[];
}

export function Header({ isExpanded, pages }: HeaderProps) {
  const [time, setTime] = useState<TimeState | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const { theme } = useTheme();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("User");
    if (userData) {
      try {
        const parsedUser: UserData = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
      };

      // Get date
      const date = now.toLocaleDateString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
      });

      // Get time in 12-hour format with AM/PM
      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });

      // Parse the time string to extract hours, minutes, seconds, and AM/PM
      const timeParts = timeString.split(/:| /);
      let hours = timeParts[0];
      const minutes = timeParts[1];
      const seconds = timeParts[2];
      const ampm = timeParts[3] || "AM";

      // Ensure hours are two digits
      hours = hours.padStart(2, "0");

      setTime({
        date,
        hours,
        minutes,
        seconds,
        ampm: ampm.toUpperCase(),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    localStorage.removeItem("User");
    setUser(null);
    setShowDropdown(false);
    navigate("/login");
  };

  const handleProfile = () => {
    setShowDropdown(false);
    navigate("/profile");
  };

  // Skeleton component for loading state
  const TimerSkeleton = () => (
    <div className="sm:flex items-center gap-2 hidden">
      {/* Date */}
      <div className="lg:flex-col items-center hidden lg:flex">
        <span className="text-xs font-medium text-muted-foreground">{""}</span>
      </div>

      {/* Time blocks */}
      <div className="flex items-center gap-1">
        {/* Hours */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border">
          <span className="text-lg font-bold text-sidebar-foreground">
            {"00"}
          </span>
        </div>

        <div className="text-2xl font-bold text-sidebar-foreground animate-pulse">
          :
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border">
          <span className="text-lg font-bold text-sidebar-foreground">
            {"00"}
          </span>
        </div>

        <div className="text-2xl font-bold text-sidebar-foreground animate-pulse">
          :
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border">
          <span className="text-lg font-bold text-sidebar-foreground">
            {"00"}
          </span>
        </div>

        {/* AM/PM skeleton */}
        <div className="flex flex-col items-center bg-primary/20 rounded-lg p-2 min-w-[2.5rem] border-border ml-1">
          <span className="text-sm font-bold text-sidebar-foreground">
            {"AM"}
          </span>
        </div>
      </div>
    </div>
  );

  // Timer clock component with AM/PM
  const TimerClock = ({ time }: { time: TimeState }) => (
    <div className="flex items-center gap-2">
      {/* Date */}
      <div className="lg:flex lg:flex-col items-center hidden">
        <span className="text-xs font-medium text-muted-foreground">
          {time.date}
        </span>
      </div>

      {/* Time blocks */}
      <div className="sm:flex items-center gap-1 hidden">
        {/* Hours */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border">
          <span className="text-lg font-bold text-sidebar-foreground">
            {time.hours}
          </span>
        </div>

        <div className="text-2xl font-bold text-sidebar-foreground animate-pulse">
          :
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border">
          <span className="text-lg font-bold text-sidebar-foreground">
            {time.minutes}
          </span>
        </div>

        <div className="text-2xl font-bold text-sidebar-foreground animate-pulse">
          :
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border">
          <span className="text-lg font-bold text-sidebar-foreground">
            {time.seconds}
          </span>
        </div>

        {/* AM/PM box */}
        <div className="flex flex-col items-center bg-primary/20 rounded-lg p-2 min-w-[2.5rem] border-border ml-1">
          <span className="text-sm font-bold text-sidebar-foreground">
            {time.ampm}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <header
      className={`h-16 transition-all duration-300 ease-in-out fixed top-0 left-0 z-10 flex items-center justify-between px-4 py-2 border-border border bg-sidebar ${
        isExpanded ? "sm:left-64" : "sm:left-16"
      } left-0 right-0`}
    >
      {/* Left - Breadcrumb */}
      <BreadcrumbWrapper items={pages} />

      {/* Right - Icons & Time */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        {/* <NotificationsDropdown /> */}

        {/* Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Avatar
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-sidebar-accent cursor-pointer border border-sidebar-border"
            onClick={handleAvatarClick}
          >
            <AvatarImage src="/profile.jpg" alt="@user" />
            <AvatarFallback className="text-sm font-medium text-sidebar-foreground bg-sidebar-accent">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-sidebar border border-sidebar-border rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-sidebar-border">
                <p className="font-medium text-sidebar-foreground">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || user?.gmail || "user@example.com"}
                </p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-sidebar-accent rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timer Clock */}
        {time ? <TimerClock time={time} /> : <TimerSkeleton />}
      </div>
    </header>
  );
}
