import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

const SUPABASE_URL = 'https://nrbndwnsdegkfexmmaak.supabase.co';
const SUPABASE_PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYm5kd25zZGVna2ZleG1tYWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NDU2NjAsImV4cCI6MjA1MzMyMTY2MH0.Ypit5O8aG9QuEiWyotZtjJ-ixErkHhN6zk-Yd9VKcwE';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

interface Item {
  description: string;
  amount: number;
}

interface Participant {
  name: string;
  email: string;
  items: Item[];
}

interface GroupDetails {
  name: string;
  member1: string;
  member1_email: string;
  member2: string;
  member2_email: string;
  member3: string;
  member3_email: string;
}

export default function BillSplittingScreen() {
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", email: "", items: [{ description: "Shared Amount", amount: 0 }] },
  ]);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [totalBill, setTotalBill] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    const fetchLatestGroup = async () => {
      try {
        const storedGroupData = await AsyncStorage.getItem('groupData');
        const savedGroupName = storedGroupData ? JSON.parse(storedGroupData) : null;

        if (!savedGroupName) {
          navigation.navigate("GroupCreation");
          return;
        }

        const { data, error } = await supabase
          .from("groups")
          .select("*")
          .eq("name", savedGroupName)
          .single();

        if (error) throw error;

        if (data) {
          setGroupDetails(data);
          const groupMembers = [
            { name: data.member1, email: data.member1_email },
            { name: data.member2, email: data.member2_email },
            { name: data.member3, email: data.member3_email },
          ].filter((member) => member.name);

          setParticipants(
            groupMembers.map((member) => ({
              name: member.name,
              email: member.email,
              items: [{ description: "Shared Amount", amount: 0 }],
            }))
          );
        } else {
          navigation.navigate("GroupCreation");
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
        Alert.alert("Error", "Failed to load group details.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestGroup();
  }, [navigation]);

  const updateTotalBill = (value: string) => {
    const newTotal = parseFloat(value) || 0;
    setTotalBill(newTotal);
    const equalShare = newTotal / participants.length;
    setParticipants(participants.map((p) => ({
      ...p,
      items: [{ description: "Shared Amount", amount: equalShare }],
    })));
  };

  const handleAmountChange = (participantIndex: number, value: string) => {
    const newAmount = parseFloat(value) || 0;
    const totalOtherParticipants = participants.reduce(
      (sum, p, idx) => (idx === participantIndex ? sum : sum + p.items[0].amount),
      0
    );
    const remainingTotal = totalBill - newAmount;

    if (remainingTotal < 0) {
      Alert.alert("Error", "Amount exceeds total bill!");
      return;
    }

    const newParticipants = participants.map((p, idx) => {
      if (idx === participantIndex) {
        return { ...p, items: [{ description: "Shared Amount", amount: newAmount }] };
      }
      const proportionalShare =
        (p.items[0].amount / totalOtherParticipants) * remainingTotal || 0;
      return { ...p, items: [{ description: "Shared Amount", amount: proportionalShare }] };
    });
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    const equalShare = totalBill / (participants.length + 1);
    setParticipants(
      [...participants, { name: "", email: "", items: [{ description: "Shared Amount", amount: equalShare }] }]
        .map((p) => ({ ...p, items: [{ description: "Shared Amount", amount: totalBill / (participants.length + 1) }] }))
    );
  };

  const removeParticipant = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    const equalShare = totalBill / newParticipants.length;
    setParticipants(newParticipants.map((p) => ({
      ...p,
      items: [{ description: "Shared Amount", amount: equalShare }],
    })));
  };

  const sendBillToParticipants = async () => {
    const emailAddresses = participants.map((p) => p.email).join(", ");
    const participantDetails = participants
      .map((p) => `${p.name}: ₹${p.items[0].amount.toFixed(2)}`)
      .join("\n");

    const emailData = {
      groupName: groupDetails?.name || "",
      participants: participantDetails,
      totalBill: totalBill.toFixed(2),
    };

    const messageBody = `
      Bill Splitting Details
      Group: ${emailData.groupName || "No Group Name"}
      Total Bill: ₹${emailData.totalBill}
      Participants:
      ${emailData.participants}
      Email recipients: ${emailAddresses}
    `;

    try {
      const response = await fetch("https://formsubmit.co/ajax/satyampannaballer@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: "Bill Splitting Details",
          email: "anyogoose@gmail.com",
          _replyto: "anyogoose@gmail.com",
          message: messageBody,
          _next: "https://yourwebsite.com/thank-you",
          _captcha: "false",
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Bill sent successfully!");
      } else {
        Alert.alert("Error", "Failed to send the bill.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sending the bill.");
    }
  };

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => (
    <Animatable.View animation="fadeInUp" style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <Icon name="user" size={24} color="#6b7280" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={item.name}
          onChangeText={(text) =>
            setParticipants(participants.map((p, idx) => idx === index ? { ...p, name: text } : p))
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={item.email}
          onChangeText={(text) =>
            setParticipants(participants.map((p, idx) => idx === index ? { ...p, email: text } : p))
          }
        />
        {participants.length > 1 && (
          <TouchableOpacity onPress={() => removeParticipant(index)} style={styles.removeButton}>
            <Icon name="trash-2" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount:</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={item.items[0].amount.toFixed(2)}
          keyboardType="numeric"
          onChangeText={(text) => handleAmountChange(index, text)}
        />
      </View>
    </Animatable.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Animatable.Text animation="pulse" easing="ease-out" iterationCount="infinite" style={styles.loadingText}>
          Loading...
        </Animatable.Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#3b82f6', '#1e40af']} style={styles.headerGradient}>
        <Text style={styles.header}>{groupDetails?.name || "Bill Splitting"}</Text>
      </LinearGradient>

      {groupDetails && (
        <Animatable.View animation="fadeIn" style={styles.groupDetails}>
          <Text style={styles.groupSubtitle}>Group Members</Text>
          {[
            { name: groupDetails.member1, email: groupDetails.member1_email },
            { name: groupDetails.member2, email: groupDetails.member2_email },
            { name: groupDetails.member3, email: groupDetails.member3_email },
          ]
            .filter((member) => member.name)
            .map((member, index) => (
              <View key={index} style={styles.memberRow}>
                <Icon name="user" size={20} color="#2563eb" style={styles.icon} />
                <Text style={styles.memberText}>{member.name} <Text style={styles.memberEmail}>({member.email})</Text></Text>
              </View>
            ))}
        </Animatable.View>
      )}

      <View style={styles.billContainer}>
        <View style={styles.totalBillHeader}>
          <Text style={styles.label}>Total Bill</Text>
          <TextInput
            style={styles.totalInput}
            placeholder="₹0.00"
            keyboardType="numeric"
            value={totalBill ? totalBill.toString() : ""}
            onChangeText={updateTotalBill}
          />
        </View>

        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          style={styles.participantList}
        />

        <View style={styles.footerActions}>
          <TouchableOpacity onPress={addParticipant} style={styles.addButton}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Participant</Text>
          </TouchableOpacity>
          <Text style={styles.totalText}>Total: ₹{totalBill.toFixed(2)}</Text>
        </View>

        <TouchableOpacity onPress={sendBillToParticipants} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send Bill</Text>
          <Icon name="send" size={20} color="#fff" style={styles.sendIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 20,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  groupDetails: {
    padding: 15,
    marginHorizontal: 15,
    marginTop: -10,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  groupSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  memberText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  billContainer: {
    flex: 1,
    padding: 20,
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 3,
  },
  totalBillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalInput: {
    width: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    textAlign: 'right',
  },
  participantList: {
    flexGrow: 1,
  },
  participantCard: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  amountInput: {
    width: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
  removeButton: {
    padding: 5,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  sendIcon: {
    marginLeft: 5,
  },
});
