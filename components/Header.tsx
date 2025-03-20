import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>C&S</Text>
      <Link href="/login" style={styles.loginButton}>
        <Text style={styles.loginText}>Create Group</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  logo: {
    fontSize: 24,
    marginTop: 40,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    marginTop: 40,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
