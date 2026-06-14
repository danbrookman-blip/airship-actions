import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { VENUES, USERS, EVENT_TYPE_LABELS, type Enquiry, type EventType } from "@/data/mockData";

interface NewEnquiryDialogProps {
  onAdd: (enquiry: Enquiry) => void;
}

const INITIAL = {
  firstName: "", lastName: "", email: "", phone: "", companyName: "",
  eventType: "" as string, venue: "" as string, requestedDate: "", requestedTime: "",
  guestCount: "", estimatedValue: "", assignedTo: "", notes: "",
};

export default function NewEnquiryDialog({ onAdd }: NewEnquiryDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.eventType || !form.venue || !form.requestedDate) return;

    const now = new Date().toISOString();
    const enquiry: Enquiry = {
      id: `ENQ-${String(Date.now()).slice(-4)}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      companyName: form.companyName || undefined,
      eventType: form.eventType as EventType,
      occasionType: EVENT_TYPE_LABELS[form.eventType as EventType],
      venue: form.venue,
      requestedDate: form.requestedDate ? new Date(form.requestedDate).toISOString() : now,
      requestedTime: form.requestedTime || "12:00",
      guestCount: Number(form.guestCount) || 0,
      estimatedValue: Number(form.estimatedValue) || 0,
      stage: "new",
      probability: 10,
      assignedTo: form.assignedTo || "",
      source: "manual",
      createdAt: now,
      updatedAt: now,
      lastActivity: now,
      notes: form.notes || undefined,
      airshipSyncStatus: "not_synced",
    };

    onAdd(enquiry);
    setForm(INITIAL);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Enquiry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Enquiry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={form.companyName} onChange={e => set("companyName", e.target.value)} />
          </div>

          {/* Event */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Event Type *</Label>
              <Select value={form.eventType} onValueChange={v => set("eventType", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Venue *</Label>
              <Select value={form.venue} onValueChange={v => set("venue", v)}>
                <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                <SelectContent>
                  {VENUES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="requestedDate">Event Date *</Label>
              <Input id="requestedDate" type="date" value={form.requestedDate} onChange={e => set("requestedDate", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requestedTime">Event Time</Label>
              <Input id="requestedTime" type="time" value={form.requestedTime} onChange={e => set("requestedTime", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="guestCount">Guest Count</Label>
              <Input id="guestCount" type="number" min={0} value={form.guestCount} onChange={e => set("guestCount", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedValue">Estimated Value (£)</Label>
              <Input id="estimatedValue" type="number" min={0} value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)} />
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select value={form.assignedTo} onValueChange={v => set("assignedTo", v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {USERS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Add Enquiry</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
