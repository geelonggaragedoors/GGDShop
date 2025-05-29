import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { Search, Eye, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
    queryFn: api.admin.customers.getAll,
  });

  const filteredCustomers = customers?.filter(customer =>
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const columns = [
    {
      header: "Customer",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.original.firstName && row.original.lastName 
              ? `${row.original.firstName} ${row.original.lastName}`
              : row.original.email
            }
          </p>
          <p className="text-sm text-gray-500">{row.original.email}</p>
        </div>
      ),
    },
    {
      header: "Contact",
      accessorKey: "contact",
      cell: ({ row }: any) => (
        <div>
          {row.original.phone && (
            <p className="text-sm text-gray-600 flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {row.original.phone}
            </p>
          )}
          {row.original.company && (
            <p className="text-sm text-gray-500">{row.original.company}</p>
          )}
        </div>
      ),
    },
    {
      header: "Joined",
      accessorKey: "createdAt",
      cell: ({ row }: any) => (
        <span className="text-gray-600">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedCustomer(row.original)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
              </DialogHeader>
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Contact Information</h4>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Name:</span>{' '}
                          {selectedCustomer.firstName && selectedCustomer.lastName
                            ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                            : 'Not provided'
                          }
                        </p>
                        <p className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {selectedCustomer.email}
                        </p>
                        {selectedCustomer.phone && (
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {selectedCustomer.phone}
                          </p>
                        )}
                        {selectedCustomer.company && (
                          <p>
                            <span className="font-medium">Company:</span> {selectedCustomer.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Account Details</h4>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Joined:</span>{' '}
                          {format(new Date(selectedCustomer.createdAt), 'MMMM dd, yyyy')}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          <Badge variant={selectedCustomer.isActive ? "default" : "secondary"}>
                            {selectedCustomer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="ghost">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customers Management</h2>
              <p className="text-gray-600">Customer relationship management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search customers by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredCustomers}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}