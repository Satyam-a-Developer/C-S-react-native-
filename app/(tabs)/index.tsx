import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

interface Member {
  name: string;
  email?: string;
  paymentStatus?: 'pending' | 'paid';
  amountDue?: number;
  loanAmount?: number;
  paymentRecipient?: string; // Who the payment is going to
}



type NavigationProps = {
  navigate: (screen: string, params?: any) => void;
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProps>();
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHero, setShowHero] = useState<boolean>(true);

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
            { 
              name: data.member1, 
              email: data.member1_email, 
              paymentStatus: 'pending' as const, 
              amountDue: 599, 
              loanAmount: 200,
              paymentRecipient: 'Group Treasurer' // Example recipient
            },
            { 
              name: data.member2, 
              email: data.member2_email, 
              paymentStatus: 'pending' as const, 
              amountDue: 599, 
              loanAmount: 0,
              paymentRecipient: 'Group Admin' // Example recipient
            },
            { 
              name: data.member3, 
              email: data.member3_email, 
              paymentStatus: 'paid' as const, 
              amountDue: 0, 
              loanAmount: 150,
              paymentRecipient: 'Group Fund'
            },
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

  const handleGetStarted = () => {
    setShowHero(false);
  };

  const handlePayment = (member: Member) => {
    Alert.alert(
      `Pay for ${member.name}`,
      `Amount Due: ₹${member.amountDue} to ${member.paymentRecipient}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Payment',
          onPress: () => {
            // console.log('PaymentScreen not implemented yet');
            navigation.navigate('PaymentScreen', {
              memberName: member.name,
              amount: member.amountDue,
              recipient: member.paymentRecipient,
              onPaymentSuccess: () => {
                setMembers((prevMembers) =>
                  prevMembers.map((m) =>
                    m.name === member.name ? { ...m, paymentStatus: 'paid', amountDue: 0 } : m
                  )
                );
                Alert.alert('Success', 'Payment completed successfully!');
              },
            });
          },
        },
      ]
    );
  };

  // Handle loan reminder
  const handleRemindLoan = (member: Member) => {
    Alert.alert(
      `Remind ${member.name}`,
      `They owe you ₹${member.loanAmount}. Send a reminder?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remind', onPress: () => Alert.alert('Reminder Sent', `Reminder sent to ${member.name}!`) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {showHero && (
          <View style={styles.heroSection}>
            <Ionicons name="people" size={40} color="#2563EB" />
            <Text style={styles.heroTitle}>
              {groupName ? `Welcome to ${groupName}'s Community` : 'Connect. Collaborate. Share.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Your team's hub for seamless collaboration, anywhere, anytime.
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
              <Text style={styles.ctaButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Group Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="person" size={24} color="#2563EB" />
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>
                {members.filter((m) => m.paymentStatus === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending Payments</Text>
            </View>
          </View>
        </View>

        {/* Pending Payment Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Pending Payment Status</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading payment statuses...</Text>
          ) : members.filter(m => m.paymentStatus === 'pending').length > 0 ? (
            members
              .filter(m => m.paymentStatus === 'pending')
              .map((member, index) => (
                <View key={index} style={styles.statusCard}>
                  <View style={styles.statusCardContent}>
                    <Image source={{ uri: getUiAvatar(member.name) }} style={styles.memberAvatar} />
                    <View style={styles.statusDetails}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                      <View style={styles.paymentRecipientContainer}>
                        <Ionicons name="arrow-forward" size={16} color="#64748B" />
                        <Text style={styles.paymentRecipient}>To: {member.paymentRecipient}</Text>
                      </View>
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>₹{member.amountDue}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: '#F59E0B' },
                        ]}
                      >
                        <Text style={styles.statusText}>Pending</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayment(member)}
                      >
                        <Text style={styles.payButtonText}>Pay Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
          ) : (
            <Text style={styles.noMembersText}>No pending payments</Text>
          )}
        </View>

        {/* Loans Section */}
        <View style={styles.loansSection}>
          <Text style={styles.sectionTitle}>Loans You've Given</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading loan statuses...</Text>
          ) : members.filter((m) => m.loanAmount && m.loanAmount > 0).length > 0 ? (
            members
              .filter((m) => m.loanAmount && m.loanAmount > 0)
              .map((member, index) => (
                <View key={index} style={styles.loanCard}>
                  <View style={styles.loanCardContent}>
                    <Image source={{ uri: getUiAvatar(member.name) }} style={styles.memberAvatar} />
                    <View style={styles.loanDetails}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                      <View style={styles.loanDirectionContainer}>
                        <Ionicons name="arrow-back" size={16} color="#D97706" />
                        <Text style={styles.loanDirection}>Owes you</Text>
                      </View>
                    </View>
                    <View style={styles.loanInfo}>
                      <Text style={styles.loanAmount}>₹{member.loanAmount}</Text>
                      <TouchableOpacity
                        style={styles.remindButton}
                        onPress={() => handleRemindLoan(member)}
                      >
                        <Text style={styles.remindButtonText}>Remind</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
          ) : (
            <Text style={styles.noMembersText}>No loans given</Text>
          )}
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading members...</Text>
          ) : members.length > 0 ? (
            members.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <View style={styles.memberCardContent}>
                  <Image source={{ uri: getUiAvatar(member.name) }} style={styles.memberAvatar} />
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noMembersText}>No members found</Text>
          )}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to transform your team's workflow?</Text>
          <TouchableOpacity style={styles.ctaButtonLarge}>
            <Text style={styles.ctaButtonText}>Start Your Free Trial</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>No credit card required • 14-day trial</Text>
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
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 10,
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
  statsSection: {
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    padding: 15,
    borderRadius: 12,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  paymentRecipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  paymentRecipient: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 5,
    fontStyle: 'italic',
  },
  loanDirectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  loanDirection: {
    fontSize: 14,
    color: '#D97706',
    marginLeft: 5,
    fontWeight: '500',
  },
  loansSection: {
    padding: 25,
    backgroundColor: '#FFF7E6', // Light yellow background for distinction
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  loanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loanDetails: {
    flex: 1,
  },
  loanInfo: {
    alignItems: 'flex-end',
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D97706', // Amber for loans
    marginBottom: 5,
  },
  remindButton: {
    backgroundColor: '#D97706',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  remindButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDetails: {
    flex: 1,
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  payButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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