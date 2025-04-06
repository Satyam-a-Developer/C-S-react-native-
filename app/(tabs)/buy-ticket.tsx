import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Event {
  title: string;
  date: string;
  image: string;
  price: number;
}

interface Ticket {
  id: string;
  eventTitle: string;
  date: string;
  price: number;
  purchaseDate: string;
  status: 'valid' | 'used' | 'expired';
  seat: string;
  gate: number;
}

export default function TicketScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  
  const events: Event[] = [
    {
      title: 'Summer Music Festival',
      date: 'Aug 15-17, 2025', // Updated to future dates since current date is April 2025
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=60',
      price: 299,
    },
    {
      title: 'Tech Conference 2025',
      date: 'Sep 5-6, 2025',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60',
      price: 499,
    },
    {
      title: 'Food & Wine Festival',
      date: 'Oct 12-13, 2025',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=60',
      price: 150,
    },
  ];

  // Load tickets from storage on mount
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const storedTickets = await AsyncStorage.getItem('myTickets');
        if (storedTickets) {
          const tickets: Ticket[] = JSON.parse(storedTickets);
          // Update ticket status based on current date
          const updatedTickets = tickets.map(ticket => {
            const eventDate = new Date(ticket.date.split('-')[1]); // Get end date
            const currentDate = new Date();
            return {
              ...ticket,
              status: eventDate < currentDate ? 'expired' : ticket.status
            };
          });
          setMyTickets(updatedTickets);
        }
      } catch (error) {
        console.error('Error loading tickets:', error);
      }
    };
    loadTickets();
  }, []);

  // Save tickets to storage
  const saveTickets = async (tickets: Ticket[]) => {
    try {
      await AsyncStorage.setItem('myTickets', JSON.stringify(tickets));
    } catch (error) {
      console.error('Error saving tickets:', error);
    }
  };

  // Handle booking an event
  const handleBookNow = (event: Event) => {
    navigation.navigate('PaymentScreen', {
      amount: event.price,
      onPaymentSuccess: (transaction: any) => {
        const newTicket: Ticket = {
          id: `TICKET-${Date.now()}`,
          eventTitle: event.title,
          date: event.date,
          price: event.price,
          purchaseDate: new Date().toISOString(),
          status: 'valid',
          seat: `A-${Math.floor(Math.random() * 1000)}`, // Random seat
          gate: Math.floor(Math.random() * 10) + 1, // Random gate 1-10
        };

        const updatedTickets = [...myTickets, newTicket];
        setMyTickets(updatedTickets);
        saveTickets(updatedTickets);

        Alert.alert(
          'Booking Successful',
          `Your ticket for ${event.title} has been booked!`,
          [
            {
              text: 'View Ticket',
              onPress: () => navigation.navigate('TicketScreen'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events & Tickets</Text>
        <Text style={styles.subtitle}>Book your next experience</Text>
      </View>

      <View style={styles.upcomingEvents}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.map((event, index) => (
          <View key={index} style={styles.eventCard}>
            <Image source={{ uri: event.image }} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
              <View style={styles.eventFooter}>
                <Text style={styles.eventPrice}>₹{event.price}</Text>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBookNow(event)}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.myTickets}>
        <Text style={styles.sectionTitle}>My Tickets</Text>
        {myTickets.length === 0 ? (
          <Text style={styles.noTicketsText}>No tickets booked yet</Text>
        ) : (
          myTickets.map((ticket, index) => (
            <View key={index} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle}>{ticket.eventTitle}</Text>
                <Text
                  style={[
                    styles.ticketStatus,
                    {
                      color:
                        ticket.status === 'valid'
                          ? '#34C759'
                          : ticket.status === 'used'
                          ? '#FF9500'
                          : '#FF3B30',
                    },
                  ]}
                >
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Text>
              </View>
              <View style={styles.ticketDetails}>
                <Text style={styles.ticketInfo}>Date: {ticket.date}</Text>
                <Text style={styles.ticketInfo}>Seat: {ticket.seat}</Text>
                <Text style={styles.ticketInfo}>Gate: {ticket.gate}</Text>
                <Text style={styles.ticketInfo}>
                  Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.ticketBarcode} />
            </View>
          ))
        )}
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
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000000',
  },
  upcomingEvents: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventInfo: {
    padding: 15,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  eventDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  eventPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  myTickets: {
    padding: 20,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  ticketStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  ticketDetails: {
    marginBottom: 20,
  },
  ticketInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  ticketBarcode: {
    height: 60,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  noTicketsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});