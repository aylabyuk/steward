import { initializeApp } from "firebase-admin/app";

initializeApp();

export { onCommentCreate } from "./onCommentCreate.js";

// Function exports landing in subsequent Phase 12 tasks:
//   onMeetingWrite      -> change notifications + 60s debounce (12.3)
//   scheduledNudges     -> hourly finalization nudges (12.4)
