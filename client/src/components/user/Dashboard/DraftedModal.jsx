import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HashLoader } from "react-spinners";

const DraftedModal = ({ isOpen, onClose }) => {
  const dummyData = {
    totalEvents: 3,
    totalRevenue: "$0",
    averageAttendance: 0,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>Drafted Events Analytics</DialogTitle>
          <DialogDescription>Detailed analytics for drafted events.</DialogDescription>
        </DialogHeader>
        <div>
          <p>Total Events: {dummyData.totalEvents}</p>
          <p>Total Revenue: {dummyData.totalRevenue}</p>
          <p>Average Attendance: {dummyData.averageAttendance}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftedModal;
