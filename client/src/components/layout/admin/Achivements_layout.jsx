import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import ReactCrop from 'react-image-crop';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, PlusCircle, Edit, Award, Users } from "lucide-react";
import adminApi from "@/services/adminApi";
import 'react-image-crop/dist/ReactCrop.css';

const AchievementsLayout = () => {
    const [badges, setBadges] = useState([]);
    const [userBadges, setUserBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: "all",
        category: "all",
        criteriaType: "all",
        page: 1,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentBadge, setCurrentBadge] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 / 1 });
    const [imageSrc, setImageSrc] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const imageRef = useRef(null);

    const { control: createControl, handleSubmit: handleCreateSubmit, reset: resetCreate, setValue: setCreateValue } = useForm({
        defaultValues: {
            name: "",
            description: "",
            category: "engagement",
            icon: null,
            target_count: 1,
            applicable_role: "User",
            criteria_type: "event_attended",
        }
    });

    const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm();

    const BADGE_CATEGORIES = [
        { value: "engagement", label: "Engagement" },
        { value: "exploration", label: "Exploration" },
        { value: "milestone", label: "Milestone" },
        { value: "contribution", label: "Contribution" },
        { value: "success", label: "Success" },
        { value: "quality", label: "Quality" },
    ];

    const CRITERIA_TYPES = [
        { value: "event_attended", label: "Events Attended" },
        { value: "event_created", label: "Events Created" },
        { value: "feedback_given", label: "Feedback Given" },
    ];

    useEffect(() => {
        fetchBadges();
        fetchUserBadges();
    }, [filters, searchQuery]);

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const params = {
                role: filters.role === "all" ? undefined : filters.role,
                category: filters.category === "all" ? undefined : filters.category,
                criteria_type: filters.criteriaType === "all" ? undefined : filters.criteriaType,
                page: filters.page,
            };
            const response = await adminApi.get("/badges/", { params });
            setBadges(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching badges:", error);
            toast.error("Failed to load badges");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBadges = async () => {
        setLoading(true);
        try {
            const params = { search: searchQuery || undefined, page: filters.page };
            const response = await adminApi.get("/user-badges/", { params });
            setUserBadges(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching user badges:", error);
            toast.error("Failed to load user badges");
        } finally {
            setLoading(false);
        }
    };

    const onSelectFile = (e, setValue) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result));
            reader.readAsDataURL(file);
        }
    };

    const onImageLoad = (e) => {
        imageRef.current = e.currentTarget;
    };

    const makeClientCrop = async (setValue) => {
        if (imageRef.current && crop.width && crop.height) {
            const croppedImageFile = await getCroppedImg(imageRef.current, crop);
            setCroppedImage(croppedImageFile);
            setValue('icon', croppedImageFile);
            setImageSrc(null);
            return croppedImageFile;
        }
    };

    const getCroppedImg = (image, crop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
            }, 'image/jpeg');
        });
    };

    const onCreateSubmit = async (data) => {
        if (!data.icon || !(data.icon instanceof File)) {
            toast.error("Please select and crop an image before submitting");
            return;
        }
        try {
            const formData = new FormData();
            for (const key in data) {
                if (key === 'icon' && data[key] instanceof File) {
                    formData.append(key, data[key]);
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            }
            const response = await adminApi.post("/badges/", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBadges([...badges, response.data]);
            toast.success("Badge created successfully");
            resetCreate();
            setCroppedImage(null);
            setIsEditDialogOpen(false); // Close the modal
        } catch (error) {
            console.error("Error creating badge:", error.response?.data || error);
            toast.error(error.response?.data?.error || "Failed to create badge");
        }
    };

    const onEditSubmit = async (data) => {
        if (!currentBadge) return;

        try {
            const formData = new FormData();
            for (const key in data) {
                if (key === 'icon' && data[key] instanceof File) {
                    formData.append(key, data[key]);
                } else if (key !== 'id' && data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            }
            const response = await adminApi.put(`/badges/${currentBadge.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBadges(badges.map((b) => (b.id === currentBadge.id ? response.data : b)));
            setIsEditDialogOpen(false);
            toast.success("Badge updated successfully");
            setCroppedImage(null);
        } catch (error) {
            console.error("Error updating badge:", error.response?.data || error);
            toast.error(error.response?.data?.error || "Failed to update badge");
        }
    };

    const openEditDialog = (badge) => {
        setCurrentBadge(badge);
        resetEdit(badge);
        setIsEditDialogOpen(true);
    };

    const getCategoryLabel = (value) => {
        const category = BADGE_CATEGORIES.find((cat) => cat.value === value);
        return category ? category.label : value;
    };

    const getCriteriaLabel = (value) => {
        const criteria = CRITERIA_TYPES.find((crit) => crit.value === value);
        return criteria ? criteria.label : value;
    };

    return (
        <div className="container mx-auto py-6">
            <Tabs defaultValue="badges" className="w-full">
                <TabsList className="mb-2">
                    <TabsTrigger value="badges" className="flex items-center gap-2">
                        <Award size={16} />
                        Badge Definitions
                    </TabsTrigger>
                    <TabsTrigger value="user-badges" className="flex items-center gap-2">
                        <Users size={16} />
                        User Achievements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="badges" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Badges</CardTitle>
                                    <CardDescription>Manage achievement badges</CardDescription>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} />
                                        <span>Filters:</span>
                                    </div>

                                    <Select
                                        value={filters.role}
                                        onValueChange={(value) => setFilters({ ...filters, role: value })}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="User">User</SelectItem>
                                            <SelectItem value="Organizer">Organizer</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filters.category}
                                        onValueChange={(value) => setFilters({ ...filters, category: value })}
                                    >
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {BADGE_CATEGORIES.map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filters.criteriaType}
                                        onValueChange={(value) => setFilters({ ...filters, criteriaType: value })}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Criteria Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Criteria</SelectItem>
                                            {CRITERIA_TYPES.map((criteria) => (
                                                <SelectItem key={criteria.value} value={criteria.value}>
                                                    {criteria.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="flex items-center gap-2">
                                                <PlusCircle size={16} />
                                                Add New Badge
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md w-md">
                                            <DialogHeader>
                                                <DialogTitle>Create New Badge</DialogTitle>
                                                <DialogDescription>Define a new badge</DialogDescription>
                                            </DialogHeader>

                                            <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="name">Name</Label>
                                                        <Controller
                                                            name="name"
                                                            control={createControl}
                                                            rules={{ required: "Name is required" }}
                                                            render={({ field, fieldState }) => (
                                                                <>
                                                                    <Input
                                                                        id="name"
                                                                        {...field}
                                                                        className="col-span-3"
                                                                    />
                                                                    {fieldState.error && (
                                                                        <span className="text-red-500 text-sm col-span-3">
                                                                            {fieldState.error.message}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="description">Description</Label>
                                                        <Controller
                                                            name="description"
                                                            control={createControl}
                                                            render={({ field }) => (
                                                                <Textarea
                                                                    id="description"
                                                                    {...field}
                                                                    className="col-span-3"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="icon">Icon</Label>
                                                        <div className="col-span-3">
                                                            <Controller
                                                                name="icon"
                                                                control={createControl}
                                                                rules={{ required: "Icon is required" }}
                                                                render={({ field, fieldState }) => (
                                                                    <>
                                                                        <Input
                                                                            id="icon"
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => onSelectFile(e, setCreateValue)}
                                                                        />
                                                                        {fieldState.error && (
                                                                            <span className="text-red-500 text-sm">
                                                                                {fieldState.error.message}
                                                                            </span>
                                                                        )}
                                                                        {imageSrc && (
                                                                            <div className="mt-2">
                                                                                <ReactCrop
                                                                                    crop={crop}
                                                                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                                                                    aspect={1}
                                                                                >
                                                                                    <img src={imageSrc} onLoad={onImageLoad} />
                                                                                </ReactCrop>
                                                                                <Button
                                                                                    type="button"
                                                                                    onClick={() => makeClientCrop(setCreateValue)}
                                                                                    className="mt-2"
                                                                                >
                                                                                    Crop Image
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                        {croppedImage && (
                                                                            <img
                                                                                src={URL.createObjectURL(croppedImage)}
                                                                                alt="Cropped"
                                                                                className="mt-2 w-20 h-20 rounded-full"
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="category">Category</Label>
                                                        <Controller
                                                            name="category"
                                                            control={createControl}
                                                            render={({ field }) => (
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {BADGE_CATEGORIES.map((cat) => (
                                                                            <SelectItem key={cat.value} value={cat.value}>
                                                                                {cat.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="target_count">Target Count</Label>
                                                        <Controller
                                                            name="target_count"
                                                            control={createControl}
                                                            rules={{ required: "Target count is required", min: 1 }}
                                                            render={({ field, fieldState }) => (
                                                                <>
                                                                    <Input
                                                                        id="target_count"
                                                                        type="number"
                                                                        {...field}
                                                                        className="col-span-3"
                                                                    />
                                                                    {fieldState.error && (
                                                                        <span className="text-red-500 text-sm col-span-3">
                                                                            {fieldState.error.message}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="applicable_role">Role</Label>
                                                        <Controller
                                                            name="applicable_role"
                                                            control={createControl}
                                                            render={({ field }) => (
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="User">User</SelectItem>
                                                                        <SelectItem value="Organizer">Organizer</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="criteria_type">Criteria Type</Label>
                                                        <Controller
                                                            name="criteria_type"
                                                            control={createControl}
                                                            render={({ field }) => (
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <SelectTrigger className="col-span-3">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {CRITERIA_TYPES.map((crit) => (
                                                                            <SelectItem key={crit.value} value={crit.value}>
                                                                                {crit.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Create Badge</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Badge</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Criteria</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center">
                                                Loading badges...
                                            </TableCell>
                                        </TableRow>
                                    ) : badges.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center">
                                                No badges found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        badges.map((badge) => (
                                            <TableRow key={badge.id}>
                                                <TableCell className="flex items-center gap-2">
                                                    <img
                                                        src={badge.icon || "https://picsum.photos/200"}
                                                        alt={badge.name}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    {badge.name}
                                                </TableCell>
                                                <TableCell>{badge.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize p-2">
                                                        {getCategoryLabel(badge.category)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{getCriteriaLabel(badge.criteria_type)}</TableCell>
                                                <TableCell>{badge.applicable_role}</TableCell>
                                                <TableCell>{badge.target_count}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => openEditDialog(badge)}
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="user-badges" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Achievements</CardTitle>
                            <CardDescription>Track earned badges</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Badge</TableHead>
                                        <TableHead>Date Earned</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Role</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">
                                                Loading user badges...
                                            </TableCell>
                                        </TableRow>
                                    ) : userBadges.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">
                                                No user badges found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        userBadges.map((userBadge) => (
                                            <TableRow key={userBadge.id}>
                                                <TableCell>{userBadge.user}</TableCell>
                                                <TableCell className="flex items-center gap-2">
                                                    <img
                                                        src={userBadge.badge.icon || "https://picsum.photos/200"}
                                                        alt={userBadge.badge.name}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    {userBadge.badge.name}
                                                </TableCell>
                                                <TableCell>
                                                    {userBadge.date_earned ? (
                                                        new Date(userBadge.date_earned).toLocaleDateString()
                                                    ) : (
                                                        <Badge variant="outline" className="bg-yellow-100">
                                                            In Progress
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {getCategoryLabel(userBadge.badge.category)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{userBadge.badge.applicable_role}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Badge</DialogTitle>
                        <DialogDescription>Update badge details</DialogDescription>
                    </DialogHeader>

                    {currentBadge && (
                        <form onSubmit={handleEditSubmit(onEditSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Controller
                                        name="name"
                                        control={editControl}
                                        rules={{ required: "Name is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <Input
                                                    id="edit-name"
                                                    {...field}
                                                    className="col-span-3"
                                                />
                                                {fieldState.error && (
                                                    <span className="text-red-500 text-sm col-span-3">
                                                        {fieldState.error.message}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Controller
                                        name="description"
                                        control={editControl}
                                        render={({ field }) => (
                                            <Textarea
                                                id="edit-description"
                                                {...field}
                                                className="col-span-3"
                                            />
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-icon">Icon</Label>
                                    <div className="col-span-3">
                                        <Controller
                                            name="icon"
                                            control={editControl}
                                            render={({ field }) => (
                                                <>
                                                    <Input
                                                        id="edit-icon"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => onSelectFile(e, setEditValue)}
                                                    />
                                                    {imageSrc && (
                                                        <div className="mt-2">
                                                            <ReactCrop
                                                                crop={crop}
                                                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                                                aspect={1}
                                                            >
                                                                <img src={imageSrc} onLoad={onImageLoad} />
                                                            </ReactCrop>
                                                            <Button
                                                                type="button"
                                                                onClick={() => makeClientCrop(setEditValue)}
                                                                className="mt-2"
                                                            >
                                                                Crop Image
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {currentBadge.icon && !imageSrc && (
                                                        <img
                                                            src={currentBadge.icon}
                                                            alt="Current badge"
                                                            className="mt-2 w-20 h-20 rounded-full"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-category">Category</Label>
                                    <Controller
                                        name="category"
                                        control={editControl}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BADGE_CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-target_count">Target Count</Label>
                                    <Controller
                                        name="target_count"
                                        control={editControl}
                                        rules={{ required: "Target count is required", min: 1 }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <Input
                                                    id="edit-target_count"
                                                    type="number"
                                                    {...field}
                                                    className="col-span-3"
                                                />
                                                {fieldState.error && (
                                                    <span className="text-red-500 text-sm col-span-3">
                                                        {fieldState.error.message}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-applicable_role">Role</Label>
                                    <Controller
                                        name="applicable_role"
                                        control={editControl}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="User">User</SelectItem>
                                                    <SelectItem value="Organizer">Organizer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-criteria_type">Criteria Type</Label>
                                    <Controller
                                        name="criteria_type"
                                        control={editControl}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CRITERIA_TYPES.map((crit) => (
                                                        <SelectItem key={crit.value} value={crit.value}>
                                                            {crit.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setImageSrc(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Update Badge</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AchievementsLayout;


// import React, { useState, useEffect, useRef } from "react";
// import { useForm, Controller } from "react-hook-form";
// import ReactCrop from 'react-image-crop';
// import { toast } from "sonner";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Search, Filter, PlusCircle, Edit, Award, Users } from "lucide-react";
// import adminApi from "@/services/adminApi";
// import 'react-image-crop/dist/ReactCrop.css';

// const AchievementsLayout = () => {
//     const [badges, setBadges] = useState([]);
//     const [userBadges, setUserBadges] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [filters, setFilters] = useState({
//         role: "all",
//         category: "all",
//         criteriaType: "all",
//         page: 1,
//     });
//     const [searchQuery, setSearchQuery] = useState("");
//     const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//     const [currentBadge, setCurrentBadge] = useState(null);
//     const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 / 1 });
//     const [imageSrc, setImageSrc] = useState(null);
//     const [croppedImage, setCroppedImage] = useState(null);
//     const imageRef = useRef(null);

//     const { control: createControl, handleSubmit: handleCreateSubmit, reset: resetCreate, setValue: setCreateValue } = useForm({
//         defaultValues: {
//             name: "",
//             description: "",
//             category: "engagement",
//             icon: null,
//             target_count: 1,
//             applicable_role: "User",
//             criteria_type: "event_attended",
//         }
//     });

//     const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm();

//     const BADGE_CATEGORIES = [
//         { value: "engagement", label: "Engagement" },
//         { value: "exploration", label: "Exploration" },
//         { value: "milestone", label: "Milestone" },
//         { value: "contribution", label: "Contribution" },
//         { value: "success", label: "Success" },
//         { value: "quality", label: "Quality" },
//     ];

//     const CRITERIA_TYPES = [
//         { value: "event_attended", label: "Events Attended" },
//         { value: "event_created", label: "Events Created" },
//         { value: "feedback_given", label: "Feedback Given" },
//     ];

//     useEffect(() => {
//         fetchBadges();
//         fetchUserBadges();
//     }, [filters, searchQuery]);

//     const fetchBadges = async () => {
//         setLoading(true);
//         try {
//             const params = {
//                 role: filters.role === "all" ? undefined : filters.role,
//                 category: filters.category === "all" ? undefined : filters.category,
//                 criteria_type: filters.criteriaType === "all" ? undefined : filters.criteriaType,
//                 page: filters.page,
//             };
//             const response = await adminApi.get("/badges/", { params });
//             setBadges(response.data.results || response.data);
//         } catch (error) {
//             console.error("Error fetching badges:", error);
//             toast.error("Failed to load badges");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchUserBadges = async () => {
//         setLoading(true);
//         try {
//             const params = { search: searchQuery || undefined, page: filters.page };
//             const response = await adminApi.get("/user-badges/", { params });
//             setUserBadges(response.data.results || response.data);
//         } catch (error) {
//             console.error("Error fetching user badges:", error);
//             toast.error("Failed to load user badges");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const onSelectFile = (e, setValue) => {
//         if (e.target.files && e.target.files.length > 0) {
//             const file = e.target.files[0];
//             const reader = new FileReader();
//             reader.addEventListener('load', () => setImageSrc(reader.result));
//             reader.readAsDataURL(file);
//         }
//     };

//     const onImageLoad = (e) => {
//         imageRef.current = e.currentTarget;
//     };

//     const makeClientCrop = async (setValue) => {
//         if (imageRef.current && crop.width && crop.height) {
//             const croppedImageFile = await getCroppedImg(imageRef.current, crop);
//             setCroppedImage(croppedImageFile);
//             setValue('icon', croppedImageFile);
//             setImageSrc(null);
//             return croppedImageFile;
//         }
//     };

//     const getCroppedImg = (image, crop) => {
//         const canvas = document.createElement('canvas');
//         const scaleX = image.naturalWidth / image.width;
//         const scaleY = image.naturalHeight / image.height;
//         canvas.width = crop.width * scaleX;
//         canvas.height = crop.height * scaleY;
//         const ctx = canvas.getContext('2d');

//         ctx.drawImage(
//             image,
//             crop.x * scaleX,
//             crop.y * scaleY,
//             crop.width * scaleX,
//             crop.height * scaleY,
//             0,
//             0,
//             crop.width * scaleX,
//             crop.height * scaleY
//         );

//         return new Promise((resolve) => {
//             canvas.toBlob((blob) => {
//                 resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
//             }, 'image/jpeg');
//         });
//     };

//     const onCreateSubmit = async (data) => {
//         if (!data.icon || !(data.icon instanceof File)) {
//             toast.error("Please select and crop an image before submitting");
//             return;
//         }
//         try {
//             const formData = new FormData();
//             for (const key in data) {
//                 if (key === 'icon' && data[key] instanceof File) {
//                     formData.append(key, data[key]);
//                 } else if (data[key] !== null && data[key] !== undefined) {
//                     formData.append(key, data[key]);
//                 }
//             }
//             const response = await adminApi.post("/badges/", formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             setBadges([...badges, response.data]);
//             toast.success("Badge created successfully");
//             resetCreate();
//             setCroppedImage(null);
//             setIsEditDialogOpen(false); // Close the modal
//         } catch (error) {
//             console.error("Error creating badge:", error.response?.data || error);
//             toast.error(error.response?.data?.error || "Failed to create badge");
//         }
//     };

//     const onEditSubmit = async (data) => {
//         if (!currentBadge) return;

//         try {
//             const formData = new FormData();
//             for (const key in data) {
//                 if (key === 'icon' && data[key] instanceof File) {
//                     formData.append(key, data[key]);
//                 } else if (key !== 'id' && data[key] !== null && data[key] !== undefined) {
//                     formData.append(key, data[key]);
//                 }
//             }
//             const response = await adminApi.put(`/badges/${currentBadge.id}/`, formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             setBadges(badges.map((b) => (b.id === currentBadge.id ? response.data : b)));
//             setIsEditDialogOpen(false);
//             toast.success("Badge updated successfully");
//             setCroppedImage(null);
//         } catch (error) {
//             console.error("Error updating badge:", error.response?.data || error);
//             toast.error(error.response?.data?.error || "Failed to update badge");
//         }
//     };

//     const openEditDialog = (badge) => {
//         setCurrentBadge(badge);
//         resetEdit(badge);
//         setIsEditDialogOpen(true);
//     };

//     const getCategoryLabel = (value) => {
//         const category = BADGE_CATEGORIES.find((cat) => cat.value === value);
//         return category ? category.label : value;
//     };

//     const getCriteriaLabel = (value) => {
//         const criteria = CRITERIA_TYPES.find((crit) => crit.value === value);
//         return criteria ? criteria.label : value;
//     };

//     return (
//         <div className="container mx-auto py-6">
//             <Tabs defaultValue="badges" className="w-full">
//                 <TabsList className="mb-2">
//                     <TabsTrigger value="badges" className="flex items-center gap-2">
//                         <Award size={16} />
//                         Badge Definitions
//                     </TabsTrigger>
//                     <TabsTrigger value="user-badges" className="flex items-center gap-2">
//                         <Users size={16} />
//                         User Achievements
//                     </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="badges" className="space-y-4">
//                     <Card>
//                         <CardHeader>
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <CardTitle>Badges</CardTitle>
//                                     <CardDescription>Manage achievement badges</CardDescription>
//                                 </div>
//                                 <div className="flex gap-4 items-center">
//                                     <div className="flex items-center gap-2">
//                                         <Filter size={16} />
//                                         <span>Filters:</span>
//                                     </div>

//                                     <Select
//                                         value={filters.role}
//                                         onValueChange={(value) => setFilters({ ...filters, role: value })}
//                                     >
//                                         <SelectTrigger className="w-32">
//                                             <SelectValue placeholder="Role" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">All Roles</SelectItem>
//                                             <SelectItem value="User">User</SelectItem>
//                                             <SelectItem value="Organizer">Organizer</SelectItem>
//                                         </SelectContent>
//                                     </Select>

//                                     <Select
//                                         value={filters.category}
//                                         onValueChange={(value) => setFilters({ ...filters, category: value })}
//                                     >
//                                         <SelectTrigger className="w-36">
//                                             <SelectValue placeholder="Category" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">All Categories</SelectItem>
//                                             {BADGE_CATEGORIES.map((category) => (
//                                                 <SelectItem key={category.value} value={category.value}>
//                                                     {category.label}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <Select
//                                         value={filters.criteriaType}
//                                         onValueChange={(value) => setFilters({ ...filters, criteriaType: value })}
//                                     >
//                                         <SelectTrigger className="w-40">
//                                             <SelectValue placeholder="Criteria Type" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">All Criteria</SelectItem>
//                                             {CRITERIA_TYPES.map((criteria) => (
//                                                 <SelectItem key={criteria.value} value={criteria.value}>
//                                                     {criteria.label}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <Dialog>
//                                         <DialogTrigger asChild>
//                                             <Button className="flex items-center gap-2">
//                                                 <PlusCircle size={16} />
//                                                 Add New Badge
//                                             </Button>
//                                         </DialogTrigger>
//                                         <DialogContent className="sm:max-w-md w-md">
//                                             <DialogHeader>
//                                                 <DialogTitle>Create New Badge</DialogTitle>
//                                                 <DialogDescription>Define a new badge</DialogDescription>
//                                             </DialogHeader>

//                                             <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
//                                                 <div className="grid gap-4 py-4">
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="name">Name</Label>
//                                                         <Controller
//                                                             name="name"
//                                                             control={createControl}
//                                                             rules={{ required: "Name is required" }}
//                                                             render={({ field, fieldState }) => (
//                                                                 <>
//                                                                     <Input
//                                                                         id="name"
//                                                                         {...field}
//                                                                         className="col-span-3"
//                                                                     />
//                                                                     {fieldState.error && (
//                                                                         <span className="text-red-500 text-sm col-span-3">
//                                                                             {fieldState.error.message}
//                                                                         </span>
//                                                                     )}
//                                                                 </>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="description">Description</Label>
//                                                         <Controller
//                                                             name="description"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Textarea
//                                                                     id="description"
//                                                                     {...field}
//                                                                     className="col-span-3"
//                                                                 />
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="icon">Icon</Label>
//                                                         <div className="col-span-3">
//                                                             <Controller
//                                                                 name="icon"
//                                                                 control={createControl}
//                                                                 rules={{ required: "Icon is required" }}
//                                                                 render={({ field, fieldState }) => (
//                                                                     <>
//                                                                         <Input
//                                                                             id="icon"
//                                                                             type="file"
//                                                                             accept="image/*"
//                                                                             onChange={(e) => onSelectFile(e, setCreateValue)}
//                                                                         />
//                                                                         {fieldState.error && (
//                                                                             <span className="text-red-500 text-sm">
//                                                                                 {fieldState.error.message}
//                                                                             </span>
//                                                                         )}
//                                                                         {imageSrc && (
//                                                                             <div className="mt-2">
//                                                                                 <ReactCrop
//                                                                                     crop={crop}
//                                                                                     onChange={(_, percentCrop) => setCrop(percentCrop)}
//                                                                                     aspect={1}
//                                                                                 >
//                                                                                     <img src={imageSrc} onLoad={onImageLoad} />
//                                                                                 </ReactCrop>
//                                                                                 <Button
//                                                                                     type="button"
//                                                                                     onClick={() => makeClientCrop(setCreateValue)}
//                                                                                     className="mt-2"
//                                                                                 >
//                                                                                     Crop Image
//                                                                                 </Button>
//                                                                             </div>
//                                                                         )}
//                                                                         {croppedImage && (
//                                                                             <img
//                                                                                 src={URL.createObjectURL(croppedImage)}
//                                                                                 alt="Cropped"
//                                                                                 className="mt-2 w-20 h-20 rounded-full"
//                                                                             />
//                                                                         )}
//                                                                     </>
//                                                                 )}
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="category">Category</Label>
//                                                         <Controller
//                                                             name="category"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Select
//                                                                     onValueChange={field.onChange}
//                                                                     value={field.value}
//                                                                 >
//                                                                     <SelectTrigger className="col-span-3">
//                                                                         <SelectValue />
//                                                                     </SelectTrigger>
//                                                                     <SelectContent>
//                                                                         {BADGE_CATEGORIES.map((cat) => (
//                                                                             <SelectItem key={cat.value} value={cat.value}>
//                                                                                 {cat.label}
//                                                                             </SelectItem>
//                                                                         ))}
//                                                                     </SelectContent>
//                                                                 </Select>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="target_count">Target Count</Label>
//                                                         <Controller
//                                                             name="target_count"
//                                                             control={createControl}
//                                                             rules={{ required: "Target count is required", min: 1 }}
//                                                             render={({ field, fieldState }) => (
//                                                                 <>
//                                                                     <Input
//                                                                         id="target_count"
//                                                                         type="number"
//                                                                         {...field}
//                                                                         className="col-span-3"
//                                                                     />
//                                                                     {fieldState.error && (
//                                                                         <span className="text-red-500 text-sm col-span-3">
//                                                                             {fieldState.error.message}
//                                                                         </span>
//                                                                     )}
//                                                                 </>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="applicable_role">Role</Label>
//                                                         <Controller
//                                                             name="applicable_role"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Select
//                                                                     onValueChange={field.onChange}
//                                                                     value={field.value}
//                                                                 >
//                                                                     <SelectTrigger className="col-span-3">
//                                                                         <SelectValue />
//                                                                     </SelectTrigger>
//                                                                     <SelectContent>
//                                                                         <SelectItem value="User">User</SelectItem>
//                                                                         <SelectItem value="Organizer">Organizer</SelectItem>
//                                                                     </SelectContent>
//                                                                 </Select>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="criteria_type">Criteria Type</Label>
//                                                         <Controller
//                                                             name="criteria_type"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Select
//                                                                     onValueChange={field.onChange}
//                                                                     value={field.value}
//                                                                 >
//                                                                     <SelectTrigger className="col-span-3">
//                                                                         <SelectValue />
//                                                                     </SelectTrigger>
//                                                                     <SelectContent>
//                                                                         {CRITERIA_TYPES.map((crit) => (
//                                                                             <SelectItem key={crit.value} value={crit.value}>
//                                                                                 {crit.label}
//                                                                             </SelectItem>
//                                                                         ))}
//                                                                     </SelectContent>
//                                                                 </Select>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                 </div>
//                                                 <DialogFooter>
//                                                     <Button type="submit">Create Badge</Button>
//                                                 </DialogFooter>
//                                             </form>
//                                         </DialogContent>
//                                     </Dialog>
//                                 </div>
//                             </div>
//                         </CardHeader>
//                         <CardContent>
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>Badge</TableHead>
//                                         <TableHead>Description</TableHead>
//                                         <TableHead>Category</TableHead>
//                                         <TableHead>Criteria</TableHead>
//                                         <TableHead>Role</TableHead>
//                                         <TableHead>Target</TableHead>
//                                         <TableHead className="text-right">Actions</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {loading ? (
//                                         <TableRow>
//                                             <TableCell colSpan={7} className="text-center">
//                                                 Loading badges...
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : badges.length === 0 ? (
//                                         <TableRow>
//                                             <TableCell colSpan={7} className="text-center">
//                                                 No badges found
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : (
//                                         badges.map((badge) => (
//                                             <TableRow key={badge.id}>
//                                                 <TableCell className="flex items-center gap-2">
//                                                     <img
//                                                         src={badge.icon || "https://picsum.photos/200"}
//                                                         alt={badge.name}
//                                                         className="w-8 h-8 rounded-full"
//                                                     />
//                                                     {badge.name}
//                                                 </TableCell>
//                                                 <TableCell>{badge.description}</TableCell>
//                                                 <TableCell>
//                                                     <Badge variant="outline" className="capitalize p-2">
//                                                         {getCategoryLabel(badge.category)}
//                                                     </Badge>
//                                                 </TableCell>
//                                                 <TableCell>{getCriteriaLabel(badge.criteria_type)}</TableCell>
//                                                 <TableCell>{badge.applicable_role}</TableCell>
//                                                 <TableCell>{badge.target_count}</TableCell>
//                                                 <TableCell className="text-right">
//                                                     <Button
//                                                         variant="outline"
//                                                         size="icon"
//                                                         onClick={() => openEditDialog(badge)}
//                                                     >
//                                                         <Edit size={16} />
//                                                     </Button>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>

//                 <TabsContent value="user-badges" className="space-y-4">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>User Achievements</CardTitle>
//                             <CardDescription>Track earned badges</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="flex gap-4 mb-4">
//                                 <div className="relative w-64">
//                                     <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                                     <Input
//                                         placeholder="Search users..."
//                                         className="pl-8"
//                                         value={searchQuery}
//                                         onChange={(e) => setSearchQuery(e.target.value)}
//                                     />
//                                 </div>
//                             </div>
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>User</TableHead>
//                                         <TableHead>Badge</TableHead>
//                                         <TableHead>Date Earned</TableHead>
//                                         <TableHead>Category</TableHead>
//                                         <TableHead>Role</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {loading ? (
//                                         <TableRow>
//                                             <TableCell colSpan={5} className="text-center">
//                                                 Loading user badges...
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : userBadges.length === 0 ? (
//                                         <TableRow>
//                                             <TableCell colSpan={5} className="text-center">
//                                                 No user badges found
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : (
//                                         userBadges.map((userBadge) => (
//                                             <TableRow key={userBadge.id}>
//                                                 <TableCell>{userBadge.user}</TableCell>
//                                                 <TableCell className="flex items-center gap-2">
//                                                     <img
//                                                         src={userBadge.badge.icon || "https://picsum.photos/200"}
//                                                         alt={userBadge.badge.name}
//                                                         className="w-8 h-8 rounded-full"
//                                                     />
//                                                     {userBadge.badge.name}
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     {userBadge.date_earned ? (
//                                                         new Date(userBadge.date_earned).toLocaleDateString()
//                                                     ) : (
//                                                         <Badge variant="outline" className="bg-yellow-100">
//                                                             In Progress
//                                                         </Badge>
//                                                     )}
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     <Badge variant="outline" className="capitalize">
//                                                         {getCategoryLabel(userBadge.badge.category)}
//                                                     </Badge>
//                                                 </TableCell>
//                                                 <TableCell>{userBadge.badge.applicable_role}</TableCell>
//                                             </TableRow>
//                                         ))
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>

//             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//                 <DialogContent className="sm:max-w-md w-md">
//                     <DialogHeader>
//                         <DialogTitle>Edit Badge</DialogTitle>
//                         <DialogDescription>Update badge details</DialogDescription>
//                     </DialogHeader>

//                     {currentBadge && (
//                         <form onSubmit={handleEditSubmit(onEditSubmit)}>
//                             <div className="grid gap-4 py-4">
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-name">Name</Label>
//                                     <Controller
//                                         name="name"
//                                         control={editControl}
//                                         rules={{ required: "Name is required" }}
//                                         render={({ field, fieldState }) => (
//                                             <>
//                                                 <Input
//                                                     id="edit-name"
//                                                     {...field}
//                                                     className="col-span-3"
//                                                 />
//                                                 {fieldState.error && (
//                                                     <span className="text-red-500 text-sm col-span-3">
//                                                         {fieldState.error.message}
//                                                     </span>
//                                                 )}
//                                             </>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-description">Description</Label>
//                                     <Controller
//                                         name="description"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Textarea
//                                                 id="edit-description"
//                                                 {...field}
//                                                 className="col-span-3"
//                                             />
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-icon">Icon</Label>
//                                     <div className="col-span-3">
//                                         <Controller
//                                             name="icon"
//                                             control={editControl}
//                                             render={({ field }) => (
//                                                 <>
//                                                     <Input
//                                                         id="edit-icon"
//                                                         type="file"
//                                                         accept="image/*"
//                                                         onChange={(e) => onSelectFile(e, setEditValue)}
//                                                     />
//                                                     {imageSrc && (
//                                                         <div className="mt-2">
//                                                             <ReactCrop
//                                                                 crop={crop}
//                                                                 onChange={(_, percentCrop) => setCrop(percentCrop)}
//                                                                 aspect={1}
//                                                             >
//                                                                 <img src={imageSrc} onLoad={onImageLoad} />
//                                                             </ReactCrop>
//                                                             <Button
//                                                                 type="button"
//                                                                 onClick={() => makeClientCrop(setEditValue)}
//                                                                 className="mt-2"
//                                                             >
//                                                                 Crop Image
//                                                             </Button>
//                                                         </div>
//                                                     )}
//                                                     {currentBadge.icon && !imageSrc && (
//                                                         <img
//                                                             src={currentBadge.icon}
//                                                             alt="Current badge"
//                                                             className="mt-2 w-20 h-20 rounded-full"
//                                                         />
//                                                     )}
//                                                 </>
//                                             )}
//                                         />
//                                     </div>
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-category">Category</Label>
//                                     <Controller
//                                         name="category"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                             >
//                                                 <SelectTrigger className="col-span-3">
//                                                     <SelectValue />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     {BADGE_CATEGORIES.map((cat) => (
//                                                         <SelectItem key={cat.value} value={cat.value}>
//                                                             {cat.label}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-target_count">Target Count</Label>
//                                     <Controller
//                                         name="target_count"
//                                         control={editControl}
//                                         rules={{ required: "Target count is required", min: 1 }}
//                                         render={({ field, fieldState }) => (
//                                             <>
//                                                 <Input
//                                                     id="edit-target_count"
//                                                     type="number"
//                                                     {...field}
//                                                     className="col-span-3"
//                                                 />
//                                                 {fieldState.error && (
//                                                     <span className="text-red-500 text-sm col-span-3">
//                                                         {fieldState.error.message}
//                                                     </span>
//                                                 )}
//                                             </>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-applicable_role">Role</Label>
//                                     <Controller
//                                         name="applicable_role"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                             >
//                                                 <SelectTrigger className="col-span-3">
//                                                     <SelectValue />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     <SelectItem value="User">User</SelectItem>
//                                                     <SelectItem value="Organizer">Organizer</SelectItem>
//                                                 </SelectContent>
//                                             </Select>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-criteria_type">Criteria Type</Label>
//                                     <Controller
//                                         name="criteria_type"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                             >
//                                                 <SelectTrigger className="col-span-3">
//                                                     <SelectValue />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     {CRITERIA_TYPES.map((crit) => (
//                                                         <SelectItem key={crit.value} value={crit.value}>
//                                                             {crit.label}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                         )}
//                                     />
//                                 </div>
//                             </div>
//                             <DialogFooter>
//                                 <Button
//                                     variant="outline"
//                                     onClick={() => {
//                                         setIsEditDialogOpen(false);
//                                         setImageSrc(null);
//                                     }}
//                                 >
//                                     Cancel
//                                 </Button>
//                                 <Button type="submit">Update Badge</Button>
//                             </DialogFooter>
//                         </form>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// };

// export default AchievementsLayout;


// import React, { useState, useEffect, useRef } from "react";
// import { useForm, Controller } from "react-hook-form";
// import ReactCrop from 'react-image-crop';
// import { toast } from "sonner";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Search, Filter, PlusCircle, Edit, Award, Users } from "lucide-react";
// import adminApi from "@/services/adminApi";
// import 'react-image-crop/dist/ReactCrop.css';

// const AchievementsLayout = () => {
//     const [badges, setBadges] = useState([]);
//     const [userBadges, setUserBadges] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [filters, setFilters] = useState({
//         role: "all",
//         category: "all",
//         criteriaType: "all",
//         page: 1,
//     });
//     const [searchQuery, setSearchQuery] = useState("");
//     const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//     const [currentBadge, setCurrentBadge] = useState(null);
//     const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 / 1 });
//     const [imageSrc, setImageSrc] = useState(null);
//     const [croppedImage, setCroppedImage] = useState(null);
//     const imageRef = useRef(null);

//     const { control: createControl, handleSubmit: handleCreateSubmit, reset: resetCreate, setValue: setCreateValue } = useForm({
//         defaultValues: {
//             name: "",
//             description: "",
//             category: "engagement",
//             icon: null,
//             target_count: 1,
//             applicable_role: "User",
//             criteria_type: "event_attended",
//         }
//     });

//     const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue } = useForm();

//     const BADGE_CATEGORIES = [
//         { value: "engagement", label: "Engagement" },
//         { value: "exploration", label: "Exploration" },
//         { value: "milestone", label: "Milestone" },
//         { value: "contribution", label: "Contribution" },
//         { value: "success", label: "Success" },
//         { value: "quality", label: "Quality" },
//     ];

//     const CRITERIA_TYPES = [
//         { value: "event_attended", label: "Events Attended" },
//         { value: "event_created", label: "Events Created" },
//         { value: "feedback_given", label: "Feedback Given" },
//     ];

//     useEffect(() => {
//         fetchBadges();
//         fetchUserBadges();
//     }, [filters, searchQuery]);

//     const fetchBadges = async () => {
//         setLoading(true);
//         try {
//             const params = {
//                 role: filters.role === "all" ? undefined : filters.role,
//                 category: filters.category === "all" ? undefined : filters.category,
//                 criteria_type: filters.criteriaType === "all" ? undefined : filters.criteriaType,
//                 page: filters.page,
//             };
//             const response = await adminApi.get("/badges/", { params });
//             setBadges(response.data.results || response.data);
//         } catch (error) {
//             console.error("Error fetching badges:", error);
//             toast.error("Failed to load badges");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchUserBadges = async () => {
//         setLoading(true);
//         try {
//             const params = { search: searchQuery || undefined, page: filters.page };
//             const response = await adminApi.get("/user-badges/", { params });
//             setUserBadges(response.data.results || response.data);
//         } catch (error) {
//             console.error("Error fetching user badges:", error);
//             toast.error("Failed to load user badges");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const onSelectFile = (e, setValue) => {
//         if (e.target.files && e.target.files.length > 0) {
//             const file = e.target.files[0];
//             const reader = new FileReader();
//             reader.addEventListener('load', () => setImageSrc(reader.result));
//             reader.readAsDataURL(file);
//         }
//     };

//     const onImageLoad = (e) => {
//         imageRef.current = e.currentTarget;
//     };

//     const makeClientCrop = async (setValue) => {
//         if (imageRef.current && crop.width && crop.height) {
//             const croppedImageFile = await getCroppedImg(imageRef.current, crop);
//             console.log("Cropped file:", croppedImageFile); // Debug: Check the File object
//             setCroppedImage(croppedImageFile);
//             setValue('icon', croppedImageFile); // Set the File object directly
//             setImageSrc(null);
//             return croppedImageFile;
//         }
//     };

//     const getCroppedImg = (image, crop) => {
//         const canvas = document.createElement('canvas');
//         const scaleX = image.naturalWidth / image.width;
//         const scaleY = image.naturalHeight / image.height;
//         canvas.width = crop.width * scaleX;
//         canvas.height = crop.height * scaleY;
//         const ctx = canvas.getContext('2d');

//         ctx.drawImage(
//             image,
//             crop.x * scaleX,
//             crop.y * scaleY,
//             crop.width * scaleX,
//             crop.height * scaleY,
//             0,
//             0,
//             crop.width * scaleX,
//             crop.height * scaleY
//         );

//         return new Promise((resolve) => {
//             canvas.toBlob((blob) => {
//                 resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
//             }, 'image/jpeg');
//         });
//     };

//     const onCreateSubmit = async (data) => {
//         if (!data.icon || !(data.icon instanceof File)) {
//             toast.error("Please select and crop an image before submitting");
//             return;
//         }
//         try {
//             const formData = new FormData();
//             for (const key in data) {
//                 if (key === 'icon' && data[key] instanceof File) {
//                     formData.append(key, data[key]);
//                 } else if (data[key] !== null && data[key] !== undefined) {
//                     formData.append(key, data[key]);
//                 }
//             }
//             // Debug: Log FormData entries
//             for (let [key, value] of formData.entries()) {
//                 console.log(`${key}:`, value);
//             }
//             const response = await adminApi.post("/badges/", formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             setBadges([...badges, response.data]);
//             toast.success("Badge created successfully");
//             resetCreate();
//             setCroppedImage(null);
//         } catch (error) {
//             console.error("Error creating badge:", error.response?.data || error);
//             toast.error(error.response?.data?.error || "Failed to create badge");
//         }
//     };

//     const onEditSubmit = async (data) => {
//         if (!currentBadge) return;

//         try {
//             const formData = new FormData();
//             for (const key in data) {
//                 if (key === 'icon' && data[key] instanceof File) {
//                     formData.append(key, data[key]);
//                 } else if (key !== 'id' && data[key] !== null && data[key] !== undefined) {
//                     formData.append(key, data[key]);
//                 }
//             }
//             // Debug: Log FormData entries
//             for (let [key, value] of formData.entries()) {
//                 console.log(`${key}:`, value);
//             }
//             const response = await adminApi.put(`/badges/${currentBadge.id}/`, formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             setBadges(badges.map((b) => (b.id === currentBadge.id ? response.data : b)));
//             setIsEditDialogOpen(false);
//             toast.success("Badge updated successfully");
//             setCroppedImage(null);
//         } catch (error) {
//             console.error("Error updating badge:", error.response?.data || error);
//             toast.error(error.response?.data?.error || "Failed to update badge");
//         }
//     };

//     const openEditDialog = (badge) => {
//         setCurrentBadge(badge);
//         resetEdit(badge);
//         setIsEditDialogOpen(true);
//     };

//     const getCategoryLabel = (value) => {
//         const category = BADGE_CATEGORIES.find((cat) => cat.value === value);
//         return category ? category.label : value;
//     };

//     const getCriteriaLabel = (value) => {
//         const criteria = CRITERIA_TYPES.find((crit) => crit.value === value);
//         return criteria ? criteria.label : value;
//     };

//     return (
//         <div className="container mx-auto py-6">
//             <Tabs defaultValue="badges" className="w-full">
//                 <TabsList className="mb-2">
//                     <TabsTrigger value="badges" className="flex items-center gap-2">
//                         <Award size={16} />
//                         Badge Definitions
//                     </TabsTrigger>
//                     <TabsTrigger value="user-badges" className="flex items-center gap-2">
//                         <Users size={16} />
//                         User Achievements
//                     </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="badges" className="space-y-4">
//                     <Card>
//                         <CardHeader>
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <CardTitle>Badges</CardTitle>
//                                     <CardDescription>Manage achievement badges</CardDescription>
//                                 </div>
//                                 <div className="flex gap-4 items-center">
//                                     <div className="flex items-center gap-2">
//                                         <Filter size={16} />
//                                         <span>Filters:</span>
//                                     </div>

//                                     <Select
//                                         value={filters.role}
//                                         onValueChange={(value) => setFilters({ ...filters, role: value })}
//                                     >
//                                         <SelectTrigger className="w-32">
//                                             <SelectValue placeholder="Role" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">All Roles</SelectItem>
//                                             <SelectItem value="User">User</SelectItem>
//                                             <SelectItem value="Organizer">Organizer</SelectItem>
//                                         </SelectContent>
//                                     </Select>

//                                     <Select
//                                         value={filters.category}
//                                         onValueChange={(value) => setFilters({ ...filters, category: value })}
//                                     >
//                                         <SelectTrigger className="w-36">
//                                             <SelectValue placeholder="Category" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">All Categories</SelectItem>
//                                             {BADGE_CATEGORIES.map((category) => (
//                                                 <SelectItem key={category.value} value={category.value}>
//                                                     {category.label}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <Select
//                                         value={filters.criteriaType}
//                                         onValueChange={(value) => setFilters({ ...filters, criteriaType: value })}
//                                     >
//                                         <SelectTrigger className="w-40">
//                                             <SelectValue placeholder="Criteria Type" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="all">All Criteria</SelectItem>
//                                             {CRITERIA_TYPES.map((criteria) => (
//                                                 <SelectItem key={criteria.value} value={criteria.value}>
//                                                     {criteria.label}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>

//                                     <Dialog>
//                                         <DialogTrigger asChild>
//                                             <Button className="flex items-center gap-2">
//                                                 <PlusCircle size={16} />
//                                                 Add New Badge
//                                             </Button>
//                                         </DialogTrigger>
//                                         <DialogContent className="sm:max-w-md w-md">
//                                             <DialogHeader>
//                                                 <DialogTitle>Create New Badge</DialogTitle>
//                                                 <DialogDescription>Define a new badge</DialogDescription>
//                                             </DialogHeader>

//                                             <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
//                                                 <div className="grid gap-4 py-4">
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="name">Name</Label>
//                                                         <Controller
//                                                             name="name"
//                                                             control={createControl}
//                                                             rules={{ required: "Name is required" }}
//                                                             render={({ field, fieldState }) => (
//                                                                 <>
//                                                                     <Input
//                                                                         id="name"
//                                                                         {...field}
//                                                                         className="col-span-3"
//                                                                     />
//                                                                     {fieldState.error && (
//                                                                         <span className="text-red-500 text-sm col-span-3">
//                                                                             {fieldState.error.message}
//                                                                         </span>
//                                                                     )}
//                                                                 </>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="description">Description</Label>
//                                                         <Controller
//                                                             name="description"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Textarea
//                                                                     id="description"
//                                                                     {...field}
//                                                                     className="col-span-3"
//                                                                 />
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="icon">Icon</Label>
//                                                         <div className="col-span-3">
//                                                             <Controller
//                                                                 name="icon"
//                                                                 control={createControl}
//                                                                 rules={{ required: "Icon is required" }}
//                                                                 render={({ field, fieldState }) => (
//                                                                     <>
//                                                                         <Input
//                                                                             id="icon"
//                                                                             type="file"
//                                                                             accept="image/*"
//                                                                             onChange={(e) => onSelectFile(e, setCreateValue)}
//                                                                         />
//                                                                         {fieldState.error && (
//                                                                             <span className="text-red-500 text-sm">
//                                                                                 {fieldState.error.message}
//                                                                             </span>
//                                                                         )}
//                                                                         {imageSrc && (
//                                                                             <div className="mt-2">
//                                                                                 <ReactCrop
//                                                                                     crop={crop}
//                                                                                     onChange={(_, percentCrop) => setCrop(percentCrop)}
//                                                                                     aspect={1}
//                                                                                 >
//                                                                                     <img src={imageSrc} onLoad={onImageLoad} />
//                                                                                 </ReactCrop>
//                                                                                 <Button
//                                                                                     type="button"
//                                                                                     onClick={() => makeClientCrop(setCreateValue)}
//                                                                                     className="mt-2"
//                                                                                 >
//                                                                                     Crop Image
//                                                                                 </Button>
//                                                                             </div>
//                                                                         )}
//                                                                         {croppedImage && (
//                                                                             <img
//                                                                                 src={URL.createObjectURL(croppedImage)}
//                                                                                 alt="Cropped"
//                                                                                 className="mt-2 w-20 h-20 rounded-full"
//                                                                             />
//                                                                         )}
//                                                                     </>
//                                                                 )}
//                                                             />
//                                                         </div>
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="category">Category</Label>
//                                                         <Controller
//                                                             name="category"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Select
//                                                                     onValueChange={field.onChange}
//                                                                     value={field.value}
//                                                                 >
//                                                                     <SelectTrigger className="col-span-3">
//                                                                         <SelectValue />
//                                                                     </SelectTrigger>
//                                                                     <SelectContent>
//                                                                         {BADGE_CATEGORIES.map((cat) => (
//                                                                             <SelectItem key={cat.value} value={cat.value}>
//                                                                                 {cat.label}
//                                                                             </SelectItem>
//                                                                         ))}
//                                                                     </SelectContent>
//                                                                 </Select>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="target_count">Target Count</Label>
//                                                         <Controller
//                                                             name="target_count"
//                                                             control={createControl}
//                                                             rules={{ required: "Target count is required", min: 1 }}
//                                                             render={({ field, fieldState }) => (
//                                                                 <>
//                                                                     <Input
//                                                                         id="target_count"
//                                                                         type="number"
//                                                                         {...field}
//                                                                         className="col-span-3"
//                                                                     />
//                                                                     {fieldState.error && (
//                                                                         <span className="text-red-500 text-sm col-span-3">
//                                                                             {fieldState.error.message}
//                                                                         </span>
//                                                                     )}
//                                                                 </>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="applicable_role">Role</Label>
//                                                         <Controller
//                                                             name="applicable_role"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Select
//                                                                     onValueChange={field.onChange}
//                                                                     value={field.value}
//                                                                 >
//                                                                     <SelectTrigger className="col-span-3">
//                                                                         <SelectValue />
//                                                                     </SelectTrigger>
//                                                                     <SelectContent>
//                                                                         <SelectItem value="User">User</SelectItem>
//                                                                         <SelectItem value="Organizer">Organizer</SelectItem>
//                                                                     </SelectContent>
//                                                                 </Select>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                     <div className="grid grid-cols-4 items-center gap-4">
//                                                         <Label htmlFor="criteria_type">Criteria Type</Label>
//                                                         <Controller
//                                                             name="criteria_type"
//                                                             control={createControl}
//                                                             render={({ field }) => (
//                                                                 <Select
//                                                                     onValueChange={field.onChange}
//                                                                     value={field.value}
//                                                                 >
//                                                                     <SelectTrigger className="col-span-3">
//                                                                         <SelectValue />
//                                                                     </SelectTrigger>
//                                                                     <SelectContent>
//                                                                         {CRITERIA_TYPES.map((crit) => (
//                                                                             <SelectItem key={crit.value} value={crit.value}>
//                                                                                 {crit.label}
//                                                                             </SelectItem>
//                                                                         ))}
//                                                                     </SelectContent>
//                                                                 </Select>
//                                                             )}
//                                                         />
//                                                     </div>
//                                                 </div>
//                                                 <DialogFooter>
//                                                     <Button type="submit">Create Badge</Button>
//                                                 </DialogFooter>
//                                             </form>
//                                         </DialogContent>
//                                     </Dialog>
//                                 </div>
//                             </div>
//                         </CardHeader>
//                         <CardContent>
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>Badge</TableHead>
//                                         <TableHead>Description</TableHead>
//                                         <TableHead>Category</TableHead>
//                                         <TableHead>Criteria</TableHead>
//                                         <TableHead>Role</TableHead>
//                                         <TableHead>Target</TableHead>
//                                         <TableHead className="text-right">Actions</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {loading ? (
//                                         <TableRow>
//                                             <TableCell colSpan={7} className="text-center">
//                                                 Loading badges...
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : badges.length === 0 ? (
//                                         <TableRow>
//                                             <TableCell colSpan={7} className="text-center">
//                                                 No badges found
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : (
//                                         badges.map((badge) => (
//                                             <TableRow key={badge.id}>
//                                                 <TableCell className="flex items-center gap-2">
//                                                     <img
//                                                         src={badge.icon || "https://picsum.photos/200"}
//                                                         alt={badge.name}
//                                                         className="w-8 h-8 rounded-full"
//                                                     />
//                                                     {badge.name}
//                                                 </TableCell>
//                                                 <TableCell>{badge.description}</TableCell>
//                                                 <TableCell>
//                                                     <Badge variant="outline" className="capitalize p-2">
//                                                         {getCategoryLabel(badge.category)}
//                                                     </Badge>
//                                                 </TableCell>
//                                                 <TableCell>{getCriteriaLabel(badge.criteria_type)}</TableCell>
//                                                 <TableCell>{badge.applicable_role}</TableCell>
//                                                 <TableCell>{badge.target_count}</TableCell>
//                                                 <TableCell className="text-right">
//                                                     <Button
//                                                         variant="outline"
//                                                         size="icon"
//                                                         onClick={() => openEditDialog(badge)}
//                                                     >
//                                                         <Edit size={16} />
//                                                     </Button>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>

//                 <TabsContent value="user-badges" className="space-y-4">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>User Achievements</CardTitle>
//                             <CardDescription>Track earned badges</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="flex gap-4 mb-4">
//                                 <div className="relative w-64">
//                                     <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                                     <Input
//                                         placeholder="Search users..."
//                                         className="pl-8"
//                                         value={searchQuery}
//                                         onChange={(e) => setSearchQuery(e.target.value)}
//                                     />
//                                 </div>
//                             </div>
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>User</TableHead>
//                                         <TableHead>Badge</TableHead>
//                                         <TableHead>Date Earned</TableHead>
//                                         <TableHead>Category</TableHead>
//                                         <TableHead>Role</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {loading ? (
//                                         <TableRow>
//                                             <TableCell colSpan={5} className="text-center">
//                                                 Loading user badges...
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : userBadges.length === 0 ? (
//                                         <TableRow>
//                                             <TableCell colSpan={5} className="text-center">
//                                                 No user badges found
//                                             </TableCell>
//                                         </TableRow>
//                                     ) : (
//                                         userBadges.map((userBadge) => (
//                                             <TableRow key={userBadge.id}>
//                                                 <TableCell>{userBadge.user}</TableCell>
//                                                 <TableCell className="flex items-center gap-2">
//                                                     <img
//                                                         src={userBadge.badge.icon || "https://picsum.photos/200"}
//                                                         alt={userBadge.badge.name}
//                                                         className="w-8 h-8 rounded-full"
//                                                     />
//                                                     {userBadge.badge.name}
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     {userBadge.date_earned ? (
//                                                         new Date(userBadge.date_earned).toLocaleDateString()
//                                                     ) : (
//                                                         <Badge variant="outline" className="bg-yellow-100">
//                                                             In Progress
//                                                         </Badge>
//                                                     )}
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     <Badge variant="outline" className="capitalize">
//                                                         {getCategoryLabel(userBadge.badge.category)}
//                                                     </Badge>
//                                                 </TableCell>
//                                                 <TableCell>{userBadge.badge.applicable_role}</TableCell>
//                                             </TableRow>
//                                         ))
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>

//             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//                 <DialogContent className="sm:max-w-md w-md">
//                     <DialogHeader>
//                         <DialogTitle>Edit Badge</DialogTitle>
//                         <DialogDescription>Update badge details</DialogDescription>
//                     </DialogHeader>

//                     {currentBadge && (
//                         <form onSubmit={handleEditSubmit(onEditSubmit)}>
//                             <div className="grid gap-4 py-4">
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-name">Name</Label>
//                                     <Controller
//                                         name="name"
//                                         control={editControl}
//                                         rules={{ required: "Name is required" }}
//                                         render={({ field, fieldState }) => (
//                                             <>
//                                                 <Input
//                                                     id="edit-name"
//                                                     {...field}
//                                                     className="col-span-3"
//                                                 />
//                                                 {fieldState.error && (
//                                                     <span className="text-red-500 text-sm col-span-3">
//                                                         {fieldState.error.message}
//                                                     </span>
//                                                 )}
//                                             </>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-description">Description</Label>
//                                     <Controller
//                                         name="description"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Textarea
//                                                 id="edit-description"
//                                                 {...field}
//                                                 className="col-span-3"
//                                             />
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-icon">Icon</Label>
//                                     <div className="col-span-3">
//                                         <Controller
//                                             name="icon"
//                                             control={editControl}
//                                             render={({ field }) => (
//                                                 <>
//                                                     <Input
//                                                         id="edit-icon"
//                                                         type="file"
//                                                         accept="image/*"
//                                                         onChange={(e) => onSelectFile(e, setEditValue)}
//                                                     />
//                                                     {imageSrc && (
//                                                         <div className="mt-2">
//                                                             <ReactCrop
//                                                                 crop={crop}
//                                                                 onChange={(_, percentCrop) => setCrop(percentCrop)}
//                                                                 aspect={1}
//                                                             >
//                                                                 <img src={imageSrc} onLoad={onImageLoad} />
//                                                             </ReactCrop>
//                                                             <Button
//                                                                 type="button"
//                                                                 onClick={() => makeClientCrop(setEditValue)}
//                                                                 className="mt-2"
//                                                             >
//                                                                 Crop Image
//                                                             </Button>
//                                                         </div>
//                                                     )}
//                                                     {currentBadge.icon && !imageSrc && (
//                                                         <img
//                                                             src={currentBadge.icon}
//                                                             alt="Current badge"
//                                                             className="mt-2 w-20 h-20 rounded-full"
//                                                         />
//                                                     )}
//                                                 </>
//                                             )}
//                                         />
//                                     </div>
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-category">Category</Label>
//                                     <Controller
//                                         name="category"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                             >
//                                                 <SelectTrigger className="col-span-3">
//                                                     <SelectValue />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     {BADGE_CATEGORIES.map((cat) => (
//                                                         <SelectItem key={cat.value} value={cat.value}>
//                                                             {cat.label}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-target_count">Target Count</Label>
//                                     <Controller
//                                         name="target_count"
//                                         control={editControl}
//                                         rules={{ required: "Target count is required", min: 1 }}
//                                         render={({ field, fieldState }) => (
//                                             <>
//                                                 <Input
//                                                     id="edit-target_count"
//                                                     type="number"
//                                                     {...field}
//                                                     className="col-span-3"
//                                                 />
//                                                 {fieldState.error && (
//                                                     <span className="text-red-500 text-sm col-span-3">
//                                                         {fieldState.error.message}
//                                                     </span>
//                                                 )}
//                                             </>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-applicable_role">Role</Label>
//                                     <Controller
//                                         name="applicable_role"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                             >
//                                                 <SelectTrigger className="col-span-3">
//                                                     <SelectValue />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     <SelectItem value="User">User</SelectItem>
//                                                     <SelectItem value="Organizer">Organizer</SelectItem>
//                                                 </SelectContent>
//                                             </Select>
//                                         )}
//                                     />
//                                 </div>
//                                 <div className="grid grid-cols-4 items-center gap-4">
//                                     <Label htmlFor="edit-criteria_type">Criteria Type</Label>
//                                     <Controller
//                                         name="criteria_type"
//                                         control={editControl}
//                                         render={({ field }) => (
//                                             <Select
//                                                 onValueChange={field.onChange}
//                                                 value={field.value}
//                                             >
//                                                 <SelectTrigger className="col-span-3">
//                                                     <SelectValue />
//                                                 </SelectTrigger>
//                                                 <SelectContent>
//                                                     {CRITERIA_TYPES.map((crit) => (
//                                                         <SelectItem key={crit.value} value={crit.value}>
//                                                             {crit.label}
//                                                         </SelectItem>
//                                                     ))}
//                                                 </SelectContent>
//                                             </Select>
//                                         )}
//                                     />
//                                 </div>
//                             </div>
//                             <DialogFooter>
//                                 <Button
//                                     variant="outline"
//                                     onClick={() => {
//                                         setIsEditDialogOpen(false);
//                                         setImageSrc(null);
//                                     }}
//                                 >
//                                     Cancel
//                                 </Button>
//                                 <Button type="submit">Update Badge</Button>
//                             </DialogFooter>
//                         </form>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// };

// export default AchievementsLayout;