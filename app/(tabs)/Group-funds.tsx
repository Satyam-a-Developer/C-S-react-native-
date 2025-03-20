import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Send, UserPlus, TrendingUp } from 'lucide-react-native';

export default function FundScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.balance}>₹12,345.67</Text>
        <Text style={styles.balanceLabel}>Available Balance</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <View style={styles.actionButton}>
          <Send size={30} color="#007AFF" />
          <Text style={styles.actionText}>Send</Text>
        </View>
        <View style={styles.actionButton}>
          <UserPlus size={30} color="#007AFF" />
          <Text style={styles.actionText}>Request</Text>
        </View>
        <View style={styles.actionButton}>
          <TrendingUp size={30} color="#007AFF" />
          <Text style={styles.actionText}>Invest</Text>
        </View>
      </View>

      {/* Transactions Section */}
      <View style={styles.transactions}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {[
          { name: 'Netflix Subscription', amount: -13.99, date: 'Today' },
          { name: 'Salary Deposit', amount: 3500, date: 'Yesterday' },
          { name: 'Grocery Store', amount: -85.43, date: '2 days ago' },
        ].map((transaction, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionName}>{transaction.name}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                { color: transaction.amount > 0 ? '#34C759' : '#FF3B30' },
              ]}>
              ₹{Math.abs(transaction.amount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
  },
  balance: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 5,
  },
  transactions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000000',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  transactionDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
