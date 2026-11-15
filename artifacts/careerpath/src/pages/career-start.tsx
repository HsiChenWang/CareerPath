import { ArrowRight, Compass, Map } from "lucide-react";
import { Link } from "wouter";
import { CareerWorkflowProgress } from "@/components/career-workflow";
import { Page } from "@/components/shell";
import { PageHeader } from "@/components/bits";

const STARTS = [
  {
    href: "/explore",
    title: "Find your dream job",
    description: "Browse Trojans who started in a similar place and discover where their careers led.",
    action: "Explore careers",
    icon: Compass,
    testId: "link-start-explore",
  },
  {
    href: "/path-finder",
    title: "Get your custom roadmap to your dream job",
    description: "Choose a role or company and see the steps alumni commonly took to get there.",
    action: "Find a path",
    icon: Map,
    testId: "link-start-path-finder",
  },
] as const;

export default function CareerStart() {
  return (
    <Page>
      <CareerWorkflowProgress current="start" />
      <PageHeader
        eyebrow="Start here"
        title={<>How would you like to <span className="text-cardinal">begin?</span></>}
        sub="Explore real Trojan journeys or map a specific career goal. Either way, you can compare your next steps in My Gap."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {STARTS.map(({ href, title, description, action, icon: Icon, testId }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-64 flex-col rounded-[1.75rem] border bg-card p-6 transition-all hover:-translate-y-1 hover:border-cardinal/40 hover:shadow-lg md:p-8"
            data-testid={testId}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cardinal text-gold">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-2xl">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
            <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-cardinal">
              {action}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
