import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
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

export default function Customer() {
  // Sample data for customers
  const customers = [
    {
      id: 1,
      name: "Reliance Fresh",
      code: "CUST001",
      type: "Retail Store",
      contactPerson: "Mr. Sharma",
      mobile: "+91 9876543210",
      email: "orders@reliance.com",
      address: "Connaught Place, Delhi",
      creditLimit: 500000,
      outstanding: 125000,
      salesman: "Rajesh Kumar",
      status: "Active",
    },
    {
      id: 2,
      name: "Big Bazaar",
      code: "CUST002",
      type: "Supermarket",
      contactPerson: "Ms. Gupta",
      mobile: "+91 8765432109",
      email: "purchase@bigbazaar.com",
      address: "Rajouri Garden, Delhi",
      creditLimit: 1000000,
      outstanding: 325000,
      salesman: "Priya Sharma",
      status: "Active",
    },
    {
      id: 3,
      name: "More Retail",
      code: "CUST003",
      type: "Hypermarket",
      contactPerson: "Mr. Reddy",
      mobile: "+91 7654321098",
      email: "vendor@more.com",
      address: "Saket, Delhi",
      creditLimit: 750000,
      outstanding: 0,
      salesman: "Amit Patel",
      status: "Active",
    },
    {
      id: 4,
      name: "DMart",
      code: "CUST004",
      type: "Chain Store",
      contactPerson: "Mr. Patel",
      mobile: "+91 6543210987",
      email: "suppliers@dmart.com",
      address: "Dwarka, Delhi",
      creditLimit: 2000000,
      outstanding: 850000,
      salesman: "Sneha Reddy",
      status: "Credit Hold",
    },
    {
      id: 5,
      name: "Local Kirana Store",
      code: "CUST005",
      type: "Kirana",
      contactPerson: "Mr. Singh",
      mobile: "+91 5432109876",
      email: "kirana@local.com",
      address: "Karol Bagh, Delhi",
      creditLimit: 100000,
      outstanding: 25000,
      salesman: "Vikram Singh",
      status: "Active",
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
            <h2 className="text-xl font-semibold">Customers</h2>
            <p className="text-muted-foreground">
              Manage your customer database and credit information
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search customers by name, code, or type..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <UserCircle className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {customer.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{customer.contactPerson}</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.mobile}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{customer.creditLimit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div
                          className={`font-medium ${
                            customer.outstanding > customer.creditLimit * 0.8
                              ? "text-red-600"
                              : customer.outstanding > 0
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          ₹{customer.outstanding.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(
                            (customer.outstanding / customer.creditLimit) *
                            100
                          ).toFixed(1)}
                          % used
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.salesman}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.status === "Active"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          customer.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {customer.status}
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

        {/* Customer Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Customers
                  </p>
                  <p className="text-2xl font-bold">142</p>
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
                  <p className="text-sm text-muted-foreground">
                    Total Outstanding
                  </p>
                  <p className="text-2xl font-bold">₹13.5L</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <div className="h-5 w-5 text-yellow-600 dark:text-yellow-400">
                    ₹
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg. Credit Limit
                  </p>
                  <p className="text-2xl font-bold">₹4.2L</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <ShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
