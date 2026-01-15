import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Wallet,
  Banknote,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export default function Account() {
  // Sample data for account heads
  const accounts = [
    {
      id: 1,
      code: "ACC001",
      name: "Cash Account",
      type: "Asset",
      group: "Current Assets",
      balance: 1250000,
      openingBalance: 1000000,
      creditLimit: 0,
      status: "Active",
      transactions: 245,
      lastTransaction: "2024-02-15",
    },
    {
      id: 2,
      code: "ACC002",
      name: "Bank of India",
      type: "Asset",
      group: "Bank Accounts",
      balance: 3250000,
      openingBalance: 3000000,
      creditLimit: 0,
      status: "Active",
      transactions: 156,
      lastTransaction: "2024-02-14",
    },
    {
      id: 3,
      code: "ACC003",
      name: "Accounts Receivable",
      type: "Asset",
      group: "Current Assets",
      balance: 1850000,
      openingBalance: 1500000,
      creditLimit: 0,
      status: "Active",
      transactions: 324,
      lastTransaction: "2024-02-15",
    },
    {
      id: 4,
      code: "ACC004",
      name: "Inventory Account",
      type: "Asset",
      group: "Current Assets",
      balance: 2750000,
      openingBalance: 2500000,
      creditLimit: 0,
      status: "Active",
      transactions: 189,
      lastTransaction: "2024-02-13",
    },
    {
      id: 5,
      code: "ACC005",
      name: "Accounts Payable",
      type: "Liability",
      group: "Current Liabilities",
      balance: 850000,
      openingBalance: 1000000,
      creditLimit: 0,
      status: "Active",
      transactions: 278,
      lastTransaction: "2024-02-15",
    },
    {
      id: 6,
      code: "ACC006",
      name: "Sales Revenue",
      type: "Revenue",
      group: "Operating Revenue",
      balance: 9850000,
      openingBalance: 0,
      creditLimit: 0,
      status: "Active",
      transactions: 456,
      lastTransaction: "2024-02-15",
    },
    {
      id: 7,
      code: "ACC007",
      name: "Purchase Account",
      type: "Expense",
      group: "Cost of Goods Sold",
      balance: 6250000,
      openingBalance: 0,
      creditLimit: 0,
      status: "Active",
      transactions: 312,
      lastTransaction: "2024-02-14",
    },
    {
      id: 8,
      code: "ACC008",
      name: "Salary Expense",
      type: "Expense",
      group: "Operating Expenses",
      balance: 1250000,
      openingBalance: 0,
      creditLimit: 0,
      status: "Active",
      transactions: 45,
      lastTransaction: "2024-02-10",
    },
  ];

  // Financial summary data
  const financialSummary = {
    totalAssets: 9100000,
    totalLiabilities: 850000,
    totalEquity: 8250000,
    totalRevenue: 9850000,
    totalExpenses: 7500000,
    netProfit: 2350000,
    cashBalance: 4500000,
    accountsReceivable: 1850000,
    accountsPayable: 850000,
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "Asset":
        return "bg-green-100 text-green-800";
      case "Liability":
        return "bg-red-100 text-red-800";
      case "Revenue":
        return "bg-blue-100 text-blue-800";
      case "Expense":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBalanceChange = (balance: number, openingBalance: number) => {
    const change = balance - openingBalance;
    const percentage = openingBalance > 0 ? (change / openingBalance) * 100 : 0;
    return { change, percentage };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Account Heads</h2>
            <p className="text-muted-foreground">
              Manage your chart of accounts and financial ledger
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <PieChart className="h-4 w-4" />
              Trial Balance
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">
                    ₹{financialSummary.totalAssets.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800/30">
                  <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+12.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Liabilities
                  </p>
                  <p className="text-2xl font-bold">
                    ₹{financialSummary.totalLiabilities.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/30">
                  <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span>-8.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">
                    ₹{financialSummary.netProfit.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/30">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span>+18.3% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cash Balance</p>
                  <p className="text-2xl font-bold">
                    ₹{financialSummary.cashBalance.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-800/30">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-purple-600">
                <TrendingUp className="h-4 w-4" />
                <span>+5.7% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search accounts by name, code, or type..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Filter by Type
            </Button>
            <Button variant="outline">Export Ledger</Button>
          </div>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const { change, percentage } = getBalanceChange(
                    account.balance,
                    account.openingBalance
                  );
                  const isPositive = change >= 0;

                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {account.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAccountTypeColor(account.type)}>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{account.group}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{account.balance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`font-medium ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? "+" : ""}₹
                            {Math.abs(change).toLocaleString()}
                          </span>
                          <span
                            className={`text-xs ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ({isPositive ? "+" : ""}
                            {percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {account.transactions} trans
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last: {account.lastTransaction}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            account.status === "Active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Financial Ratios and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Sheet Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Balance Sheet</h3>
                <PieChart className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Assets</span>
                    <span className="text-sm font-medium">
                      ₹{financialSummary.totalAssets.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={68} className="h-2 bg-green-100" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Liabilities</span>
                    <span className="text-sm font-medium">
                      ₹{financialSummary.totalLiabilities.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={32} className="h-2 bg-red-100" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Equity</span>
                    <span className="font-bold">
                      ₹{financialSummary.totalEquity.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income Statement */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Income Statement</h3>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Revenue</span>
                  </div>
                  <span className="font-bold">
                    ₹{financialSummary.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Expenses</span>
                  </div>
                  <span className="font-bold">
                    ₹{financialSummary.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Net Profit</span>
                  </div>
                  <span className="font-bold text-green-700 dark:text-green-400">
                    ₹{financialSummary.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Quick Actions</h3>
                <Banknote className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <Button className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  Create Journal Entry
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  View Trial Balance
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <PieChart className="h-4 w-4" />
                  Generate Reports
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Bank Reconciliation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
