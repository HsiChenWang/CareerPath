import { expect, test, type Page } from "@playwright/test";

type Role = "student" | "alumni";

type Person = {
  id: string;
  name: string;
  role: Role;
  school?: string;
  major?: string;
  level?: string;
  year?: string;
  gradYear?: number;
  currentRole?: string;
  clubs: string[];
  skills: string[];
  interests: string[];
  experience: string[];
  courses: string[];
  timeline: unknown[];
};

const makePerson = (role: Role, complete: boolean): Person => ({
  id: `${role}-${complete ? "complete" : "incomplete"}`,
  name: "Taylor Trojan",
  role,
  school: complete ? "Viterbi" : "Other",
  major: complete ? "Computer Science" : "",
  ...(role === "student"
    ? { level: "Undergrad", year: complete ? "Sophomore" : "" }
    : { currentRole: complete ? "Product Manager" : "" }),
  clubs: [],
  skills: [],
  interests: [],
  experience: [],
  courses: [],
  timeline: [],
});

async function mockRoutingApi(
  page: Page,
  options: { sessionUser?: Person | null; loginUser?: Person } = {},
) {
  let savedUser = options.sessionUser ?? options.loginUser ?? null;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/auth/me") {
      await route.fulfill({ json: { user: options.sessionUser ?? null } });
      return;
    }
    if (url.pathname === "/api/healthz") {
      await route.fulfill({ json: { status: "ok" } });
      return;
    }
    if (url.pathname === "/api/auth/login" && request.method() === "POST") {
      savedUser = options.loginUser ?? makePerson("student", false);
      await route.fulfill({ json: { user: savedUser } });
      return;
    }
    if (url.pathname === "/api/auth/register" && request.method() === "POST") {
      const { role, name } = request.postDataJSON() as { role: Role; name: string };
      savedUser = { ...makePerson(role, false), name };
      await route.fulfill({ json: { user: savedUser } });
      return;
    }
    if (url.pathname === "/api/profile" && request.method() === "PATCH") {
      const data = request.postDataJSON() as Partial<Person>;
      savedUser = { ...savedUser!, ...data };
      await route.fulfill({ json: savedUser });
      return;
    }

    await route.fulfill({
      status: 404,
      json: { error: `Unexpected API request: ${request.method()} ${url.pathname}` },
    });
  });
}

for (const role of ["student", "alumni"] as const) {
  for (const complete of [false, true]) {
    test(`login routes ${complete ? "complete" : "incomplete"} ${role} profiles correctly`, async ({ page }) => {
      await mockRoutingApi(page, { loginUser: makePerson(role, complete) });

      await page.goto("/login");
      await page.getByTestId("input-email").fill("taylor@example.com");
      await page.getByTestId("input-password").fill("password123");
      await page.getByTestId("button-login").click();

      const destination = complete
        ? role === "alumni" ? "/requests" : "/career-workflow"
        : "/profile?welcome=1";
      await expect(page).toHaveURL(new RegExp(`${destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      if (!complete) {
        await expect(page.getByTestId("button-save-profile")).toHaveText("Save and continue");
      }
    });
  }
}

for (const role of ["student", "alumni"] as const) {
  test(`registration sends new ${role} accounts to profile setup`, async ({ page }) => {
    await mockRoutingApi(page);

    await page.goto("/register");
    if (role === "alumni") await page.getByTestId("button-role-alumni").click();
    await page.getByTestId("input-name").fill("Taylor Trojan");
    await page.getByTestId("input-email").fill(`${role}@example.com`);
    await page.getByTestId("input-password").fill("password123");
    await page.getByTestId("button-register").click();

    await expect(page).toHaveURL(/\/profile\?welcome=1$/);
    await expect(page.getByTestId("button-save-profile")).toHaveText("Save and continue");
    await expect(page.getByTestId(role === "alumni" ? "input-current-role" : "select-level")).toBeVisible();
      if (role === "student") {
        await expect(page.getByRole("heading", { name: "Do you know what career you want?" })).toHaveCount(0);
        await expect(page.getByTestId("button-knows-yes")).toHaveCount(0);
      }
  });
}

for (const role of ["student", "alumni"] as const) {
  for (const complete of [false, true]) {
    test(`direct ${role} route ${complete ? "admits" : "redirects"} the ${complete ? "complete" : "incomplete"} profile`, async ({ page }) => {
      await mockRoutingApi(page, { sessionUser: makePerson(role, complete) });
      const protectedRoute = role === "alumni" ? "/requests" : "/explore";

      await page.goto(protectedRoute);

      if (complete) {
        await expect(page).toHaveURL(new RegExp(`${protectedRoute}$`));
      } else {
        await expect(page).toHaveURL(/\/profile\?welcome=1$/);
        await expect(page.getByTestId("button-save-profile")).toHaveText("Save and continue");
      }
    });
  }
}

for (const role of ["student", "alumni"] as const) {
  test(`saving a complete ${role} first profile opens its destination`, async ({ page }) => {
    await mockRoutingApi(page);
    await page.goto("/register");
    if (role === "alumni") await page.getByTestId("button-role-alumni").click();
    await page.getByTestId("input-name").fill("Taylor Trojan");
    await page.getByTestId("input-email").fill(`${role}-save@example.com`);
    await page.getByTestId("input-password").fill("password123");
    await page.getByTestId("button-register").click();

    await expect(page).toHaveURL(/\/profile\?welcome=1$/);
    const school = page.getByTestId("select-school");
    await school.click();
    await page.getByRole("option", { name: "Viterbi" }).click();
    await page.getByTestId("input-major").fill("Computer Science");
    if (role === "alumni") {
      await page.getByTestId("input-current-role").fill("Product Manager");
    } else {
      await page.getByTestId("input-year").fill("Sophomore");
    }
    await page.getByTestId("button-save-profile").click();

    await expect(page).toHaveURL(role === "alumni" ? /\/requests$/ : /\/explore$/);
  });
}
