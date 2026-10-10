import { config } from "@/config/app.config";

// True when the time falls outside front-desk hours, in IST.
export function isOutsideHours(d: Date): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: config.hours.timeZone,
    }).format(d),
  );
  return hour < config.hours.startHour || hour >= config.hours.endHour;
}
