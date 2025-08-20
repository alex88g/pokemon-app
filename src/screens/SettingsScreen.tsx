// src/screens/SettingsScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Linking, Alert, Platform, View } from 'react-native';
import {
  Text,
  Button,
  Card,
  List,
  Divider,
  Switch,
  Portal,
  Modal,
  TextInput,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemeContext } from '@/theme/ThemeContext';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelAllReminders,
  sendTestNotification,
  registerForPushNotifications,
  sendExpoTestPush,
} from '@/lib/notifications';
import { useGlobalSplash } from '@/context/GlobalSplashContext';
import { subscribe, updateTime, unsubscribe } from '@/lib/pushApi'; // ✅ använder wrappers

const STORAGE_NOTIF_ENABLED = 'settings.notificationsEnabled';
const STORAGE_NOTIF_TIME = 'settings.notificationsTime'; // "HH:MM"
const STORAGE_EXPO_PUSH_TOKEN = 'settings.expoPushToken';

const isWeb = Platform.OS === 'web';

function makeDefaultTime() {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d;
}
function parseHHMM(v: string | null): Date {
  const d = new Date();
  if (!v) return makeDefaultTime();
  const [h, m] = v.split(':').map((n) => Number(n));
  if (Number.isFinite(h) && Number.isFinite(m)) {
    d.setHours(h, m, 0, 0);
    return d;
  }
  return makeDefaultTime();
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---- Platform-safe helpers (laddas bara på respektive plattform) ----
function showAndroidToast(message: string) {
  if (Platform.OS === 'android') {
    const { ToastAndroid } = require('react-native');
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}
function showIOSActionSheet(opts: {
  title?: string;
  options: string[];
  destructiveButtonIndex?: number;
  cancelButtonIndex?: number;
  onSelect: (index: number) => void;
}) {
  if (Platform.OS === 'ios') {
    const { ActionSheetIOS } = require('react-native');
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: opts.title,
        options: opts.options,
        destructiveButtonIndex: opts.destructiveButtonIndex,
        cancelButtonIndex: opts.cancelButtonIndex,
      },
      opts.onSelect,
    );
  }
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { setBusy } = useGlobalSplash();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifHydrated, setNotifHydrated] = useState(false);

  const [notifTime, setNotifTime] = useState<Date>(makeDefaultTime());
  const [timeHydrated, setTimeHydrated] = useState(false);

  // web push token
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // modaler / pickers
  const [timeModalVisible, setTimeModalVisible] = useState(false); // iOS
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false); // Android
  const [webTimeModalVisible, setWebTimeModalVisible] = useState(false); // Web
  const [infoVisible, setInfoVisible] = useState(false); // info-modal

  // web-modal inputs
  const [webHour, setWebHour] = useState('18');
  const [webMinute, setWebMinute] = useState('00');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true, 'Laddar inställningar...');
      try {
        const [enabled, time, savedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_NOTIF_ENABLED),
          AsyncStorage.getItem(STORAGE_NOTIF_TIME),
          AsyncStorage.getItem(STORAGE_EXPO_PUSH_TOKEN),
        ]);
        if (!cancelled) {
          if (enabled != null) setNotificationsEnabled(enabled === 'true');
          const t = parseHHMM(time);
          setNotifTime(t);
          setWebHour(String(t.getHours()).padStart(2, '0'));
          setWebMinute(String(t.getMinutes()).padStart(2, '0'));
          if (savedToken) setExpoPushToken(savedToken);
        }
      } finally {
        if (!cancelled) {
          setNotifHydrated(true);
          setTimeHydrated(true);
          setBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setBusy]);

  async function enableNotifications(hour: number, minute: number) {
    if (isWeb) {
      // Web: registrera push + be om rättigheter + hämta token
      setBusy(true, 'Aktiverar web push...');
      try {
        const token = await registerForPushNotifications();
        if (token) {
          setExpoPushToken(token);
          await AsyncStorage.setItem(STORAGE_EXPO_PUSH_TOKEN, token);

          // ⬇️ Skicka till backend för serverstyrd daglig push
          try {
            await subscribe(token, hour, minute, Intl.DateTimeFormat().resolvedOptions().timeZone);
          } catch (e) {
            console.warn('subscribe failed', e);
          }

          Alert.alert('Aktiverat', 'Web push är aktiverat. Dagliga påminnelser skickas via push.');
        } else {
          Alert.alert(
            'Behörighet saknas',
            'Webbläsaren blockerade notiser. Tillåt notiser i webbläsarens inställningar och försök igen.',
          );
        }

        setNotificationsEnabled(true);
        await AsyncStorage.multiSet([
          [STORAGE_NOTIF_ENABLED, 'true'],
          [
            STORAGE_NOTIF_TIME,
            `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          ],
        ]);
      } finally {
        setBusy(false);
      }
      return;
    }

    // ----- native (iOS/Android) -----
    setBusy(true, 'Aktiverar aviseringar...');
    try {
      const ok = await requestNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Aviseringar avstängda',
          'Behörighet nekades. Du kan ändra detta i systeminställningarna.',
        );
        setNotificationsEnabled(false);
        await AsyncStorage.setItem(STORAGE_NOTIF_ENABLED, 'false');
        return;
      }
      await cancelAllReminders();
      await scheduleDailyReminder(hour, minute);
      setNotificationsEnabled(true);
      await AsyncStorage.multiSet([
        [STORAGE_NOTIF_ENABLED, 'true'],
        [STORAGE_NOTIF_TIME, `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`],
      ]);
      Alert.alert(
        'Klart',
        `Daglig påminnelse är aktiverad (${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}).`,
      );
      showAndroidToast('Daglig påminnelse aktiverad');
    } finally {
      setBusy(false);
    }
  }

  async function disableNotifications() {
    if (isWeb) {
      // ⬇️ Avregistrera i backend (om token finns)
      if (expoPushToken) {
        try {
          await unsubscribe(expoPushToken);
        } catch (e) {
          console.warn('unsubscribe failed', e);
        }
      }

      setNotificationsEnabled(false);
      await AsyncStorage.setItem(STORAGE_NOTIF_ENABLED, 'false');
      Alert.alert('Aviseringar av', 'Web push är avstängt.');
      return;
    }

    setBusy(true, 'Stänger av aviseringar...');
    try {
      await cancelAllReminders();
      setNotificationsEnabled(false);
      await AsyncStorage.setItem(STORAGE_NOTIF_ENABLED, 'false');
      Alert.alert('Aviseringar av', 'Du får inte längre dagliga påminnelser.');
    } finally {
      setBusy(false);
    }
  }

  const onToggleNotifications = async (v: boolean) => {
    const h = notifTime.getHours();
    const m = notifTime.getMinutes();
    if (v) await enableNotifications(h, m);
    else await disableNotifications();
  };

  async function saveTimeAndMaybeReschedule(newDate: Date) {
    setBusy(true, 'Uppdaterar påminnelsetid...');
    try {
      setNotifTime(newDate);
      const h = newDate.getHours();
      const m = newDate.getMinutes();
      await AsyncStorage.setItem(
        STORAGE_NOTIF_TIME,
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      );

      if (!isWeb && notificationsEnabled) {
        await cancelAllReminders();
        await scheduleDailyReminder(h, m);
        Alert.alert('Uppdaterat', `Påminnelsetid ändrad till ${fmtTime(newDate)}.`);
      }

      // web: uppdatera inputs + meddela backend om ny tid
      setWebHour(String(h).padStart(2, '0'));
      setWebMinute(String(m).padStart(2, '0'));

      if (isWeb && notificationsEnabled && expoPushToken) {
        try {
          await updateTime(expoPushToken, h, m, Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch (e) {
          console.warn('update-time failed', e);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const onAndroidTimeChange = async (e: DateTimePickerEvent, date?: Date) => {
    setAndroidPickerOpen(false);
    if (e.type === 'set' && date) {
      await saveTimeAndMaybeReschedule(date);
    }
  };

  const openTimePicker = () => {
    if (Platform.OS === 'android') setAndroidPickerOpen(true);
    else if (Platform.OS === 'ios') setTimeModalVisible(true);
    else setWebTimeModalVisible(true); // web
  };

  const sendFeedback = () => {
    Linking.openURL(
      'mailto:support@dittappnamn.com?subject=Feedback&body=Hej, jag vill lämna feedback...',
    );
  };

  const clearAppData = async () => {
    setBusy(true, 'Rensar appdata...');
    try {
      await AsyncStorage.clear();
      if (!isWeb) await cancelAllReminders();
      setNotificationsEnabled(false);
      setExpoPushToken(null);
      Alert.alert('Klart', 'All sparad data har rensats.');
      showAndroidToast('Appdata rensad');
    } catch {
      Alert.alert('Fel', 'Kunde inte rensa data.');
    } finally {
      setBusy(false);
    }
  };

  async function confirmClear() {
    if (Platform.OS === 'ios') {
      showIOSActionSheet({
        title: 'Rensa appdata?',
        options: ['Avbryt', 'Rensa'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
        onSelect: async (idx) => {
          if (idx === 1) await clearAppData();
        },
      });
    } else {
      Alert.alert('Rensa appdata', 'Är du säker?', [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Rensa', style: 'destructive', onPress: clearAppData },
      ]);
    }
  }

  // --- Responsiv container: centrerad och maxbreddad på web/desktop ---
  const contentMax = 720;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.centerWrap, { maxWidth: contentMax }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Inställningar
        </Text>

        <Card mode="elevated" style={styles.card}>
          <Card.Content style={{ paddingVertical: 0 }}>
            <List.Item
              title="Mörkt läge"
              description="Växla mellan mörkt och ljust tema"
              left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
              right={() => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
            />
            <Divider />
            <List.Item
              title="Aktivera aviseringar"
              description={`Daglig påminnelse ${timeHydrated ? fmtTime(notifTime) : ''}`}
              left={(p) => <List.Icon {...p} icon="bell-outline" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={onToggleNotifications}
                  disabled={!notifHydrated || !timeHydrated}
                />
              )}
            />
            <List.Item
              title="Tid för daglig påminnelse"
              description={timeHydrated ? fmtTime(notifTime) : ''}
              left={(p) => <List.Icon {...p} icon="clock-outline" />}
              onPress={openTimePicker}
            />
            <Divider />
            <List.Item
              title="Visa modal"
              description="Öppna en modal med information"
              left={(p) => <List.Icon {...p} icon="information-outline" />}
              onPress={() => setInfoVisible(true)}
            />
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={sendFeedback}
              style={{ marginBottom: 8 }}
              icon="email-outline"
            >
              Skicka feedback
            </Button>
            <Button
              mode="contained"
              onPress={confirmClear}
              buttonColor={theme.colors.error}
              icon="trash-can-outline"
            >
              Rensa appdata
            </Button>

            {/* Native – lokal testnotis */}
            {notificationsEnabled && !isWeb && (
              <Button
                mode="contained-tonal"
                style={{ marginTop: 8 }}
                icon="bell-ring-outline"
                onPress={sendTestNotification}
              >
                Skicka testavisering
              </Button>
            )}

            {/* Web – push-test via Expo Push direkt */}
            {isWeb && notificationsEnabled && (
              <Button
                mode="contained-tonal"
                style={{ marginTop: 8 }}
                icon="bell-ring-outline"
                onPress={async () => {
                  let token = expoPushToken;
                  if (!token) {
                    token = await registerForPushNotifications();
                    if (token) {
                      setExpoPushToken(token);
                      await AsyncStorage.setItem(STORAGE_EXPO_PUSH_TOKEN, token);
                    }
                  }
                  if (token) {
                    await sendExpoTestPush(token);
                    Alert.alert('Skickat', 'Testpush skickad via Expo Push.');
                  } else {
                    Alert.alert(
                      'Saknar token',
                      'Kunde inte få en push-token (web). Tillåt notiser och prova igen.',
                    );
                  }
                }}
              >
                Skicka testavisering (web push)
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* iOS – tid-modal */}
      <Portal>
        <Modal
          visible={Platform.OS === 'ios' ? timeModalVisible : false}
          onDismiss={() => setTimeModalVisible(false)}
          contentContainerStyle={[
            styles.modalCard,
            { backgroundColor: theme.colors.surface, borderRadius: theme.roundness + 8 },
          ]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 8 }}>
            Välj tid
          </Text>
          <DateTimePicker
            mode="time"
            display="spinner"
            value={notifTime}
            onChange={(_, date) => date && setNotifTime(date)}
          />
          <Button
            mode="contained"
            style={{ marginTop: 12 }}
            onPress={async () => {
              await saveTimeAndMaybeReschedule(notifTime);
              setTimeModalVisible(false);
            }}
          >
            Spara
          </Button>
          <Button onPress={() => setTimeModalVisible(false)} style={{ marginTop: 6 }}>
            Avbryt
          </Button>
        </Modal>
      </Portal>

      {/* Android – system dialog */}
      {androidPickerOpen && Platform.OS === 'android' && (
        <DateTimePicker mode="time" value={notifTime} onChange={onAndroidTimeChange} />
      )}

      {/* Web – enkel tidväljare */}
      <Portal>
        <Modal
          visible={isWeb && webTimeModalVisible}
          onDismiss={() => setWebTimeModalVisible(false)}
          contentContainerStyle={[
            styles.modalCard,
            { backgroundColor: theme.colors.surface, borderRadius: theme.roundness + 8 },
          ]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 8 }}>
            Välj tid
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TextInput
              label="Timme"
              value={webHour}
              onChangeText={(t) => setWebHour(t.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              style={{ flex: 1 }}
            />
            <TextInput
              label="Minut"
              value={webMinute}
              onChangeText={(t) => setWebMinute(t.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              style={{ flex: 1 }}
            />
          </View>
          <Button
            mode="contained"
            style={{ marginTop: 12 }}
            onPress={async () => {
              const h = Math.min(23, Math.max(0, Number(webHour || 0)));
              const m = Math.min(59, Math.max(0, Number(webMinute || 0)));
              const d = new Date(notifTime);
              d.setHours(h, m, 0, 0);
              await saveTimeAndMaybeReschedule(d);
              setWebTimeModalVisible(false);
            }}
          >
            Spara
          </Button>
          <Button onPress={() => setWebTimeModalVisible(false)} style={{ marginTop: 6 }}>
            Avbryt
          </Button>
        </Modal>
      </Portal>

      {/* Info-modal */}
      <Portal>
        <Modal
          visible={infoVisible}
          onDismiss={() => setInfoVisible(false)}
          contentContainerStyle={[
            styles.modalCard,
            { backgroundColor: theme.colors.surface, borderRadius: theme.roundness + 8 },
          ]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 8 }}>
            Modal
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}
          >
            Detta är en tema-anpassad modal via Paper. Den följer mörkt/ljust läge automatiskt.
          </Text>
          <Button mode="contained" onPress={() => setInfoVisible(false)}>
            Stäng
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centerWrap: {
    alignSelf: 'center',
    width: '100%',
    padding: 16,
    gap: 16,
  },
  title: { marginBottom: 4 },
  card: { borderRadius: 16 },
  modalCard: { marginHorizontal: 24, padding: 16 },
});
