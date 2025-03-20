import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '../config';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

interface GroupData {
  groupName: string;
  member1Name: string;
  member1Email: string;
  member2Name: string;
  member2Email: string;
  member3Name: string;
  member3Email: string;
}

const GroupCreationForm: React.FC = () => {
  const router = useRouter();

  const [groupData, setGroupData] = useState<GroupData>({
    groupName: '',
    member1Name: '',
    member1Email: '',
    member2Name: '',
    member2Email: '',
    member3Name: '',
    member3Email: '',
  });

  const handleChange = (name: keyof GroupData, value: string) => {
    setGroupData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('groups')
        .insert({
          name: groupData.groupName,
          member1: groupData.member1Name,
          member1_email: groupData.member1Email,
          member2: groupData.member2Name,
          member2_email: groupData.member2Email,
          member3: groupData.member3Name,
          member3_email: groupData.member3Email,
        })
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Group created successfully!');

      setTimeout(async () => {
        await AsyncStorage.setItem('groupData', JSON.stringify(groupData.groupName));
        setTimeout(() => {
          router.push('/bill-split');
        }, 1000);
      }, 2000);

      setGroupData({
        groupName: '',
        member1Name: '',
        member1Email: '',
        member2Name: '',
        member2Email: '',
        member3Name: '',
        member3Email: '',
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Group</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupData.groupName}
            onChangeText={(text) => handleChange('groupName', text)}
            placeholder="Enter group name"
            autoCapitalize="none"
          />

          {[1, 2, 3].map((memberNum) => (
            <View key={memberNum} style={styles.memberSection}>
              <Text style={styles.label}>Member {memberNum}</Text>
              <TextInput
                style={styles.input}
                value={groupData[`member₹{memberNum}Name` as keyof GroupData]}
                onChangeText={(text) => handleChange(`member₹{memberNum}Name` as keyof GroupData, text)}
                placeholder={`Member ₹{memberNum} Name`}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                value={groupData[`member₹{memberNum}Email` as keyof GroupData]}
                onChangeText={(text) => handleChange(`member₹{memberNum}Email` as keyof GroupData, text)}
                placeholder={`Member ₹{memberNum} Email`}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ))}

          <Button title="Create Group" onPress={handleSubmit} color="#007AFF" />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom for scroll comfort
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 100, // Matches mt-[100px] roughly
    marginBottom: 20,
  },
  form: {
    gap: 16, // Replaces space-y-4
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  memberSection: {
    gap: 8,
  },
});

export default GroupCreationForm;