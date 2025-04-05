import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const start_date = watch("start_date");
  const end_date = watch("end_date");

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
      start_date: data.start_date,
      end_date: data.end_date,
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
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 p-2">
         
          {modalError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                {...register("code", {
                  required: "Coupon code is required",
                })}
                placeholder="SUMMER2025"
                className={cn("uppercase", errors.code && "border-red-500")}
                value={watch("code")}
              />
              {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
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
              <Label htmlFor="discount_type">Discount Type</Label>
              <Select
                onValueChange={(value) => setValue("discount_type", value)}
                value={discount_type}
              >
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
              <Label htmlFor="discount_value">Discount Value</Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                {...register("discount_value", {
                  required: "Discount value is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Discount must be greater than 0" },
                })}
                placeholder={discount_type === "percentage" ? "20" : "50.00"}
                className={errors.discount_value && "border-red-500"}
              />
              {errors.discount_value && (
                <p className="text-red-500 text-xs">{errors.discount_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_order_amount">Min Order Amount</Label>
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
              <Label htmlFor="usage_limit">Usage Limit</Label>
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
              {errors.usage_limit && (
                <p className="text-red-500 text-xs">{errors.usage_limit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !start_date && "text-muted-foreground",
                      errors.start_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {start_date ? format(new Date(start_date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={start_date ? new Date(start_date) : undefined}
                    onSelect={(date) => setValue("start_date", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                {...register("start_date", {
                  required: "Start date is required",
                })}
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !end_date && "text-muted-foreground",
                      errors.end_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {end_date ? format(new Date(end_date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={end_date ? new Date(end_date) : undefined}
                    onSelect={(date) => setValue("end_date", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                {...register("end_date", {
                  required: "End date is required",
                })}
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

// import React, { useCallback, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import adminApi from "@/services/adminApi";
// import { toast } from "sonner";

// const CouponModal = ({ isOpen, onClose, onSubmit, status, id, fetchCoupons }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     reset,
//   } = useForm({
//     defaultValues: {
//       code: "",
//       title: "",
//       discount_type: "fixed",
//       discount_value: "",
//       min_order_amount: "",
//       start_date: "",
//       end_date: "",
//       is_active: true,
//       usage_limit: 1,
//     },
//   });

//   const discount_type = watch("discount_type");
//   const start_date = watch("start_date");
//   const end_date = watch("end_date");

//   const fetchCoupon = useCallback(async () => {
//     try {
//       const response = await adminApi.get(`/coupons/${id}/`);
//       console.log("Fetched coupon data:", response.data);
//       const data = response.data;
//       Object.keys(data).forEach((key) => {
//         setValue(key, data[key]);
//       });
//     } catch (error) {
//       console.error("Error fetching coupon:", error);
//     }
//   }, [id, setValue]);

//   const SaveNewChanges = useCallback(
//     async (data) => {
//       console.log("Submitting edited data:", data);
//       try {
//         const response = await adminApi.put(`/coupons/${id}/`, data);
//         console.log("Update response:", response.data);
//         if (response.status === 200) {
//           toast.success("Coupon Updated", {
//             duration: 3000,
//             className: "text-white p-4 rounded-md",
//           });
//         } else {
//           toast.error("Coupon updation failed!", {
//             duration: 3000,
//             className: "text-white p-4 rounded-md",
//           });
//         }
//       } catch (error) {
//         console.error("Error updating coupon:", error);
//       } finally {
//         fetchCoupons();
//         onClose();
//       }
//     },
//     [id, fetchCoupons, onClose]
//   );

//   useEffect(() => {
//     console.log("Modal opened with id:", id, "status:", status);
//     if (id !== null && status === null) {
//       fetchCoupon();
//     }
//   }, [id, fetchCoupon, status]);

//   useEffect(() => {
//     if (!isOpen) {
//       reset();
//     }
//   }, [isOpen, reset]);

//   const onSubmitForm = (data) => {
//     console.log("Form submission data:", data);
//     // Custom validation for date comparison
//     if (new Date(data.start_date) >= new Date(data.end_date)) {
//       toast.error("End date must be after start date", {
//         duration: 3000,
//         className: "text-white p-4 rounded-md",
//       });
//       return;
//     }

//     const submitData = {
//       ...data,
//       discount_value: parseFloat(data.discount_value),
//       min_order_amount: parseFloat(data.min_order_amount),
//       start_date: data.start_date,
//       end_date: data.end_date,
//     };

//     if (status === "new") {
//       onSubmit(submitData);
//       onClose();
//     } else {
//       SaveNewChanges(submitData);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="w-auto bg-white dark:bg-gray-900">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//             {status === "new" ? "Create New Coupon" : "Edit Coupon"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 p-2">
//           <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
//             <div className="space-y-2">
//               <Label htmlFor="code">Coupon Code</Label>
//               <Input
//                 id="code"
//                 {...register("code", {
//                   required: "Coupon code is required",
//                 })}
//                 placeholder="SUMMER2025"
//                 className={cn("uppercase", errors.code && "border-red-500")}
//                 value={watch("code")}
//               />
//               {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="title">Title</Label>
//               <Input
//                 id="title"
//                 {...register("title", {
//                   required: "Title is required",
//                 })}
//                 placeholder="Summer Sale"
//                 maxLength={30}
//                 className={errors.title && "border-red-500"}
//               />
//               {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="discount_type">Discount Type</Label>
//               <Select
//                 onValueChange={(value) => setValue("discount_type", value)}
//                 value={discount_type}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select discount type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="fixed">Fixed Amount</SelectItem>
//                   <SelectItem value="percentage">Percentage</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="discount_value">Discount Value</Label>
//               <Input
//                 id="discount_value"
//                 type="number"
//                 step="0.01"
//                 {...register("discount_value", {
//                   required: "Discount value is required",
//                   valueAsNumber: true,
//                   min: { value: 0.01, message: "Discount must be greater than 0" },
//                 })}
//                 placeholder={discount_type === "percentage" ? "20" : "50.00"}
//                 className={errors.discount_value && "border-red-500"}
//               />
//               {errors.discount_value && (
//                 <p className="text-red-500 text-xs">{errors.discount_value.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="min_order_amount">Min Order Amount</Label>
//               <Input
//                 id="min_order_amount"
//                 type="number"
//                 step="0.01"
//                 {...register("min_order_amount", {
//                   required: "Minimum order amount is required",
//                   valueAsNumber: true,
//                   min: { value: 0, message: "Cannot be negative" },
//                 })}
//                 placeholder="100.00"
//                 className={errors.min_order_amount && "border-red-500"}
//               />
//               {errors.min_order_amount && (
//                 <p className="text-red-500 text-xs">{errors.min_order_amount.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="usage_limit">Usage Limit</Label>
//               <Input
//                 id="usage_limit"
//                 type="number"
//                 {...register("usage_limit", {
//                   required: "Usage limit is required",
//                   valueAsNumber: true,
//                   min: { value: 1, message: "Must be at least 1" },
//                 })}
//                 placeholder="100"
//                 className={errors.usage_limit && "border-red-500"}
//               />
//               {errors.usage_limit && (
//                 <p className="text-red-500 text-xs">{errors.usage_limit.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="start_date">Start Date</Label>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className={cn(
//                       "w-full justify-start text-left font-normal",
//                       !start_date && "text-muted-foreground",
//                       errors.start_date && "border-red-500"
//                     )}
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {start_date ? format(new Date(start_date), "PPP") : <span>Pick a date</span>}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={start_date ? new Date(start_date) : undefined}
//                     onSelect={(date) => setValue("start_date", date ? format(date, "yyyy-MM-dd") : "")}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//               <input
//                 type="hidden"
//                 {...register("start_date", {
//                   required: "Start date is required",
//                 })}
//               />
//               {errors.start_date && (
//                 <p className="text-red-500 text-xs">{errors.start_date.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="end_date">End Date</Label>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className={cn(
//                       "w-full justify-start text-left font-normal",
//                       !end_date && "text-muted-foreground",
//                       errors.end_date && "border-red-500"
//                     )}
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {end_date ? format(new Date(end_date), "PPP") : <span>Pick a date</span>}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={end_date ? new Date(end_date) : undefined}
//                     onSelect={(date) => setValue("end_date", date ? format(date, "yyyy-MM-dd") : "")}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//               <input
//                 type="hidden"
//                 {...register("end_date", {
//                   required: "End date is required",
//                 })}
//               />
//               {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date.message}</p>}
//             </div>

//             <div className="flex items-center space-x-2">
//               <Checkbox
//                 id="is_active"
//                 checked={watch("is_active")}
//                 onCheckedChange={(checked) => setValue("is_active", checked)}
//               />
//               <Label htmlFor="is_active">Active</Label>
//             </div>
//           </div>
//           <DialogFooter className="sm:justify-end gap-2 flex flex-row">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             {status === "new" ? (
//               <Button type="submit" className="bg-primary hover:bg-primary/90">
//                 Create Coupon
//               </Button>
//             ) : (
//               <Button type="submit" className="bg-primary hover:bg-primary/90">
//                 Save Changes
//               </Button>
//             )}
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default CouponModal;

// import React, { useCallback, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import adminApi from "@/services/adminApi";
// import { toast } from "sonner";

// // Define validation schema with Zod
// const couponSchema = z
//   .object({
//     code: z.string().min(1, "Coupon code is required"),
//     title: z.string().min(1, "Title is required"),
//     discount_type: z.enum(["fixed", "percentage"]),
//     discount_value: z.number().positive("Discount must be greater than 0"),
//     min_order_amount: z.number().min(0, "Cannot be negative"),
//     start_date: z.string().min(1, "Start date is required"),
//     end_date: z.string().min(1, "End date is required"),
//     is_active: z.boolean(),
//     usage_limit: z.number().min(1, "Must be at least 1"),
//   })
//   .refine((data) => new Date(data.start_date) < new Date(data.end_date), {
//     message: "End date must be after start date",
//     path: ["end_date"],
//   });

// const CouponModal = ({ isOpen, onClose, onSubmit, status, id, fetchCoupons }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//     reset,
//   } = useForm({
//     resolver: zodResolver(couponSchema),
//     defaultValues: {
//       code: "",
//       title: "",
//       discount_type: "fixed",
//       discount_value: "",
//       min_order_amount: "",
//       start_date: "",
//       end_date: "",
//       is_active: true,
//       usage_limit: 1,
//     },
//   });

//   const discount_type = watch("discount_type");
//   const start_date = watch("start_date");
//   const end_date = watch("end_date");

//   const fetchCoupon = useCallback(async () => {
//     try {
//       const response = await adminApi.get(`/coupons/${id}/`);
//       console.log("Fetched coupon data:", response.data);
//       const data = response.data;
//       Object.keys(data).forEach((key) => {
//         setValue(key, data[key]); // Set form values exactly as received
//       });
//     } catch (error) {
//       console.error("Error fetching coupon:", error);
//     }
//   }, [id, setValue]);

//   const SaveNewChanges = useCallback(
//     async (data) => {
//       console.log("Submitting edited data:", data);
//       try {
//         const response = await adminApi.put(`/coupons/${id}/`, data);
//         console.log("Update response:", response.data);
//         if (response.status === 200) {
//           toast.success("Coupon Updated", {
//             duration: 3000,
//             className: "text-white p-4 rounded-md",
//           });
//         } else {
//           toast.error("Coupon updation failed!", {
//             duration: 3000,
//             className: "text-white p-4 rounded-md",
//           });
//         }
//       } catch (error) {
//         console.error("Error updating coupon:", error);
//       } finally {
//         fetchCoupons();
//         onClose();
//       }
//     },
//     [id, fetchCoupons, onClose]
//   );

//   useEffect(() => {
//     console.log("Modal opened with id:", id, "status:", status);
//     if (id !== null && status === null) {
//       fetchCoupon();
//     }
//   }, [id, fetchCoupon, status]);

//   useEffect(() => {
//     if (!isOpen) {
//       reset(); // Reset form when modal closes
//     }
//   }, [isOpen, reset]);

//   const onSubmitForm = (data) => {
//     console.log("Form submission data:", data); // Debug the submitted data
//     const submitData = {
//       ...data,
//       discount_value: parseFloat(data.discount_value),
//       min_order_amount: parseFloat(data.min_order_amount),
//       start_date: data.start_date,
//       end_date: data.end_date,
//     };

//     if (status === "new") {
//       onSubmit(submitData);
//       onClose();
//     } else {
//       SaveNewChanges(submitData);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="w-auto bg-white dark:bg-gray-900">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//             {status === "new" ? "Create New Coupon" : "Edit Coupon"}
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 p-2">
//           <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
//             <div className="space-y-2">
//               <Label htmlFor="code">Coupon Code</Label>
//               <Input
//                 id="code"
//                 {...register("code")}
//                 placeholder="SUMMER2025"
//                 className={cn("uppercase", errors.code && "border-red-500")}
//                 // Ensure the value is displayed as entered
//                 value={watch("code")}
//               />
//               {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="title">Title</Label>
//               <Input
//                 id="title"
//                 {...register("title")}
//                 placeholder="Summer Sale"
//                 maxLength={30}
//                 className={errors.title && "border-red-500"}
//               />
//               {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="discount_type">Discount Type</Label>
//               <Select onValueChange={(value) => setValue("discount_type", value)} value={discount_type}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select discount type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="fixed">Fixed Amount</SelectItem>
//                   <SelectItem value="percentage">Percentage</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="discount_value">Discount Value</Label>
//               <Input
//                 id="discount_value"
//                 type="number"
//                 step="0.01"
//                 {...register("discount_value", { valueAsNumber: true })}
//                 placeholder={discount_type === "percentage" ? "20" : "50.00"}
//                 className={errors.discount_value && "border-red-500"}
//               />
//               {errors.discount_value && (
//                 <p className="text-red-500 text-xs">{errors.discount_value.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="min_order_amount">Min Order Amount</Label>
//               <Input
//                 id="min_order_amount"
//                 type="number"
//                 step="0.01"
//                 {...register("min_order_amount", { valueAsNumber: true })}
//                 placeholder="100.00"
//                 className={errors.min_order_amount && "border-red-500"}
//               />
//               {errors.min_order_amount && (
//                 <p className="text-red-500 text-xs">{errors.min_order_amount.message}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="usage_limit">Usage Limit</Label>
//               <Input
//                 id="usage_limit"
//                 type="number"
//                 {...register("usage_limit", { valueAsNumber: true })}
//                 placeholder="100"
//                 className={errors.usage_limit && "border-red-500"}
//               />
//               {errors.usage_limit && <p className="text-red-500 text-xs">{errors.usage_limit.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="start_date">Start Date</Label>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className={cn(
//                       "w-full justify-start text-left font-normal",
//                       !start_date && "text-muted-foreground",
//                       errors.start_date && "border-red-500"
//                     )}
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {start_date ? format(new Date(start_date), "PPP") : <span>Pick a date</span>}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={start_date ? new Date(start_date) : undefined}
//                     onSelect={(date) => setValue("start_date", date ? format(date, "yyyy-MM-dd") : "")}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//               {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date.message}</p>}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="end_date">End Date</Label>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className={cn(
//                       "w-full justify-start text-left font-normal",
//                       !end_date && "text-muted-foreground",
//                       errors.end_date && "border-red-500"
//                     )}
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {end_date ? format(new Date(end_date), "PPP") : <span>Pick a date</span>}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={end_date ? new Date(end_date) : undefined}
//                     onSelect={(date) => setValue("end_date", date ? format(date, "yyyy-MM-dd") : "")}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//               {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date.message}</p>}
//             </div>

//             <div className="flex items-center space-x-2">
//               <Checkbox
//                 id="is_active"
//                 checked={watch("is_active")}
//                 onCheckedChange={(checked) => setValue("is_active", checked)}
//               />
//               <Label htmlFor="is_active">Active</Label>
//             </div>
//           </div>
//           <DialogFooter className="sm:justify-end gap-2 flex flex-row">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             {status === "new" ? (
//               <Button type="submit" className="bg-primary hover:bg-primary/90">
//                 Create Coupon
//               </Button>
//             ) : (
//               <Button type="submit" className="bg-primary hover:bg-primary/90">
//                 Save Changes
//               </Button>
//             )}
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default CouponModal;

// import React, { useCallback, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import adminApi from "@/services/adminApi";
// import { toast } from "sonner";

// // Define validation schema with Zod
// const couponSchema = z
//     .object({
//         code: z.string().min(1, "Coupon code is required"),
//         title: z.string().min(1, "Title is required"),
//         discount_type: z.enum(["fixed", "percentage"]),
//         discount_value: z.number().positive("Discount must be greater than 0"),
//         min_order_amount: z.number().min(0, "Cannot be negative"),
//         start_date: z.string().min(1, "Start date is required"),
//         end_date: z.string().min(1, "End date is required"),
//         is_active: z.boolean(),
//         usage_limit: z.number().min(1, "Must be at least 1"),
//     })
//     .refine((data) => new Date(data.start_date) < new Date(data.end_date), {
//         message: "End date must be after start date",
//         path: ["end_date"],
//     });

// const CouponModal = ({ isOpen, onClose, onSubmit, status, id, fetchCoupons }) => {
//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//         setValue,
//         watch,
//         reset,
//     } = useForm({
//         resolver: zodResolver(couponSchema),
//         defaultValues: {
//             code: "",
//             title: "",
//             discount_type: "fixed",
//             discount_value: "",
//             min_order_amount: "",
//             start_date: "",
//             end_date: "",
//             is_active: true,
//             usage_limit: 1,
//         },
//     });

//     const discount_type = watch("discount_type");
//     const start_date = watch("start_date");
//     const end_date = watch("end_date");

//     const fetchCoupon = useCallback(async () => {
//         try {
//             const response = await adminApi.get(`/coupons/${id}/`);
//             console.log(response);
//             const data = response.data;
//             Object.keys(data).forEach((key) => {
//                 setValue(key, data[key]);
//             });
//         } catch (error) {
//             console.log(error);
//         }
//     }, [id]);

//     const SaveNewChanges = useCallback(
//         async (data) => {
//             console.log("edit subit datas ", data);
//             try {
//                 const response = await adminApi.put(`/coupons/${id}/`, data);
//                 console.log("new changes subcesss", response);
//                 if (response.status === 200) {
//                     toast.success("Coupon Updated", {
//                         duration: 3000,
//                         className: "text-white p-4 rounded-md",
//                     });
//                 } else {
//                     toast.error("Coupon updation failed!", {
//                         duration: 3000,
//                         className: "text-white p-4 rounded-md",
//                     });
//                 }
//             } catch (error) {
//                 console.log(error);
//             } finally {
//                 fetchCoupons();
//                 onClose();
//             }
//         },
//         [id]
//     );

//     useEffect(() => {
//         console.log("********", id, status);
//         if (id !== null && status === null) {
//             fetchCoupon();
//         }
//     }, [id, fetchCoupon, status]);

//     useEffect(() => {
//         console.log(id, "test");
//         return reset();
//     }, [id]);

//     const onSubmitForm = (data) => {
//         if (status === "new") {
//             const submitData = {
//                 ...data,
//                 discount_value: parseFloat(data.discount_value),
//                 min_order_amount: parseFloat(data.min_order_amount),
//                 // Format dates as YYYY-MM-DD for DateField
//                 start_date: data.start_date,
//                 end_date: data.end_date,
//             };
//             onSubmit(submitData);
//             onClose();
//         } else {
//             console.log("new datas");
//             const submitData = {
//                 ...data,
//                 discount_value: parseFloat(data.discount_value),
//                 min_order_amount: parseFloat(data.min_order_amount),
//                 // Format dates as YYYY-MM-DD for DateField
//                 start_date: data.start_date,
//                 end_date: data.end_date,
//             };
//             SaveNewChanges(submitData);
//         }
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="w-auto bg-white dark:bg-gray-900">
//                 {/* <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//                         Create New Coupon
//                     </DialogTitle>
//                 </DialogHeader> */}
//                 <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//                         {status === "new" ? "Create New Coupon" : "Edit Coupon"}
//                     </DialogTitle>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 p-2">
//                     <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
//                         <div className="space-y-2">
//                             <Label htmlFor="code">Coupon Code</Label>
//                             <Input
//                                 id="code"
//                                 {...register("code")}
//                                 placeholder="SUMMER2025"
//                                 className={cn("uppercase", errors.code && "border-red-500")}
//                             />
//                             {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="title">Title</Label>
//                             <Input
//                                 id="title"
//                                 {...register("title")}
//                                 placeholder="Summer Sale"
//                                 maxLength={30}
//                                 className={errors.title && "border-red-500"}
//                             />
//                             {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="discount_type">Discount Type</Label>
//                             <Select onValueChange={(value) => setValue("discount_type", value)} defaultValue="fixed">
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select discount type" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="fixed">Fixed Amount</SelectItem>
//                                     <SelectItem value="percentage">Percentage</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="discount_value">Discount Value</Label>
//                             <Input
//                                 id="discount_value"
//                                 type="number"
//                                 step="0.01"
//                                 {...register("discount_value", { valueAsNumber: true })}
//                                 placeholder={discount_type === "percentage" ? "20" : "50.00"}
//                                 className={errors.discount_value && "border-red-500"}
//                             />
//                             {errors.discount_value && (
//                                 <p className="text-red-500 text-xs">{errors.discount_value.message}</p>
//                             )}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="min_order_amount">Min Order Amount</Label>
//                             <Input
//                                 id="min_order_amount"
//                                 type="number"
//                                 step="0.01"
//                                 {...register("min_order_amount", { valueAsNumber: true })}
//                                 placeholder="100.00"
//                                 className={errors.min_order_amount && "border-red-500"}
//                             />
//                             {errors.min_order_amount && (
//                                 <p className="text-red-500 text-xs">{errors.min_order_amount.message}</p>
//                             )}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="usage_limit">Usage Limit</Label>
//                             <Input
//                                 id="usage_limit"
//                                 type="number"
//                                 {...register("usage_limit", { valueAsNumber: true })}
//                                 placeholder="100"
//                                 className={errors.usage_limit && "border-red-500"}
//                             />
//                             {errors.usage_limit && <p className="text-red-500 text-xs">{errors.usage_limit.message}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="start_date">Start Date</Label>
//                             <Popover>
//                                 <PopoverTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className={cn(
//                                             "w-full justify-start text-left font-normal",
//                                             !start_date && "text-muted-foreground",
//                                             errors.start_date && "border-red-500"
//                                         )}
//                                     >
//                                         <CalendarIcon className="mr-2 h-4 w-4" />
//                                         {start_date ? format(new Date(start_date), "PPP") : <span>Pick a date</span>}
//                                     </Button>
//                                 </PopoverTrigger>
//                                 <PopoverContent className="w-auto p-0" align="start">
//                                     <Calendar
//                                         mode="single"
//                                         selected={start_date ? new Date(start_date) : undefined}
//                                         onSelect={(date) => setValue("start_date", date ? format(date, "yyyy-MM-dd") : "")}
//                                         initialFocus
//                                         // Removed showTimePicker
//                                     />
//                                 </PopoverContent>
//                             </Popover>
//                             {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date.message}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="end_date">End Date</Label>
//                             <Popover>
//                                 <PopoverTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className={cn(
//                                             "w-full justify-start text-left font-normal",
//                                             !end_date && "text-muted-foreground",
//                                             errors.end_date && "border-red-500"
//                                         )}
//                                     >
//                                         <CalendarIcon className="mr-2 h-4 w-4" />
//                                         {end_date ? format(new Date(end_date), "PPP") : <span>Pick a date</span>}
//                                     </Button>
//                                 </PopoverTrigger>
//                                 <PopoverContent className="w-auto p-0" align="start">
//                                     <Calendar
//                                         mode="single"
//                                         selected={end_date ? new Date(end_date) : undefined}
//                                         onSelect={(date) => setValue("end_date", date ? format(date, "yyyy-MM-dd") : "")}
//                                         initialFocus
//                                         // Removed showTimePicker
//                                     />
//                                 </PopoverContent>
//                             </Popover>
//                             {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date.message}</p>}
//                         </div>

//                         <div className="flex items-center space-x-2">
//                             <Checkbox
//                                 id="is_active"
//                                 checked={watch("is_active")}
//                                 onCheckedChange={(checked) => setValue("is_active", checked)}
//                             />
//                             <Label htmlFor="is_active">Active</Label>
//                         </div>
//                     </div>
//                     <DialogFooter className="sm:justify-end gap-2 flex flex-row">
//                         <Button type="button" variant="outline" onClick={onClose}>
//                             Cancel
//                         </Button>
//                         {status === "new" ? (
//                             <Button type="submit" className="bg-primary hover:bg-primary/90">
//                                 Create Coupon
//                             </Button>
//                         ) : (
//                             <Button type="submit" className="bg-primary hover:bg-primary/90">
//                                 Save Changes
//                             </Button>
//                         )}
//                     </DialogFooter>

//                     {/* <DialogFooter className="sm:justify-end gap-2 flex flex-row">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button type="submit" className="bg-primary hover:bg-primary/90">
//               Create Coupon
//             </Button>
//           </DialogFooter> */}
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default CouponModal;

// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// const CouponModal = ({ isOpen, onClose, onSubmit }) => {
//     const [formData, setFormData] = useState({
//         code: "",
//         title: "",
//         discount_type: "fixed",
//         discount_value: "",
//         min_order_amount: "",
//         start_date: "",
//         end_date: "",
//         is_active: true,
//         usage_limit: 1,
//     });

//     const [errors, setErrors] = useState({});

//     const validateForm = () => {
//         const newErrors = {};
//         if (!formData.code) newErrors.code = "Coupon code is required";
//         if (!formData.title) newErrors.title = "Title is required";
//         if (!formData.discount_value || formData.discount_value <= 0)
//             newErrors.discount_value = "Discount must be greater than 0";
//         if (!formData.min_order_amount || formData.min_order_amount < 0) newErrors.min_order_amount = "Cannot be negative";
//         if (!formData.start_date) newErrors.start_date = "Start date is required";
//         if (!formData.end_date) newErrors.end_date = "End date is required";
//         if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date))
//             newErrors.end_date = "Must be after start date";
//         if (!formData.usage_limit || formData.usage_limit < 1) newErrors.usage_limit = "Must be at least 1";

//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     };

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData((prev) => ({
//             ...prev,
//             [name]: type === "checkbox" ? checked : value,
//         }));
//     };

//     const handleDateChange = (name, date) => {
//         setFormData((prev) => ({
//             ...prev,
//             [name]: date ? format(date, "yyyy-MM-dd'T'HH:mm") : "",
//         }));
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (validateForm()) {
//             const submitData = {
//                 ...formData,
//                 discount_value: parseFloat(formData.discount_value),
//                 min_order_amount: parseFloat(formData.min_order_amount),
//                 start_date: new Date(formData.start_date).toISOString(),
//                 end_date: new Date(formData.end_date).toISOString(),
//             };
//             onSubmit(submitData);
//             onClose();
//             setFormData({
//                 code: "",
//                 title: "",
//                 discount_type: "fixed",
//                 discount_value: "",
//                 min_order_amount: "",
//                 start_date: "",
//                 end_date: "",
//                 is_active: true,
//                 usage_limit: 1,
//             });
//             setErrors({});
//         }
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="w-auto  bg-white dark:bg-gray-900">
//                 <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//                         Create New Coupon
//                     </DialogTitle>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit} className="space-y-6 p-2">
//                     <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
//                         <div className="space-y-2">
//                             <Label htmlFor="code" className="text-sm font-medium">
//                                 Coupon Code
//                             </Label>
//                             <Input
//                                 id="code"
//                                 name="code"
//                                 value={formData.code}
//                                 onChange={handleChange}
//                                 placeholder="SUMMER2025"
//                                 className={cn("uppercase", errors.code && "border-red-500")}
//                             />
//                             {errors.code && <p className="text-red-500 text-xs">{errors.code}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="title" className="text-sm font-medium">
//                                 Title
//                             </Label>
//                             <Input
//                                 id="title"
//                                 name="title"
//                                 value={formData.title}
//                                 onChange={handleChange}
//                                 placeholder="Summer Sale"
//                                 maxLength={30}
//                                 className={errors.title && "border-red-500"}
//                             />
//                             {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="discount_type" className="text-sm font-medium">
//                                 Discount Type
//                             </Label>
//                             <Select
//                                 name="discount_type"
//                                 value={formData.discount_type}
//                                 onValueChange={(value) => setFormData((prev) => ({ ...prev, discount_type: value }))}
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select discount type" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="fixed">Fixed Amount</SelectItem>
//                                     <SelectItem value="percentage">Percentage</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="discount_value" className="text-sm font-medium">
//                                 Discount Value
//                             </Label>
//                             <Input
//                                 id="discount_value"
//                                 name="discount_value"
//                                 type="number"
//                                 step="0.01"
//                                 value={formData.discount_value}
//                                 onChange={handleChange}
//                                 placeholder={formData.discount_type === "percentage" ? "20" : "50.00"}
//                                 className={errors.discount_value && "border-red-500"}
//                             />
//                             {errors.discount_value && <p className="text-red-500 text-xs">{errors.discount_value}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="min_order_amount" className="text-sm font-medium">
//                                 Min Order Amount
//                             </Label>
//                             <Input
//                                 id="min_order_amount"
//                                 name="min_order_amount"
//                                 type="number"
//                                 step="0.01"
//                                 value={formData.min_order_amount}
//                                 onChange={handleChange}
//                                 placeholder="100.00"
//                                 className={errors.min_order_amount && "border-red-500"}
//                             />
//                             {errors.min_order_amount && <p className="text-red-500 text-xs">{errors.min_order_amount}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="usage_limit" className="text-sm font-medium">
//                                 Usage Limit
//                             </Label>
//                             <Input
//                                 id="usage_limit"
//                                 name="usage_limit"
//                                 type="number"
//                                 min="1"
//                                 value={formData.usage_limit}
//                                 onChange={handleChange}
//                                 placeholder="100"
//                                 className={errors.usage_limit && "border-red-500"}
//                             />
//                             {errors.usage_limit && <p className="text-red-500 text-xs">{errors.usage_limit}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="start_date" className="text-sm font-medium">
//                                 Start Date
//                             </Label>
//                             <Popover>
//                                 <PopoverTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className={cn(
//                                             "w-full justify-start text-left font-normal",
//                                             !formData.start_date && "text-muted-foreground",
//                                             errors.start_date && "border-red-500"
//                                         )}
//                                     >
//                                         <CalendarIcon className="mr-2 h-4 w-4" />
//                                         {formData.start_date ? (
//                                             format(new Date(formData.start_date), "PPP")
//                                         ) : (
//                                             <span>Pick a date</span>
//                                         )}
//                                     </Button>
//                                 </PopoverTrigger>
//                                 <PopoverContent className="w-auto p-0" align="start">
//                                     <Calendar
//                                         mode="single"
//                                         selected={formData.start_date ? new Date(formData.start_date) : undefined}
//                                         onSelect={(date) => handleDateChange("start_date", date)}
//                                         initialFocus
//                                         showTimePicker
//                                     />
//                                 </PopoverContent>
//                             </Popover>
//                             {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date}</p>}
//                         </div>

//                         <div className="space-y-2">
//                             <Label htmlFor="end_date" className="text-sm font-medium">
//                                 End Date
//                             </Label>
//                             <Popover>
//                                 <PopoverTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className={cn(
//                                             "w-full justify-start text-left font-normal",
//                                             !formData.end_date && "text-muted-foreground",
//                                             errors.end_date && "border-red-500"
//                                         )}
//                                     >
//                                         <CalendarIcon className="mr-2 h-4 w-4" />
//                                         {formData.end_date ? (
//                                             format(new Date(formData.end_date), "PPP")
//                                         ) : (
//                                             <span>Pick a date</span>
//                                         )}
//                                     </Button>
//                                 </PopoverTrigger>
//                                 <PopoverContent className="w-auto p-0" align="start">
//                                     <Calendar
//                                         mode="single"
//                                         selected={formData.end_date ? new Date(formData.end_date) : undefined}
//                                         onSelect={(date) => handleDateChange("end_date", date)}
//                                         initialFocus
//                                         showTimePicker
//                                     />
//                                 </PopoverContent>
//                             </Popover>
//                             {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date}</p>}
//                         </div>

//                         <div className="flex items-center space-x-2">
//                             <Checkbox
//                                 id="is_active"
//                                 name="is_active"
//                                 checked={formData.is_active}
//                                 onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
//                             />
//                             <Label htmlFor="is_active" className="text-sm font-medium">
//                                 Active
//                             </Label>
//                         </div>
//                     </div>

//                     <DialogFooter className="sm:justify-end gap-2 flex flex-row">
//                         <Button type="button" variant="outline" onClick={onClose}>
//                             Cancel
//                         </Button>
//                         <Button type="submit" className="bg-primary hover:bg-primary/90">
//                             Create Coupon
//                         </Button>
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default CouponModal;

// import React, { useState } from "react";

// const CouponModal = ({ isOpen, onClose, onSubmit }) => {
//     const [formData, setFormData] = useState({
//         code: "",
//         title: "", // Changed from description to match CouponLayout
//         description: "", // Optional additional field
//         discount_type: "percentage",
//         discount_value: "",
//         min_order_amount: "",
//         start_date: "", // Added start_date
//         end_date: "",
//         is_active: true,
//         usage_limit: 1,
//     });

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData({
//             ...formData,
//             [name]: type === "checkbox" ? checked : value,
//         });
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         // Basic validation
//         if (formData.discount_value <= 0) {
//             alert("Discount value must be greater than 0");
//             return;
//         }
//         if (new Date(formData.start_date) > new Date(formData.end_date)) {
//             alert("Start date must be before end date");
//             return;
//         }
//         onSubmit(formData);
//         onClose(true);
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-30">
//             <div className="bg-white rounded-md shadow-lg w-full max-w-md">
//                 <div className=" flex justify-between items-center border-b">
//                     <h2 className="text-lg font-medium">Add New Coupon</h2>
//                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//                         ×
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-4">
//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700 ">
//                             Coupon Code <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                             type="text"
//                             name="code"
//                             value={formData.code}
//                             onChange={handleChange}
//                             placeholder="e.g. SUMMER2023"
//                             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                             required
//                         />
//                         <p className="text-xs text-gray-500 mt-1">Use a-z, 0-9, capital letters, and numbers only.</p>
//                     </div>

//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700">
//                             Title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                             type="text"
//                             name="title"
//                             value={formData.title}
//                             onChange={handleChange}
//                             placeholder="Enter coupon title"
//                             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                             required
//                         />
//                     </div>

//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700">
//                             Discount <span className="text-red-500">*</span>
//                         </label>
//                         <div className="flex">
//                             <select
//                                 name="discount_type"
//                                 value={formData.discount_type}
//                                 onChange={handleChange}
//                                 className="border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                             >
//                                 <option value="percentage">%</option>
//                                 <option value="fixed">$</option>
//                             </select>
//                             <input
//                                 type="number"
//                                 name="discount_value"
//                                 value={formData.discount_value}
//                                 onChange={handleChange}
//                                 placeholder="Enter discount value"
//                                 className="w-full border border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                                 required
//                                 min="1"
//                             />
//                         </div>
//                     </div>

//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700">
//                             Start Date <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                             type="date"
//                             name="start_date"
//                             value={formData.start_date}
//                             onChange={handleChange}
//                             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                             required
//                         />
//                     </div>

//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700">
//                             Valid Until <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                             type="date"
//                             name="end_date"
//                             value={formData.end_date}
//                             onChange={handleChange}
//                             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                             required
//                         />
//                     </div>

//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700 ">Status</label>
//                         <div className="flex">
//                             <button
//                                 type="button"
//                                 className={`px-4 py-2 rounded-l-md ${
//                                     formData.is_active ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
//                                 }`}
//                                 onClick={() => setFormData({ ...formData, is_active: true })}
//                             >
//                                 Active
//                             </button>
//                             <button
//                                 type="button"
//                                 className={`px-4 py-2 rounded-r-md ${
//                                     !formData.is_active ? "bg-gray-500 text-white" : "bg-gray-200 text-gray-700"
//                                 }`}
//                                 onClick={() => setFormData({ ...formData, is_active: false })}
//                             >
//                                 Inactive
//                             </button>
//                         </div>
//                     </div>

//                     {/* <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Applied To
//             </label>
//             <select
//               name="applied_to"
//               value={formData.applied_to}
//               onChange={handleChange}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//             >
//               <option value="All Events">All Events</option>
//               <option value="Specific Events">Specific Events</option>
//             </select>
//           </div> */}

//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
//                         <input
//                             type="number"
//                             name="usage_limit"
//                             value={formData.usage_limit}
//                             onChange={handleChange}
//                             placeholder="Enter maximum usage limit"
//                             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
//                             min="1"
//                         />
//                     </div>

//                     <div className="flex justify-end mt-6 space-x-2">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
//                         >
//                             Cancel
//                         </button>
//                         <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
//                             Create Coupon
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default CouponModal;
