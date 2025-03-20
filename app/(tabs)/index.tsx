import { View, StyleSheet, ScrollView, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>System Status</Text>
        {[
          { name: 'Payment Gateway', status: 'Operational', color: '#34C759' },
          { name: 'User Authentication', status: 'Operational', color: '#34C759' },
          { name: 'Media Services', status: 'Partial Outage', color: '#FF9500' },
          { name: 'Ticket System', status: 'Operational', color: '#34C759' },
          { name: 'Database', status: 'Operational', color: '#34C759' },
        ].map((service, index) => (
          <View key={index} style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: service.color }]} />
            </View>
            <Text style={[styles.statusText, { color: service.color }]}>{service.status}</Text>
            <View style={styles.metrics}>
              <Text style={styles.metricText}>Uptime: 99.9%</Text>
              <Text style={styles.metricText}>Response: 120ms</Text>
            </View>
          </View>
        ))}

        {/* Incident History */}
        <View style={styles.incidentSection}>
          <Text style={styles.incidentTitle}>Recent Incidents</Text>
          {[
            { date: '2024-02-10', title: 'Minor API Latency', status: 'Resolved' },
            { date: '2024-02-08', title: 'Database Maintenance', status: 'Resolved' },
          ].map((incident, index) => (
            <View key={index} style={styles.incidentCard}>
              <Text style={styles.incidentDate}>{incident.date}</Text>
              <Text style={styles.incidentName}>{incident.title}</Text>
              <Text style={styles.incidentStatus}>{incident.status}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statusSection: {
    padding: 20,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
  },
  metricText: {
    fontSize: 14,
    color: '#6C757D',
  },
  incidentSection: {
    marginTop: 30,
  },
  incidentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentDate: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  incidentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 5,
  },
  incidentStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
});