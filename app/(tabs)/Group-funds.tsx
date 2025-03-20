import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

const MicroinvestmentScreen: React.FC = () => {
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<{ name: string; savings: number; avatar?: string }[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'savings' | 'trips'>('savings');

  // Mock data for group trips
  const groupTrips = [
    { 
      destination: 'Goa Beach', 
      cost: 5000, 
      duration: '3 days', 
      image: 'https://via.placeholder.com/80',
      progress: 65 
    },
    { 
      destination: 'Manali Hills', 
      cost: 7000, 
      duration: '5 days', 
      image: 'https://via.placeholder.com/80',
      progress: 42
    },
    { 
      destination: 'Rajasthan Safari', 
      cost: 6000, 
      duration: '4 days', 
      image: 'https://via.placeholder.com/80',
      progress: 28
    },
  ];

  // Fetch group data from Supabase using AsyncStorage
  useEffect(() => {
    const fetchLatestGroup = async () => {
      try {
        setLoading(true);
        // Retrieve group name from AsyncStorage
        const savedGroupName = await AsyncStorage.getItem('groupData');
        if (!savedGroupName) {
          console.log('No group found in AsyncStorage');
          setGroupName('Default Group'); // Fallback name
          setLoading(false);
          return;
        }

        const parsedGroupName = JSON.parse(savedGroupName);
        setGroupName(parsedGroupName);

        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('name', parsedGroupName)
          .single();

        if (error) throw error;

        if (data) {
          // Adding mock savings and avatar data for demonstration
          const groupMembers = [
            { name: data.member1, email: data.member1_email, savings: 1250, avatar: 'https://via.placeholder.com/50' },
            { name: data.member2, email: data.member2_email, savings: 980, avatar: 'https://via.placeholder.com/50' },
            { name: data.member3, email: data.member3_email, savings: 650, avatar: 'https://via.placeholder.com/50' },
          ].filter((member) => member.name);

          setMembers(groupMembers);
          const total = groupMembers.reduce((sum, member) => sum + member.savings, 0);
          setTotalSavings(total);
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
        Alert.alert('Error', 'Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestGroup();
  }, []);

  // Render member item
  const renderMember = ({ item }: { item: { name: string; savings: number; avatar?: string } }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => setSelectedMember(item.name)}
    >
      <View style={styles.memberAvatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
        ) : (
          <View style={styles.memberAvatarPlaceholder}>
            <Text style={styles.memberInitial}>{item.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={styles.memberSavings}>₹{item.savings.toLocaleString()}</Text>
    </TouchableOpacity>
  );

  // Render trip item
  const renderTrip = ({ item }: { item: { destination: string; cost: number; duration: string; image: string; progress: number } }) => (
    <TouchableOpacity style={styles.tripItem}>
      <Image source={{ uri: item.image }} style={styles.tripImage} />
      <View style={styles.tripInfo}>
        <Text style={styles.tripDestination}>{item.destination}</Text>
        <Text style={styles.tripDuration}>{item.duration}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `₹{item.progress}%` }]} />
        </View>
        <View style={styles.tripProgress}>
          <Text style={styles.progressText}>{item.progress}% funded</Text>
          <Text style={styles.tripCost}>₹{item.cost.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading group data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f9ff" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Icon name="group" size={32} color="#fff" />
            <Text style={styles.title}>
              {groupName ? `₹{groupName}'s Fund` : 'Group Fund'}
            </Text>
          </View>
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsLabel}>Total Group Savings</Text>
            <Text style={styles.totalSavings}>₹{totalSavings.toLocaleString()}</Text>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'savings' && styles.activeTab]}
            onPress={() => setActiveTab('savings')}
          >
            <Icon 
              name="account-balance-wallet" 
              size={22} 
              color={activeTab === 'savings' ? '#2563eb' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>Savings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
            onPress={() => setActiveTab('trips')}
          >
            <Icon 
              name="flight" 
              size={22} 
              color={activeTab === 'trips' ? '#2563eb' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>Trip Plans</Text>
          </TouchableOpacity>
        </View>

        {/* Members Tab */}
        {activeTab === 'savings' && (
          <>
            <Text style={styles.sectionTitle}>Group Members</Text>
            <Text style={styles.subtitle}>
              Tap a member to view their QR code for investments
            </Text>

            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersListContainer}
            />

            {/* Invest Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowQrModal(true)}>
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Add Investment</Text>
            </TouchableOpacity>

            {/* Alternative Payment Method */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Alert.alert('Stripe', 'Stripe payment processing will be integrated here')}
            >
              <Icon name="credit-card" size={20} color="#2563eb" />
              <Text style={styles.secondaryButtonText}>Pay with Card</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <>
            <View style={styles.tripHeaderRow}>
              <Text style={styles.sectionTitle}>Upcoming Trips</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={groupTrips}
              renderItem={renderTrip}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
            
            <TouchableOpacity style={styles.primaryButton}>
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Plan New Trip</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invest in Group Fund</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <QRCode value="GroupPaymentLink" size={200} backgroundColor="#FFF" color="#1e40af" />
            <Text style={styles.modalSubtitle}>Scan with any UPI app to contribute</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowQrModal(false)}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selected Member QR */}
      <Modal visible={!!selectedMember} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <Icon name="person" size={22} color="#2563eb" /> {selectedMember}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMember(null)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.memberQrContainer}>
              <QRCode 
                value={`Member:₹{selectedMember}`} 
                size={180} 
                backgroundColor="#FFF" 
                color="#1e40af"
              />
            </View>
            
            <View style={styles.memberDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Savings</Text>
                <Text style={styles.detailValue}>
                  ₹{members.find(m => m.name === selectedMember)?.savings.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contribution</Text>
                <Text style={styles.detailValue}>
                  {((members.find(m => m.name === selectedMember)?.savings || 0) / totalSavings * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.primaryButton} onPress={() => setSelectedMember(null)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Updated styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  savingsContainer: {
    marginTop: 16,
  },
  savingsLabel: {
    fontSize: 14,
    color: '#dbeafe',
  },
  totalSavings: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -20,
    elevation: 6,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#2563eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 24,
    marginLeft: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginLeft: 16,
  },
  membersListContainer: {
    paddingHorizontal: 10,
    marginTop: 16,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    width: 110,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
  },
  memberAvatar: {
    width: 56,
    height: 56,
  },
  memberAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748b',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  memberSavings: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  tripItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tripDestination: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  tripDuration: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  tripProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  tripCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  memberQrContainer: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  memberDetails: {
    width: '100%',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
});

export default MicroinvestmentScreen;