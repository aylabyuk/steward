import { initializeApp } from "firebase-admin/app";

initializeApp();

// Function exports land in subsequent Phase 12 tasks:
//   onCommentCreate     -> mention notifications (12.2)
//   onMeetingWrite      -> change notifications + 60s debounce (12.3)
//   scheduledNudges     -> hourly finalization nudges (12.4)
