import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/api/firebase';
import { DEFAULT_HABITS, DEFAULT_PROFILE, createDefaultDay, mergeDayWithDefaults } from '@/lib/mocks';
import { getTodayDateKey } from '@/lib/dateUtils';

const PROFILE_COLLECTION = 'profile';
const PROFILE_DOCUMENT_ID = 'app';
const DAYS_COLLECTION = 'days';
const RECENT_DAYS_LIMIT = 40;

function resetHabitsCompletion(habits) {
  return habits.map((habit) => ({ ...habit, done: false }));
}

function buildNextProfile(profileSnapshot, daySnapshot, todayDateKey) {
  const profileData = profileSnapshot.data();
  const profileHasHabits = Array.isArray(profileData?.habits);
  const baseProfile = profileSnapshot.exists() ? { ...DEFAULT_PROFILE, ...profileData } : DEFAULT_PROFILE;
  const migratedHabits = profileHasHabits ? profileData.habits : daySnapshot.data()?.habits ?? DEFAULT_HABITS;
  const isNewDay = profileData?.activeDate !== todayDateKey;
  const nextHabits = isNewDay ? resetHabitsCompletion(migratedHabits) : migratedHabits;

  return {
    nextProfile: {
      ...baseProfile,
      activeDate: todayDateKey,
      habits: nextHabits,
      updatedAt: new Date().toISOString(),
    },
    todayDateKey,
    profileHasHabits,
    previousActiveDate: profileData?.activeDate,
  };
}

export async function loadDashboardData() {
  const profileRef = doc(db, PROFILE_COLLECTION, PROFILE_DOCUMENT_ID);
  const profileSnapshot = await getDoc(profileRef);
  const profileData = profileSnapshot.data();
  const baseProfile = profileSnapshot.exists() ? { ...DEFAULT_PROFILE, ...profileData } : DEFAULT_PROFILE;
  const todayDateKey = getTodayDateKey(baseProfile.timezone || DEFAULT_PROFILE.timezone);

  const dayRef = doc(db, DAYS_COLLECTION, todayDateKey);
  const daySnapshot = await getDoc(dayRef);
  const { nextProfile, profileHasHabits, previousActiveDate } = buildNextProfile(profileSnapshot, daySnapshot, todayDateKey);
  const nextDay = daySnapshot.exists()
    ? mergeDayWithDefaults(daySnapshot.data(), todayDateKey)
    : createDefaultDay(todayDateKey);

  if (!profileSnapshot.exists() || previousActiveDate !== todayDateKey || !profileHasHabits) {
    await setDoc(profileRef, nextProfile, { merge: true });
  }

  if (!daySnapshot.exists()) {
    await setDoc(dayRef, nextDay);
  }

  const recentDaysQuery = query(
    collection(db, DAYS_COLLECTION),
    where('date', '<=', todayDateKey),
    orderBy('date', 'desc'),
    limit(RECENT_DAYS_LIMIT),
  );
  const recentDaysSnapshot = await getDocs(recentDaysQuery);

  const daysByDate = {};
  recentDaysSnapshot.forEach((snapshot) => {
    const snapshotDateKey = snapshot.data().date || snapshot.id;
    daysByDate[snapshotDateKey] = mergeDayWithDefaults(snapshot.data(), snapshotDateKey);
  });
  daysByDate[todayDateKey] = nextDay;

  return {
    profile: nextProfile,
    dateKey: todayDateKey,
    dayData: nextDay,
    daysByDate,
  };
}

export async function saveProfilePatch(patch, updatedAt = new Date().toISOString()) {
  await setDoc(doc(db, PROFILE_COLLECTION, PROFILE_DOCUMENT_ID), { ...patch, updatedAt }, { merge: true });
  return updatedAt;
}

export async function saveDayPatch(targetDateKey, patch, updatedAt = new Date().toISOString()) {
  await setDoc(doc(db, DAYS_COLLECTION, targetDateKey), { date: targetDateKey, ...patch, updatedAt }, { merge: true });
  return updatedAt;
}
