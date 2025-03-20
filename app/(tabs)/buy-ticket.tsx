import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function TicketScreen() {
  const events = [
    {
      title: 'Summer Music Festival',
      date: 'Aug 15-17, 2024',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=60',
      price: 299,
    },
    {
      title: 'Tech Conference 2024',
      date: 'Sep 5-6, 2024',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60',
      price: 499,
    },
    {
      title: 'Food & Wine Festival',
      date: 'Oct 12-13, 2024',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=60',
      price: 150,
    },
  ];

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
                <Text style={styles.eventPrice}>${event.price}</Text>
                <View style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.myTickets}>
        <Text style={styles.sectionTitle}>My Tickets</Text>
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>Concert Ticket</Text>
            <Text style={styles.ticketStatus}>Valid</Text>
          </View>
          <View style={styles.ticketDetails}>
            <Text style={styles.ticketInfo}>Date: March 1, 2024</Text>
            <Text style={styles.ticketInfo}>Seat: A-123</Text>
            <Text style={styles.ticketInfo}>Gate: 5</Text>
          </View>
          <View style={styles.ticketBarcode} />
        </View>
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
    color: '#34C759',
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
});