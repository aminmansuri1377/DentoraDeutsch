/** Preserve tRPC JSON errors, but give an actionable message for proxy/CSRF HTML or text errors. */
export const rpcFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  if (!response.ok && !isJson) {
    if (response.status === 403)
      throw new Error(
        "Die Anfrage wurde blockiert. Bitte lade die Seite neu. Falls der Fehler bleibt, muss die Website-Adresse in der Serverkonfiguration geprüft werden.",
      );
    throw new Error(
      `Der Server ist gerade nicht erreichbar (HTTP ${response.status}). Bitte versuche es erneut.`,
    );
  }
  return response;
};
