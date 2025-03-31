import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

const SUPABASE_URL = "https://nrbndwnsdegkfexmmaak.supabase.co";
const SUPABASE_PUBLIC_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYm5kd25zZGVna2ZleG1tYWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NDU2NjAsImV4cCI6MjA1MzMyMTY2MH0.Ypit5O8aG9QuEiWyotZtjJ-ixErkHhN6zk-Yd9VKcwE";

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
  const flatListRef = useRef<FlatList>(null);

  const dismissKeyboard = () => Keyboard.dismiss();

  useEffect(() => {
    const fetchLatestGroup = async () => {
      try {
        const storedGroupData = await AsyncStorage.getItem("groupData");
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

  const updateTotalBill = (text: string) => {
    const newTotal = parseFloat(text.replace("₹", "")) || 0;
    setTotalBill(newTotal);
    const equalShare = newTotal / participants.length;
    setParticipants(
      participants.map((p) => ({
        ...p,
        items: [{ description: "Shared Amount", amount: equalShare }],
      }))
    );
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
    const newParticipants = [
      ...participants.map((p) => ({
        ...p,
        items: [{ description: "Shared Amount", amount: equalShare }],
      })),
      { name: "", email: "", items: [{ description: "Shared Amount", amount: equalShare }] },
    ];
    setParticipants(newParticipants);
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: newParticipants.length - 1,
          animated: true,
          viewPosition: 0,
        });
      }
    }, 300);
  };

  const removeParticipant = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    const equalShare = totalBill / newParticipants.length;
    setParticipants(
      newParticipants.map((p) => ({
        ...p,
        items: [{ description: "Shared Amount", amount: equalShare }],
      }))
    );
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
    <Animatable.View animation="fadeInUp" duration={300} style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <TextInput
          style={[styles.input, { borderColor: item.name ? "#d1d5db" : "#2563eb" }]}
          placeholder="Enter name"
          value={item.name}
          onChangeText={(text) =>
            setParticipants(participants.map((p, idx) => (idx === index ? { ...p, name: text } : p)))
          }
          onFocus={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
              });
            }
          }}
          returnKeyType="next"
        />
        {participants.length > 1 && (
          <TouchableOpacity onPress={() => removeParticipant(index)} style={styles.removeButton}>
            <Icon name="trash-2" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[styles.input, { borderColor: item.email ? "#d1d5db" : "#2563eb" }]}
        placeholder="email@example.com"
        value={item.email}
        onChangeText={(text) =>
          setParticipants(participants.map((p, idx) => (idx === index ? { ...p, email: text } : p)))
        }
        onFocus={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5,
            });
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount:</Text>
        <TextInput
          style={[styles.amountInput, { borderColor: item.items[0].amount ? "#d1d5db" : "#2563eb" }]}
          placeholder="0.00"
          value={item.items[0].amount.toString()}
          keyboardType="numeric"
          onChangeText={(text) => handleAmountChange(index, text)}
          onFocus={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
              });
            }
          }}
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
        />
      </View>
    </Animatable.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 40}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{groupDetails?.name || "Bill Splitting"}</Text>
          </View>

          <View style={styles.billContainer}>
            <View style={styles.totalBillHeader}>
              <Text style={styles.label}>Total Bill</Text>
              <TextInput
                style={[styles.totalInput, { borderColor: totalBill ? "#d1d5db" : "#2563eb" }]}
                placeholder="₹0.00"
                keyboardType="numeric"
                value={totalBill ? `₹${totalBill}` : ""}
                onChangeText={updateTotalBill}
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
              />
            </View>

            <FlatList
              ref={flatListRef}
              data={participants}
              renderItem={renderParticipant}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.participantList}
              contentContainerStyle={{ paddingBottom: 10 }} // Increased for blurred summary
              keyboardShouldPersistTaps="handled"
            />

            <View style={styles.footerActions}>
              <TouchableOpacity onPress={addParticipant} style={styles.addButton}>
                <Icon name="plus" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.summaryContainer}>
                <Text style={styles.totalText}>Total: ₹{totalBill.toFixed(2)}</Text>
                {participants.map((participant, index) => (
                  <Text key={index} style={styles.participantSummary}>
                    {participant.name || `Person ${index + 1}`}: ₹{participant.items[0].amount.toFixed(2)}
                  </Text>
                ))}
              </View>
              <TouchableOpacity onPress={sendBillToParticipants} style={styles.sendButton}>
                <Text style={styles.sendButtonText}>Send Bill</Text>
                <Icon name="send" size={22} color="#fff" style={styles.sendIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  loadingText: {
    fontSize: 22,
    color: "#2563eb",
    fontWeight: "500",
    marginTop: 10,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#2563eb",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  billContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
  },
  totalBillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalInput: {
    width: 140,
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    backgroundColor: "#fff",
    textAlign: "right",
  },
  participantList: {
    flexGrow: 1,
  },
  participantCard: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  participantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    backgroundColor: "#fff",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  amountLabel: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  amountInput: {
    width: 120,
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    textAlign: "right",
    backgroundColor: "#fff",
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 20,
  },
  footerActions: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
  },
  addButton: {
    position: "absolute",
    bottom: 80,
    right: 15,
    width: 60,
    height: 60,
    backgroundColor: "#22c55e",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    width: "90%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  totalText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
    textAlign: "center",
  },
  participantSummary: {
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 5,
    textAlign: "center",
  },
  sendButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10,
  },
  sendIcon: {
    marginLeft: 5,
  },
});