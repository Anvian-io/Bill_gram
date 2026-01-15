import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Truck,
  Fuel,
  Users,
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
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export default function Van() {
  // Sample data for vans
  const vans = [
    {
      id: 1,
      registration: "DL01AB1234",
      name: "Van Alpha",
      model: "Tata Ace",
      capacity: 1000, // kg
      driver: "Ramesh Kumar",
      currentLoad: 750,
      fuelType: "Diesel",
      fuelEfficiency: 15, // km/l
      status: "On Route",
      currentLocation: "South Delhi",
      lastService: "2024-01-15",
    },
    {
      id: 2,
      registration: "DL01CD5678",
      name: "Van Beta",
      model: "Mahindra Supro",
      capacity: 800,
      driver: "Suresh Patel",
      currentLoad: 600,
      fuelType: "Diesel",
      fuelEfficiency: 18,
      status: "Available",
      currentLocation: "Warehouse",
      lastService: "2024-02-01",
    },
    {
      id: 3,
      registration: "DL01EF9012",
      name: "Van Gamma",
      model: "Ashok Leyland Dost",
      capacity: 1200,
      driver: "Mahesh Sharma",
      currentLoad: 1100,
      fuelType: "CNG",
      fuelEfficiency: 12,
      status: "On Route",
      currentLocation: "North Delhi",
      lastService: "2024-01-20",
    },
    {
      id: 4,
      registration: "DL01GH3456",
      name: "Van Delta",
      model: "Tata Intra",
      capacity: 1500,
      driver: "Rajesh Yadav",
      currentLoad: 0,
      fuelType: "Diesel",
      fuelEfficiency: 14,
      status: "Maintenance",
      currentLocation: "Service Center",
      lastService: "2024-02-10",
    },
    {
      id: 5,
      registration: "DL01IJ7890",
      name: "Van Epsilon",
      model: "Mahindra Jeeto",
      capacity: 600,
      driver: "Anil Verma",
      currentLoad: 450,
      fuelType: "Petrol",
      fuelEfficiency: 20,
      status: "Available",
      currentLocation: "Warehouse",
      lastService: "2024-01-25",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Route":
        return "bg-blue-100 text-blue-800";
      case "Available":
        return "bg-green-100 text-green-800";
      case "Maintenance":
        return "bg-red-100 text-red-800";
      case "Loading":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateLoadPercentage = (currentLoad: number, capacity: number) => {
    return Math.round((currentLoad / capacity) * 100);
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
            <h2 className="text-xl font-semibold">Delivery Vans</h2>
            <p className="text-muted-foreground">
              Manage your fleet of delivery vehicles and their status
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Van
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search vans by registration, name, or driver..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Truck className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Vans Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Van Details</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Current Load</TableHead>
                  <TableHead>Fuel & Efficiency</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vans.map((van) => {
                  const loadPercentage = calculateLoadPercentage(
                    van.currentLoad,
                    van.capacity
                  );
                  return (
                    <TableRow key={van.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                            <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <div className="font-medium">{van.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {van.registration} • {van.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{van.driver}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{van.currentLoad} kg</span>
                            <span>{van.capacity} kg</span>
                          </div>
                          <Progress
                            value={loadPercentage}
                            className={`h-2 ${
                              loadPercentage >= 90
                                ? "bg-red-500"
                                : loadPercentage >= 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          />
                          <div className="text-xs text-center">
                            {loadPercentage}% loaded
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Fuel className="h-3 w-3" />
                            {van.fuelType}
                          </div>
                          <div className="text-sm">
                            {van.fuelEfficiency} km/l
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{van.currentLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(van.status)}>
                          {van.status}
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

        {/* Fleet Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Vans</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available Vans
                  </p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <div className="h-5 w-5 rounded-full bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Route</p>
                  <p className="text-2xl font-bold">6</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <div className="h-5 w-5 rounded-full bg-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    In Maintenance
                  </p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <div className="h-5 w-5 rounded-full bg-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Maintenance Schedule</h3>
            <div className="space-y-4">
              {vans.map((van) => (
                <div
                  key={van.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{van.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last service: {van.lastService}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant={
                        new Date(van.lastService) < new Date("2024-01-01")
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {new Date(van.lastService) < new Date("2024-01-01")
                        ? "Service Due"
                        : "Up to Date"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
