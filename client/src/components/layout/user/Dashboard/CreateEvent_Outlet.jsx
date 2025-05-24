import React, { useState, useEffect } from "react";
import { ChevronDown, Upload, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import FileInput from "./FileInput";
import ImageCropper from "./ImageCropper";
import api from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const today = new Date();
today.setHours(0, 0, 0, 0);

const CreateEvent_Outlet = () => {
    const [imageState, setImageState] = useState({
        event_banner: { src: "", cropped: "", isCropping: false },
        promotional_image: { src: "", cropped: "", isCropping: false },
    });

    const location = useLocation();
    const navigate = useNavigate();
    const eventId = new URLSearchParams(location.search).get("eventId");

    const onImageSelected = (field) => (selectedImg) => {
        setImageState((prev) => ({
            ...prev,
            [field]: { ...prev[field], src: selectedImg, isCropping: true },
        }));
    };

    const onCropDone = (field) => (imgCroppedArea) => {
        const canvasEle = document.createElement("canvas");
        canvasEle.width = imgCroppedArea.width;
        canvasEle.height = imgCroppedArea.height;
        const context = canvasEle.getContext("2d");

        let imageObj = new Image();
        imageObj.src = imageState[field].src;
        imageObj.onload = function () {
            context.drawImage(
                imageObj,
                imgCroppedArea.x,
                imgCroppedArea.y,
                imgCroppedArea.width,
                imgCroppedArea.height,
                0,
                0,
                imgCroppedArea.width,
                imgCroppedArea.height
            );
            const dataURL = canvasEle.toDataURL("image/jpeg");
            setImageState((prev) => ({
                ...prev,
                [field]: { ...prev[field], cropped: dataURL, isCropping: false },
            }));
            fetch(dataURL)
                .then((res) => res.blob())
                .then((blob) => {
                    const file = new File([blob], `${field}.jpeg`, { type: "image/jpeg" });
                    setValue(field, file);
                });
        };
    };

    const onCropCancel = (field) => () => {
        setImageState((prev) => ({
            ...prev,
            [field]: { ...prev[field], src: "", isCropping: false },
        }));
    };

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            event_title: "",
            event_type: "",
            description: "",
            venue_name: "",
            address: "",
            city: "",
            start_date: null,
            end_date: null,
            start_time: "",
            end_time: "",
            visibility: "Public",
            capacity: "",
            tickets: [{ ticketType: "", ticketPrice: "", ticketQuantity: "", ticketDescription: "" }],
            age_restriction: false,
            special_instructions: "",
            cancel_ticket: false,
            event_banner: null,
            promotional_image: null,
        },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({ control, name: "tickets" });
    const [loading, setLoading] = useState(false);
    const availableTicketTypes = ["Regular", "Gold", "VIP"];
    const formValues = watch();

    const totalTicketQuantity = formValues.tickets.reduce((sum, ticket) => sum + (parseInt(ticket.ticketQuantity) || 0), 0);
    const capacityCount = parseInt(formValues.capacity) || 0;
    useEffect(() => {
        if (eventId) {
            const fetchEventData = async () => {
                try {
                    const response = await api.get(`event/get-event/${eventId}/`);
                    const eventData = response.data;

                    console.log("Fetched event data:", eventData);

                    setValue("event_title", eventData.event_title);
                    setValue("event_type", eventData.event_type);
                    setValue("description", eventData.description);
                    setValue("venue_name", eventData.venue_name);
                    setValue("address", eventData.address);
                    setValue("city", eventData.city);
                    setValue("start_date", new Date(eventData.start_date));
                    setValue("end_date", new Date(eventData.end_date));
                    setValue("start_time", eventData.start_time);
                    setValue("end_time", eventData.end_time);
                    setValue("visibility", eventData.visibility);
                    setValue("capacity", eventData.capacity);

                    setValue("age_restriction", Boolean(eventData.age_restriction), { shouldValidate: true });
                    setValue("cancel_ticket", Boolean(eventData.cancel_ticket), { shouldValidate: true });
                    setValue("special_instructions", eventData.special_instructions || "");

                    console.log("age_restriction:", eventData.age_restriction, "Type:", typeof eventData.age_restriction);
                    console.log("cancel_ticket:", eventData.cancel_ticket, "Type:", typeof eventData.cancel_ticket);

                    if (eventData.tickets && eventData.tickets.length > 0) {
                        remove();
                        eventData.tickets.forEach((ticket) => {
                            append({
                                ticketType: ticket.ticket_type,
                                ticketPrice: ticket.price,
                                ticketQuantity: ticket.quantity,
                                ticketDescription: ticket.description,
                            });
                        });
                    }

                    if (eventData.event_banner) {
                        setImageState((prev) => ({
                            ...prev,
                            event_banner: { ...prev.event_banner, cropped: eventData.event_banner },
                        }));
                    }
                    if (eventData.promotional_image) {
                        setImageState((prev) => ({
                            ...prev,
                            promotional_image: { ...prev.promotional_image, cropped: eventData.promotional_image },
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching event data:", error);
                    toast.error("Error fetching event data: " + (error.response?.data?.detail || error.message));
                }
            };

            fetchEventData();
        }
    }, [eventId, setValue, append, remove]);

    const onSubmit = async (data, action) => {
        setLoading(true);
        const formData = new FormData();

        formData.append("event_title", data.event_title);
        formData.append("event_type", data.event_type);
        formData.append("description", data.description);
        formData.append("venue_name", data.venue_name);
        formData.append("address", data.address);
        formData.append("city", data.city);

        if (data.start_date) formData.append("start_date", data.start_date.toISOString().split("T")[0]);
        if (data.end_date) formData.append("end_date", data.end_date.toISOString().split("T")[0]);
        formData.append("start_time", data.start_time);
        if (data.end_time) formData.append("end_time", data.end_time);

        formData.append("visibility", data.visibility);
        formData.append("capacity", data.capacity || 0);
        formData.append("age_restriction", data.age_restriction ? "true" : "false");
        formData.append("cancel_ticket", data.cancel_ticket ? "true" : "false");
        if (data.special_instructions) formData.append("special_instructions", data.special_instructions);

        if (data.event_banner instanceof File) formData.append("event_banner", data.event_banner);
        if (data.promotional_image instanceof File) formData.append("promotional_image", data.promotional_image);

        const processedTickets = data.tickets.map((ticket) => ({
            ticketType: ticket.ticketType,
            ticketPrice: ticket.ticketPrice,
            ticketQuantity: ticket.ticketQuantity,
            ticketDescription: ticket.ticketDescription || "",
        }));
        formData.append("tickets", JSON.stringify(processedTickets));

        formData.append("is_draft", action === "draft" ? "true" : "false");
        formData.append("is_published", action === "publish" ? "true" : "false");

        if (eventId) {
            formData.append("event_id", eventId);
        }

        try {
            console.log("Submitting event data...");
            for (let [key, value] of formData.entries()) console.log(`${key}:`, value);

            const response = await api[eventId ? "put" : "post"]("event/create-event/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("Published successfully:", response.data);

            toast.success(
                `Event ${action === "draft" ? "saved as draft" : eventId ? "updated" : "published"} successfully!`,
                {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                }
            );
            navigate("/dashboard");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Error submitting event: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const renderImageSection = (field) => (
        <div className="border-2 border-dashed border-[#3C3C3C] rounded-lg h-40 flex items-center justify-center">
            {!imageState[field].cropped ? (
                <FileInput
                    onImageSelected={onImageSelected(field)}
                    label={field === "event_banner" ? "Main Event Banner" : "Promotional Image"}
                />
            ) : (
                <div className="text-center">
                    <img src={imageState[field].cropped} alt="Cropped" className="h-32 object-cover" />
                    <div className="mt-2">
                        <Button
                            onClick={() =>
                                setImageState((prev) => ({
                                    ...prev,
                                    [field]: { ...prev[field], isCropping: true },
                                }))
                            }
                            className="mr-2 bg-gray-700 text-white hover:bg-gray-600"
                        >
                            Recrop
                        </Button>
                        <Button
                            onClick={() =>
                                setImageState((prev) => ({
                                    ...prev,
                                    [field]: { src: "", cropped: "", isCropping: false },
                                }))
                            }
                            className="bg-gray-700 text-white hover:bg-gray-600"
                        >
                            New Image
                        </Button>
                    </div>
                </div>
            )}
            <Dialog
                open={imageState[field].isCropping}
                onOpenChange={(open) =>
                    setImageState((prev) => ({
                        ...prev,
                        [field]: { ...prev[field], isCropping: open },
                    }))
                }
            >
                <DialogContent className="bg-[#2C2C2C] text-white max-w-2xl p-0">
                    <DialogHeader className="px-4 pt-4">
                        <DialogTitle>Crop {field === "event_banner" ? "Event Banner" : "Promotional Image"}</DialogTitle>
                    </DialogHeader>
                    {imageState[field].src && (
                        <ImageCropper
                            image={imageState[field].src}
                            onCropDone={onCropDone(field)}
                            onCropCancel={onCropCancel(field)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );

    return (
        <div className="bg-[#444444] text-white p-6 max-w-7xl mx-auto rounded-2xl">
            <form onSubmit={handleSubmit((data) => onSubmit(data, "publish"))} className="space-y-6 grid grid-cols-2 gap-4">
                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Event Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="event_title" className="block text-white mb-2">
                                Event Title
                            </label>
                            <input
                                id="event_title"
                                {...register("event_title", { required: "Event title is required" })}
                                placeholder="Enter an engaging title for your event"
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            />
                            {errors.event_title && (
                                <p className="text-red-500 text-sm mt-1">{errors.event_title.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="event_type" className="block text-white mb-2">
                                Event Type
                            </label>
                            <select
                                id="event_type"
                                {...register("event_type", { required: "Event type is required" })}
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            >
                                <option value="">Select event type</option>
                                <option value="Conference">Conference</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Seminar">Seminar</option>
                                <option value="Concert">Concert</option>
                                <option value="Festival">Festival</option>
                            </select>
                            {errors.event_type && <p className="text-red-500 text-sm mt-1">{errors.event_type.message}</p>}
                        </div>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="description" className="block text-white mb-2">
                            Event Description
                        </label>
                        <textarea
                            id="description"
                            {...register("description", { required: "Description is required" })}
                            placeholder="Describe what makes your event special"
                            className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 h-24 focus:outline-none focus:border-green-500"
                            disabled={loading}
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                    </div>
                </div>

                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0 mt-4">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Venue Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="venue_name" className="block text-white font-medium mb-2">
                                Venue Name
                            </label>
                            <input
                                id="venue_name"
                                {...register("venue_name", { required: "Venue name is required" })}
                                placeholder="Enter the venue name"
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            />
                            {errors.venue_name && <p className="text-red-500 text-sm mt-1">{errors.venue_name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-white mb-2">
                                Street Address
                            </label>
                            <input
                                id="address"
                                {...register("address", { required: "Address is required" })}
                                placeholder="Enter the street address"
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-white mb-2">
                                City
                            </label>
                            <input
                                id="city"
                                {...register("city", { required: "City is required" })}
                                placeholder="Enter the city"
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Event Branding</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {renderImageSection("event_banner")}
                        {renderImageSection("promotional_image")}
                    </div>
                </div>

                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0 mt-4">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Schedule Event</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Start Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-[#1E1E1E] text-white border-gray-700 hover:text-white",
                                            !watch("start_date") && "text-gray-400"
                                        )}
                                        disabled={loading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {watch("start_date") ? (
                                            format(watch("start_date"), "PPP")
                                        ) : (
                                            <span>Select Start Date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-gray-900 text-white border-gray-700 rounded-md shadow-lg">
                                    <Calendar
                                        mode="single"
                                        selected={watch("start_date")}
                                        onSelect={(date) => setValue("start_date", date, { shouldValidate: true })}
                                        initialFocus
                                        className="bg-gray-900 text-white rounded-4xl"
                                        disabled={(date) => date <= today}
                                    />
                                </PopoverContent>
                            </Popover>
                            <input
                                type="hidden"
                                {...register("start_date", {
                                    required: "Start date is required",
                                    validate: {
                                        notPast: (value) => value >= today || "Start date cannot be in the past",
                                    },
                                })}
                            />
                            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">End Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-[#1E1E1E] text-white border-gray-700 hover:text-white",
                                            !watch("end_date") && "text-gray-400"
                                        )}
                                        disabled={loading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {watch("end_date") ? (
                                            format(watch("end_date"), "PPP")
                                        ) : (
                                            <span>Select End Date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-gray-900 text-white border-gray-700 rounded-md shadow-lg">
                                    <Calendar
                                        mode="single"
                                        selected={watch("end_date")}
                                        onSelect={(date) => setValue("end_date", date, { shouldValidate: true })}
                                        initialFocus
                                        className="bg-gray-900 text-white rounded-4xl"
                                        disabled={(date) => watch("start_date") && date < watch("start_date")}
                                    />
                                </PopoverContent>
                            </Popover>
                            <input
                                type="hidden"
                                {...register("end_date", {
                                    validate: {
                                        afterStart: (value) =>
                                            !value ||
                                            !watch("start_date") ||
                                            value >= watch("start_date") ||
                                            "End date must be on or after start date",
                                    },
                                })}
                            />
                            {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="start_time" className="block text-sm font-medium text-white mb-1">
                                Start Time
                            </label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={["TimePicker"]}>
                                    <TimePicker
                                        className="bg-[#1E1E1E] rounded-md"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                variant: "outlined",
                                                error: !!errors.start_time,
                                                sx: {
                                                    ".MuiOutlinedInput-root": {
                                                        color: "white",
                                                        bgcolor: "#1E1E1E",
                                                        borderColor: "#3C3C3C",
                                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                                            borderColor: "#00FF82",
                                                        },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                            borderColor: "#00FF82",
                                                        },
                                                    },
                                                    ".MuiInputLabel-root": { color: "white" },
                                                    ".MuiSvgIcon-root": { color: "white" },
                                                },
                                            },
                                        }}
                                        disabled={loading}
                                        value={watch("start_time") ? dayjs(`2022-04-17T${watch("start_time")}`) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                const formattedTime = newValue.format("HH:mm");
                                                setValue("start_time", formattedTime, { shouldValidate: true });
                                            }
                                        }}
                                    />
                                </DemoContainer>
                            </LocalizationProvider>
                            <input type="hidden" {...register("start_time", { required: "Start time is required" })} />
                            {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="end_time" className="block text-sm font-medium text-white mb-1">
                                End Time
                            </label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={["TimePicker"]}>
                                    <TimePicker
                                        className="bg-[#1E1E1E] rounded-md"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                variant: "outlined",
                                                error: !!errors.end_time,
                                                sx: {
                                                    ".MuiOutlinedInput-root": {
                                                        color: "white",
                                                        bgcolor: "#1E1E1E",
                                                        borderColor: "#3C3C3C",
                                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                                            borderColor: "#00FF82",
                                                        },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                            borderColor: "#00FF82",
                                                        },
                                                    },
                                                    ".MuiInputLabel-root": { color: "white" },
                                                    ".MuiSvgIcon-root": { color: "white" },
                                                },
                                            },
                                        }}
                                        disabled={loading}
                                        value={watch("end_time") ? dayjs(`2022-04-17T${watch("end_time")}`) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                const formattedTime = newValue.format("HH:mm");
                                                setValue("end_time", formattedTime, { shouldValidate: true });
                                            }
                                        }}
                                    />
                                </DemoContainer>
                            </LocalizationProvider>
                            <input
                                type="hidden"
                                {...register("end_time", {
                                    validate: (value) =>
                                        !value ||
                                        (watch("start_time") &&
                                            watch("start_date") &&
                                            watch("end_date") &&
                                            (watch("start_date").toDateString() !== watch("end_date")?.toDateString() ||
                                                value > watch("start_time"))) ||
                                        "End time must be after start time on the same day",
                                })}
                            />
                            {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0 mt-4">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Event Settings</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="visibility" className="block text-white font-medium mb-2">
                                Event Visibility
                            </label>
                            <select
                                id="visibility"
                                {...register("visibility", { required: "Visibility is required" })}
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            >
                                <option value="Public">Public</option>
                                <option value="Private">Private</option>
                            </select>
                            {errors.visibility && <p className="text-red-500 text-sm mt-1">{errors.visibility.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="capacity" className="block text-white font-medium mb-2">
                                Maximum Capacity
                            </label>
                            <input
                                type="number"
                                id="capacity"
                                {...register("capacity", {
                                    required: "Capacity is required",
                                    min: { value: 1, message: "Capacity must be at least 1" },
                                    validate: {
                                        matchesTickets: (value) =>
                                            totalTicketQuantity === parseInt(value) ||
                                            "Capacity must match total ticket quantity",
                                    },
                                })}
                                placeholder="Enter maximum capacity"
                                className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                disabled={loading}
                            />
                            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0 mt-4">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Ticket Details</h2>
                    {fields.map((ticket, index) => (
                        <div key={ticket.id} className="grid md:grid-cols-2 gap-4 mb-4 border-b border-gray-700 pb-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-1">Ticket Type</label>
                                <select
                                    {...register(`tickets.${index}.ticketType`, { required: "Ticket type is required" })}
                                    className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                >
                                    <option value="">Select Ticket Type</option>
                                    {availableTicketTypes
                                        .filter(
                                            (type) =>
                                                !formValues.tickets.some((t, i) => i !== index && t.ticketType === type)
                                        )
                                        .map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                </select>
                                {errors.tickets?.[index]?.ticketType && (
                                    <p className="text-red-500 text-sm mt-1">{errors.tickets[index].ticketType.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-1">Ticket Price</label>
                                <input
                                    type="number"
                                    {...register(`tickets.${index}.ticketPrice`, {
                                        required: "Ticket price is required",
                                        min: { value: 0, message: "Price cannot be negative" },
                                    })}
                                    placeholder="Price"
                                    className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                />
                                {errors.tickets?.[index]?.ticketPrice && (
                                    <p className="text-red-500 text-sm mt-1">{errors.tickets[index].ticketPrice.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-1">Number of Tickets</label>
                                <input
                                    type="number"
                                    {...register(`tickets.${index}.ticketQuantity`, {
                                        required: "Ticket quantity is required",
                                        min: { value: 1, message: "Quantity must be at least 1" },
                                        validate: {
                                            matchesCapacity: () =>
                                                !capacityCount ||
                                                totalTicketQuantity === capacityCount ||
                                                `Total ticket quantity (${totalTicketQuantity}) must equal capacity (${capacityCount})`,
                                        },
                                    })}
                                    placeholder="Enter ticket quantity"
                                    className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500"
                                    disabled={loading}
                                />
                                {errors.tickets?.[index]?.ticketQuantity && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.tickets[index].ticketQuantity.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-1">Ticket Description</label>
                                <textarea
                                    {...register(`tickets.${index}.ticketDescription`)}
                                    placeholder="Provide details about this ticket type..."
                                    className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 focus:outline-none focus:border-green-500 h-20"
                                    disabled={loading}
                                />
                            </div>
                            {index > 0 && (
                                <div className="md:col-span-2 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="bg-red-500 text-white rounded-lg p-2 hover:bg-red-600 transition-colors"
                                        disabled={loading}
                                    >
                                        Remove Ticket
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="mb-4">
                        <p className="text-white">
                            Total Tickets: {totalTicketQuantity}
                            {capacityCount > 0 && ` / ${capacityCount} capacity`}
                        </p>
                    </div>
                    {fields.length < availableTicketTypes.length && (
                        <div className="md:col-span-2 flex justify-end">
                            <Button
                                type="button"
                                onClick={() =>
                                    append({ ticketType: "", ticketPrice: "", ticketQuantity: "", ticketDescription: "" })
                                }
                                className="bg-[#00FF82] text-black rounded-lg p-2 hover:bg-green-600 hover:text-white transition-colors"
                                disabled={loading}
                            >
                                + Add Another Ticket Type
                            </Button>
                        </div>
                    )}
                </div>

                <div className="bg-[#2C2C2C] p-4 rounded-lg m-0">
                    <h2 className="text-lg font-semibold mb-4 text-green-500">Extra Information</h2>
                    <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                            id="age_restriction"
                            checked={watch("age_restriction")}
                            onCheckedChange={(checked) => setValue("age_restriction", checked, { shouldValidate: true })}
                            className="bg-[#1E1E1E] text-green-500 focus:ring-green-500"
                            disabled={loading}
                        />
                        <Label htmlFor="age_restriction" className="text-white">
                            Age Restriction 18+
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                            id="cancel_ticket"
                            checked={watch("cancel_ticket")}
                            onCheckedChange={(checked) => setValue("cancel_ticket", checked, { shouldValidate: true })}
                            className="bg-[#1E1E1E] text-green-500 focus:ring-green-500"
                            disabled={loading}
                        />
                        <Label htmlFor="cancel_ticket" className="text-white">
                            Allow Ticket Cancellation
                        </Label>
                    </div>
                    <Textarea
                        id="special_instructions"
                        {...register("special_instructions")}
                        placeholder="Any additional information for attendees"
                        className="w-full bg-[#1E1E1E] text-white border-2 border-[#3C3C3C] rounded-lg p-2 h-24 focus:outline-none"
                        disabled={loading}
                    />
                </div>

                <div className="col-span-full flex justify-end items-center space-x-4">
                    <Button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="bg-[#3C3C3C] text-white rounded-lg px-4 py-2 hover:bg-[#4C4C4C] transition-colors"
                        disabled={loading}
                    >
                        Discard
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit((data) => onSubmit(data, "draft"))}
                        className="bg-[#3C3C3C] text-white rounded-lg px-4 py-2 hover:bg-[#4C4C4C] transition-colors"
                        disabled={loading}
                    >
                        Save as Draft
                    </Button>
                    <Button
                        type="submit"
                        className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 transition-colors"
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Publish Event"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent_Outlet;
