import { expect, test, type Page } from "@playwright/test";

const viewer = {
  id: "alex",
  name: "Alex Kim",
  role: "student",
  school: "Viterbi",
  major: "Computer Science",
  level: "Undergrad",
  year: "Sophomore",
  clubs: ["HackSC"],
  skills: ["Python"],
  interests: ["Technology"],
  courses: ["CSCI 104"],
  experience: [],
  timeline: [],
};

const person = {
  id: "priya",
  name: "Priya Shah",
  role: "alumni",
  photo: "avatars/alumni-01.jpg",
  school: "Viterbi",
  major: "Computer Science",
  level: "Undergrad",
  gradYear: 2021,
  currentRole: "Product Manager",
  company: "Google",
  openToChat: true,
  paused: false,
  bio: "From late nights at HackSC to building products at Google.",
  linkedin: "https://www.linkedin.com/in/priya-shah",
  contactEmail: "priya@example.com",
  phone: "+1 (213) 555-0123",
  clubs: ["HackSC", "LavaLab"],
  skills: ["Python", "SQL"],
  interests: ["Product management", "Mentorship"],
  courses: ["CSCI 104: Data Structures"],
  experience: ["Undergraduate research", "Product internship at Microsoft"],
  helpTopics: ["Career exploration", "Internship advice"],
  availability: ["2026-11-20T18:00:00.000Z"],
  timeline: [
    { year: "2017", title: "Started at USC Viterbi", detail: "Began Computer Science." },
    { year: "2021", title: "Associate Product Manager at Google", detail: "Started her first full-time role." },
    { year: "Now", title: "Product Manager at Google", detail: "Supports fellow Trojans." },
  ],
  fitReason: "You both started in HackSC and share a Computer Science background.",
};

async function mockProfileApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: viewer } });
    } else if (pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
    } else if (pathname === "/api/people/priya") {
      await route.fulfill({ json: person });
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected request: ${pathname}` } });
    }
  });
}

test("shows profile actions, shared details, and a readable career timeline", async ({ page }) => {
  await mockProfileApi(page);
  await page.goto("/people/priya");

  await expect(page.getByTestId("text-person-name")).toHaveText("Priya Shah");
  await expect(page.locator('img[data-testid="img-avatar"]')).toHaveAttribute("src", /avatars\/alumni-01\.jpg$/);
  await expect(page.getByTestId("link-contact-linkedin")).toHaveAttribute("href", "https://www.linkedin.com/in/priya-shah");
  await expect(page.getByTestId("link-contact-email")).toHaveAttribute("href", "mailto:priya@example.com");
  await expect(page.getByTestId("link-contact-phone")).toHaveAttribute("href", "tel:+12135550123");
  await expect(page.getByRole("heading", { name: "Conversation starters" })).toBeVisible();
  await expect(page.getByTestId("text-person-fit")).toContainText("HackSC");
  await expect(page.getByRole("button", { name: /Draft message/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Request coffee chat/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How Priya got here" })).toBeVisible();
  await expect(page.locator('[data-testid^="timeline-step-"]')).toHaveCount(3);
  await expect(page.getByText("Experience", { exact: true })).toBeVisible();
});

test("keeps the profile readable on a phone without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockProfileApi(page);
  await page.goto("/people/priya");

  await expect(page.getByTestId("text-person-name")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How Priya got here" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
