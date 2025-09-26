import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/crop";

export default function Test() {
  const [images, setImages] = useState([null, null]);
  const [croppedImages, setCroppedImages] = useState([null, null]);
  const [croppingImage, setCroppingImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedIndex(index);
        setCroppingImage(reader.result);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback(
    async (_, croppedAreaPixels) => {
      if (croppingImage) {
        const croppedImage = await getCroppedImg(
          croppingImage,
          croppedAreaPixels
        );
        const newCroppedImages = [...croppedImages];
        newCroppedImages[selectedIndex] = croppedImage;
        setCroppedImages(newCroppedImages);
        setIsModalOpen(false); // Close modal after saving
      }
    },
    [croppingImage, selectedIndex]
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-md w-96 mx-auto">
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, index)}
            className="border p-2 rounded-lg cursor-pointer"
          />
          {croppedImages[index] && (
            <img
              src={croppedImages[index]}
              alt={`Cropped Preview ${index + 1}`}
              className="w-32 h-32 object-cover rounded-lg border"
            />
          )}
        </div>
      ))}

      {/* Modal for Cropping */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-2">Crop Image</h2>
            <div className="relative w-full h-64">
              <Cropper
                image={croppingImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => onCropComplete(null, null)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import React, { useState } from "react";
// import {
//     Search,
//     Plus,
//     MoreHorizontal,
//     ArrowUpDown,
//     Filter,
//     CheckCircle,
//     XCircle,
//     Download,
//     Upload,
//     Trash2,
//     RefreshCw,
// } from "lucide-react";

// // Import shadcn components
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectLabel,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//     Pagination,
//     PaginationContent,
//     PaginationEllipsis,
//     PaginationItem,
//     PaginationLink,
//     PaginationNext,
//     PaginationPrevious,
// } from "@/components/ui/pagination";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// // Sample user data
// const sampleUsers = [
//     {
//         id: 1,
//         name: "John Doe",
//         email: "john.doe@example.com",
//         role: "Admin",
//         status: "Active",
//         lastActive: "2 hours ago",
//         joined: "Jan 10, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 2,
//         name: "Jane Smith",
//         email: "jane.smith@example.com",
//         role: "User",
//         status: "Active",
//         lastActive: "1 day ago",
//         joined: "Mar 15, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 3,
//         name: "Robert Johnson",
//         email: "robert.j@example.com",
//         role: "Editor",
//         status: "Blocked",
//         lastActive: "3 weeks ago",
//         joined: "Nov 5, 2022",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 4,
//         name: "Sarah Williams",
//         email: "sarah.w@example.com",
//         role: "User",
//         status: "Inactive",
//         lastActive: "2 months ago",
//         joined: "Aug 22, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 5,
//         name: "Michael Brown",
//         email: "m.brown@example.com",
//         role: "User",
//         status: "Active",
//         lastActive: "Just now",
//         joined: "Feb 14, 2024",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 6,
//         name: "Emily Davis",
//         email: "emily.d@example.com",
//         role: "Editor",
//         status: "Active",
//         lastActive: "5 hours ago",
//         joined: "Apr 30, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 7,
//         name: "David Miller",
//         email: "david.m@example.com",
//         role: "User",
//         status: "Blocked",
//         lastActive: "1 month ago",
//         joined: "Sep 12, 2022",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 8,
//         name: "Lisa Wilson",
//         email: "lisa.w@example.com",
//         role: "User",
//         status: "Active",
//         lastActive: "3 days ago",
//         joined: "Jul 7, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
// ];

// const Test = () => {
//     // State for search term
//     const [searchTerm, setSearchTerm] = useState("");

//     // State for filter
//     const [statusFilter, setStatusFilter] = useState("all");
//     const [roleFilter, setRoleFilter] = useState("all");

//     // State for selected users
//     const [selectedUsers, setSelectedUsers] = useState([]);

//     // State for dialog
//     const [isAddUserOpen, setIsAddUserOpen] = useState(false);

//     // State for users data
//     const [users, setUsers] = useState(sampleUsers);

//     // State for current page
//     const [currentPage, setCurrentPage] = useState(1);
//     const itemsPerPage = 5;

//     // Filter and search users
//     const filteredUsers = users.filter((user) => {
//         // Search filter
//         const matchesSearch =
//             user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             user.email.toLowerCase().includes(searchTerm.toLowerCase());

//         // Status filter
//         const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase();

//         // Role filter
//         const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase();

//         return matchesSearch && matchesStatus && matchesRole;
//     });

//     // Paginated users
//     const indexOfLastUser = currentPage * itemsPerPage;
//     const indexOfFirstUser = indexOfLastUser - itemsPerPage;
//     const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
//     const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

//     // Toggle user selection
//     const toggleUserSelection = (userId) => {
//         if (selectedUsers.includes(userId)) {
//             setSelectedUsers(selectedUsers.filter((id) => id !== userId));
//         } else {
//             setSelectedUsers([...selectedUsers, userId]);
//         }
//     };

//     // Toggle all users selection
//     const toggleAllUsers = () => {
//         if (selectedUsers.length === currentUsers.length) {
//             setSelectedUsers([]);
//         } else {
//             setSelectedUsers(currentUsers.map((user) => user.id));
//         }
//     };

//     // Handle block/unblock user
//     const toggleUserStatus = (userId) => {
//         setUsers(
//             users.map((user) => {
//                 if (user.id === userId) {
//                     const newStatus = user.status === "Active" ? "Blocked" : "Active";
//                     return { ...user, status: newStatus };
//                 }
//                 return user;
//             })
//         );
//     };

//     // Handle bulk block/unblock
//     const bulkToggleStatus = (status) => {
//         setUsers(
//             users.map((user) => {
//                 if (selectedUsers.includes(user.id)) {
//                     return { ...user, status };
//                 }
//                 return user;
//             })
//         );
//         setSelectedUsers([]);
//     };

//     // Handle reset filters
//     const resetFilters = () => {
//         setSearchTerm("");
//         setStatusFilter("all");
//         setRoleFilter("all");
//     };

//     // User status badge component
//     const UserStatusBadge = ({ status }) => {
//         let variant = "secondary";
//         let icon = null;

//         if (status === "Active") {
//             variant = "success";
//             icon = <CheckCircle className="w-3 h-3 mr-1" />;
//         } else if (status === "Blocked") {
//             variant = "destructive";
//             icon = <XCircle className="w-3 h-3 mr-1" />;
//         } else if (status === "Inactive") {
//             variant = "outline";
//         }

//         return (
//             <Badge variant={variant} className="flex items-center">
//                 {icon}
//                 {status}
//             </Badge>
//         );
//     };

//     return (
//         <div className="space-y-4">
//             <Tabs defaultValue="list" className="w-full">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
//                     <div>
//                         <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
//                         <p className="text-muted-foreground">Manage user accounts, permissions and roles.</p>
//                     </div>
//                     <TabsList className="mt-2 sm:mt-0">
//                         <TabsTrigger value="list">List View</TabsTrigger>
//                         <TabsTrigger value="grid">Grid View</TabsTrigger>
//                     </TabsList>
//                 </div>

//                 <Card>
//                     <CardHeader className="p-4">
//                         <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center sm:justify-between">
//                             <div className="relative w-full sm:w-64 md:w-80">
//                                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                                 <Input
//                                     type="search"
//                                     placeholder="Search users..."
//                                     className="pl-8 w-full"
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                 />
//                             </div>

//                             <div className="flex flex-wrap gap-2">
//                                 <Select value={statusFilter} onValueChange={setStatusFilter}>
//                                     <SelectTrigger className="w-[130px]">
//                                         <SelectValue placeholder="Status" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="all">All Status</SelectItem>
//                                         <SelectItem value="active">Active</SelectItem>
//                                         <SelectItem value="blocked">Blocked</SelectItem>
//                                         <SelectItem value="inactive">Inactive</SelectItem>
//                                     </SelectContent>
//                                 </Select>

//                                 <Select value={roleFilter} onValueChange={setRoleFilter}>
//                                     <SelectTrigger className="w-[130px]">
//                                         <SelectValue placeholder="Role" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="all">All Roles</SelectItem>
//                                         <SelectItem value="admin">Admin</SelectItem>
//                                         <SelectItem value="editor">Editor</SelectItem>
//                                         <SelectItem value="user">User</SelectItem>
//                                     </SelectContent>
//                                 </Select>

//                                 <TooltipProvider>
//                                     <Tooltip>
//                                         <TooltipTrigger asChild>
//                                             <Button variant="outline" size="icon" onClick={resetFilters}>
//                                                 <RefreshCw className="h-4 w-4" />
//                                             </Button>
//                                         </TooltipTrigger>
//                                         <TooltipContent>Reset Filters</TooltipContent>
//                                     </Tooltip>
//                                 </TooltipProvider>

//                                 <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
//                                     <DialogTrigger asChild>
//                                         <Button className="ml-auto">
//                                             <Plus className="mr-2 h-4 w-4" />
//                                             Add User
//                                         </Button>
//                                     </DialogTrigger>
//                                     <DialogContent>
//                                         <DialogHeader>
//                                             <DialogTitle>Add New User</DialogTitle>
//                                             <DialogDescription>
//                                                 Create a new user account and send an invitation.
//                                             </DialogDescription>
//                                         </DialogHeader>
//                                         <div className="grid gap-4 py-4">
//                                             <div className="grid grid-cols-4 items-center gap-4">
//                                                 <Label htmlFor="name" className="text-right">
//                                                     Name
//                                                 </Label>
//                                                 <Input id="name" placeholder="Full name" className="col-span-3" />
//                                             </div>
//                                             <div className="grid grid-cols-4 items-center gap-4">
//                                                 <Label htmlFor="email" className="text-right">
//                                                     Email
//                                                 </Label>
//                                                 <Input
//                                                     id="email"
//                                                     type="email"
//                                                     placeholder="Email address"
//                                                     className="col-span-3"
//                                                 />
//                                             </div>
//                                             <div className="grid grid-cols-4 items-center gap-4">
//                                                 <Label htmlFor="role" className="text-right">
//                                                     Role
//                                                 </Label>
//                                                 <Select>
//                                                     <SelectTrigger className="col-span-3">
//                                                         <SelectValue placeholder="Select role" />
//                                                     </SelectTrigger>
//                                                     <SelectContent>
//                                                         <SelectItem value="admin">Admin</SelectItem>
//                                                         <SelectItem value="editor">Editor</SelectItem>
//                                                         <SelectItem value="user">User</SelectItem>
//                                                     </SelectContent>
//                                                 </Select>
//                                             </div>
//                                         </div>
//                                         <DialogFooter>
//                                             <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
//                                                 Cancel
//                                             </Button>
//                                             <Button onClick={() => setIsAddUserOpen(false)}>Add User</Button>
//                                         </DialogFooter>
//                                     </DialogContent>
//                                 </Dialog>
//                             </div>
//                         </div>

//                         {selectedUsers.length > 0 && (
//                             <div className="flex items-center gap-2 mt-4 p-2 bg-muted rounded">
//                                 <span className="text-sm">Selected {selectedUsers.length} users</span>
//                                 <Button variant="outline" size="sm" onClick={() => bulkToggleStatus("Active")}>
//                                     <CheckCircle className="mr-1 h-4 w-4" />
//                                     Unblock All
//                                 </Button>
//                                 <Button variant="outline" size="sm" onClick={() => bulkToggleStatus("Blocked")}>
//                                     <XCircle className="mr-1 h-4 w-4" />
//                                     Block All
//                                 </Button>
//                                 <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
//                                     Clear Selection
//                                 </Button>
//                             </div>
//                         )}
//                     </CardHeader>

//                     <TabsContent value="list" className="m-0">
//                         <CardContent className="p-0">
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead className="w-[40px]">
//                                             <Checkbox
//                                                 checked={
//                                                     selectedUsers.length === currentUsers.length && currentUsers.length > 0
//                                                 }
//                                                 onCheckedChange={toggleAllUsers}
//                                                 aria-label="Select all"
//                                             />
//                                         </TableHead>
//                                         <TableHead>User</TableHead>
//                                         <TableHead>Role</TableHead>
//                                         <TableHead>Status</TableHead>
//                                         <TableHead>Last Active</TableHead>
//                                         <TableHead>Joined</TableHead>
//                                         <TableHead className="text-right">Actions</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {currentUsers.length > 0 ? (
//                                         currentUsers.map((user) => (
//                                             <TableRow key={user.id}>
//                                                 <TableCell>
//                                                     <Checkbox
//                                                         checked={selectedUsers.includes(user.id)}
//                                                         onCheckedChange={() => toggleUserSelection(user.id)}
//                                                         aria-label={`Select ${user.name}`}
//                                                     />
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     <div className="flex items-center gap-3">
//                                                         <Avatar>
//                                                             <AvatarImage src={user.avatar} alt={user.name} />
//                                                             <AvatarFallback>
//                                                                 {user.name
//                                                                     .split(" ")
//                                                                     .map((n) => n[0])
//                                                                     .join("")}
//                                                             </AvatarFallback>
//                                                         </Avatar>
//                                                         <div>
//                                                             <div className="font-medium">{user.name}</div>
//                                                             <div className="text-sm text-muted-foreground">
//                                                                 {user.email}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     <Badge variant="outline">{user.role}</Badge>
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     <UserStatusBadge status={user.status} />
//                                                 </TableCell>
//                                                 <TableCell>{user.lastActive}</TableCell>
//                                                 <TableCell>{user.joined}</TableCell>
//                                                 <TableCell className="text-right">
//                                                     <DropdownMenu>
//                                                         <DropdownMenuTrigger asChild>
//                                                             <Button variant="ghost" size="icon">
//                                                                 <MoreHorizontal className="h-4 w-4" />
//                                                                 <span className="sr-only">Open menu</span>
//                                                             </Button>
//                                                         </DropdownMenuTrigger>
//                                                         <DropdownMenuContent align="end">
//                                                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                                                             <DropdownMenuItem>View Profile</DropdownMenuItem>
//                                                             <DropdownMenuItem>Edit User</DropdownMenuItem>
//                                                             <DropdownMenuSeparator />
//                                                             <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
//                                                                 {user.status === "Active" ? (
//                                                                     <>
//                                                                         <XCircle className="mr-2 h-4 w-4" />
//                                                                         Block User
//                                                                     </>
//                                                                 ) : (
//                                                                     <>
//                                                                         <CheckCircle className="mr-2 h-4 w-4" />
//                                                                         Unblock User
//                                                                     </>
//                                                                 )}
//                                                             </DropdownMenuItem>
//                                                             <DropdownMenuSeparator />
//                                                             <DropdownMenuItem className="text-destructive">
//                                                                 <Trash2 className="mr-2 h-4 w-4" />
//                                                                 Delete
//                                                             </DropdownMenuItem>
//                                                         </DropdownMenuContent>
//                                                     </DropdownMenu>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))
//                                     ) : (
//                                         <TableRow>
//                                             <TableCell colSpan={7} className="text-center py-8">
//                                                 <div className="flex flex-col items-center justify-center space-y-2">
//                                                     <div className="text-muted-foreground">No users found</div>
//                                                     <Button variant="outline" size="sm" onClick={resetFilters}>
//                                                         <RefreshCw className="mr-2 h-4 w-4" />
//                                                         Reset Filters
//                                                     </Button>
//                                                 </div>
//                                             </TableCell>
//                                         </TableRow>
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </CardContent>
//                     </TabsContent>

//                     <TabsContent value="grid" className="m-0">
//                         <CardContent className="p-4">
//                             {currentUsers.length > 0 ? (
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                                     {currentUsers.map((user) => (
//                                         <Card key={user.id} className="overflow-hidden">
//                                             <div className="p-1 absolute right-2 top-2">
//                                                 <Checkbox
//                                                     checked={selectedUsers.includes(user.id)}
//                                                     onCheckedChange={() => toggleUserSelection(user.id)}
//                                                     aria-label={`Select ${user.name}`}
//                                                 />
//                                             </div>
//                                             <CardHeader className="pb-2">
//                                                 <div className="flex flex-col items-center text-center">
//                                                     <Avatar className="h-16 w-16 mb-2">
//                                                         <AvatarImage src={user.avatar} alt={user.name} />
//                                                         <AvatarFallback>
//                                                             {user.name
//                                                                 .split(" ")
//                                                                 .map((n) => n[0])
//                                                                 .join("")}
//                                                         </AvatarFallback>
//                                                     </Avatar>
//                                                     <CardTitle className="text-lg">{user.name}</CardTitle>
//                                                     <CardDescription>{user.email}</CardDescription>
//                                                 </div>
//                                             </CardHeader>
//                                             <CardContent className="pb-2 pt-0 text-center space-y-2">
//                                                 <div className="flex justify-center space-x-2">
//                                                     <Badge variant="outline">{user.role}</Badge>
//                                                     <UserStatusBadge status={user.status} />
//                                                 </div>
//                                                 <div className="text-sm text-muted-foreground">
//                                                     <p>Last active: {user.lastActive}</p>
//                                                     <p>Joined: {user.joined}</p>
//                                                 </div>
//                                             </CardContent>
//                                             <CardFooter className="flex justify-center gap-2 pt-0">
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => toggleUserStatus(user.id)}
//                                                 >
//                                                     {user.status === "Active" ? "Block" : "Unblock"}
//                                                 </Button>
//                                                 <DropdownMenu>
//                                                     <DropdownMenuTrigger asChild>
//                                                         <Button variant="outline" size="sm">
//                                                             More
//                                                             <ChevronDown className="ml-1 h-3 w-3" />
//                                                         </Button>
//                                                     </DropdownMenuTrigger>
//                                                     <DropdownMenuContent align="end">
//                                                         <DropdownMenuItem>View Profile</DropdownMenuItem>
//                                                         <DropdownMenuItem>Edit User</DropdownMenuItem>
//                                                         <DropdownMenuSeparator />
//                                                         <DropdownMenuItem className="text-destructive">
//                                                             Delete
//                                                         </DropdownMenuItem>
//                                                     </DropdownMenuContent>
//                                                 </DropdownMenu>
//                                             </CardFooter>
//                                         </Card>
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <div className="flex flex-col items-center justify-center py-8 space-y-2">
//                                     <div className="text-muted-foreground">No users found</div>
//                                     <Button variant="outline" size="sm" onClick={resetFilters}>
//                                         <RefreshCw className="mr-2 h-4 w-4" />
//                                         Reset Filters
//                                     </Button>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </TabsContent>

//                     <CardFooter className="p-4 border-t">
//                         <div className="flex items-center justify-between w-full">
//                             <div className="text-sm text-muted-foreground">
//                                 Showing {currentUsers.length} of {filteredUsers.length} users
//                             </div>

//                             <Pagination>
//                                 <PaginationContent>
//                                     <PaginationItem>
//                                         <PaginationPrevious
//                                             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                                             isActive={currentPage > 1}
//                                             aria-disabled={currentPage === 1}
//                                         />
//                                     </PaginationItem>

//                                     {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
//                                         let pageNum = i + 1;
//                                         if (totalPages > 5 && currentPage > 3) {
//                                             pageNum = currentPage - 3 + i;
//                                             if (pageNum > totalPages) pageNum = totalPages - (4 - i);
//                                         }
//                                         return (
//                                             <PaginationItem key={i}>
//                                                 <PaginationLink
//                                                     isActive={currentPage === pageNum}
//                                                     onClick={() => setCurrentPage(pageNum)}
//                                                 >
//                                                     {pageNum}
//                                                 </PaginationLink>
//                                             </PaginationItem>
//                                         );
//                                     })}

//                                     {totalPages > 5 && currentPage < totalPages - 2 && (
//                                         <>
//                                             <PaginationItem>
//                                                 <PaginationEllipsis />
//                                             </PaginationItem>
//                                             <PaginationItem>
//                                                 <PaginationLink onClick={() => setCurrentPage(totalPages)}>
//                                                     {totalPages}
//                                                 </PaginationLink>
//                                             </PaginationItem>
//                                         </>
//                                     )}

//                                     <PaginationItem>
//                                         <PaginationNext
//                                             onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                                             isActive={currentPage < totalPages}
//                                             aria-disabled={currentPage === totalPages}
//                                         />
//                                     </PaginationItem>
//                                 </PaginationContent>
//                             </Pagination>

//                             <div className="flex items-center space-x-2">
//                                 <Select defaultValue="5">
//                                     <SelectTrigger className="w-16">
//                                         <SelectValue placeholder="5" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="5">5</SelectItem>
//                                         <SelectItem value="10">10</SelectItem>
//                                         <SelectItem value="20">20</SelectItem>
//                                         <SelectItem value="50">50</SelectItem>
//                                     </SelectContent>
//                                 </Select>
//                                 <span className="text-sm text-muted-foreground">per page</span>
//                             </div>
//                         </div>
//                     </CardFooter>
//                 </Card>
//             </Tabs>
//         </div>
//     );
// };

// export default Test;

// import { Button } from "../../components/ui/button"
// import { Test_shace } from "@/components/Test_shade";

// function Test() {
//   return (
//     <div className="m-52">
//       <Button>Click me</Button>
//       <Test_shace></Test_shace>
//     </div>
//   );
// }
// export default Test;

// import React from "react";
// import { Toaster, toast } from "sonner";

// const Test = () => {
//     return (
//         <div>

//             <button onClick={() => toast.success("Event has been created", { duration: 3000})}>Give me a toast</button>
//             <button onClick={() =>
//                     toast.success("Login Successfully", {
//                         duration: 3000,
//                         className: "text-white p-4 rounded-md",
//                         style: {width: "auto"},
//                     })
//                 } >
// Login Successfully
//             </button>

//         </div>
//     );
// };

// export default Test;

// import React from 'react';
// import { Search, ChevronDown } from 'lucide-react';

// const EventCard = ({ image, title, location, date, time, price, participants, category }) => (
//   <div className="relative bg-[#2A2A2A] rounded-xl overflow-hidden group cursor-pointer">
//     <img
//       src={image}
//       alt={title}
//       className="w-full h-[280px] object-cover"
//     />
//     <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
//       <div className="text-xs text-gray-400 mb-1">{category}</div>
//       <h3 className="text-white font-medium mb-2">{title}</h3>
//       <div className="space-y-1.5 text-gray-300 text-[13px]">
//         <div className="flex items-center gap-2">
//           <span>📍</span> {location}
//         </div>
//         <div className="flex items-center gap-2">
//           <span>📅</span> {date}
//         </div>
//         <div className="flex items-center gap-2">
//           <span>⏰</span> {time}
//         </div>
//         <div className="flex items-center gap-2">
//           <span>💰</span> From {price}
//         </div>
//         <div className="flex items-center gap-2">
//           <span>👥</span> {participants} Participants
//         </div>
//       </div>
//       <div className="absolute right-2 bottom-2 opacity-60 group-hover:opacity-100 transition-opacity">
//         <div className="bg-white/10 rounded-full p-1">
//           <ChevronDown className="w-5 h-5 text-white" />
//         </div>
//       </div>
//     </div>
//   </div>
// );

// const Test = () => {
//   const events = [
//     {
//       image: "/api/placeholder/400/320",
//       category: "Edu & Hackathon",
//       title: "Music in the Park: Summer Concert Series",
//       location: "Central Park, New York City, United States",
//       date: "Sunday, July 30, 2025",
//       time: "06:00 PM",
//       price: "299.00 ₹",
//       participants: "1500"
//     },
//     // Add more events here
//   ];

//   return (
//     <div className="bg-[#1A1A1A] p-6 min-h-screen">
//       <div className="max-w-[1400px] mx-auto">
//         {/* Search and Filters */}
//         <div className="flex flex-col lg:flex-row gap-4 justify-between mb-6">
//           <div className="relative flex-grow max-w-md">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//             <input
//               type="text"
//               placeholder="Search Events"
//               className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none"
//             />
//           </div>

//           <div className="flex flex-wrap gap-3">
//             <button className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition">
//               Add event
//             </button>
//             {['Category', 'Type', 'Custom', 'Filter'].map((filter) => (
//               <button
//                 key={filter}
//                 className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition"
//               >
//                 {filter}
//                 <ChevronDown size={16} />
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-4 mb-8">
//           <button className="px-4 py-1.5 bg-[#2A2A2A] text-white rounded-lg">
//             Participated
//           </button>
//           <button className="px-4 py-1.5 text-gray-400">
//             Organized
//           </button>
//         </div>

//         {/* Events Grid */}
//         {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {events.map((event, index) => (
//             <EventCard key={index} {...event} />
//           ))}
//         </div> */}
//       </div>
//     </div>
//   );
// };

// export default Test;
