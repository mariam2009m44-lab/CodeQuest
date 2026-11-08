const STORAGE_KEY = "cq_notif";
const TIME_KEY = "cq_reminder_time";
const SENT_PREFIX = "cq_reminder_sent_";

let reminderTimer = null;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function deliverReminder() {
  const title = "موعد رحلة التعلم مع كودي!";
  const options = {
    body: "خصص بضع دقائق اليوم لتكمل درسًا جديدًا في البرمجة.",
    icon: "./cody-avatar.svg",
    badge: "./cody-avatar.svg",
    tag: "cody-daily-learning-reminder",
    renotify: false,
    data: { url: "./dashboard.html" }
  };

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch (error) {
    console.warn("Cody reminder could not be displayed:", error);
  }
}

function scheduleReminder() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }

  if (
    localStorage.getItem(STORAGE_KEY) !== "on" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) return;

  const rawTime = localStorage.getItem(TIME_KEY) || "18:00";
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(rawTime);
  const [hour, minute] = (match ? rawTime : "18:00").split(":").map(Number);

  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next <= now) next.setDate(next.getDate() + 1);

  reminderTimer = window.setTimeout(async () => {
    const key = SENT_PREFIX + localDateKey();
    if (localStorage.getItem(key) !== "yes") {
      await deliverReminder();
      localStorage.setItem(key, "yes");
    }
    scheduleReminder();
  }, Math.max(1000, next.getTime() - now.getTime()));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleReminder, { once: true });
} else {
  scheduleReminder();
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleReminder();
});

window.addEventListener("pagehide", () => {
  if (reminderTimer) clearTimeout(reminderTimer);
});
