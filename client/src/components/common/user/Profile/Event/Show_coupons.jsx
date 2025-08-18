import React, { useEffect, useState } from "react";
import api from "@/services/api";
import QRCode from "react-qr-code";
import QRCodeGenerator from "qrcode";
import {
    Crown,
    Star,
    Ticket,
    MapPin,
    Calendar,
    Download,
    X,
    Users,
    CheckCircle,
    Clock3,
    AlertTriangle,
    IndianRupee,
} from "lucide-react";

const ShowTickets = ({ bookingId, onClose }) => {
    const [bookingDetail, setBookingDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingTicket, setDownloadingTicket] = useState(null);

    useEffect(() => {
        async function fetchTicketDetails() {
            setLoading(true);
            try {
                const res = await api.get(`event/booked-ticket-details/${bookingId}/`);
                setBookingDetail(res.data);
            } catch (err) {
                console.error("Error fetching ticket details:", err);
                setBookingDetail(null);
            }
            setLoading(false);
        }
        if (bookingId) fetchTicketDetails();
    }, [bookingId]);

    const downloadTicketAsImage = async (ticketPurchase, ticketIndex) => {
        setDownloadingTicket(ticketIndex);
        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = 900;
            canvas.height = 350;

            ctx.fillStyle = "#1a1d29";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, "#1a1d29");
            gradient.addColorStop(0.5, "#232740");
            gradient.addColorStop(1, "#1a1d29");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const ticketType = ticketPurchase.ticket.ticket_type.toLowerCase();
            const bannerHeight = 12;
            const bannerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            if (ticketType === "vip") {
                bannerGradient.addColorStop(0, "#8b5cf6");
                bannerGradient.addColorStop(1, "#ec4899");
            } else if (ticketType === "gold") {
                bannerGradient.addColorStop(0, "#f59e0b");
                bannerGradient.addColorStop(1, "#ef4444");
            } else if (ticketType === "regular") {
                bannerGradient.addColorStop(0, "#3b82f6");
                bannerGradient.addColorStop(1, "#06b6d4");
            } else {
                bannerGradient.addColorStop(0, "#6b7280");
                bannerGradient.addColorStop(1, "#4b5563");
            }
            ctx.fillStyle = bannerGradient;
            ctx.fillRect(0, 0, canvas.width, bannerHeight);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
            ctx.setLineDash([]);

            const leftSection = 50;
            const rightSection = canvas.width - 220;

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px Arial, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            const eventTitle = bookingDetail.event.event_title;
            ctx.fillText(eventTitle, leftSection, 40);

            const ticketTypeSymbol = ticketType === "vip" ? "♛" : ticketType === "gold" ? "★" : "♪";
            ctx.font = "24px Arial, sans-serif";
            ctx.fillText(ticketTypeSymbol, leftSection, 85);
            ctx.font = "bold 24px Arial, sans-serif";
            ctx.fillStyle = ticketType === "vip" ? "#ec4899" : ticketType === "gold" ? "#f59e0b" : "#3b82f6";
            ctx.fillText(`${ticketPurchase.ticket.ticket_type} Ticket`, leftSection + 40, 85);

            ctx.fillStyle = "#94a3b8";
            ctx.font = "16px Arial, sans-serif";
            ctx.fillText(ticketPurchase.ticket.description, leftSection, 120);

            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 18px Arial, sans-serif";
            ctx.fillText("● " + bookingDetail.event.venue_name, leftSection, 150);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px Arial, sans-serif";
            ctx.fillText(bookingDetail.event.city + ", " + bookingDetail.event.address, leftSection + 20, 175);

            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 16px Arial, sans-serif";
            ctx.fillText("📅 " + formatDate(bookingDetail.event.start_date), leftSection, 205);
            ctx.fillText("⏰ " + formatTime(bookingDetail.event.start_time), leftSection, 230);

            const priceBoxY = 260;
            const boxWidth = 120;
            const boxHeight = 50;

            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(leftSection, priceBoxY, boxWidth, boxHeight);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.strokeRect(leftSection, priceBoxY, boxWidth, boxHeight);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px Arial, sans-serif";
            ctx.fillText("Price per ticket", leftSection + 8, priceBoxY + 12);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial, sans-serif";
            ctx.fillText(`₹${ticketPurchase.ticket.price}`, leftSection + 8, priceBoxY + 28);

            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(leftSection + boxWidth + 10, priceBoxY, boxWidth, boxHeight);
            ctx.strokeRect(leftSection + boxWidth + 10, priceBoxY, boxWidth, boxHeight);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px Arial, sans-serif";
            ctx.fillText("Total Amount", leftSection + boxWidth + 18, priceBoxY + 12);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial, sans-serif";
            ctx.fillText(`₹${ticketPurchase.total_price}`, leftSection + boxWidth + 18, priceBoxY + 28);

            const quantityX = leftSection + boxWidth * 2 + 40;
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px Arial, sans-serif";
            ctx.fillText(`Qty: ${ticketPurchase.quantity}`, quantityX, priceBoxY + 8);
            ctx.fillText(`Used: ${ticketPurchase.used_tickets}`, quantityX, priceBoxY + 25);
            ctx.fillText(`Left: ${ticketPurchase.quantity - ticketPurchase.used_tickets}`, quantityX, priceBoxY + 42);

            const qrSize = 140;
            const qrX = rightSection + 30;
            const qrY = 80;

            ctx.save();

            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "#1a1d29";
            ctx.fillRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);

            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;

            ctx.restore();

            const qrDataURL = await QRCodeGenerator.toDataURL(ticketPurchase.unique_qr_code, {
                width: qrSize,
                margin: 0,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
                errorCorrectionLevel: "M",
            });

            const qrImage = new Image();
            await new Promise((resolve, reject) => {
                qrImage.onload = resolve;
                qrImage.onerror = reject;
                qrImage.src = qrDataURL;
            });

            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

            const perfY = canvas.height / 2;
            ctx.fillStyle = "#2d3748";
            const perfStartX = rightSection - 30;
            const perfEndX = rightSection - 10;
            const perfSpacing = 4;
            const numPerfs = Math.floor((perfEndX - perfStartX) / perfSpacing);

            for (let i = 0; i <= numPerfs; i++) {
                const x = perfStartX + i * perfSpacing;
                if (x < qrX - 20) {
                    ctx.beginPath();
                    ctx.arc(x, perfY, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }

            const cornerSize = 20;
            ctx.fillStyle = "#0f172a";

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(cornerSize, 0);
            ctx.lineTo(0, cornerSize);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(canvas.width, 0);
            ctx.lineTo(canvas.width - cornerSize, 0);
            ctx.lineTo(canvas.width, cornerSize);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(cornerSize, canvas.height);
            ctx.lineTo(0, canvas.height - cornerSize);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(canvas.width, canvas.height);
            ctx.lineTo(canvas.width - cornerSize, canvas.height);
            ctx.lineTo(canvas.width, canvas.height - cornerSize);
            ctx.closePath();
            ctx.fill();

            const link = document.createElement("a");
            link.download = `${bookingDetail.event.event_title
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}-${ticketPurchase.ticket.ticket_type.toLowerCase()}-ticket.png`;
            link.href = canvas.toDataURL("image/png", 1.0);
            link.click();
        } catch (error) {
            console.error("Error downloading ticket:", error);
            alert("Failed to download ticket. Please try again.");
        }
        setDownloadingTicket(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (timeString) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getTicketTypeIcon = (type) => {
        switch (type.toLowerCase()) {
            case "vip":
                return Crown;
            case "gold":
                return Star;
            case "regular":
                return Ticket;
            default:
                return Ticket;
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-[#2d2d42] to-[#1e1e2f] rounded-2xl p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-white mt-4 text-center">Loading your tickets...</p>
                </div>
            </div>
        );
    }

    if (!bookingDetail) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-[#2d2d42] to-[#1e1e2f] rounded-2xl p-8 text-center">
                    <AlertTriangle className="text-red-400 w-16 h-16 mb-4 mx-auto" />
                    <h3 className="text-xl font-bold text-white mb-2">Tickets Not Found</h3>
                    <p className="text-gray-300 mb-6">We couldn't load your ticket details.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#2d2d42] to-[#1e1e2f] rounded-2xl w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                    <div className="flex items-center gap-4">
                        <Ticket className="text-blue-400 w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">{bookingDetail.event.event_title}</h2>
                            <p className="text-blue-400 font-medium">{bookingDetail.event.event_type}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 pb-0 bg-gradient-to-r from-gray-800/30 to-gray-700/30 border-b border-gray-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-3">
                            <MapPin className="text-red-400 w-5 h-5" />
                            <div>
                                <p className="text-white font-medium">{bookingDetail.event.venue_name}</p>
                                <p className="text-gray-400 text-sm">{bookingDetail.event.city}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="text-green-400 w-5 h-5" />
                            <div>
                                <p className="text-white font-medium">{formatDate(bookingDetail.event.start_date)}</p>
                                <p className="text-gray-400 text-sm">{formatTime(bookingDetail.event.start_time)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <IndianRupee className="text-yellow-400 w-5 h-5" />
                            <div>
                                <p className="text-white font-medium">Total: ₹{bookingDetail.total}</p>
                                <p className="text-gray-400 text-sm">Booking ID: {bookingDetail.booking_id.slice(-8)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {bookingDetail.ticket_purchases.map((ticketPurchase, index) => {
                        const TicketIcon = getTicketTypeIcon(ticketPurchase.ticket.ticket_type);
                        return (
                            <div
                                key={ticketPurchase.unique_id}
                                id={`ticket-${index}`}
                                className="relative bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-600 shadow-xl"
                                style={{
                                    background: "linear-gradient(to right, #1a1a2e, #16213e)",
                                    borderColor: "rgba(156, 163, 175, 0.3)",
                                }}
                            >
                                <div
                                    className="h-2 bg-gradient-to-r"
                                    style={{
                                        background: `linear-gradient(to right, ${
                                            ticketPurchase.ticket.ticket_type.toLowerCase() === "vip"
                                                ? "#9333ea, #ec4899"
                                                : ticketPurchase.ticket.ticket_type.toLowerCase() === "gold"
                                                ? "#eab308, #f97316"
                                                : ticketPurchase.ticket.ticket_type.toLowerCase() === "regular"
                                                ? "#3b82f6, #06b6d4"
                                                : "#6b7280, #4b5563"
                                        })`,
                                    }}
                                ></div>

                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <TicketIcon
                                                    className={`w-6 h-6 ${
                                                        ticketPurchase.ticket.ticket_type.toLowerCase() === "vip"
                                                            ? "text-purple-400"
                                                            : ticketPurchase.ticket.ticket_type.toLowerCase() === "gold"
                                                            ? "text-yellow-400"
                                                            : "text-blue-400"
                                                    }`}
                                                />
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">
                                                        {ticketPurchase.ticket.ticket_type} Ticket
                                                    </h3>
                                                    <p className="text-gray-400">{ticketPurchase.ticket.description}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div
                                                    className="bg-black bg-opacity-30 rounded-lg p-3"
                                                    style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                                                >
                                                    <p className="text-gray-400 text-sm">Price per ticket</p>
                                                    <p className="text-white font-bold text-lg">
                                                        ₹{ticketPurchase.ticket.price}
                                                    </p>
                                                </div>
                                                <div
                                                    className="bg-black bg-opacity-30 rounded-lg p-3"
                                                    style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                                                >
                                                    <p className="text-gray-400 text-sm">Total Amount</p>
                                                    <p className="text-white font-bold text-lg">
                                                        ₹{ticketPurchase.total_price}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Users className="text-blue-400 w-4 h-4" />
                                                    <span className="text-gray-400">Quantity:</span>
                                                    <span className="text-white font-medium">
                                                        {ticketPurchase.quantity}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="text-green-400 w-4 h-4" />
                                                    <span className="text-gray-400">Used:</span>
                                                    <span className="text-white font-medium">
                                                        {ticketPurchase.used_tickets}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock3 className="text-orange-400 w-4 h-4" />
                                                    <span className="text-gray-400">Remaining:</span>
                                                    <span className="text-white font-medium">
                                                        {ticketPurchase.quantity - ticketPurchase.used_tickets}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-white p-4 rounded-xl shadow-lg">
                                                <QRCode value={ticketPurchase.unique_qr_code} size={120} level="M" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-400 text-xs">Ticket ID</p>
                                                <p className="text-white text-sm font-mono">
                                                    {ticketPurchase.unique_id.slice(-8)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-700/50">
                                        <button
                                            onClick={() => downloadTicketAsImage(ticketPurchase, index)}
                                            disabled={downloadingTicket === index}
                                            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all text-white ${
                                                downloadingTicket === index
                                                    ? "cursor-not-allowed"
                                                    : "shadow-lg hover:shadow-xl"
                                            }`}
                                            style={{
                                                background:
                                                    downloadingTicket === index
                                                        ? "#6b7280"
                                                        : "linear-gradient(to right, #2563eb, #7c3aed)",
                                                backgroundImage:
                                                    downloadingTicket === index
                                                        ? "none"
                                                        : "linear-gradient(to right, #2563eb, #7c3aed)",
                                            }}
                                        >
                                            {downloadingTicket === index ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Generating Image...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-5 h-5" />
                                                    Download Ticket Image
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full border-4 -ml-4"
                                    style={{
                                        backgroundColor: "#2d2d42",
                                        borderColor: "#1a1a2e",
                                    }}
                                ></div>
                                <div
                                    className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full border-4 -mr-4"
                                    style={{
                                        backgroundColor: "#2d2d42",
                                        borderColor: "#1a1a2e",
                                    }}
                                ></div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-700/30">
                    <div className="flex justify-between items-center">
                        <div className="text-gray-400 text-sm">
                            <p>Purchased on {formatDate(bookingDetail.created_at)}</p>
                            <p>Payment via {bookingDetail.payment_method}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowTickets;
