import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Clock, Plus, Trash, Edit2, MapPin, AlignLeft, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, isToday, isFuture, isPast, startOfDay, endOfDay, isSameDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/calendar")({ component: Page });

type Event = {
  id: string;
  project_id?: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  created_at: string;
};

const DEFAULT_PROJECT = "00000000-0000-0000-0000-000000000000";

function Page() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "agenda">("agenda");
  
  // Editor
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:00"),
    end_time: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:00")
  });

  // Local fallback if table doesn't exist
  const [localEvents, setLocalEvents] = useState<Event[]>(() => {
    try { return JSON.parse(localStorage.getItem("neura_events") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("neura_events", JSON.stringify(localEvents));
  }, [localEvents]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) {
        // Fallback to local storage if table doesn't exist
        setEvents(localEvents);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      setEvents(localEvents);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Event title is required");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || "local-user";

    const payload = {
      ...formData,
      project_id: DEFAULT_PROJECT,
      user_id: userId,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString()
    };

    if (editId) {
      // Update
      try {
        const { error } = await supabase.from("events").update(payload).eq("id", editId);
        if (error) throw error;
        setEvents(prev => prev.map(e => e.id === editId ? { ...e, ...payload } : e));
        toast.success("Event updated");
      } catch (err) {
        // Local fallback update
        const updated = localEvents.map(e => e.id === editId ? { ...e, ...payload } : e);
        setLocalEvents(updated);
        setEvents(updated);
        toast.success("Event updated (locally)");
      }
    } else {
      // Create
      try {
        const { data, error } = await supabase.from("events").insert(payload).select().single();
        if (error) throw error;
        setEvents(prev => [...prev, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        toast.success("Event created");
      } catch (err) {
        // Local fallback create
        const newLocal: Event = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
        const updated = [...localEvents, newLocal].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        setLocalEvents(updated);
        setEvents(updated);
        toast.success("Event created (locally)");
      }
    }

    setIsEditing(false);
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("Event deleted");
    } catch (err) {
      // Local fallback delete
      const updated = localEvents.filter(e => e.id !== id);
      setLocalEvents(updated);
      setEvents(updated);
      toast.success("Event deleted (locally)");
    }
  };

  const openEditor = (e?: Event) => {
    if (e) {
      setEditId(e.id);
      setFormData({
        title: e.title,
        description: e.description || "",
        location: e.location || "",
        start_time: format(new Date(e.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(e.end_time), "yyyy-MM-dd'T'HH:mm")
      });
    } else {
      setEditId(null);
      setFormData({
        title: "",
        description: "",
        location: "",
        start_time: format(selectedDate || new Date(), "yyyy-MM-dd'T'HH:00"),
        end_time: format(new Date((selectedDate || new Date()).getTime() + 3600000), "yyyy-MM-dd'T'HH:00")
      });
    }
    setIsEditing(true);
  };

  const todayEvents = events.filter(e => isToday(new Date(e.start_time)));
  const upcomingEvents = events.filter(e => isFuture(new Date(e.start_time)) && !isToday(new Date(e.start_time)));
  const selectedDayEvents = selectedDate ? events.filter(e => isSameDay(new Date(e.start_time), selectedDate)) : [];

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Calendar" title="Time, in context." description="Your schedule cross-linked with tasks, projects, and memories." hue="ai-blue" />
      
      <div className="mt-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-220px)]">
        
        {/* Left Sidebar (Mini Calendar & Quick Filters) */}
        <div className="w-full md:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <Button className="w-full bg-ai-blue hover:bg-ai-blue/90" onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>

          <div className="bg-surface rounded-2xl border p-4 shadow-sm flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0 pointer-events-auto"
              modifiers={{
                hasEvent: (date) => events.some(e => isSameDay(new Date(e.start_time), date))
              }}
              modifiersStyles={{
                hasEvent: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: 'var(--color-ai-blue)' }
              }}
            />
          </div>

          <div className="bg-surface rounded-2xl border p-4 shadow-sm flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Views</h3>
            <div className="flex gap-2">
              <Button 
                variant={view === "agenda" ? "default" : "outline"} 
                className={`flex-1 ${view === 'agenda' ? 'bg-ai-blue hover:bg-ai-blue/90' : ''}`}
                onClick={() => setView("agenda")}
              >
                <List className="h-4 w-4 mr-2" /> Agenda
              </Button>
              <Button 
                variant={view === "month" ? "default" : "outline"} 
                className={`flex-1 ${view === 'month' ? 'bg-ai-blue hover:bg-ai-blue/90' : ''}`}
                onClick={() => setView("month")}
              >
                <CalendarDays className="h-4 w-4 mr-2" /> Month
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-surface rounded-2xl border shadow-sm flex flex-col overflow-hidden relative">
          
          {isEditing && (
            <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm p-6 flex flex-col">
              <div className="max-w-2xl w-full mx-auto space-y-6 mt-10">
                <h2 className="text-2xl font-semibold">{editId ? 'Edit Event' : 'New Event'}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Title</label>
                    <Input autoFocus value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., Team Sync" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <Input type="datetime-local" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <Input type="datetime-local" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location / Link</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Zoom link or location" className="pl-9" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <div className="relative">
                      <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Agenda or notes..." 
                        className="w-full min-h-[100px] pl-9 pt-2.5 pb-2.5 bg-background border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ai-blue"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="bg-ai-blue hover:bg-ai-blue/90">Save Event</Button>
                </div>
              </div>
            </div>
          )}

          {view === "agenda" ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Today */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-ai-blue" />
                  Today
                </h2>
                {todayEvents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm text-center">
                    No events today. Enjoy your day!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayEvents.map(e => <EventCard key={e.id} event={e} onEdit={openEditor} onDelete={handleDelete} />)}
                  </div>
                )}
              </div>

              {/* Upcoming */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Upcoming
                </h2>
                {upcomingEvents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm text-center">
                    No upcoming events.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 10).map(e => <EventCard key={e.id} event={e} onEdit={openEditor} onDelete={handleDelete} />)}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </h2>
              {selectedDayEvents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
                  No events on this day.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(e => <EventCard key={e.id} event={e} onEdit={openEditor} onDelete={handleDelete} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}

function EventCard({ event, onEdit, onDelete }: { event: Event, onEdit: (e: Event) => void, onDelete: (id: string) => void }) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-surface-hover transition-colors group">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-medium text-base">{event.title}</h4>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}</span>
            {event.location && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>}
          </div>
          {event.description && <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-2">{event.description}</p>}
        </div>
        
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(event)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(event.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
