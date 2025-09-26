import React, { useEffect, useState } from "react";
import { Edit, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import adminApi from "@/services/adminApi";
import { HashLoader } from "react-spinners";

const SubscriptionPlansAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchPlanDatas = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get("subscription-plans/");
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to fetch subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanDatas();
  }, []);

  const handleEdit = (plan) => {
    const formattedPlan = {
      id: plan.id,
      name: plan.name === "basic" ? "Basic" : "Premium",
      price: parseFloat(plan.price),
      event_join_limit: plan.event_join_limit,
      event_creation_limit: plan.event_creation_limit,
      email_notification: plan.email_notification,
      group_chat: plan.group_chat,
      personal_chat: plan.personal_chat,
      advanced_analytics: plan.advanced_analytics,
      ticket_scanning: plan.ticket_scanning,
      live_streaming: plan.live_streaming,
      active: plan.active,
    };
    setEditingPlan(formattedPlan);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedPlan = {
        name: editingPlan.name.toLowerCase(),
        price: parseFloat(editingPlan.price).toFixed(2),
        event_join_limit: parseInt(editingPlan.event_join_limit) || 0,
        event_creation_limit: parseInt(editingPlan.event_creation_limit) || 0,
        email_notification: editingPlan.email_notification,
        group_chat: editingPlan.group_chat,
        personal_chat: editingPlan.personal_chat,
        advanced_analytics: editingPlan.advanced_analytics,
        ticket_scanning: editingPlan.ticket_scanning,
        live_streaming: editingPlan.live_streaming,
        active: editingPlan.active,
      };

      await adminApi.put(`subscription-plans/${editingPlan.id}/`, updatedPlan);
      await fetchPlanDatas();
      setEditingPlan(null);
      toast.success("Plan updated successfully.");
    } catch (error) {
      console.error(
        "Error updating plan:",
        error.response?.data || error.message
      );
      toast.error(
        `Failed to update plan: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
  };

  const handleToggleActive = async (planId, currentStatus) => {
    try {
      const plan = plans.find((p) => p.id === planId);
      const updatedPlan = {
        name: plan.name,
        price: parseFloat(plan.price).toFixed(2),
        event_join_limit: plan.event_join_limit,
        event_creation_limit: plan.event_creation_limit,
        email_notification: plan.email_notification,
        group_chat: plan.group_chat,
        personal_chat: plan.personal_chat,
        advanced_analytics: plan.advanced_analytics,
        ticket_scanning: plan.ticket_scanning,
        live_streaming: plan.live_streaming,
        active: !currentStatus,
      };
      await adminApi.put(`subscription-plans/${planId}/`, updatedPlan);
      await fetchPlanDatas();
      toast.success(
        `Plan ${currentStatus ? "deactivated" : "activated"} successfully.`
      );
    } catch (error) {
      console.error(
        "Error toggling plan status:",
        error.response?.data || error.message
      );
      toast.error(
        `Failed to update plan status: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  const PlanForm = ({ plan, setPlan }) => {
    const features = [
      { id: "email_notification", name: "Email Notification" },
      { id: "group_chat", name: "Group Chat" },
      { id: "personal_chat", name: "Personal Chat" },
      { id: "advanced_analytics", name: "Advanced Analytics" },
      { id: "ticket_scanning", name: "Ticket Scanning" },
      { id: "live_streaming", name: "Live Streaming" },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Plan Name {plan.name}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-price">Price (₹)</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              value={plan.price}
              onChange={(e) =>
                setPlan({ ...plan, price: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-join-limit">Monthly Event Join Limit</Label>
            <Input
              id="edit-join-limit"
              type="number"
              value={plan.event_join_limit}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  event_join_limit: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-creation-limit">
              Monthly Event Creation Limit
            </Label>
            <Input
              id="edit-creation-limit"
              type="number"
              value={plan.event_creation_limit}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  event_creation_limit: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Active Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-active"
              checked={plan.active}
              onCheckedChange={(checked) =>
                setPlan({ ...plan, active: checked })
              }
            />
            <Label htmlFor="edit-active">
              {plan.active ? "Active" : "Inactive"}
            </Label>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Features</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between border p-3 rounded-md bg-gray-900"
              >
                <Label
                  htmlFor={`edit-${feature.id}`}
                  className="cursor-pointer"
                >
                  {feature.name}
                </Label>
                <Switch
                  id={`edit-${feature.id}`}
                  checked={plan[feature.id]}
                  onCheckedChange={(checked) =>
                    setPlan({ ...plan, [feature.id]: checked })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex text-center w-full h-screen justify-center items-center">
            <HashLoader color="#54c955" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center">No plans available.</div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 ">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="bg-gray-900 border-gray-800 shadow-lg relative overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        {plan.name === "basic" ? "Basic" : "Premium"} Plan
                      </CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleEdit(plan)}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                      >
                        <Edit className="h-7 w-7" />
                      </Button>
                      <Switch
                        checked={plan.active}
                        onCheckedChange={() =>
                          handleToggleActive(plan.id, plan.active)
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-900 hover:bg-green-800 text-green-300 text-xl"
                    >
                      ₹{parseFloat(plan.price).toFixed(2)}/month
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-800 p-3 rounded-md">
                      <p className="text-xs text-gray-400">Join Events</p>
                      <p className="text-xl font-semibold">
                        {plan.event_join_limit} / month
                      </p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-md">
                      <p className="text-xs text-gray-400">Create Events</p>
                      <p className="text-xl font-semibold">
                        {plan.event_creation_limit} / month
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4 bg-gray-800" />

                  <h3 className="font-medium mb-3">Features</h3>
                  <ul className="space-y-2">
                    {[
                      { key: "email_notification", name: "Email Notification" },
                      { key: "group_chat", name: "Group Chat" },
                      { key: "personal_chat", name: "Personal Chat" },
                      { key: "advanced_analytics", name: "Advanced Analytics" },
                      { key: "ticket_scanning", name: "Ticket Scanning" },
                      { key: "live_streaming", name: "Live Streaming" },
                    ].map((feature) => (
                      <li
                        key={feature.key}
                        className="flex items-center text-sm"
                      >
                        {plan[feature.key] ? (
                          <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="w-6 h-6 text-gray-500 mr-2" />
                        )}
                        <span
                          className={
                            plan[feature.key]
                              ? "text-gray-200 text-lg"
                              : "text-gray-500 text-lg"
                          }
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingPlan && (
          <Dialog
            open={editingPlan !== null}
            onOpenChange={(open) => !open && setEditingPlan(null)}
          >
            <DialogContent className="bg-gray-900 text-gray-50 border-gray-800 max-w-2xl">
              <PlanForm plan={editingPlan} setPlan={setEditingPlan} />

              <DialogFooter className="flex flex-row">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="border-gray-700 hover:bg-gray-800 w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 w-1/2"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlansAdmin;
