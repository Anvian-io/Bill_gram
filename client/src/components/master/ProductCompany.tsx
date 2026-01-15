// import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building,
  Phone,
  Mail,
  Globe,
  Package,
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

export default function ProductCompany() {
  // Sample data for product companies
  const companies = [
    {
      id: 1,
      name: "137 Degrees",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=137",
      contactPerson: "John Smith",
      email: "john@137degrees.com",
      phone: "+1 (555) 123-4567",
      website: "www.137degrees.com",
      address: "123 Business St, New York, NY",
      productCount: 58,
      status: "Active",
    },
    {
      id: 2,
      name: "Parle Agro",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Parle",
      contactPerson: "Sarah Johnson",
      email: "sarah@parle.com",
      phone: "+1 (555) 987-6543",
      website: "www.parleagro.com",
      address: "456 Industry Ave, Chicago, IL",
      productCount: 42,
      status: "Active",
    },
    {
      id: 3,
      name: "Nestle India",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Nestle",
      contactPerson: "Michael Chen",
      email: "michael@nestle.in",
      phone: "+91 9876543210",
      website: "www.nestle.in",
      address: "789 Corporate Rd, Mumbai, India",
      productCount: 127,
      status: "Active",
    },
    {
      id: 4,
      name: "Britannia Industries",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Britannia",
      contactPerson: "Priya Sharma",
      email: "priya@britannia.com",
      phone: "+91 8765432109",
      website: "www.britannia.com",
      address: "321 Factory St, Delhi, India",
      productCount: 89,
      status: "Inactive",
    },
    {
      id: 5,
      name: "Amul",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Amul",
      contactPerson: "Raj Patel",
      email: "raj@amul.com",
      phone: "+91 7654321098",
      website: "www.amul.com",
      address: "654 Dairy Rd, Gujarat, India",
      productCount: 156,
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
            <h2 className="text-xl font-semibold">Product Companies</h2>
            <p className="text-muted-foreground">
              Manage manufacturers and suppliers of your products
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search companies..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Building className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        {/* Companies Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={company.logo} alt={company.name} />
                          <AvatarFallback>
                            {company.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {company.website}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {company.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {company.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {company.productCount} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          company.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          company.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {company.status}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Companies
                  </p>
                  <p className="text-2xl font-bold">42</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Companies
                  </p>
                  <p className="text-2xl font-bold">38</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <div className="h-6 w-6 rounded-full bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold">1,248</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
