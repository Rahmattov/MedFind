const activeStatuses = new Set(["Pending", "Confirmed"]);

function appointmentTimeKey(appointment) {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(appointment.date ?? "");
  const time = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,7})?)?$/.exec(appointment.startTime ?? "");
  if (!date || !time) return null;
  const [, year, month, day] = date.map(Number);
  const [, hour, minute, second = 0] = time.map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null;
  return `${date[0]}T${time[1]}:${time[2]}:${time[3] ?? "00"}`;
}

export function groupAppointments(appointments, now = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const nowKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const upcoming = [];
  const history = [];
  for (const appointment of appointments) {
    const key = appointmentTimeKey(appointment);
    const entry = { appointment, key };
    (key && key > nowKey && activeStatuses.has(appointment.status) ? upcoming : history).push(entry);
  }
  const compare = (a, b) => (a.key ?? "").localeCompare(b.key ?? "");
  upcoming.sort(compare);
  history.sort((a, b) => compare(b, a));
  return {
    upcoming: upcoming.map(({ appointment }) => appointment),
    history: history.map(({ appointment }) => appointment),
  };
}
