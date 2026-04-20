import { initializeApp } from "firebase-admin/app";

initializeApp();

export { onCommentCreate } from "./onCommentCreate.js";
export { onMeetingWrite } from "./onMeetingWrite.js";
export { drainNotificationQueue } from "./drainNotificationQueue.js";

// Function exports landing in the next Phase 12 task:
//   scheduledNudges     -> hourly finalization nudges (12.4)
