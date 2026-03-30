import { describe, expect, it, vi, afterEach } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("promptInitSkillProfile()", () => {
  it("shows mobile-testing as the canonical mobile profile label", async () => {
    const select = vi.fn(async ({ choices }) => choices[2]?.value);
    vi.doMock("@inquirer/prompts", () => ({
      checkbox: vi.fn(),
      confirm: vi.fn(),
      password: vi.fn(),
      select,
    }));

    const { promptInitSkillProfile } = await import("./prompts.js");
    await promptInitSkillProfile("mobile-testing");

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: expect.arrayContaining([
          expect.objectContaining({
            name: "mobile-testing",
            value: "mobile-testing",
          }),
        ]),
      }),
    );
  });
});
