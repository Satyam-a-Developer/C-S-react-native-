import { Tabs } from 'expo-router';
import { Home, Receipt, Wallet, Film, Ticket } from 'lucide-react-native';
import Header from '../../components/Header';
import { View, Animated } from 'react-native';

export default function TabLayout() {
  const scrollY = new Animated.Value(0);
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            backgroundColor: '#FFFFFF',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bill-split"
          options={{
            title: 'bill-split',
            tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Group-funds"
          options={{
            title: 'Group-funds',
            tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="media"
          options={{
            title: 'Media',
            tabBarIcon: ({ color, size }) => <Film size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="buy-ticket"
          options={{
            title: 'buy-ticket',
            tabBarIcon: ({ color, size }) => <Ticket size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}