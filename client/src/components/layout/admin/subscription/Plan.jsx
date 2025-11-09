import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Edit, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import adminApi from "@/services/adminApi";
import { HashLoader } from "react-spinners";

const SubscriptionPlansAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const getLatestPlanRef = useRef(null);

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

  const getPlanDisplayName = (planName) => {
    const nameMap = {
      trial: "Trial",
      basic: "Basic",
      premium: "Premium",
    };
    return nameMap[planName?.toLowerCase()] || planName;
  };

  const handleEdit = (plan) => {
    const formattedPlan = {
      id: plan.id,
      name: plan.name,
      price: plan.price != null ? String(plan.price) : "",
      event_join_limit:
        plan.event_join_limit != null ? String(plan.event_join_limit) : "",
      event_creation_limit:
        plan.event_creation_limit != null
          ? String(plan.event_creation_limit)
          : "",
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
      const latestPlan = getLatestPlanRef.current
        ? getLatestPlanRef.current()
        : editingPlan;

      const priceValue = parseFloat(latestPlan.price);
      const joinLimitValue = parseInt(latestPlan.event_join_limit);
      const creationLimitValue = parseInt(latestPlan.event_creation_limit);

      const updatedPlan = {
        name: latestPlan.name.toLowerCase(),
        price: isNaN(priceValue) ? 0 : parseFloat(priceValue.toFixed(2)),
        event_join_limit: isNaN(joinLimitValue) ? 0 : joinLimitValue,
        event_creation_limit: isNaN(creationLimitValue)
          ? 0
          : creationLimitValue,
        email_notification: latestPlan.email_notification,
        group_chat: latestPlan.group_chat,
        personal_chat: latestPlan.personal_chat,
        advanced_analytics: latestPlan.advanced_analytics,
        ticket_scanning: latestPlan.ticket_scanning,
        live_streaming: latestPlan.live_streaming,
        active: latestPlan.active,
      };

      await adminApi.put(`subscription-plans/${latestPlan.id}/`, updatedPlan);
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

  const PlanForm = ({ plan, setPlan, onFormChange }) => {
    const [localPlan, setLocalPlan] = useState(plan);
    const localPlanRef = useRef(plan);

    useEffect(() => {
      setLocalPlan(plan);
      localPlanRef.current = plan;
    }, [plan.id]);

    useEffect(() => {
      if (onFormChange) {
        onFormChange(() => localPlanRef.current);
      }
    }, [onFormChange]);

    useEffect(() => {
      localPlanRef.current = localPlan;
    }, [localPlan]);

    const features = useMemo(
      () => [
        { id: "email_notification", name: "Email Notification" },
        { id: "group_chat", name: "Group Chat" },
        { id: "personal_chat", name: "Personal Chat" },
        { id: "advanced_analytics", name: "Advanced Analytics" },
        { id: "ticket_scanning", name: "Ticket Scanning" },
        { id: "live_streaming", name: "Live Streaming" },
      ],
      []
    );

    const syncToParent = useCallback(() => {
      setPlan({ ...localPlanRef.current });
    }, [setPlan]);

    const handlePriceChange = useCallback((e) => {
      const value = e.target.value;
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setLocalPlan((prev) => {
          const updated = { ...prev, price: value };
          localPlanRef.current = updated;
          return updated;
        });
      }
    }, []);

    const handlePriceBlur = useCallback(() => {
      syncToParent();
    }, [syncToParent]);

    const handleJoinLimitChange = useCallback((e) => {
      const value = e.target.value;
      if (value === "" || /^\d+$/.test(value)) {
        setLocalPlan((prev) => {
          const updated = { ...prev, event_join_limit: value };
          localPlanRef.current = updated;
          return updated;
        });
      }
    }, []);

    const handleJoinLimitBlur = useCallback(() => {
      syncToParent();
    }, [syncToParent]);

    const handleCreationLimitChange = useCallback((e) => {
      const value = e.target.value;
      if (value === "" || /^\d+$/.test(value)) {
        setLocalPlan((prev) => {
          const updated = { ...prev, event_creation_limit: value };
          localPlanRef.current = updated;
          return updated;
        });
      }
    }, []);

    const handleCreationLimitBlur = useCallback(() => {
      syncToParent();
    }, [syncToParent]);

    const handleFeatureToggle = useCallback((featureId, checked) => {
      setLocalPlan((prev) => {
        const updated = { ...prev, [featureId]: checked };
        localPlanRef.current = updated;
        return updated;
      });
    }, []);

    const handleActiveToggle = useCallback((checked) => {
      setLocalPlan((prev) => {
        const updated = { ...prev, active: checked };
        localPlanRef.current = updated;
        return updated;
      });
    }, []);

    return (
      <div className="space-y-6">
        <div className="space-y-2 pb-4 border-b border-gray-800">
          <Label className="text-sm font-medium text-gray-400">Plan Name</Label>
          <div className="text-lg font-semibold text-gray-200">
            {getPlanDisplayName(localPlan.name)} Plan
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">
            Pricing & Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price" className="text-sm font-medium">
                Price (₹)
              </Label>
              <Input
                id="edit-price"
                type="text"
                inputMode="decimal"
                value={localPlan.price || ""}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-gray-50 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-join-limit" className="text-sm font-medium">
                Monthly Event Join Limit
              </Label>
              <Input
                id="edit-join-limit"
                type="text"
                inputMode="numeric"
                value={localPlan.event_join_limit || ""}
                onChange={handleJoinLimitChange}
                onBlur={handleJoinLimitBlur}
                placeholder="0"
                className="bg-gray-800 border-gray-700 text-gray-50 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="edit-creation-limit"
                className="text-sm font-medium"
              >
                Monthly Event Creation Limit
              </Label>
              <Input
                id="edit-creation-limit"
                type="text"
                inputMode="numeric"
                value={localPlan.event_creation_limit || ""}
                onChange={handleCreationLimitChange}
                onBlur={handleCreationLimitBlur}
                placeholder="0"
                className="bg-gray-800 border-gray-700 text-gray-50 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-800">
          <Label className="text-lg font-semibold text-gray-200">Status</Label>
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <Switch
              id="edit-active"
              checked={localPlan.active}
              onCheckedChange={handleActiveToggle}
            />
            <Label
              htmlFor="edit-active"
              className="cursor-pointer text-sm font-medium"
            >
              {localPlan.active ? (
                <span className="text-green-400">Active</span>
              ) : (
                <span className="text-gray-400">Inactive</span>
              )}
            </Label>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-gray-800">
          <Label className="text-lg font-semibold text-gray-200">
            Features
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <Label
                  htmlFor={`edit-${feature.id}`}
                  className="cursor-pointer text-sm font-medium text-gray-300 flex-1"
                >
                  {feature.name}
                </Label>
                <Switch
                  id={`edit-${feature.id}`}
                  checked={localPlan[feature.id]}
                  onCheckedChange={(checked) =>
                    handleFeatureToggle(feature.id, checked)
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
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="bg-gray-900 border-gray-800 shadow-lg relative overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        {getPlanDisplayName(plan.name)} Plan
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
            key={editingPlan.id}
            open={editingPlan !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingPlan(null);
              }
            }}
          >
            <DialogContent className="bg-gray-900 text-gray-50 border-gray-800 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl">
                  Edit Subscription Plan
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Update the details for the{" "}
                  <span className="font-semibold text-gray-300">
                    {getPlanDisplayName(editingPlan.name)}
                  </span>{" "}
                  plan.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <PlanForm
                  key={`form-${editingPlan.id}`}
                  plan={editingPlan}
                  setPlan={setEditingPlan}
                  onFormChange={(getLatest) => {
                    getLatestPlanRef.current = getLatest;
                  }}
                />
              </div>

              <DialogFooter className="flex flex-row gap-3 pt-6 mt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="border-gray-700 hover:bg-gray-800 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
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
