import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Users } from "lucide-react";

const EventCard = lazy(() => import("./EventCard"));

const EventTabs = ({ userData }) => {
    const [activeTab, setActiveTab] = useState("organized");

    return (
        <div className="container mx-auto px-4 pb-12 bg-amber-400 md:px-40">
            <Tabs defaultValue="organized" className="">
                <TabsList className="flex w-full bg-slate-800 rounded-lg h-13 p-1 mb-6 md:mb-8">
                    <TabsTrigger
                        value="organized"
                        className="flex-1 h-11 text-xs md:text-sm data-[state=active]:bg-green-400 data-[state=active]:text-slate-900 transition-colors duration-300"
                        onClick={() => setActiveTab("organized")}
                    >
                        <CalendarDays size={16} className="mr-1 md:mr-2" />
                        <span className="hidden [@media(max-width:425px)]:inline sm:hidden">Organized</span>
                        <span className="inline [@media(max-width:425px)]:hidden sm:inline">Organized Events</span>
                        <span className="ml-1">({userData.stats.organized})</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="participated"
                        className="flex-1 h-11 text-xs md:text-sm data-[state=active]:bg-green-400 data-[state=active]:text-slate-900 transition-colors duration-300"
                        onClick={() => setActiveTab("participated")}
                    >
                        <Users size={16} className="mr-1 md:mr-2" />
                        <span className="inline [@media(max-width:425px)]:hidden sm:inline">Participated Events</span>
                        <span className="hidden [@media(max-width:425px)]:inline sm:hidden">Participated</span>
                        <span className="ml-1">({userData.stats.participated})</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="organized" className="mt-0">
                    <Suspense fallback={<div className="text-center py-8">Loading events...</div>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {userData.organizedEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </Suspense>
                </TabsContent>

                <TabsContent value="participated" className="mt-0">
                    <Suspense fallback={<div className="text-center py-8">Loading events...</div>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {userData.participatedEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default EventTabs;
