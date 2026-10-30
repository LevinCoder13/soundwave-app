import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

const { api } = require('../api/client');

export default function SettingsModal({ visible, onClose }) {
  const [serverUrl, setServerUrl] = useState(api.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusColor, setStatusColor] = useState('#b3b3b3');
  const [audioQuality, setAudioQuality] = useState('Very High'); // 'Normal' | 'High' | 'Very High'

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusMessage('Pinging server...');
    setStatusColor('#b3b3b3');
    try {
      api.setBaseUrl(serverUrl.trim());
      const res = await api.checkHealth();
      if (res && res.status === 'online') {
        setStatusMessage(`Connected! DB: ${res.database?.connected ? 'MySQL Active' : 'Offline'}`);
        setStatusColor('#1db954');
      } else {
        setStatusMessage('Server replied with unexpected status');
        setStatusColor('#f59e0b');
      }
    } catch (e) {
      setStatusMessage(`Failed: ${e.message}`);
      setStatusColor('#ef4444');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    api.setBaseUrl(serverUrl.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Account Card */}
          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>L</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>Levin</Text>
              <Text style={styles.accountBadge}>SoundWave Premium</Text>
            </View>
          </View>

          {/* Network Server Settings */}
          <Text style={styles.sectionTitle}>Network & Server Bridge</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Backend Server URL (Wi-Fi / LAN)</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.13:3000"
              placeholderTextColor="#666666"
            />
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={isTesting}>
              {isTesting ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Text style={styles.testBtnText}>Test Connection</Text>
              )}
            </TouchableOpacity>
            {statusMessage && (
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusMessage}
              </Text>
            )}
          </View>

          {/* Audio Quality Settings */}
          <Text style={styles.sectionTitle}>Audio Quality</Text>
          <View style={styles.card}>
            {['Normal (96 kbps)', 'High (160 kbps)', 'Very High (320 kbps)'].map((quality) => {
              const key = quality.split(' ')[0];
              const isSelected = audioQuality === key;
              return (
                <TouchableOpacity
                  key={quality}
                  style={styles.qualityRow}
                  onPress={() => setAudioQuality(key)}>
                  <Text style={[styles.qualityText, isSelected && styles.qualityTextActive]}>
                    {quality}
                  </Text>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* App Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SoundWave v1.0.0 (Spotify Engine)</Text>
            <Text style={styles.footerSub}>Connected to MySQL & YouTube Audio Stream</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  backBtn: {
    padding: 6,
  },
  backText: {
    color: '#ffffff',
    fontSize: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1db954',
    borderRadius: 16,
  },
  saveText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  accountBadge: {
    color: '#1db954',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#b3b3b3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  inputLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#282828',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  testBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  testBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  qualityText: {
    color: '#ffffff',
    fontSize: 14,
  },
  qualityTextActive: {
    color: '#1db954',
    fontWeight: '600',
  },
  checkIcon: {
    color: '#1db954',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#777777',
    fontSize: 12,
    marginBottom: 4,
  },
  footerSub: {
    color: '#555555',
    fontSize: 11,
  },
});

