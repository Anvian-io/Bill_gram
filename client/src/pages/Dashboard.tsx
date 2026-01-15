import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Database,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  Badge,
} from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      backupDatabase: () => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
    };
  }
}

// Mock data for charts
const monthlySalesData = [
  { month: "Jan", sales: 42000, purchases: 28000, profit: 14000 },
  { month: "Feb", sales: 38000, purchases: 32000, profit: 6000 },
  { month: "Mar", sales: 52000, purchases: 35000, profit: 17000 },
  { month: "Apr", sales: 48000, purchases: 30000, profit: 18000 },
  { month: "May", sales: 61000, purchases: 42000, profit: 19000 },
  { month: "Jun", sales: 55000, purchases: 38000, profit: 17000 },
  { month: "Jul", sales: 72000, purchases: 45000, profit: 27000 },
  { month: "Aug", sales: 68000, purchases: 40000, profit: 28000 },
  { month: "Sep", sales: 59000, purchases: 35000, profit: 24000 },
  { month: "Oct", sales: 63000, purchases: 42000, profit: 21000 },
  { month: "Nov", sales: 75000, purchases: 48000, profit: 27000 },
  { month: "Dec", sales: 82000, purchases: 52000, profit: 30000 },
];

const productPerformanceData = [
  { name: "MILKY BAR 5 RS", sales: 450, revenue: 67500 },
  { name: "CHOCO DELIGHT", sales: 380, revenue: 53200 },
  { name: "NUTTY CRUNCH", sales: 290, revenue: 34800 },
  { name: "CARAMEL BLAST", sales: 520, revenue: 156000 },
  { name: "FRUITY SWIRL", sales: 310, revenue: 54250 },
  { name: "VANILLA DREAM", sales: 420, revenue: 42840 },
];

const expenseBreakdownData = [
  { name: "Inventory", value: 42000, color: "#3b82f6" },
  { name: "Salaries", value: 25000, color: "#10b981" },
  { name: "Rent", value: 15000, color: "#f59e0b" },
  { name: "Utilities", value: 8000, color: "#ef4444" },
  { name: "Marketing", value: 12000, color: "#8b5cf6" },
  { name: "Maintenance", value: 5000, color: "#6366f1" },
];

const dailySalesData = [
  { day: "Mon", sales: 8500 },
  { day: "Tue", sales: 9200 },
  { day: "Wed", sales: 7800 },
  { day: "Thu", sales: 10500 },
  { day: "Fri", sales: 12800 },
  { day: "Sat", sales: 15200 },
  { day: "Sun", sales: 9800 },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  // Calculate statistics
  const totalSales = monthlySalesData.reduce(
    (sum, item) => sum + item.sales,
    0
  );
  const totalPurchases = monthlySalesData.reduce(
    (sum, item) => sum + item.purchases,
    0
  );
  const totalProfit = monthlySalesData.reduce(
    (sum, item) => sum + item.profit,
    0
  );
  const avgMonthlyProfit = Math.round(totalProfit / 12);
  const profitMargin = ((totalProfit / totalSales) * 100).toFixed(1);

  // Find best and worst months
  const bestMonth = monthlySalesData.reduce((prev, current) =>
    prev.profit > current.profit ? prev : current
  );
  const worstMonth = monthlySalesData.reduce((prev, current) =>
    prev.profit < current.profit ? prev : current
  );

  const handleBackupDatabase = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus("Creating backup...");

      // Check if we're in Electron environment
      if (window.electronAPI) {
        const result = await window.electronAPI.backupDatabase();

        if (result.success) {
          setBackupStatus(`✅ Backup saved to: ${result.path}`);
          setTimeout(() => setBackupStatus(""), 5000);
        } else {
          setBackupStatus(`❌ Backup failed: ${result.error}`);
          setTimeout(() => setBackupStatus(""), 5000);
        }
      } else {
        setBackupStatus("❌ Backup only available in desktop app");
        setTimeout(() => setBackupStatus(""), 3000);
      }
    } catch (error) {
      console.error("Backup error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error);
      setBackupStatus(`❌ Error: ${errorMessage}`);
      setTimeout(() => setBackupStatus(""), 5000);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="w-full space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.shop_name || user?.username}! Here's your
            business overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleBackupDatabase}
            disabled={isBackingUp}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isBackingUp ? (
              <>
                <Database className="h-4 w-4 animate-spin" />
                Backing up...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download DB
              </>
            )}
          </Button>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      {backupStatus && (
        <div
          className={`p-4 rounded-lg ${
            backupStatus.startsWith("✅")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <p className="text-sm font-medium">{backupStatus}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">
                  ₹{totalSales.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    +12.5% from last year
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold">
                  ₹{totalProfit.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    +18.3% from last year
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">
                  ₹{totalPurchases.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">
                    -5.2% from last year
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                <ShoppingCart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">{profitMargin}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+2.4% improved</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Purchases Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Sales vs Purchases</CardTitle>
                <CardDescription>Revenue and cost comparison</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={timeRange === "month" ? "default" : "outline"}
                  onClick={() => setTimeRange("month")}
                >
                  Month
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === "year" ? "default" : "outline"}
                  onClick={() => setTimeRange("year")}
                >
                  Year
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString()}`,
                      "Amount",
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Sales"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Purchases"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Profit"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
            <CardDescription>Last week's sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString()}`,
                      "Sales",
                    ]}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Daily Sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
