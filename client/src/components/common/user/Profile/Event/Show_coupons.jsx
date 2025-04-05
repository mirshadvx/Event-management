import React from "react";

const ShowTickets = ({ bookingId, onClose }) => {
    //     {
    //   event_title: "hackathon",
    //   purchase_date: "2025-03-25T14:30:00Z",
    //   quantity: 6,
    //   used_tickets: 2,
    // },
    const tickets = [
        {
            ticket_type: "Regular",
            event_title: "Summer Music Festival",
            price: "45.00",
            description: "General admission to all main stage events",
            qr_code: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            purchase_date: "2025-03-25T14:30:00Z",
            quantity: 3,
            used_tickets: 1,
        },
        {
            ticket_type: "Gold",
            event_title: "Summer Music Festival",
            price: "75.00",
            description: "Premium seating with backstage access",
            qr_code: "b2c3d4e5-f678-9012-bcde-f12345678901",
            purchase_date: "2025-03-25T14:30:00Z",
            quantity: 2,
            used_tickets: 0,
        },
        {
            ticket_type: "VIP",
            event_title: "Summer Music Festival",
            price: "150.00",
            description: "All-access pass with meet & greet",
            qr_code: "c3d4e5f6-7890-1234-cdef-123456789012",
            purchase_date: "2025-03-25T14:30:00Z",
            quantity: 1,
            used_tickets: 0,
        },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#2d2d42] to-[#1e1e2f] rounded-2xl pt-1 px-2 w-full max-w-2xl shadow-2xl max-h-[90vh]">
                <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-1 px-4">
                    <h2 className="text-xl font-bold text-white">Your Event Tickets</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* {ticketPurchase && (
          <div className="mb-6 bg-[#252538] p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-400">{ticketPurchase.event.event_title}</h3>
            <p className="text-gray-300 text-sm">Purchase ID: <span className="text-white">{ticketPurchase.unique_id}</span></p>
            <p className="text-gray-400 text-sm">Purchased: {new Date(ticketPurchase.purchased_at).toLocaleString()}</p>
          </div>
        )} */}

                <div className="flex flex-col">
                    {tickets.map((ticket, index) => (
                        <div
                            key={index}
                            className="bg-[#1e1e2f] p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors"
                        >
                            <div className="flex gap-1">
                                <div className="w-[60%]">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                                            {ticket.ticket_type} /{" "}
                                            <span className="text-green-400 font-semibold">{ticket.price}</span>
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-gray-300 text-sm">
                                            {ticket.description || "No description available"}
                                        </p>
                                        <div className="text-gray-400 text-sm space-y-1">
                                            <p>
                                                Quantity: <span className="text-white">{ticket.quantity}</span>
                                            </p>
                                            <p>
                                                Used: <span className="text-white">{ticket.used_tickets}</span>
                                            </p>
                                            <p>
                                                Remaining:{" "}
                                                <span className="text-white">{ticket.quantity - ticket.used_tickets}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-[40%]">
                                    <div className="flex justify-center">
                                        <div className="bg-white p-2 w-30 h-30 flex items-center justify-center">
                                            <span className="text-black text-xs text-center">
                                                {/* QR: {ticket.qr_code.slice(0, 8)}... */}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShowTickets;

// import React from 'react';

// const Show_coupons = ({ bookingId, onClose }) => {
//   return (
//     <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-[#2d2d42] rounded-xl p-6 w-full max-w-md shadow-xl">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-white">Your Coupons</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-white transition-colors"
//           >
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div className="text-gray-300">
//             <p>Booking ID: <span className="text-blue-400">{bookingId || 'N/A'}</span></p>
//           </div>

//           {/* Add your coupons display logic here */}
//           <div className="bg-[#1e1e2f] p-4 rounded-lg">
//             <p className="text-gray-300">Coupon information would go here</p>
//             {/* You can add actual coupon data fetching/display based on bookingId */}
//           </div>
//         </div>

//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Show_coupons;
