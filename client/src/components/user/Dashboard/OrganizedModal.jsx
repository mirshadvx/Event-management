import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HashLoader } from "react-spinners";

const OrganizedModal = ({ isOpen, onClose, eventId }) => {
  const dummyData = {
    totalEvents: 10,
    totalRevenue: "$5000",
    averageAttendance: 50,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>Organized Events Analytics</DialogTitle>
          <DialogDescription>Detailed analytics for organized events.</DialogDescription>
        </DialogHeader>
        <div>
          <p>Event ID: {eventId}</p>
          <p>Total Events: {dummyData.totalEvents}</p>
          <p>Total Revenue: {dummyData.totalRevenue}</p>
          <p>Average Attendance: {dummyData.averageAttendance}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizedModal;
