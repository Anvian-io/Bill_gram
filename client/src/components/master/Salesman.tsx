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
  Users,
  Phone,
  Mail,
  MapPin,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function Salesman() {
  // Sample data for salesmen
  const salesmen = [
    {
      id: 1,
      name: "Rajesh Kumar",
      code: "SLS001",
      mobile: "+91 9876543210",
      email: "rajesh@example.com",
      area: "South Delhi",
      target: 500000,
      achieved: 425000,
      commission: 8.5,
      status: "Active",
    },
    {
      id: 2,
      name: "Priya Sharma",
      code: "SLS002",
      mobile: "+91 8765432109",
      email: "priya@example.com",
      area: "North Delhi",
      target: 450000,
      achieved: 380000,
      commission: 7.5,
      status: "Active",
    },
    {
      id: 3,
      name: "Amit Patel",
      code: "SLS003",
      mobile: "+91 7654321098",
      email: "amit@example.com",
      area: "East Delhi",
      target: 400000,
      achieved: 420000,
      commission: 9.0,
      status: "Active",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      code: "SLS004",
      mobile: "+91 6543210987",
      email: "sneha@example.com",
      area: "West Delhi",
      target: 550000,
      achieved: 510000,
      commission: 8.0,
      status: "Active",
    },
    {
      id: 5,
      name: "Vikram Singh",
      code: "SLS005",
      mobile: "+91 5432109876",
      email: "vikram@example.com",
      area: "Central Delhi",
      target: 600000,
      achieved: 580000,
      commission: 8.2,
      status: "On Leave",
    },
  ];

  const calculatePercentage = (achieved: number, target: number) => {
    return Math.round((achieved / target) * 100);
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
            <h2 className="text-xl font-semibold">Sales Team</h2>
            <p className="text-muted-foreground">
              Manage your sales representatives and their performance
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Salesman
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search salesmen by name, code, or area..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Salesmen Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Target vs Achieved</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesmen.map((salesman) => {
                  const percentage = calculatePercentage(
                    salesman.achieved,
                    salesman.target
                  );
                  return (
                    <TableRow key={salesman.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {salesman.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{salesman.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {salesman.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {salesman.mobile}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {salesman.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{salesman.area}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>₹{salesman.achieved.toLocaleString()}</span>
                            <span>₹{salesman.target.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 100
                                  ? "bg-green-500"
                                  : percentage >= 80
                                  ? "bg-blue-500"
                                  : percentage >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-center">
                            {percentage}% achieved
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {salesman.commission}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            salesman.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            salesman.status === "Active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {salesman.status}
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

        {/* Performance Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Team Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Target
                    </p>
                    <p className="text-2xl font-bold">₹25,00,000</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Achieved</p>
                    <p className="text-2xl font-bold">₹23,15,000</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Average Commission
                    </p>
                    <p className="text-2xl font-bold">8.24%</p>
                  </div>
                  <div className="text-2xl text-purple-500">%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
