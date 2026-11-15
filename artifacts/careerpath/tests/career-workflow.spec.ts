import { expect, test, type Page } from "@playwright/test";

const student = {
  id: "alex",
  name: "Alex Kim",
  role: "student",
  school: "Viterbi",
  major: "Computer Science",
  level: "Undergrad",
  year: "Sophomore",
  gradYear: 2028,
  clubs: [],
  skills: [],
  interests: [],
  experience: [],
  courses: [],
  timeline: [],
  isDemo: true,
};

const alum = {
  ...student,
  id: "priya",
  name: "Priya Shah",
  role: "alumni",
  major: "Computer Science",
  currentRole: "Product Manager",
  company: "Google",
  outcome: "Product Manager at Google",
  gradYear: 2021,
  timeline: [
    { year: "2021", title: "Associate Product Manager", detail: "Started in product", category: "Work" },
  ],
};

const peer = {
  ...student,
  id: "student-2",
  name: "Sarah Chen",
  photo: "avatars/alumni-01.jpg",
};

const path = {
  role: "Product Manager",
  company: "Google",
  summary: "A common path from campus leadership into product.",
  total: 8,
  fallback: false,
  steps: [{
    id: "internship",
    stage: "During college",
    title: "Complete a product internship",
    description: "Build experience working with product teams.",
    count: 6,
    total: 8,
    category: "Experience",
    keywords: ["internship"],
  }],
  alumni: [alum],
};

const gap = {
  role: "Product Manager",
  company: "Google",
  completed: 0,
  total: 1,
  steps: [{ ...path.steps[0], done: false }],
  actions: ["Apply for a product internship."],
};

async function mockCareerApi(page: Page, options: { hasPath?: boolean } = {}) {
  const mappedGoals: Array<{ role: string; company?: string; industry?: string }> = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: student } });
    } else if (url.pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
    } else if (url.pathname === "/api/people") {
      await route.fulfill({ json: url.searchParams.get("kind") === "peers" ? [peer] : [alum] });
    } else if (url.pathname === "/api/path" && request.method() === "POST") {
      mappedGoals.push(request.postDataJSON());
      await route.fulfill({ json: { ...path, industry: request.postDataJSON().industry } });
    } else if (url.pathname === "/api/gap") {
      await route.fulfill({ json: options.hasPath ? gap : { ...gap, role: "", company: "", total: 0, steps: [], actions: [] } });
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected API request: ${request.method()} ${url.pathname}` } });
    }
  });

  return mappedGoals;
}

async function mockMyNetworkApi(page: Page) {
  let sentMessages = 0;
  const conversationId = "demo-priya";
  const draft = "Hi Priya, thanks for sharing your experience. Could I ask you one quick question about product roles?";

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: student } });
    } else if (url.pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
    } else if (url.pathname === "/api/network") {
      await route.fulfill({ json: {
        summary: "One follow-up is due.",
        connections: [],
        chats: [],
        followups: [{
          id: "followup-priya",
          person: alum,
          kind: "coffee chat",
          reason: "Send a thank-you after your conversation.",
          draft: "Thanks for meeting with me.",
          dueAt: "2026-11-01T12:00:00.000Z",
          status: "pending",
        }],
        waiting: 0,
        relationships: 0,
        now: "2026-11-14T12:00:00.000Z",
        offsetDays: 0,
      } });
    } else if (url.pathname === "/api/conversations" && request.method() === "GET") {
      await route.fulfill({ json: [{
        id: conversationId,
        person: alum,
        lastMessage: "Thanks for reaching out!",
        updatedAt: "2026-11-14T12:00:00.000Z",
        canSend: true,
        hasReply: true,
        blocked: false,
      }] });
    } else if (url.pathname === `/api/conversations/${conversationId}/messages` && request.method() === "GET") {
      await route.fulfill({ json: [{
        id: "message-priya-1",
        conversationId,
        senderId: alum.id,
        text: "Thanks for reaching out!",
        createdAt: "2026-11-14T11:00:00.000Z",
      }] });
    } else if (url.pathname === `/api/conversations/${conversationId}/messages` && request.method() === "POST") {
      sentMessages += 1;
      await route.fulfill({ json: {
        id: "message-alex-1",
        conversationId,
        senderId: student.id,
        text: request.postDataJSON().text,
        createdAt: "2026-11-14T12:01:00.000Z",
      } });
    } else if (url.pathname === "/api/ai" && request.method() === "POST") {
      const body = request.postDataJSON();
      await route.fulfill({ json: {
        text: body.kind === "reply" ? draft : "Explore product roles this week.",
        suggestions: [],
        questions: [],
        actions: body.kind === "weekly" ? ["Explore product roles this week."] : [],
        fallback: false,
      } });
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected API request: ${request.method()} ${url.pathname}` } });
    }
  });

  return { sentMessageCount: () => sentMessages, draft };
}

async function mockProfileApi(page: Page, role: "student" | "alumni") {
  const profile = role === "alumni"
    ? { ...alum, school: "", major: "", currentRole: "", company: "", level: "", year: "", gradYear: null }
    : { ...student, school: "", major: "", level: "", year: "", gradYear: null };

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: profile } });
    } else if (url.pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected API request: ${url.pathname}` } });
    }
  });
}

async function mockAlumniScheduleApi(page: Page) {
  const futureTime = "2030-01-02T12:00:00.000Z";
  const chats = [
    {
      id: "alumni-future-chat",
      studentId: student.id,
      alumniId: alum.id,
      person: student,
      duration: 15,
      format: "virtual",
      times: [futureTime],
      note: "Interested in product management.",
      status: "accepted",
      scheduledAt: futureTime,
      notes: "",
      summary: "",
      actionItems: [],
      createdAt: "2026-11-14T12:00:00.000Z",
    },
    {
      id: "alumni-past-chat",
      studentId: student.id,
      alumniId: alum.id,
      person: student,
      duration: 30,
      format: "campus",
      times: ["2025-01-02T12:00:00.000Z"],
      note: "",
      status: "completed",
      scheduledAt: "2025-01-02T12:00:00.000Z",
      notes: "",
      summary: "Discussed product career paths.",
      actionItems: [],
      createdAt: "2024-12-15T12:00:00.000Z",
    },
    {
      id: "alumni-pending-chat",
      studentId: student.id,
      alumniId: alum.id,
      person: student,
      duration: 15,
      format: "virtual",
      times: [futureTime],
      note: "",
      status: "pending",
      scheduledAt: "",
      notes: "",
      summary: "",
      actionItems: [],
      createdAt: "2026-11-14T12:00:00.000Z",
    },
  ];

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: alum } });
    } else if (url.pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
    } else if (url.pathname === "/api/chats") {
      await route.fulfill({ json: chats });
    } else if (url.pathname === "/api/conversations") {
      await route.fulfill({ json: [] });
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected API request: ${url.pathname}` } });
    }
  });
}

test("follows an Explore recommendation through a mapped path into My Gap", async ({ page }) => {
  const mappedGoals = await mockCareerApi(page, { hasPath: true });

  await page.goto("/explore");
  await expect(page.getByTestId("card-explore-priya")).toBeVisible();
  await expect(page.getByTestId("text-workflow-progress")).toHaveCount(0);
  await expect(page.locator("header nav").getByRole("link", { name: "Messages" })).toHaveCount(0);
  await expect(page.locator("header nav").getByRole("link", { name: "Career" })).toHaveCount(0);

  await page.getByTestId("button-explore-path-priya").click();
  await expect(page).toHaveURL(/\/path-finder\?role=Product%20Manager&company=Google/);
  await expect(page.getByTestId("text-workflow-progress")).toHaveCount(0);
  await expect(page.getByTestId("input-dream-role")).toHaveValue("Product Manager");
  await expect(page.getByTestId("input-dream-company")).toHaveValue("Google");
  await expect(page.getByTestId("text-path-title")).toHaveText("Product Manager at Google");
  await expect(page.getByTestId("text-path-summary")).toContainText("Quick read");
  await expect(page.getByTestId("text-path-summary").locator("li")).toHaveCount(Math.min(path.steps.length, 3));
  await expect(page.getByTestId("step-path-internship")).toBeVisible();
  expect(mappedGoals).toEqual([{ role: "Product Manager", company: "Google" }]);

  await page.getByTestId("link-see-gap").click();
  await expect(page).toHaveURL(/\/my-gap$/);
  await expect(page.getByTestId("text-workflow-progress")).toHaveCount(0);
  await expect(page.getByTestId("text-gap-progress")).toContainText("0/1");
  await expect(page.getByTestId("checkbox-step-internship")).toContainText("Complete a product internship");
});

test("returns from an unmapped My Gap to Path Finder with the right step active", async ({ page }) => {
  await mockCareerApi(page);

  await page.goto("/my-gap");
  await expect(page.getByTestId("text-workflow-progress")).toHaveCount(0);
  await expect(page.getByText("Pick a destination first")).toBeVisible();
  await expect(page.getByTestId("link-path-finder")).toHaveAttribute("href", "/path-finder");

  await page.getByTestId("link-path-finder").click();
  await expect(page).toHaveURL(/\/path-finder$/);
  await expect(page.getByTestId("text-workflow-progress")).toHaveCount(0);
  await expect(page.getByText("No path mapped yet")).toBeVisible();
});

test("shows the student's two starting choices without the roadmap box", async ({ page }) => {
  await mockCareerApi(page);

  await page.goto("/career-workflow");
  await expect(page.getByTestId("text-workflow-progress")).toHaveCount(0);
  await expect(page.getByTestId("link-start-explore")).toBeVisible();
  await expect(page.getByTestId("link-start-path-finder")).toBeVisible();
});

test("keeps My Network focused and AI drafts unsent until the student sends them", async ({ page }) => {
  const api = await mockMyNetworkApi(page);

  await page.goto("/my-network");
  await expect(page.getByTestId("list-weekly-suggestions")).toContainText("Follow up with Priya");
  await expect(page.getByTestId("panel-upcoming-coffee")).toBeVisible();
  await expect(page.getByTestId("panel-message-session")).toBeVisible();
  for (const removedHeading of ["Follow-ups due", "Waiting for reply", "Relationships", "Hit a milestone?", "Everyone"]) {
    await expect(page.getByText(removedHeading, { exact: true })).toHaveCount(0);
  }

  await page.getByTestId("button-weekly-coach").click();
  await expect(page.getByTestId("list-weekly-suggestions")).toContainText("Explore product roles this week.");
  await expect(page.getByTestId("list-weekly-suggestions")).toContainText("Follow up with Priya");

  await page.getByTestId("button-session-ai-draft").click();
  const composer = page.getByTestId("input-session-message");
  await expect(composer).toHaveValue(api.draft);
  expect(api.sentMessageCount()).toBe(0);

  await page.getByTestId("button-session-send").click();
  await expect.poll(api.sentMessageCount).toBe(1);
});

test("fills student and alumni profile fields with clearly labeled LinkedIn demo data", async ({ browser }) => {
  for (const role of ["student", "alumni"] as const) {
    const page = await browser.newPage();
    await mockProfileApi(page, role);
    await page.goto("/profile");
    await expect(page.getByTestId("input-contact-linkedin")).toBeVisible();
    await expect(page.getByTestId("input-contact-email")).toBeVisible();
    await expect(page.getByTestId("input-contact-phone")).toBeVisible();
    await expect(page.getByTestId("input-contact-linkedin")).not.toHaveAttribute("required");
    await expect(page.getByTestId("input-contact-email")).not.toHaveAttribute("required");
    await expect(page.getByTestId("input-contact-phone")).not.toHaveAttribute("required");
    await page.getByTestId("button-linkedin-autofill").click();

    await expect(page.getByText("Uses sample profile details only.", { exact: false })).toBeVisible();
    await expect(page.getByTestId("input-major")).toHaveValue("Computer Science");
    await expect(page.getByTestId("select-school")).toContainText("Viterbi");

    if (role === "student") {
      await expect(page.getByTestId("input-year")).toHaveValue("Junior");
      await expect(page.getByTestId("input-grad-year")).toHaveValue("2027");
    } else {
      await expect(page.getByTestId("input-current-role")).toHaveValue("Product Manager");
      await expect(page.getByTestId("input-company")).toHaveValue("Google");
    }

    await page.close();
  }
});

test("includes an optional industry with the company in path searches", async ({ page }) => {
  const mappedGoals = await mockCareerApi(page);
  await page.goto("/path-finder");

  await page.getByTestId("input-dream-role").fill("Product Manager");
  await page.getByTestId("input-dream-company").fill("Google");
  await page.getByTestId("input-dream-industry").fill("Technology");
  await page.getByTestId("button-find-path").click();

  await expect(page.getByTestId("text-path-industry")).toHaveText("Industry: Technology");
  expect(mappedGoals).toEqual([{ role: "Product Manager", company: "Google", industry: "Technology" }]);
});

test("gives alumni a Chat Session tab and a schedule of confirmed chats", async ({ page }) => {
  await mockAlumniScheduleApi(page);

  await page.goto("/chat-session");
  const nav = page.locator("header nav");
  await expect(nav.getByRole("link", { name: "Requests" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Chat Session" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Schedule" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Upcoming Chats" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Chat session" })).toBeVisible();

  await nav.getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  await expect(page.getByTestId("card-chat-alumni-future-chat")).toBeVisible();
  await expect(page.getByTestId("card-chat-alumni-past-chat")).toBeVisible();
  await expect(page.getByTestId("card-chat-alumni-pending-chat")).toHaveCount(0);
});

test("shows mapped career paths as a short quick-read list", async ({ page }) => {
  await mockCareerApi(page, { hasPath: true });

  await page.goto("/explore");
  await page.getByTestId("button-explore-path-priya").click();

  const quickRead = page.getByTestId("text-path-summary");
  await expect(quickRead).toContainText("Quick read");
  await expect(quickRead.locator("li")).toHaveCount(Math.min(path.steps.length, 3));
  await expect(quickRead).not.toContainText(path.summary);
});

test("shows profile photos on peer cards", async ({ page }) => {
  await mockCareerApi(page);
  await page.goto("/connect");
  await page.getByTestId("tab-peers").click();

  const avatar = page.locator('[data-testid="card-person-student-2"] img[data-testid="img-avatar"]');
  await expect(avatar).toHaveAttribute("src", /avatars\/alumni-01\.jpg$/);
  await expect(avatar).toBeVisible();
});
