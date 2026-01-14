import { useEffect, useState, useRef } from "react";
import { BreadcrumbWrapper } from "../custom_ui/CustomBreadCrumb";
import { Bell, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { NotificationsDropdown } from "../Notifications/NotificationsDropdown";
import { useNavigate } from "react-router-dom";

// Define types
interface TimeState {
  date: string;
  hours: string;
  minutes: string;
  seconds: string;
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
        timeZone: "Africa/Gaborone", // Botswana timezone
      };

      // Get individual time components
      const date = now.toLocaleDateString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
      });

      const hours = now
        .toLocaleString("en-GB", {
          hour: "2-digit",
          hour12: false,
          ...options,
        })
        .split(":")[0]
        .padStart(2, "0");

      const minutes = now
        .toLocaleString("en-GB", {
          minute: "2-digit",
          ...options,
        })
        .padStart(2, "0");

      const seconds = String(
        now.toLocaleString("en-GB", { second: "numeric", ...options })
      ).padStart(2, "0");

      setTime({ date, hours, minutes, seconds });
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
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border border">
          <span className="text-lg font-bold text-text">{"00"}</span>
        </div>

        <div className="text-2xl font-bold text-text animate-pulse">:</div>

        {/* Minutes */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border border">
          <span className="text-lg font-bold text-text">{"00"}</span>
        </div>

        <div className="text-2xl font-bold text-text animate-pulse">:</div>

        {/* Seconds */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border border">
          <span className="text-lg font-bold text-text">{"00"}</span>
        </div>
      </div>
    </div>
  );

  // Timer clock component
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
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border border">
          <span className="text-lg font-bold text-text">{time.hours}</span>
        </div>

        <div className="text-2xl font-bold text-text animate-pulse">:</div>

        {/* Minutes */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border border">
          <span className="text-lg font-bold text-text">{time.minutes}</span>
        </div>

        <div className="text-2xl font-bold text-text animate-pulse">:</div>

        {/* Seconds */}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg p-2 min-w-[3rem] border-border border">
          <span className="text-lg font-bold text-text">{time.seconds}</span>
        </div>
      </div>
    </div>
  );

  return (
    <header
      className={`h-16 transition-all duration-300 ease-in-out fixed top-0 left-0 z-10 flex items-center justify-between px-4 py-2 border-border border bg-sidebar ${
        isExpanded ? "left-64" : "left-16"
      } right-0`}
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
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-hoverBg cursor-pointer"
            onClick={handleAvatarClick}
          >
            <AvatarImage src="/profile.jpg" alt="@user" />
            <AvatarFallback className="text-sm font-medium">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-border z-20">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.gmail || user?.email || "No email"}
                </p>
              </div>
              <button
                onClick={handleProfile}
                className="border-b border-border w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
              >
                <User size={16} />
                Profile
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Timer Clock */}
        {time ? <TimerClock time={time} /> : <TimerSkeleton />}
      </div>
    </header>
  );
}
