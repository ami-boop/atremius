import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc, terminate } from "firebase/firestore";
import { createDefaultDay } from "../src/lib/mocks.js";
import { addDaysToDateKey, getTodayDateKey } from "../src/lib/dateUtils.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfcMZszpQ5t20_A9-_fRHQqfZoDV8h8bs",
  authDomain: "atremius-52747.firebaseapp.com",
  projectId: "atremius-52747",
  storageBucket: "atremius-52747.firebasestorage.app",
  messagingSenderId: "20345068852",
  appId: "1:20345068852:web:f2d610d6b2818f16b65961",
};

const historyPresets = [
  { offset: -6, mode: "СТАБИЛЬНО", vitality: { sleep: 6, stress: 5, focus: 4, activity: 80, social: 5 } },
  { offset: -5, mode: "ВЫСОКАЯ ПРОДУКТИВНОСТЬ", vitality: { sleep: 8, stress: 4, focus: 7, activity: 140, social: 7 } },
  { offset: -4, mode: "СТАБИЛЬНО", vitality: { sleep: 7, stress: 6, focus: 6, activity: 95, social: 6 } },
  { offset: -3, mode: "ВЫСОКАЯ ПРОДУКТИВНОСТЬ", vitality: { sleep: 8, stress: 3, focus: 9, activity: 180, social: 8 } },
  { offset: -2, mode: "СТАБИЛЬНО", vitality: { sleep: 7, stress: 5, focus: 7, activity: 120, social: 6 } },
  { offset: -1, mode: "ВОССТАНОВЛЕНИЕ", vitality: { sleep: 5, stress: 7, focus: 3, activity: 40, social: 4 } },
];

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const todayDateKey = getTodayDateKey("Europe/Saratov");

  for (const preset of historyPresets) {
    const dateKey = addDaysToDateKey(todayDateKey, preset.offset);
    const baseDay = createDefaultDay(dateKey);
    const seededDay = {
      ...baseDay,
      date: dateKey,
      mode: preset.mode,
      vitality: {
        ...baseDay.vitality,
        ...preset.vitality,
      },
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "days", dateKey), seededDay, { merge: true });
    console.log(`Wrote days/${dateKey}`);
  }

  await terminate(db);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
