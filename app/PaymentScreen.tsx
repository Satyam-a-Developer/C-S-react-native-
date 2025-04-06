import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'fontawesome';
  color: string;
  packageName?: string;
  urlScheme?: string;
}

interface Transaction {
  id: string;
  method: string;
  amount: string;
  date: string;
  status: 'success' | 'failed' | 'pending';
}

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  const [cardErrors, setCardErrors] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  });

  const [upiError, setUpiError] = useState('');

  const paymentOptions: PaymentMethod[] = [
    {
      id: 'gpay',
      name: 'Google Pay',
      icon: 'google-pay',
      iconType: 'fontawesome',
      color: '#4285F4',
      packageName: 'com.google.android.apps.nbu.paisa.user',
      urlScheme: 'gpay://',
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: 'mobile-alt',
      iconType: 'fontawesome',
      color: '#5F259F',
      packageName: 'com.phonepe.app',
      urlScheme: 'phonepe://',
    },
    {
      id: 'paytm',
      name: 'Paytm',
      icon: 'wallet',
      iconType: 'ionicons',
      color: '#00BAF2',
      packageName: 'net.one97.paytm',
      urlScheme: 'paytm://',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'credit-card',
      iconType: 'fontawesome',
      color: '#1E293B',
    },
  ];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, '').replace(/\D/g, '');
    const groups = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }
    return groups.join(' ').trim();
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    } else if (cleaned.length === 2) {
      return `${cleaned}/`;
    }
    return cleaned;
  };

  const validateCard = () => {
    const errors = { number: '', holder: '', expiry: '', cvv: '' };
    let isValid = true;

    const luhnCheck = (num: string) => {
      let sum = 0;
      let shouldDouble = false;
      for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num.charAt(i));
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      return sum % 10 === 0;
    };

    const cleanedCardNumber = cardNumber.replace(/\s+/g, '');
    if (cleanedCardNumber.length !== 16 || !luhnCheck(cleanedCardNumber)) {
      errors.number = 'Please enter a valid 16-digit card number';
      isValid = false;
    }

    if (!cardHolder.trim()) {
      errors.holder = 'Please enter cardholder name';
      isValid = false;
    }

    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryPattern.test(expiry)) {
      errors.expiry = 'Enter a valid date (MM/YY)';
      isValid = false;
    } else {
      const [month, year] = expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
      const today = new Date();
      if (expiryDate < today) {
        errors.expiry = 'Card has expired';
        isValid = false;
      }
    }

    if (cvv.length !== 3 || !/^\d{3}$/.test(cvv)) {
      errors.cvv = 'Enter a valid 3-digit CVV';
      isValid = false;
    }

    setCardErrors(errors);
    return isValid;
  };

  const validateUpi = () => {
    if (selectedMethod === 'gpay' || selectedMethod === 'phonepe' || selectedMethod === 'paytm') {
      if (!upiId.trim()) {
        setUpiError('Please enter a valid UPI ID (e.g., name@upi)');
        return false;
      }
      const upiPattern = /^[\w.-]+@[\w.-]+$/;
      if (!upiPattern.test(upiId)) {
        setUpiError('Please enter a valid UPI ID (e.g., name@upi)');
        return false;
      }
    }
    setUpiError('');
    return true;
  };

  const saveTransaction = async (transaction: Transaction) => {
    try {
      const existingTransactions = await AsyncStorage.getItem('transactions');
      const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];
      transactions.push(transaction);
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const simulatePaymentApiCall = async (paymentData: any) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.9) {
          resolve({ status: 'success', transactionId: `TXN${Date.now()}` });
        } else {
          reject(new Error('Payment processing failed'));
        }
      }, 2000);
    });
  };

  const openPaymentApp = async (method: PaymentMethod) => {
    if (!validateUpi()) return;

    setIsProcessing(true);
    const orderId = `ORD${Date.now()}`;
    const amount = "999.00";
    const transaction: Transaction = {
      id: orderId,
      method: method.name,
      amount,
      date: new Date().toISOString(),
      status: 'pending',
    };

    try {
      // Specific handling for Google Pay
      if (method.id === 'gpay') {
        const gpayUrl = `gpay://upi/pay?pa=${upiId}&pn=Store%20Payment&mc=5411&tid=${orderId}&tr=${orderId}&tn=Order%20Payment&am=${amount}&cu=INR`;
        
        if (Platform.OS === 'android') {
          // Android-specific Google Pay intent
          const gpayIntent = `intent://${method.packageName}/upi/pay?pa=${upiId}&pn=Store%20Payment&mc=5411&tid=${orderId}&tr=${orderId}&tn=Order%20Payment&am=${amount}&cu=INR#Intent;scheme=gpay;package=com.google.android.apps.nbu.paisa.user;end`;
          
          try {
            const canOpen = await Linking.canOpenURL(gpayIntent);
            if (canOpen) {
              await Linking.openURL(gpayIntent);
            } else {
              await Linking.openURL(gpayUrl);
            }
            transaction.status = 'success';
            await saveTransaction(transaction);
            setTransactionStatus('success');
          } catch (error) {
            console.log('Google Pay intent failed, trying direct URL:', error);
            await Linking.openURL(gpayUrl);
            transaction.status = 'success';
            await saveTransaction(transaction);
            setTransactionStatus('success');
          }
        } else {
          // iOS-specific Google Pay handling
          const canOpen = await Linking.canOpenURL(method.urlScheme || '');
          if (canOpen) {
            await Linking.openURL(gpayUrl);
            transaction.status = 'success';
            await saveTransaction(transaction);
            setTransactionStatus('success');
          } else {
            throw new Error('Google Pay not installed');
          }
        }
      } else {
        // Handling for other UPI apps
        const upiUrl = `${method.urlScheme}pay?pa=${upiId}&pn=Store%20Payment&mc=5411&tid=${orderId}&tr=${orderId}&tn=Order%20Payment&am=${amount}&cu=INR`;
        
        if (Platform.OS === 'android') {
          const appIntent = `intent://pay?pa=${upiId}&pn=Store%20Payment&mc=5411&tid=${orderId}&tr=${orderId}&tn=Order%20Payment&am=${amount}&cu=INR#Intent;scheme=${method.urlScheme?.replace('://', '')};package=${method.packageName};end`;
          
          try {
            await Linking.openURL(appIntent);
            transaction.status = 'success';
            await saveTransaction(transaction);
            setTransactionStatus('success');
          } catch (error) {
            await Linking.openURL(upiUrl);
            transaction.status = 'success';
            await saveTransaction(transaction);
            setTransactionStatus('success');
          }
        } else {
          const canOpen = await Linking.canOpenURL(method.urlScheme || '');
          if (canOpen) {
            await Linking.openURL(upiUrl);
            transaction.status = 'success';
            await saveTransaction(transaction);
            setTransactionStatus('success');
          } else {
            throw new Error(`${method.name} not installed`);
          }
        }
      }

      setTimeout(() => {
        setIsProcessing(false);
        navigation.navigate('OrderConfirmation', { transaction });
      }, 1000);
    } catch (error) {
      transaction.status = 'failed';
      await saveTransaction(transaction);
      setTransactionStatus('failed');
      handleUpiAppNotFound(method);
    }
  };

  const handleUpiAppNotFound = (method: PaymentMethod) => {
    setIsProcessing(false);
    const storeUrl = Platform.OS === 'ios'
      ? `https://apps.apple.com/search?term=${method.name.toLowerCase().replace(/\s+/g, '-')}`
      : `market://details?id=${method.packageName}`;

    Alert.alert(
      'UPI App Required',
      `To complete this payment, you need the ${method.name} app.`,
      [
        { text: 'Get App', onPress: () => Linking.openURL(storeUrl) },
        { text: 'Use Different Method', style: 'cancel' }
      ]
    );
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    Keyboard.dismiss();

    if (selectedMethod === 'card') {
      if (!validateCard()) return;

      setIsProcessing(true);
      const transaction: Transaction = {
        id: `ORD${Date.now()}`,
        method: 'Card',
        amount: '999.00',
        date: new Date().toISOString(),
        status: 'pending',
      };

      try {
        const paymentData = {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          cardHolder,
          expiry,
          cvv,
          amount: '999.00',
        };

        const response = await simulatePaymentApiCall(paymentData);
        transaction.status = 'success';
        await saveTransaction(transaction);
        setTransactionStatus('success');

        setTimeout(() => {
          setIsProcessing(false);
          Alert.alert(
            'Payment Successful',
            'Your card payment has been processed successfully.',
            [{ text: 'OK', onPress: () => navigation.navigate('OrderConfirmation', { transaction }) }]
          );
        }, 500);
      } catch (error) {
        transaction.status = 'failed';
        await saveTransaction(transaction);
        setTransactionStatus('failed');
        setIsProcessing(false);
        Alert.alert(
          'Payment Failed',
          'There was an error processing your payment. Please try again.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    const selectedOption = paymentOptions.find(option => option.id === selectedMethod);
    if (selectedOption) {
      await openPaymentApp(selectedOption);
    }
  };

  const renderIcon = (method: PaymentMethod) => {
    if (method.iconType === 'ionicons') {
      return <Ionicons name={method.icon as any} size={24} color={selectedMethod === method.id ? method.color : '#64748B'} />;
    } else {
      return <FontAwesome5 name={method.icon} size={22} color={selectedMethod === method.id ? method.color : '#64748B'} />;
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
            </View>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>₹999.00</Text>
              </View>
              {transactionStatus && (
                <Text style={[
                  styles.statusText,
                  { color: transactionStatus === 'success' ? '#22C55E' : '#EF4444' }
                ]}>
                  {transactionStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
                </Text>
              )}
            </View>

            <View style={styles.paymentOptions}>
              <Text style={styles.sectionTitle}>Choose Payment Method</Text>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.paymentOption,
                    selectedMethod === option.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setSelectedMethod(option.id);
                    setCardErrors({ number: '', holder: '', expiry: '', cvv: '' });
                    setUpiError('');
                    setTransactionStatus(null);
                  }}
                >
                  <View style={[
                    styles.iconContainer,
                    selectedMethod === option.id && { backgroundColor: `${option.color}20` }
                  ]}>
                    {renderIcon(option)}
                  </View>
                  <Text style={[
                    styles.optionText,
                    selectedMethod === option.id && { color: option.color, fontWeight: '600' },
                  ]}>
                    {option.name}
                  </Text>
                  {selectedMethod === option.id && (
                    <Ionicons name="checkmark-circle" size={22} color={option.color} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedMethod && (
              <Animated.View style={styles.paymentDetails} entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
                {selectedMethod === 'card' && (
                  <View style={styles.cardDetails}>
                    <Text style={styles.detailsTitle}>Card Details</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Card Number</Text>
                      <TextInput
                        style={[styles.input, cardErrors.number && styles.inputError]}
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                        keyboardType="numeric"
                        maxLength={19}
                      />
                      {cardErrors.number && <Text style={styles.errorText}>{cardErrors.number}</Text>}
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Cardholder Name</Text>
                      <TextInput
                        style={[styles.input, cardErrors.holder && styles.inputError]}
                        placeholder="Name on card"
                        value={cardHolder}
                        onChangeText={setCardHolder}
                        autoCapitalize="words"
                      />
                      {cardErrors.holder && <Text style={styles.errorText}>{cardErrors.holder}</Text>}
                    </View>
                    <View style={styles.cardExtra}>
                      <View style={[styles.inputContainer, { width: '48%' }]}>
                        <Text style={styles.inputLabel}>Expiry Date</Text>
                        <TextInput
                          style={[styles.input, cardErrors.expiry && styles.inputError]}
                          placeholder="MM/YY"
                          value={expiry}
                          onChangeText={(text) => setExpiry(formatExpiry(text))}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                        {cardErrors.expiry && <Text style={styles.errorText}>{cardErrors.expiry}</Text>}
                      </View>
                      <View style={[styles.inputContainer, { width: '48%' }]}>
                        <Text style={styles.inputLabel}>CVV</Text>
                        <TextInput
                          style={[styles.input, cardErrors.cvv && styles.inputError]}
                          placeholder="000"
                          value={cvv}
                          onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
                          keyboardType="numeric"
                          maxLength={3}
                          secureTextEntry
                        />
                        {cardErrors.cvv && <Text style={styles.errorText}>{cardErrors.cvv}</Text>}
                      </View>
                    </View>
                  </View>
                )}
                {['gpay', 'phonepe', 'paytm'].includes(selectedMethod ?? '') && (
                  <View style={styles.upiDetails}>
                    <Text style={styles.detailsTitle}>UPI Details</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>UPI ID</Text>
                      <TextInput
                        style={[styles.input, upiError && styles.inputError]}
                        placeholder="name@upi"
                        value={upiId}
                        onChangeText={setUpiId}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {upiError && <Text style={styles.errorText}>{upiError}</Text>}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            <View style={styles.securityMessage}>
              <Ionicons name="lock-closed" size={18} color="#64748B" />
              <Text style={styles.securityText}>
                Your payment information is secure and encrypted
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.bottomContainer, keyboardVisible && { display: 'none' }]}>
            <TouchableOpacity
              style={[
                styles.payButton,
                !selectedMethod && styles.disabledButton,
                isProcessing && styles.processingButton,
              ]}
              onPress={handlePayment}
              disabled={!selectedMethod || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.payButtonText}>Pay ₹999.00</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 15,
  },
  orderSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  paymentOptions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  optionText: {
    fontSize: 16,
    color: '#334155',
    marginLeft: 15,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  paymentDetails: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
  },
  cardDetails: {
    marginTop: 5,
  },
  upiDetails: {
    marginTop: 5,
  },
  cardExtra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  processingButton: {
    backgroundColor: '#0056b3',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});