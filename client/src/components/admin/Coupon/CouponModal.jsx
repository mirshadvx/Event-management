import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import adminApi from "@/services/adminApi";
import { toast } from "sonner";

const CouponModal = ({ isOpen, onClose, onSubmit, status, id, fetchCoupons }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm({
        defaultValues: {
            code: "",
            title: "",
            discount_type: "fixed",
            discount_value: "",
            min_order_amount: "",
            start_date: "",
            end_date: "",
            is_active: true,
            usage_limit: 1,
        },
    });

    const [modalError, setModalError] = useState(null);
    const discount_type = watch("discount_type");

    const fetchCoupon = useCallback(async () => {
        try {
            const response = await adminApi.get(`/coupons/${id}/`);
            const data = response.data;
            Object.keys(data).forEach((key) => {
                setValue(key, data[key]);
            });
        } catch (error) {
            console.error("Error fetching coupon:", error);
            setModalError("Failed to fetch coupon details");
        }
    }, [id, setValue]);

    const SaveNewChanges = useCallback(
        async (data) => {
            try {
                const response = await adminApi.put(`/coupons/${id}/`, data);
                if (response.status === 200) {
                    toast.success("Coupon Updated", {
                        duration: 3000,
                        className: "text-white p-4 rounded-md",
                    });
                    fetchCoupons();
                    onClose();
                } else {
                    throw new Error("Unexpected response status");
                }
            } catch (error) {
                const errorMessage = error.response?.data?.code?.[0] || "Failed to update coupon";
                setModalError(errorMessage);
                toast.error(errorMessage, { duration: 3000, className: "text-white p-4 rounded-md" });
            }
        },
        [id, fetchCoupons, onClose]
    );

    useEffect(() => {
        if (id !== null && status === null) {
            fetchCoupon();
        }
    }, [id, fetchCoupon, status]);

    useEffect(() => {
        if (!isOpen) {
            reset();
            setModalError(null);
        }
    }, [isOpen, reset]);

    const onSubmitForm = async (data) => {
        setModalError(null);
        if (new Date(data.start_date) >= new Date(data.end_date)) {
            setModalError("End date must be after start date");
            toast.error("End date must be after start date", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
            return;
        }
        const submitData = {
            ...data,
            discount_value: parseFloat(data.discount_value),
            min_order_amount: parseFloat(data.min_order_amount),
        };
        if (status === "new") {
            const result = await onSubmit(submitData);
            if (result.success) {
                onClose();
            } else {
                setModalError(result.error);
            }
        } else {
            SaveNewChanges(submitData);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-auto bg-white dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        {status === "new" ? "Create New Coupon" : "Edit Coupon"}
                    </DialogTitle>
                    <DialogDescription>
                        {status === "new"
                            ? "Fill in the details to create a new coupon."
                            : "Update the details of the existing coupon."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 p-2">
                    {modalError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
                            {modalError}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Coupon Code*</Label>
                            <Input
                                id="code"
                                {...register("code", {
                                    required: "Coupon code is required",
                                })}
                                placeholder="SUMMER2025"
                            />
                            {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Title*</Label>
                            <Input
                                id="title"
                                {...register("title", {
                                    required: "Title is required",
                                })}
                                placeholder="Summer Sale"
                                maxLength={30}
                                className={errors.title && "border-red-500"}
                            />
                            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount_type">Discount Type*</Label>
                            <Select onValueChange={(value) => setValue("discount_type", value)} value={discount_type}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select discount type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount_value">Discount Value*</Label>
                            <Input
                                id="discount_value"
                                type="number"
                                step="1"
                                {...register("discount_value", {
                                    required: "Discount value is required",
                                    valueAsNumber: true,
                                    min: { value: 0.01, message: "Discount must be greater than 0" },
                                    max:
                                        discount_type === "percentage"
                                            ? { value: 100, message: "Percentage discount cannot exceed 100" }
                                            : undefined,
                                })}
                                placeholder={discount_type === "percentage" ? "20%.." : "50.00"}
                                className={errors.discount_value && "border-red-500"}
                            />
                            {errors.discount_value && (
                                <p className="text-red-500 text-xs">{errors.discount_value.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min_order_amount">Min Order Amount*</Label>
                            <Input
                                id="min_order_amount"
                                type="number"
                                step="0.01"
                                {...register("min_order_amount", {
                                    required: "Minimum order amount is required",
                                    valueAsNumber: true,
                                    min: { value: 0, message: "Cannot be negative" },
                                })}
                                placeholder="100.00"
                                className={errors.min_order_amount && "border-red-500"}
                            />
                            {errors.min_order_amount && (
                                <p className="text-red-500 text-xs">{errors.min_order_amount.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usage_limit">Usage Limit*</Label>
                            <Input
                                id="usage_limit"
                                type="number"
                                {...register("usage_limit", {
                                    required: "Usage limit is required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Must be at least 1" },
                                })}
                                placeholder="100"
                                className={errors.usage_limit && "border-red-500"}
                            />
                            {errors.usage_limit && <p className="text-red-500 text-xs">{errors.usage_limit.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date*</Label>
                            <Input
                                id="start_date"
                                type="date"
                                {...register("start_date", {
                                    required: "Start date is required",
                                })}
                                className={errors.start_date && "border-red-500"}
                            />
                            {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date*</Label>
                            <Input
                                id="end_date"
                                type="date"
                                {...register("end_date", {
                                    required: "End date is required",
                                })}
                                className={errors.end_date && "border-red-500"}
                            />
                            {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date.message}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={watch("is_active")}
                                onCheckedChange={(checked) => setValue("is_active", checked)}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end gap-2 flex flex-row">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        {status === "new" ? (
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                Create Coupon
                            </Button>
                        ) : (
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                Save Changes
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CouponModal;
