import { Outlet } from "react-router";
import { useNavDirection } from "@/app/hooks/useNavDirection";

/** Layout for routes that live "on top of" Schedule as full-screen
 *  modals — Profile, Notifications, Ward settings, Templates. No
 *  Topbar, no AppShell chrome. Each page renders its own `<AppBar>`
 *  for navigation + title + description.
 *
 *  Centered content columns are owned by the page bodies (not the
 *  layout) so the sticky AppBar can span the viewport width while
 *  the content stays gutter-aligned.
 *
 *  Reuses the `.shell-content` view-transition slot so the slide
 *  animation is continuous with the rest of the stack: opening a
 *  modal slides in from the right; dismissing back to /schedule
 *  slides out to the right (driven by the wrapped Link/useNavigate
 *  in `@/lib/nav`). */
export function ModalPage() {
  useNavDirection();
  return (
    <div className="shell-content flex flex-col min-h-dvh sm:h-dvh sm:overflow-hidden">
      <div className="flex flex-1 flex-col sm:overflow-y-auto sm:overflow-x-clip">
        <Outlet />
      </div>
    </div>
  );
}
