import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Flag, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useSafetyAction, getGetConversationsQueryKey, getGetPeopleQueryKey, getGetPersonQueryKey } from "@workspace/api-client-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { errMsg } from "@/lib/cp";

export function SafetyMenu({ personId, name, blocked }: { personId: string; name: string; blocked?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const safety = useSafetyAction();
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState("");

  const run = (action: "report" | "block" | "unblock", why?: string) =>
    safety.mutate({ data: { personId, action, reason: why } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPersonQueryKey(personId) });
        qc.invalidateQueries({ queryKey: getGetPeopleQueryKey() });
        toast({ title: action === "report" ? "Report received" : action === "block" ? `${name} is blocked` : `${name} is unblocked`, description: action === "report" ? "Our team will review it. Thank you for keeping CareerPath safe." : undefined });
        setReporting(false); setBlocking(false); setReason("");
      },
      onError: (e) => toast({ title: "That did not go through", description: errMsg(e), variant: "destructive" }),
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full border bg-card p-2 text-muted-foreground transition-colors hover:text-cardinal" aria-label="Safety options" data-testid="button-safety-menu">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem onClick={() => setReporting(true)} data-testid="button-report"><Flag className="mr-2 h-4 w-4" />Report {name.split(" ")[0]}</DropdownMenuItem>
          {blocked ? (
            <DropdownMenuItem onClick={() => run("unblock")} data-testid="button-unblock"><ShieldCheck className="mr-2 h-4 w-4" />Unblock</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBlocking(true)} className="text-destructive" data-testid="button-block"><Ban className="mr-2 h-4 w-4" />Block</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={reporting} onOpenChange={setReporting}>
        <DialogContent className="rounded-3xl bg-paper">
          <DialogTitle className="font-display text-2xl">Report {name}</DialogTitle>
          <DialogDescription>Tell us what happened. They will not see your report.</DialogDescription>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="What went wrong?" className="rounded-2xl bg-card" data-testid="input-report-reason" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setReporting(false)}>Cancel</Button>
            <Button className="rounded-full" disabled={!reason.trim() || safety.isPending} onClick={() => run("report", reason.trim())} data-testid="button-submit-report">Send report</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={blocking} onOpenChange={setBlocking}>
        <DialogContent className="rounded-3xl bg-paper">
          <DialogTitle className="font-display text-2xl">Block {name}?</DialogTitle>
          <DialogDescription>They will not be able to message you or request chats. You can unblock anytime.</DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setBlocking(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-full" disabled={safety.isPending} onClick={() => run("block")} data-testid="button-confirm-block">Block</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
