import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Users } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbndwnsdegkfexmmaak.supabase.co';
const SUPABASE_PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYm5kd25zZGVna2ZleG1tYWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NDU2NjAsImV4cCI6MjA1MzMyMTY2MH0.Ypit5O8aG9QuEiWyotZtjJ-ixErkHhN6zk-Yd9VKcwE';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

interface GroupMember {
  name: string;
  email: string;
}

export default function Header() {
  const [groupName, setGroupName] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  const generateCustomAvatar = (name: string) => {
    if (!name) return { initials: '', backgroundColor: '#d9d9d9' };

    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2); // Limit to 2 initials

    return { initials, backgroundColor: '#d9d9d9' };
  };

  // Fetch group name and members from AsyncStorage and Supabase
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        const savedGroupName = await AsyncStorage.getItem('groupData');
        if (!savedGroupName) {
          console.log('No group data found in AsyncStorage');
          setLoading(false);
          return;
        }

        const parsedGroupName = JSON.parse(savedGroupName);
        setGroupName(parsedGroupName);
        console.log('Group Name from AsyncStorage:', parsedGroupName);

        const { data, error } = await supabase
          .from('groups')
          .select('member1, member1_email, member2, member2_email, member3, member3_email')
          .eq('name', parsedGroupName)
          .single();

        if (error) {
          console.error('Supabase Error:', error);
          throw error;
        }

        if (data) {
          console.log('Supabase Data:', data);
          const groupMembers = [
            { name: data.member1 || '', email: data.member1_email || '' },
            { name: data.member2 || '', email: data.member2_email || '' },
            { name: data.member3 || '', email: data.member3_email || '' },
          ].filter(member => member.name);

          console.log('Processed Members:', groupMembers);
          setMembers(groupMembers);
        } else {
          console.log('No data returned from Supabase');
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, []);

  const toggleMembers = () => {
    if (groupName) {
      setShowMembers(!showMembers);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('groupData');
      setGroupName(null);
      setMembers([]);
      setShowMembers(false);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>C&S</Text>
        <Text style={styles.companyName}>(Connect&Share)</Text>
      </View>

      {groupName ? (
        <View>
          <TouchableOpacity onPress={toggleMembers}>
            <Text style={styles.groupName}>
              <Users size={32} color="black" />
            </Text>
          </TouchableOpacity>

          {showMembers && (
            <View style={styles.membersContainer}>
              <Text style={styles.membersTitle}>Group Members</Text>
              <ScrollView style={styles.membersList}>
                {loading ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : members.length > 0 ? (
                  members.map((member, index) => {
                    const { initials, backgroundColor } = generateCustomAvatar(member.name);
                    return (
                      <View key={index} style={styles.memberItem}>
                        <View style={[styles.memberAvatar, { backgroundColor }]}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberText}>{member.name}</Text>
                          {member.email && (
                            <Text style={styles.memberEmail}>{member.email}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noMembersText}>No members found</Text>
                )}
              </ScrollView>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowMembers(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <Link href="/login" style={styles.loginButton}>
          <Text style={styles.loginText}>Create Group</Text>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
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
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 40,
  },
  membersContainer: {
    position: 'absolute',
    right: 0,
    top: 70,
    width: 250,
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b', // Same as UI Avatars default text color
  },
  memberInfo: {
    flex: 1,
  },
  memberText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 12,
    color: '#666666',
  },
  noMembersText: {
    fontSize: 14,
    color: '#666666',
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 14,
    color: '#2563EB',
    paddingVertical: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginLeft: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
