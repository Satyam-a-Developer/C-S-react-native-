import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Header() {
  const [groupName, setGroupName] = useState<string | null>(null);

  // Fetch group name from AsyncStorage
  useEffect(() => {
    const fetchGroupName = async () => {
      try {
        const savedGroupName = await AsyncStorage.getItem('groupData');
        if (savedGroupName) {
          const parsedGroupName = JSON.parse(savedGroupName); // Parse JSON string
          setGroupName(parsedGroupName);
        }
      } catch (error) {
        console.error('Error fetching group name from AsyncStorage:', error);
      }
    };

    fetchGroupName();
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
                <Text style={styles.logoText}>C&S</Text>
                <Text style={styles.companyName}>(Connect&Share)</Text>
              </View>
      {groupName ? (
        <Text style={styles.groupName}>{groupName}</Text>
      ) : (
        <Link href="/login" style={styles.loginButton}>
          <Text style={styles.loginText}>Create Group</Text>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    color: '#2563EB',
    marginRight: 5,
  },
  companyName: {
    fontSize: 15,
    marginTop: 40,
    fontWeight: '600',
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  logo: {
    fontSize: 24,
    marginTop: 40,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    marginTop: 40,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  groupName: {
    fontSize: 18,
    backgroundColor: '#bde0fe',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: '600',
    color: '#1f2937', // Dark gray for visibility
    marginTop: 40,
  },
});