import { useEffect, useState } from "react";

/** Returns the current epoch minute, ticking once a minute. Cheap
 *  way to force consumers to re-render at minute granularity — used
 *  for time-windowed UI like the 30-min edit/delete affordance,
 *  where the gate must close even when nothing else changes. */
export function useMinuteTick(): number {
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60_000));
  useEffect(() => {
    const id = setInterval(() => setMinute(Math.floor(Date.now() / 60_000)), 60_000);
    return () => clearInterval(id);
  }, []);
  return minute;
}
