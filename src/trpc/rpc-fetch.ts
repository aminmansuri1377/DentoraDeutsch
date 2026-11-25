/**
 * Surface a stalled read as a recoverable error. Never abort mutations on a
 * client timer: their writes may already be committed on the server.
 */
export const rpcFetch: typeof fetch = async (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const controller = method === "GET" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 25000) : null;
  const signal = controller
    ? init?.signal
      ? AbortSignal.any([init.signal, controller.signal])
      : controller.signal
    : init?.signal;

  try {
    const response = await fetch(input, { ...init, signal, cache: "no-store" });
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
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error("Die Anfrage hat zu lange gedauert. Bitte erneut versuchen.");
    }
    throw error;
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
};
