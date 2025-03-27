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
  Dimensions,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Import configuration 
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '../../config';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
const { width } = Dimensions.get('window');

// Define types
interface Member {
  name: string;
  email?: string;
  savings: number;
}

interface GroupTrip {
  destination: string;
  cost: number;
  duration: string;
  image: string;
  progress: number;
}

const MicroinvestmentScreen: React.FC = () => {
  // State management
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'savings' | 'trips'>('savings');

  // Helper function to generate UI Avatars URL
  const getUiAvatar = (name: string) => {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=f0f0f0&color=1e293b&size=128&rounded=true&bold=true`;
  };

  // Sample group trips data
  const groupTrips: GroupTrip[] = [
    { 
      destination: 'Goa Beach', 
      cost: 5000, 
      duration: '3 days', 
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=90&h=90&q=80', 
      progress: 65 
    },
    { 
      destination: 'Manali Hills', 
      cost: 7000, 
      duration: '5 days', 
      image: 'https://plus.unsplash.com/premium_photo-1726313836345-3524772937fe?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
      progress: 42 
    },
    { 
      destination: 'Rajasthan Safari', 
      cost: 6000, 
      duration: '4 days', 
      image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?ixlib=rb-4.0.3&auto=format&fit=crop&w=90&h=90&q=80', 
      progress: 28 
    },
  ];

  // Fetch group data on component mount
  useEffect(() => {
    const fetchLatestGroup = async () => {
      setLoading(true);
      try {
        // Retrieve group name from AsyncStorage
        const savedGroupName = await AsyncStorage.getItem('groupData');
        if (!savedGroupName) {
          setGroupName('Unnamed Group');
          setMembers([]);
          console.log('No group data found in AsyncStorage');
          return;
        }

        const parsedGroupName = JSON.parse(savedGroupName);
        setGroupName(parsedGroupName);

        // Fetch group details from Supabase
        const { data, error } = await supabase
          .from('groups')
          .select('name, member1, member1_email, member2, member2_email, member3, member3_email')
          .eq('name', parsedGroupName)
          .single();

        if (error) throw new Error(`Supabase fetch error: ${error.message}`);

        if (data) {
          // Prepare group members
          const groupMembers: Member[] = [
            { name: data.member1, email: data.member1_email, savings: 1250 },
            { name: data.member2, email: data.member2_email, savings: 980 },
            { name: data.member3, email: data.member3_email, savings: 650 },
          ].filter((member) => member.name);

          setMembers(groupMembers);
          setTotalSavings(groupMembers.reduce((sum, member) => sum + member.savings, 0));
        } else {
          setMembers([]);
          console.log('No group data returned from Supabase');
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
        Alert.alert('Error', 'Unable to load group data.');
        setGroupName('Error Loading Group');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestGroup();
  }, []);

  // Render individual member card
  const renderMember = ({ item }: { item: Member }) => (
    <Animatable.View animation="fadeIn" style={styles.memberCard}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedMember(item.name)}
      >
        <Image 
          source={{ uri: getUiAvatar(item.name) }} 
          style={styles.memberAvatar} 
          defaultSource={{ uri: 'https://via.placeholder.com/64' }} 
        />
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberSavings}>₹{item.savings.toLocaleString()}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  // Render individual trip item
  const renderTrip = ({ item }: { item: GroupTrip }) => (
    <Animatable.View animation="fadeInUp" style={styles.tripItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.tripImage} 
        defaultSource={{ uri: 'https://via.placeholder.com/90' }} 
        onError={(e) => console.log(`Failed to load image for ${item.destination}: ${e.nativeEvent.error}`)}
      />
      <View style={styles.tripInfo}>
        <Text style={styles.tripDestination}>{item.destination}</Text>
        <Text style={styles.tripDuration}>{item.duration}</Text>
        <View style={styles.progressBar}>
          <Animatable.View
            animation="slideInLeft"
            duration={1000}
            style={[styles.progressFill, { width: `${item.progress}%` }]}
          />
        </View>
        <View style={styles.tripProgress}>
          <Text style={styles.progressText}>{item.progress}% Funded</Text>
          <Text style={styles.tripCost}>₹{item.cost.toLocaleString()}</Text>
        </View>
      </View>
    </Animatable.View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your group...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#3b82f6', '#1e40af']} style={styles.headerGradient}>
          <View style={styles.header}>
            <Icon name="people" size={34} color="#fff" />
            <Text style={styles.title}>{groupName ? `${groupName}'s Fund` : 'Group Fund'}</Text>
          </View>
          <Text style={styles.savingsLabel}>Total Group Savings</Text>
          <Text style={styles.totalSavings}>₹{totalSavings.toLocaleString()}</Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'savings' && styles.activeTab]}
            onPress={() => setActiveTab('savings')}
            activeOpacity={0.7}
          >
            <Icon
              name="wallet-outline"
              size={24}
              color={activeTab === 'savings' ? '#2563eb' : '#94a3b8'}
            />
            <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>
              Savings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
            onPress={() => setActiveTab('trips')}
            activeOpacity={0.7}
          >
            <Icon
              name="airplane-outline"
              size={24}
              color={activeTab === 'trips' ? '#2563eb' : '#94a3b8'}
            />
            <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>
              Trips
            </Text>
          </TouchableOpacity>
        </View>

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <Animatable.View animation="fadeIn" style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Group Members</Text>
            <Text style={styles.subtitle}>Tap a member to invest via QR</Text>
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersListContainer}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowQrModal(true)}
              activeOpacity={0.8}
            >
              <Icon name="add-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Invest Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Alert.alert('Payment', 'Card payment coming soon!')}
              activeOpacity={0.8}
            >
              <Icon name="card-outline" size={22} color="#2563eb" />
              <Text style={styles.secondaryButtonText}>Pay with Card</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <Animatable.View animation="fadeIn" style={styles.tabContent}>
            <View style={styles.tripHeaderRow}>
              <Text style={styles.sectionTitle}>Trip Plans</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={groupTrips}
              renderItem={renderTrip}
              keyExtractor={(item) => item.destination}
              scrollEnabled={false}
            />
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
              <Icon name="add-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Plan a Trip</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Investment</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)} activeOpacity={0.7}>
                <Icon name="close" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>
            <QRCode value="GroupPaymentLink" size={200} backgroundColor="#FFF" color="#1e40af" />
            <Text style={styles.modalSubtitle}>Scan with any UPI app</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowQrModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* Member QR Modal */}
      <Modal visible={!!selectedMember} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Image 
                  source={{ uri: selectedMember ? getUiAvatar(selectedMember) : '' }} 
                  style={styles.modalMemberAvatar} 
                />
                <Text style={styles.modalTitle}>{selectedMember}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMember(null)} activeOpacity={0.7}>
                <Icon name="close" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.memberQrContainer}>
              <QRCode value={`Member:${selectedMember}`} size={180} backgroundColor="#FFF" color="#1e40af" />
            </View>
            <View style={styles.memberDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Savings</Text>
                <Text style={styles.detailValue}>
                  ₹{members.find((m) => m.name === selectedMember)?.savings.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contribution</Text>
                <Text style={styles.detailValue}>
                  {((members.find((m) => m.name === selectedMember)?.savings || 0) / totalSavings * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setSelectedMember(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
    marginTop: 16,
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  savingsLabel: {
    fontSize: 16,
    color: '#dbeafe',
    marginTop: 12,
    fontWeight: '500',
  },
  totalSavings: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: -25,
    padding: 4,
    elevation: 10,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#dbeafe',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#2563eb',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  membersListContainer: {
    paddingVertical: 8,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    width: width * 0.32, // Responsive width
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 8,
  },
  memberSavings: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  tripItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    marginRight: 16,
    resizeMode: 'cover',
  },
  tripInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  tripDuration: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  tripProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  tripCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  modalMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  memberQrContainer: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  memberDetails: {
    width: '100%',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
});

export default MicroinvestmentScreen;