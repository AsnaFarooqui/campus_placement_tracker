import API from "../lib/api";

export const applyToJob = async (jobId) => {
  const response = await API.post("/applications", { jobId });
  return response.data;
};