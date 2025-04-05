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

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'fontawesome';
  color: string;
  packageName?: string; // Android package name
  urlScheme?: string;   // iOS URL scheme
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

  // Card validation states
  const [cardErrors, setCardErrors] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  });

  // UPI validation state
  const [upiError, setUpiError] = useState('');

  // Enhanced payment options with app-specific data
  const paymentOptions: PaymentMethod[] = [
    { 
      id: 'gpay', 
      name: 'Google Pay', 
      icon: 'google-pay', 
      iconType: 'fontawesome', 
      color: '#4285F4',
      packageName: 'com.google.android.apps.nbu.paisa.user',
      urlScheme: 'googlepay://'
    },
    { 
      id: 'phonepe', 
      name: 'PhonePe', 
      icon: 'mobile-alt', 
      iconType: 'fontawesome', 
      color: '#5F259F',
      packageName: 'com.phonepe.app',
      urlScheme: 'phonepe://'
    },
    { 
      id: 'paytm', 
      name: 'Paytm', 
      icon: 'wallet', 
      iconType: 'ionicons', 
      color: '#00BAF2',
      packageName: 'net.one97.paytm',
      urlScheme: 'paytm://'
    },
    { 
      id: 'card', 
      name: 'Credit/Debit Card', 
      icon: 'credit-card', 
      iconType: 'fontawesome', 
      color: '#1E293B' 
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

  // Format card number as user types (adds spaces every 4 digits)
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, '').replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }
    
    return groups.join(' ').trim();
  };

  // Format expiry date as MM/YY
  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length >= 3) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    } else if (cleaned.length === 2) {
      return `${cleaned}/`;
    }
    
    return cleaned;
  };

  // Validate card details
  const validateCard = () => {
    const errors = {
      number: '',
      holder: '',
      expiry: '',
      cvv: '',
    };
    let isValid = true;

    // Card number validation (basic check for length)
    if (cardNumber.replace(/\s+/g, '').length !== 16) {
      errors.number = 'Please enter a valid 16-digit card number';
      isValid = false;
    }

    // Card holder validation
    if (!cardHolder.trim()) {
      errors.holder = 'Please enter cardholder name';
      isValid = false;
    }

    // Expiry validation
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryPattern.test(expiry)) {
      errors.expiry = 'Enter a valid date (MM/YY)';
      isValid = false;
    } else {
      // Check if card is expired
      const [month, year] = expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
      const today = new Date();
      
      if (expiryDate < today) {
        errors.expiry = 'Card has expired';
        isValid = false;
      }
    }

    // CVV validation
    if (cvv.length !== 3) {
      errors.cvv = 'Enter a valid 3-digit CVV';
      isValid = false;
    }

    setCardErrors(errors);
    return isValid;
  };

  // Validate UPI ID
  const validateUpi = () => {
    const upiPattern = /^[\w.-]+@[\w.-]+$/;
    
    if (!upiPattern.test(upiId)) {
      setUpiError('Please enter a valid UPI ID (e.g., name@upi)');
      return false;
    }
    
    setUpiError('');
    return true;
  };

  // Handle UPI payment with improved app handling
  const handleUpiPayment = async (method: PaymentMethod) => {
    if (!validateUpi()) {
      return;
    }

    setIsProcessing(true);

    // Create UPI payment URL with more details and the proper reference
    const orderId = `ORD${Date.now()}`;
    const upiUrl = `upi://pay?pa=${upiId}&pn=Store%20Payment&mc=5411&tid=${orderId}&tr=${orderId}&tn=Order%20Payment&am=999.00&cu=INR`;
    
    try {
      // Try the generic UPI intent first - this works with any UPI app on the device
      Linking.openURL(upiUrl)
        .then(() => {
          console.log('UPI URL opened successfully');
          // Wait briefly to ensure the UPI app has time to open
          setTimeout(() => setIsProcessing(false), 500);
        })
        .catch(async (error) => {
          console.error('Error opening generic UPI URL:', error);
          
          // If generic UPI fails, try the app-specific scheme as fallback
          if (method.urlScheme || method.packageName) {
            try {
              const appUrl = Platform.OS === 'ios' ? method.urlScheme : `${method.packageName}://`;
              if (appUrl) {
                const canOpen = await Linking.canOpenURL(appUrl);
                if (canOpen) {
                  await Linking.openURL(appUrl);
                  setTimeout(() => setIsProcessing(false), 500);
                } else {
                  handleUpiAppNotFound(method);
                }
              } else {
                handleUpiAppNotFound(method);
              }
            } catch (appError) {
              console.error('Error opening specific app:', appError);
              handleUpiAppNotFound(method);
            }
          } else {
            handleUpiAppNotFound(method);
          }
        });
    } catch (error) {
      console.error('General error in UPI handling:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Something went wrong while processing your payment.');
    }
  };

  // Handle case when UPI app is not found
  const handleUpiAppNotFound = (method: PaymentMethod) => {
    setIsProcessing(false);
    
    // Get system-appropriate store URL
    const storeUrl = Platform.OS === 'ios' 
      ? `https://apps.apple.com/search?term=${method.name.toLowerCase().replace(/\s+/g, '-')}` 
      : `market://details?id=${method.packageName}`;
    
    Alert.alert(
      'UPI App Required', 
      `To complete this payment, you need the ${method.name} app.`,
      [
        { 
          text: 'Get App', 
          onPress: () => Linking.openURL(storeUrl)
        },
        { 
          text: 'Use Different Method', 
          style: 'cancel'
        }
      ]
    );
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    Keyboard.dismiss();

    if (selectedMethod === 'card') {
      if (!validateCard()) {
        return;
      }

      setIsProcessing(true);
      
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        Alert.alert(
          'Payment Successful',
          'Your card payment has been processed successfully.',
          [{ text: 'OK', onPress: () => navigation.navigate('OrderConfirmation') }]
        );
      }, 2000);
      
      return;
    }

    // Handle UPI payment methods
    const selectedOption = paymentOptions.find(option => option.id === selectedMethod);
    if (selectedOption) {
      handleUpiPayment(selectedOption);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
            </View>

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>₹999.00</Text>
              </View>
            </View>

            {/* Payment Options */}
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
                    // Reset errors when changing payment method
                    setCardErrors({ number: '', holder: '', expiry: '', cvv: '' });
                    setUpiError('');
                  }}
                >
                  <View style={[styles.iconContainer, selectedMethod === option.id && { backgroundColor: `${option.color}20` }]}>
                    {renderIcon(option)}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedMethod === option.id && { color: option.color, fontWeight: '600' },
                    ]}
                  >
                    {option.name}
                  </Text>
                  {selectedMethod === option.id && (
                    <Ionicons name="checkmark-circle" size={22} color={option.color} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Details */}
            {selectedMethod && (
              <Animated.View 
                style={styles.paymentDetails}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              >
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
                        maxLength={19} // 16 digits + 3 spaces
                      />
                      {cardErrors.number ? <Text style={styles.errorText}>{cardErrors.number}</Text> : null}
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
                      {cardErrors.holder ? <Text style={styles.errorText}>{cardErrors.holder}</Text> : null}
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
                        {cardErrors.expiry ? <Text style={styles.errorText}>{cardErrors.expiry}</Text> : null}
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
                        {cardErrors.cvv ? <Text style={styles.errorText}>{cardErrors.cvv}</Text> : null}
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
                      {upiError ? <Text style={styles.errorText}>{upiError}</Text> : null}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Security Message */}
            <View style={styles.securityMessage}>
              <Ionicons name="lock-closed" size={18} color="#64748B" />
              <Text style={styles.securityText}>
                Your payment information is secure and encrypted
              </Text>
            </View>
          </ScrollView>

          {/* Pay Button - Fixed at bottom */}
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
    paddingBottom: 100, // Extra padding to avoid button overlap
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