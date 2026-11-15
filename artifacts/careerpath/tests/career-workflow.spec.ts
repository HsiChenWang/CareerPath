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
  const mappedGoals: Array<{ role: string; company?: string }> = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: student } });
    } else if (url.pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
    } else if (url.pathname === "/api/people" && url.searchParams.get("kind") === "explore") {
      await route.fulfill({ json: [alum] });
    } else if (url.pathname === "/api/path" && request.method() === "POST") {
      mappedGoals.push(request.postDataJSON());
      await route.fulfill({ json: path });
    } else if (url.pathname === "/api/gap") {
      await route.fulfill({ json: options.hasPath ? gap : { ...gap, role: "", company: "", total: 0, steps: [], actions: [] } });
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected API request: ${request.method()} ${url.pathname}` } });
    }
  });

  return mappedGoals;
}

async function expectCurrentStep(page: Page, label: string, step: number) {
  await expect(page.getByTestId("text-workflow-progress")).toHaveText(`Step ${step} of 3`);
  await expect(page.locator('[aria-current="step"]')).toContainText(label);
}

test("follows an Explore recommendation through a mapped path into My Gap", async ({ page }) => {
  const mappedGoals = await mockCareerApi(page, { hasPath: true });

  await page.goto("/explore");
  await expect(page.getByTestId("card-explore-priya")).toBeVisible();
  await expectCurrentStep(page, "Explore", 1);
  await expect(page.locator("header nav").getByRole("link", { name: "Messages" })).toHaveCount(0);
  await expect(page.locator("header nav").getByRole("link", { name: "Career" })).toHaveCount(0);

  await page.getByTestId("button-explore-path-priya").click();
  await expect(page).toHaveURL(/\/path-finder\?role=Product%20Manager&company=Google/);
  await expectCurrentStep(page, "Path Finder", 2);
  await expect(page.getByTestId("input-dream-role")).toHaveValue("Product Manager");
  await expect(page.getByTestId("input-dream-company")).toHaveValue("Google");
  await expect(page.getByTestId("text-path-title")).toHaveText("Product Manager at Google");
  await expect(page.getByTestId("step-path-internship")).toBeVisible();
  expect(mappedGoals).toEqual([{ role: "Product Manager", company: "Google" }]);

  await page.getByTestId("link-see-gap").click();
  await expect(page).toHaveURL(/\/my-gap$/);
  await expectCurrentStep(page, "My Gap", 3);
  await expect(page.getByTestId("text-gap-progress")).toContainText("0/1");
  await expect(page.getByTestId("checkbox-step-internship")).toContainText("Complete a product internship");
});

test("returns from an unmapped My Gap to Path Finder with the right step active", async ({ page }) => {
  await mockCareerApi(page);

  await page.goto("/my-gap");
  await expectCurrentStep(page, "My Gap", 3);
  await expect(page.getByText("Pick a destination first")).toBeVisible();
  await expect(page.getByTestId("link-path-finder")).toHaveAttribute("href", "/path-finder");

  await page.getByTestId("link-path-finder").click();
  await expect(page).toHaveURL(/\/path-finder$/);
  await expectCurrentStep(page, "Path Finder", 2);
  await expect(page.getByText("No path mapped yet")).toBeVisible();
});
