import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

interface Member {
  name: string;
  email?: string;
}

export default function HomeScreen() {
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHero, setShowHero] = useState<boolean>(true); // New state to control hero section visibility

  // Function to generate UI Avatars URL
  const getUiAvatar = (name: string) => {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=f0f0f0&color=1e293b&size=128&rounded=true&bold=true`;
  };

  useEffect(() => {
    const fetchLatestGroup = async () => {
      setLoading(true);
      try {
        const savedGroupName = await AsyncStorage.getItem('groupData');
        if (!savedGroupName) {
          setGroupName('Unnamed Group');
          setMembers([]);
          console.log('No group data found in AsyncStorage');
          return;
        }

        const parsedGroupName = JSON.parse(savedGroupName);
        setGroupName(parsedGroupName);

        const { data, error } = await supabase
          .from('groups')
          .select('name, member1, member1_email, member2, member2_email, member3, member3_email')
          .eq('name', parsedGroupName)
          .single();

        if (error) throw new Error(`Supabase fetch error: ${error.message}`);

        if (data) {
          const groupMembers = [
            { name: data.member1, email: data.member1_email },
            { name: data.member2, email: data.member2_email },
            { name: data.member3, email: data.member3_email },
          ].filter((member) => member.name);

          setMembers(groupMembers);
        } else {
          setMembers([]);
          console.log('No group data returned from Supabase');
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
        setGroupName('Error Loading Group');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestGroup();
  }, []);

  // Function to handle "Get Started" button click
  const handleGetStarted = () => {
    setShowHero(false); // Hide the hero section
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Hero Section - Conditionally Rendered */}
        {showHero && (
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              {groupName ? `${groupName}'s Community` : 'Connect. Collaborate. Share.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              The seamless platform for teams to work together, anywhere.
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
              <Text style={styles.ctaButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading members...</Text>
          ) : members.length > 0 ? (
            members.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <View style={styles.memberCardContent}>
                  <Image 
                    source={{ uri: getUiAvatar(member.name) }} 
                    style={styles.memberAvatar} 
                  />
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.email && (
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noMembersText}>No members found</Text>
          )}
        </View>

        {/* Pending Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Pending Status</Text>
          <TouchableOpacity style={styles.statusButton}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusButtonText}>All Systems Operational</Text>
            <Text style={styles.viewDetailsText}>View Details →</Text>
          </TouchableOpacity>
        </View>

        {/* Call To Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to transform your team's workflow?</Text>
          <TouchableOpacity style={styles.ctaButtonLarge}>
            <Text style={styles.ctaButtonText}>Start Your Free Trial</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>No credit card required.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroSection: {
    padding: 25,
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 15,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 26,
  },
  ctaButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  membersSection: {
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  memberCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  memberCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 80,  
    height: 80, 
    borderRadius: 20,
    marginRight: 15,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  noMembersText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  statusSection: {
    padding: 25,
    backgroundColor: '#F8FAFF',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    marginRight: 10,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  ctaSection: {
    padding: 30,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    borderRadius: 12,
    margin: 25,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButtonLarge: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 10,
  },
  ctaSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
});