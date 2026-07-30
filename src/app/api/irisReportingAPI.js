import api from "./axios";

// ── Helper: wrap every call in a normalised { success, data?, error? } shape ──
async function call(fn) {
  try {
    const response = await fn();
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Request failed",
      status: error.response?.status,
    };
  }
}

export const irisReportingAPI = {
  // ── Overview & Report Pack ───────────────────────────────────────────────
  getOverview:   () => call(() => api.get("/iris-reporting/overview")),
  getReportPack: () => call(() => api.get("/iris-reporting/report-pack")),

  // ── Obligation CRUD ──────────────────────────────────────────────────────
  createRequirement: async (payload) => {
    const res = await call(() => api.post("/iris-reporting/requirements", payload));
    if (res.success) res.requirementId = res.data?.requirement?._id || null;
    return res;
  },

  updateRequirement: async (requirementId, payload) => {
    const res = await call(() =>
      api.patch(`/iris-reporting/requirements/${requirementId}`, payload)
    );
    if (res.success) res.requirementId = res.data?.requirement?._id || requirementId;
    return res;
  },

  deleteRequirement: (requirementId) =>
    call(() => api.delete(`/iris-reporting/requirements/${requirementId}`)),

  // ── Approval workflow ────────────────────────────────────────────────────
  /**
   * @param {string} requirementId
   * @param {string} stepId
   * @param {"approved"|"rejected"} decision
   * @param {string} notes
   */
  decideApprovalStep: (requirementId, stepId, decision, notes = "") =>
    call(() =>
      api.patch(
        `/iris-reporting/requirements/${requirementId}/steps/${stepId}/decision`,
        { decision, notes }
      )
    ),

  // ── Comments ─────────────────────────────────────────────────────────────
  addComment: (requirementId, text) =>
    call(() =>
      api.post(`/iris-reporting/requirements/${requirementId}/comments`, { text })
    ),

  deleteComment: (requirementId, commentId) =>
    call(() =>
      api.delete(`/iris-reporting/requirements/${requirementId}/comments/${commentId}`)
    ),

  // ── Evidence Files ────────────────────────────────────────────────────────
  uploadEvidenceFile: async (requirementId, file) => {
    // Read the file into an ArrayBuffer first — this detaches it from the
    // input element so resetting the input cannot cancel the in-flight request.
    const arrayBuffer = await file.arrayBuffer();
    const blob        = new Blob([arrayBuffer], { type: file.type });
    const safeFile    = new File([blob], file.name, { type: file.type });

    const formData = new FormData();
    formData.append("file", safeFile);

    return call(() =>
      api.post(`/iris-reporting/requirements/${requirementId}/files`, formData, {
        // Let the browser/axios set Content-Type with the correct multipart boundary.
        // Setting it to undefined (not deleting) ensures axios handles it correctly.
        headers: { "Content-Type": undefined },
      })
    );
  },

  downloadEvidenceFile: async (requirementId, fileId) => {
    const res = await call(() =>
      api.get(`/iris-reporting/requirements/${requirementId}/files/${fileId}`)
    );
    if (res.success) {
      const url = res.data?.file?.url;
      if (url) window.open(url, "_blank");
      else return { success: false, error: "File URL not found" };
    }
    return res;
  },

  deleteEvidenceFile: (requirementId, fileId) =>
    call(() =>
      api.delete(`/iris-reporting/requirements/${requirementId}/files/${fileId}`)
    ),
};
