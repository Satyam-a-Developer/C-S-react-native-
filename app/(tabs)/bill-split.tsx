import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    {
      name: "",
      email: "",
      items: [{ description: "Shared Amount", amount: 0 }],
    },
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
          console.log("No group found in AsyncStorage");
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
          console.log("No group found with name:", savedGroupName);
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
    setParticipants(
      participants.map((participant) => ({
        ...participant,
        items: [{ description: "Shared Amount", amount: equalShare }],
      }))
    );
  };

  const handleAmountChange = (participantIndex: number, value: string) => {
    const newAmount = parseFloat(value) || 0;
    const totalOtherParticipants = participants.reduce(
      (sum, participant, index) =>
        index === participantIndex ? sum : sum + participant.items[0].amount,
      0
    );
    const remainingTotal = totalBill - newAmount;

    if (remainingTotal < 0) {
      Alert.alert("Error", "Amount exceeds total bill!");
      return;
    }

    const newParticipants = participants.map((participant, index) => {
      if (index === participantIndex) {
        return {
          ...participant,
          items: [{ description: "Shared Amount", amount: newAmount }],
        };
      }
      const proportionalShare =
        (participant.items[0].amount / totalOtherParticipants) *
          remainingTotal || 0;
      return {
        ...participant,
        items: [{ description: "Shared Amount", amount: proportionalShare }],
      };
    });

    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    const equalShare = totalBill / (participants.length + 1);
    const newParticipants = [
      ...participants,
      {
        name: "",
        email: "",
        items: [{ description: "Shared Amount", amount: equalShare }],
      },
    ];
    setParticipants(
      newParticipants.map((participant) => ({
        ...participant,
        items: [{ description: "Shared Amount", amount: totalBill / newParticipants.length }],
      }))
    );
  };

  const removeParticipant = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    const equalShare = totalBill / newParticipants.length;
    setParticipants(
      newParticipants.map((participant) => ({
        ...participant,
        items: [{ description: "Shared Amount", amount: equalShare }],
      }))
    );
  };

  const sendBillToParticipants = async () => {
    const emailAddresses = participants.map((p) => p.email).join(", ");
    const participantDetails = participants
      .map((p) => `₹{p.name}: ₹₹{p.items[0].amount.toFixed(2)}`)
      .join("\n");

    const emailData = {
      groupName: groupDetails?.name || "",
      participants: participantDetails,
      totalBill: totalBill.toFixed(2),
    };

    const messageBody = `
      Bill Splitting Test
      Group: ₹{emailData.groupName || "No Group Name"}
      Total Bill: ₹₹{emailData.totalBill}
      Participants:
      ₹{emailData.participants}
      This is a test email to verify functionality.
      Email recipients: ₹{emailAddresses}
    `;

    try {
      const response = await fetch(
        "https://formsubmit.co/ajax/satyampannaballer@gmail.com",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _subject: "Bill Splitting Test Email",
            email: "anyogoose@gmail.com",
            _replyto: "anyogoose@gmail.com",
            message: messageBody,
            _next: "https://yourwebsite.com/thank-you",
            _captcha: "false",
          }),
        }
      );

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
    <View style={styles.participantContainer}>
      <View style={styles.participantHeader}>
        <Icon name="user" size={20} color="#6b7280" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Participant Name"
          value={item.name}
          onChangeText={(text) =>
            setParticipants(
              participants.map((p, idx) =>
                idx === index ? { ...p, name: text } : p
              )
            )
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Participant Email"
          value={item.email}
          onChangeText={(text) =>
            setParticipants(
              participants.map((p, idx) =>
                idx === index ? { ...p, email: text } : p
              )
            )
          }
        />
        {participants.length > 1 && (
          <TouchableOpacity
            onPress={() => removeParticipant(index)}
            style={styles.removeButton}
          >
            <Icon name="trash-2" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={styles.amountInput}
        placeholder="Amount"
        value={item.items[0].amount.toFixed(2)}
        keyboardType="numeric"
        onChangeText={(text) => handleAmountChange(index, text)}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groupDetails && (
        <View style={styles.groupDetails}>
          <Text style={styles.groupTitle}>{groupDetails.name}</Text>
          {[
            { name: groupDetails.member1, email: groupDetails.member1_email },
            { name: groupDetails.member2, email: groupDetails.member2_email },
            { name: groupDetails.member3, email: groupDetails.member3_email },
          ]
            .filter((member) => member.name)
            .map((member, index) => (
              <View key={index} style={styles.memberRow}>
                <Icon name="user" size={20} color="#6b7280" style={styles.icon} />
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>({member.email})</Text>
              </View>
            ))}
        </View>
      )}

      <Text style={styles.header}>Bill Splitting</Text>

      <View style={styles.billContainer}>
        <Text style={styles.label}>Total Bill</Text>
        <TextInput
          style={styles.totalInput}
          placeholder="Enter total bill"
          keyboardType="numeric"
          value={totalBill ? totalBill.toString() : ""}
          onChangeText={updateTotalBill}
        />

        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={true}
          style={styles.flatList}
          nestedScrollEnabled={true}
        />

        <View style={styles.actions}>
          <TouchableOpacity onPress={addParticipant} style={styles.addButton}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Participant</Text>
          </TouchableOpacity>
          <Text style={styles.totalText}>Total Bill: ₹{totalBill.toFixed(2)}</Text>
        </View>

        <TouchableOpacity onPress={sendBillToParticipants} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send Bill to Participants</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#374151",
  },
  groupDetails: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  memberEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 24,
  },
  billContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  totalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  flatList: {
    flexGrow: 1,
    maxHeight: '60%', // Optional: adjust or remove based on your needs
  },
  participantContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 16,
    marginBottom: 16,
  },
  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginRight: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    width: 100,
  },
  removeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 24,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});