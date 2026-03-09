/**
 * Procedural ringtone/notification sound generators using Web Audio API.
 * Each generator creates a distinct ~30s looping tone when previewed,
 * but plays a short version for actual notifications.
 */

export type SoundCategory = "chat" | "project" | "alert" | "announcement";

export interface RingtoneOption {
  id: string;
  name: string;
  /** Generates and plays the tone. Returns a stop function. */
  play: (ctx: AudioContext, duration: number) => { stop: () => void };
}

/* ─── helper ─── */
const gain = (ctx: AudioContext, vol: number) => {
  const g = ctx.createGain();
  g.gain.value = vol;
  g.connect(ctx.destination);
  return g;
};

/* ─── Ringtone generators ─── */

const classicChime: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.25);
  osc.type = "sine";
  osc.frequency.value = 880;
  const now = ctx.currentTime;
  const interval = 1.2;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1108, t + 0.15);
    osc.frequency.setValueAtTime(1320, t + 0.3);
    g.gain.setValueAtTime(0.25, t);
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    g.gain.setValueAtTime(0.25, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const softPulse: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.2);
  osc.type = "triangle";
  osc.frequency.value = 523;
  const now = ctx.currentTime;
  const interval = 0.8;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    if (i + 1 < reps) g.gain.setValueAtTime(0.2, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const digitalBeep: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.2);
  osc.type = "square";
  osc.frequency.value = 1200;
  const now = ctx.currentTime;
  const interval = 1.0;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(900, t + 0.1);
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0, t + 0.25);
    if (i + 1 < reps) g.gain.setValueAtTime(0.2, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const mellowBell: RingtoneOption["play"] = (ctx, dur) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = gain(ctx, 0.15);
  osc1.type = "sine";
  osc2.type = "sine";
  osc1.frequency.value = 660;
  osc2.frequency.value = 990;
  const now = ctx.currentTime;
  const interval = 1.5;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    g.gain.setValueAtTime(0.15, t);
    g.gain.linearRampToValueAtTime(0, t + 0.8);
    if (i + 1 < reps) g.gain.setValueAtTime(0.15, t + interval);
  }
  osc1.connect(g);
  osc2.connect(g);
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + dur);
  osc2.stop(now + dur);
  return { stop: () => { try { osc1.stop(); osc2.stop(); } catch {} } };
};

const urgentAlarm: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.2);
  osc.type = "sawtooth";
  const now = ctx.currentTime;
  const interval = 0.5;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1400, t + 0.2);
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0, t + 0.3);
    if (i + 1 < reps) g.gain.setValueAtTime(0.2, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const crystalDrop: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.2);
  osc.type = "sine";
  const now = ctx.currentTime;
  const interval = 1.0;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.5);
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    if (i + 1 < reps) g.gain.setValueAtTime(0.2, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const harmonicRise: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.18);
  osc.type = "sine";
  const now = ctx.currentTime;
  const interval = 1.2;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.3);
    osc.frequency.linearRampToValueAtTime(1320, t + 0.5);
    g.gain.setValueAtTime(0.18, t);
    g.gain.linearRampToValueAtTime(0, t + 0.7);
    if (i + 1 < reps) g.gain.setValueAtTime(0.18, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const bubblePop: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.22);
  osc.type = "sine";
  const now = ctx.currentTime;
  const interval = 0.6;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(600 + (i % 3) * 200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    g.gain.setValueAtTime(0.22, t);
    g.gain.linearRampToValueAtTime(0, t + 0.25);
    if (i + 1 < reps) g.gain.setValueAtTime(0.22, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const windChime: RingtoneOption["play"] = (ctx, dur) => {
  const osc = ctx.createOscillator();
  const g = gain(ctx, 0.15);
  osc.type = "triangle";
  const notes = [1047, 1175, 1319, 1397, 1568];
  const now = ctx.currentTime;
  const interval = 0.7;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc.frequency.setValueAtTime(notes[i % notes.length], t);
    g.gain.setValueAtTime(0.15, t);
    g.gain.linearRampToValueAtTime(0, t + 0.5);
    if (i + 1 < reps) g.gain.setValueAtTime(0.15, t + interval);
  }
  osc.connect(g);
  osc.start(now);
  osc.stop(now + dur);
  return { stop: () => { try { osc.stop(); } catch {} } };
};

const dualTone: RingtoneOption["play"] = (ctx, dur) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = gain(ctx, 0.12);
  osc1.type = "sine";
  osc2.type = "triangle";
  const now = ctx.currentTime;
  const interval = 1.0;
  const reps = Math.ceil(dur / interval);
  for (let i = 0; i < reps; i++) {
    const t = now + i * interval;
    osc1.frequency.setValueAtTime(700, t);
    osc2.frequency.setValueAtTime(1050, t);
    osc1.frequency.setValueAtTime(900, t + 0.2);
    osc2.frequency.setValueAtTime(1350, t + 0.2);
    g.gain.setValueAtTime(0.12, t);
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    if (i + 1 < reps) g.gain.setValueAtTime(0.12, t + interval);
  }
  osc1.connect(g);
  osc2.connect(g);
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + dur);
  osc2.stop(now + dur);
  return { stop: () => { try { osc1.stop(); osc2.stop(); } catch {} } };
};

export const RINGTONES: RingtoneOption[] = [
  { id: "classic-chime", name: "Classic Chime", play: classicChime },
  { id: "soft-pulse", name: "Soft Pulse", play: softPulse },
  { id: "digital-beep", name: "Digital Beep", play: digitalBeep },
  { id: "mellow-bell", name: "Mellow Bell", play: mellowBell },
  { id: "urgent-alarm", name: "Urgent Alarm", play: urgentAlarm },
  { id: "crystal-drop", name: "Crystal Drop", play: crystalDrop },
  { id: "harmonic-rise", name: "Harmonic Rise", play: harmonicRise },
  { id: "bubble-pop", name: "Bubble Pop", play: bubblePop },
  { id: "wind-chime", name: "Wind Chime", play: windChime },
  { id: "dual-tone", name: "Dual Tone", play: dualTone },
];

export const SOUND_CATEGORIES: { key: SoundCategory; label: string; description: string }[] = [
  { key: "chat", label: "Chat Messages", description: "Sound for incoming chat messages" },
  { key: "project", label: "Project Updates", description: "Sound for project status changes" },
  { key: "alert", label: "Alerts", description: "Sound for important alerts and warnings" },
  { key: "announcement", label: "Announcements", description: "Sound for new announcements" },
];

const STORAGE_KEY = "notification-sound-preferences";

export interface SoundPreferences {
  enabled: boolean;
  pushEnabled: boolean;
  sounds: Record<SoundCategory, { ringtoneId: string; enabled: boolean }>;
}

export const DEFAULT_PREFERENCES: SoundPreferences = {
  enabled: true,
  pushEnabled: false,
  sounds: {
    chat: { ringtoneId: "classic-chime", enabled: true },
    project: { ringtoneId: "soft-pulse", enabled: true },
    alert: { ringtoneId: "urgent-alarm", enabled: true },
    announcement: { ringtoneId: "mellow-bell", enabled: true },
  },
};

export const loadSoundPreferences = (): SoundPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const saveSoundPreferences = (prefs: SoundPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};
