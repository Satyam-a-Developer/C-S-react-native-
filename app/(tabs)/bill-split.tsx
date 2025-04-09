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
  StatusBar,
  Dimensions,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get("window");
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
  const [sendingBill, setSendingBill] = useState(false);
  const navigation = useNavigation<NavigationProp<any>>();
  const flatListRef = useRef<FlatList>(null);
  
  // Create refs for TextInputs to handle tab navigation
  const inputRefs = useRef<Array<TextInput | null>>([]);

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

  // Update inputRefs when participants change
  useEffect(() => {
    inputRefs.current = Array(participants.length * 3).fill(null);
  }, [participants.length]);

  const updateTotalBill = (text: string) => {
    const newTotal = parseFloat(text.replace(/[^0-9.]/g, "")) || 0;
    setTotalBill(newTotal);
    const equalShare = newTotal / participants.length;
    setParticipants(
      participants.map((p) => ({
        ...p,
        items: [{ description: "Shared Amount", amount: equalShare }],
      }))
    );
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const handleAmountChange = (participantIndex: number, value: string) => {
    const newAmount = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
    const totalOtherParticipants = participants.reduce(
      (sum, p, idx) => (idx === participantIndex ? sum : sum + p.items[0].amount),
      0
    );
    const remainingTotal = totalBill - newAmount;

    if (remainingTotal < 0) {
      Alert.alert("Exceeds Total", "The amount exceeds the total bill!");
      return;
    }

    const newParticipants = participants.map((p, idx) => {
      if (idx === participantIndex) {
        return { ...p, items: [{ description: "Shared Amount", amount: newAmount }] };
      }
      
      // Calculate proportional share for other participants
      if (totalOtherParticipants === 0) {
        // If all other participants have 0, distribute equally
        const othersCount = participants.length - 1;
        return { ...p, items: [{ description: "Shared Amount", amount: othersCount > 0 ? remainingTotal / othersCount : 0 }] };
      } else {
        const proportionalShare = (p.items[0].amount / totalOtherParticipants) * remainingTotal;
        return { ...p, items: [{ description: "Shared Amount", amount: proportionalShare }] };
      }
    });
    
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    if (participants.length >= 10) {
      Alert.alert("Limit Reached", "You can add up to 10 participants.");
      return;
    }
    
    const equalShare = totalBill / (participants.length + 1);
    const newParticipants = [
      ...participants.map((p) => ({
        ...p,
        items: [{ description: "Shared Amount", amount: equalShare }],
      })),
      { name: "", email: "", items: [{ description: "Shared Amount", amount: equalShare }] },
    ];
    setParticipants(newParticipants);
    
    // Smooth scroll to new participant
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: newParticipants.length - 1,
          animated: true,
          viewPosition: 0.2,
        });
      }
    }, 200);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 1) {
      Alert.alert("Cannot Remove", "At least one participant is required.");
      return;
    }
    
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
    // Validate inputs
    const emptyParticipants = participants.some(p => !p.name || !p.email);
    if (emptyParticipants) {
      Alert.alert("Missing Information", "Please ensure all participants have name and email filled in.");
      return;
    }
    
    if (totalBill <= 0) {
      Alert.alert("Invalid Bill", "Please enter a valid bill amount.");
      return;
    }

    try {
      setSendingBill(true);
      
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

      const response = await fetch("https://formsubmit.co/ajax/satyampannaballer@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: `Bill Split: ${emailData.groupName || "Group"}`,
          email: "anyogoose@gmail.com",
          _replyto: "anyogoose@gmail.com",
          message: messageBody,
          _next: "https://yourwebsite.com/thank-you",
          _captcha: "false",
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Success!", 
          "Bill has been sent to all participants.",
          [{ text: "OK", style: "default" }]
        );
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      console.error("Error sending bill:", error);
      Alert.alert("Error", "Failed to send the bill. Please try again.");
    } finally {
      setSendingBill(false);
    }
  };

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => {
    const baseIndex = index * 3; // Each participant has 3 inputs: name, email, amount
    
    return (
      <Animatable.View 
        animation="fadeInUp" 
        duration={300} 
        delay={index * 50}
        style={styles.participantCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.participantTitle}>
            {item.name ? item.name : `Participant ${index + 1}`}
          </Text>
          {participants.length > 1 && (
            <TouchableOpacity 
              onPress={() => removeParticipant(index)} 
              style={styles.removeButton}
              activeOpacity={0.7}
            >
              <Icon name="x" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.inputWrapper}>
          <Icon name="user" size={18} color="#64748b" style={styles.inputIcon} />
          <TextInput
            ref={ref => inputRefs.current[baseIndex] = ref}
            style={[
              styles.input, 
              { borderColor: item.name ? "#d1d5db" : "#6366f1" }
            ]}
            placeholder="Name"
            placeholderTextColor="#9ca3af"
            value={item.name}
            onChangeText={(text) =>
              setParticipants(participants.map((p, idx) => 
                idx === index ? { ...p, name: text } : p
              ))
            }
            onFocus={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.3,
                });
              }
            }}
            returnKeyType="next"
            onSubmitEditing={() => {
              inputRefs.current[baseIndex + 1]?.focus();
            }}
            blurOnSubmit={false}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Icon name="mail" size={18} color="#64748b" style={styles.inputIcon} />
          <TextInput
            ref={ref => inputRefs.current[baseIndex + 1] = ref}
            style={[
              styles.input, 
              { borderColor: item.email ? "#d1d5db" : "#6366f1" }
            ]}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={item.email}
            onChangeText={(text) =>
              setParticipants(participants.map((p, idx) => 
                idx === index ? { ...p, email: text } : p
              ))
            }
            onFocus={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.3,
                });
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => {
              inputRefs.current[baseIndex + 2]?.focus();
            }}
            blurOnSubmit={false}
          />
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              ref={ref => inputRefs.current[baseIndex + 2] = ref}
              style={[
                styles.amountInput, 
                { borderColor: item.items[0].amount > 0 ? "#d1d5db" : "#6366f1" }
              ]}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              value={item.items[0].amount > 0 ? item.items[0].amount.toString() : ""}
              keyboardType="numeric"
              onChangeText={(text) => handleAmountChange(index, text)}
              onFocus={() => {
                if (flatListRef.current) {
                  flatListRef.current.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.3,
                  });
                }
              }}
              returnKeyType="done"
              onSubmitEditing={() => {
                const nextIndex = baseIndex + 3;
                if (nextIndex < inputRefs.current.length) {
                  inputRefs.current[nextIndex]?.focus();
                } else {
                  dismissKeyboard();
                }
              }}
            />
          </View>
        </View>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your group...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="chevron-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerText}>{groupDetails?.name || "Split Bill"}</Text>
            <View style={styles.backButton} />
          </View>

          {/* Compact total bill header */}
          <View style={styles.compactTotalContainer}>
            <View style={styles.compactTotalWrapper}>
              <Text style={styles.compactTotalLabel}>Total Bill:</Text>
              <View style={styles.compactInputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.compactTotalInput}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={totalBill > 0 ? totalBill.toString() : ""}
                  onChangeText={updateTotalBill}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (participants.length > 0 && inputRefs.current[0]) {
                      inputRefs.current[0].focus();
                    } else {
                      dismissKeyboard();
                    }
                  }}
                />
              </View>
            </View>
          </View>

          <View style={styles.billContainer}>
            <FlatList
              ref={flatListRef}
              data={participants}
              renderItem={renderParticipant}
              keyExtractor={(_, index) => `participant-${index}`}
              showsVerticalScrollIndicator={false}
              style={styles.participantList}
              contentContainerStyle={styles.participantListContent}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={4}
              onScrollBeginDrag={dismissKeyboard}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No participants added</Text>
              }
              ListHeaderComponent={
                <Text style={styles.sectionTitle}>Participants</Text>
              }
              ListFooterComponent={
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total:</Text>
                    <Text style={styles.summaryTotal}>{formatCurrency(totalBill)}</Text>
                  </View>
                  <View style={styles.divider} />
                  {participants.map((participant, index) => (
                    <View key={index} style={styles.participantSummaryRow}>
                      <Text style={styles.participantName} numberOfLines={1} ellipsizeMode="tail">
                        {participant.name || `Person ${index + 1}`}
                      </Text>
                      <Text style={styles.participantAmount}>
                        {formatCurrency(participant.items[0].amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              }
            />

            <View style={styles.footerContainer}>
              <TouchableOpacity 
                onPress={addParticipant} 
                style={styles.addButton}
                activeOpacity={0.8}
              >
                <Icon name="user-plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={sendBillToParticipants} 
                style={styles.sendButton}
                activeOpacity={0.8}
                disabled={sendingBill}
              >
                {sendingBill ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.sendButtonText}>Send Bill</Text>
                    <Icon name="send" size={18} color="#fff" style={styles.sendIcon} />
                  </>
                )}
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
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 18,
    color: "#4f46e5",
    fontWeight: "500",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4f46e5",
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  // New compact total bill container
  compactTotalContainer: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  compactTotalWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  compactInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  compactTotalInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    minWidth: 80,
    padding: 6,
    textAlign: "right",
  },
  billContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  participantList: {
    flexGrow: 1,
  },
  participantListContent: {
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  emptyListText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 30,
  },
  participantCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  participantTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  inputIcon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    padding: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountLabel: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
    paddingLeft: 10,
  },
  amountInput: {
    width: 80,
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
    padding: 8,
    textAlign: "right",
  },
  removeButton: {
    backgroundColor: "#ef4444",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "600",
  },
  summaryTotal: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 10,
  },
  participantSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  participantName: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  participantAmount: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
  },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  sendButton: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 12,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  sendIcon: {
    marginLeft: 8,
  },
});