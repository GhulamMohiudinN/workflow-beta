import api from "./axios";

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return { success: true, ...response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Something went wrong",
      status: error.response?.status,
    };
  }
};

export const contractAPI = {
  // Sent as multipart when a document is attached, plain JSON otherwise.
  create: (payload, file) => {
    if (!file) return unwrap(api.post("/contracts", payload));
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => form.append(key, value ?? ""));
    form.append("document", file);
    // Left for the browser to set, so the multipart boundary is included.
    return unwrap(api.post("/contracts", form, { headers: { "Content-Type": undefined } }));
  },
  list:        () => unwrap(api.get("/contracts")),
  get:         (id) => unwrap(api.get(`/contracts/${id}`)),
  remove:      (id) => unwrap(api.delete(`/contracts/${id}`)),
  // Fresh, short-lived links to the attached document.
  documentLinks: (id) => unwrap(api.get(`/contracts/${id}/document`)),

  // Public — no auth token needed, the link's token is the authorization
  getPublic:   (token) => unwrap(api.get(`/contracts/public/${token}`)),
  publicDocumentLinks: (token) => unwrap(api.get(`/contracts/public/${token}/document`)),
  sign:        (token, payload) => unwrap(api.post(`/contracts/public/${token}/sign`, payload)),
};

/**
 * Opens or downloads a contract document from a links-fetching call.
 * The tab is opened before the request, while the click still counts as user
 * action — one opened after an await is blocked as a pop-up.
 */
export async function openContractDocument(fetchLinks, mode = "view") {
  const tab = mode === "view" ? window.open("", "_blank") : null;
  if (tab) tab.document.title = "Opening…";

  const res = await fetchLinks();
  const links = res.links;
  if (!res.success || !links) {
    if (tab) tab.close();
    return { ok: false, error: res.error || "Could not open the document" };
  }

  let href = mode === "view" ? links.viewUrl : links.downloadUrl;
  if (links.dataUrl) {
    const [meta, base64] = links.dataUrl.split(",");
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    href = URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  if (tab) {
    tab.opener = null;
    tab.location.href = href;
  } else {
    const a = document.createElement("a");
    a.href = href;
    a.download = links.fileName || "document";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  return { ok: true };
}

export default contractAPI;
