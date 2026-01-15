import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  Building2,
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
import { motion } from "framer-motion";

export default function Area() {
  // Sample data for areas
  const areas = [
    {
      id: 1,
      code: "AREA001",
      name: "South Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      salesman: "Rajesh Kumar",
      customerCount: 42,
      salesTarget: 500000,
      status: "Active",
    },
    {
      id: 2,
      code: "AREA002",
      name: "North Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110006",
      salesman: "Priya Sharma",
      customerCount: 38,
      salesTarget: 450000,
      status: "Active",
    },
    {
      id: 3,
      code: "AREA003",
      name: "East Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110092",
      salesman: "Amit Patel",
      customerCount: 35,
      salesTarget: 400000,
      status: "Active",
    },
    {
      id: 4,
      code: "AREA004",
      name: "West Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110018",
      salesman: "Sneha Reddy",
      customerCount: 45,
      salesTarget: 550000,
      status: "Active",
    },
    {
      id: 5,
      code: "AREA005",
      name: "Central Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110002",
      salesman: "Vikram Singh",
      customerCount: 28,
      salesTarget: 300000,
      status: "Inactive",
    },
  ];

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
            <h2 className="text-xl font-semibold">Areas</h2>
            <p className="text-muted-foreground">
              Manage geographical areas for sales and distribution
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Area
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search areas by name, code, or city..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Areas Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned Salesman</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Sales Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">{area.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {area.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {area.city}, {area.state}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pincode: {area.pincode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{area.salesman}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {area.customerCount}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          customers
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{area.salesTarget.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          area.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          area.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {area.status}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Area Map Visualization */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">Area Distribution Map</h3>
                <p className="text-sm text-muted-foreground">
                  Geographical distribution of sales areas
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Full Map
              </Button>
            </div>

            {/* Simplified Map Visualization */}
            <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg overflow-hidden">
              {/* Delhi Map Outline */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* Delhi Shape */}
                  <div className="absolute inset-0 border-2 border-blue-300 rounded-lg"></div>

                  {/* Area Points */}
                  {areas.map((area, index) => {
                    const positions = [
                      { top: "30%", left: "40%" }, // South
                      { top: "20%", left: "60%" }, // North
                      { top: "50%", left: "70%" }, // East
                      { top: "60%", left: "30%" }, // West
                      { top: "40%", left: "50%" }, // Central
                    ];

                    return (
                      <div
                        key={area.id}
                        className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform ${
                          area.status === "Active"
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gray-400 text-white"
                        }`}
                        style={positions[index]}
                        title={`${area.name} - ${area.customerCount} customers`}
                      >
                        <div className="text-xs font-bold">
                          {area.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div className="absolute -bottom-10 left-0 right-0">
                    <div className="flex justify-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Active Area</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span>Inactive Area</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
