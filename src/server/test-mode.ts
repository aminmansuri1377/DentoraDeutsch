/** Deliberately insecure sign-in is restricted to explicitly enabled test installations. */
export function testModeEnabled() {
  return (
    process.env.ENABLE_DEMO_AUTH === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.ENABLE_DEMO_AUTH !== "false")
  );
}
