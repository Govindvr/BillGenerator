// @ts-nocheck

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import {Text, Card, Button, FAB, Divider} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../config/theme';
import {getSupplierConfig, getBills} from '../config/supabaseClient';

const OCB_LOGO = require('../assets/ocb-logo.png');

function HomeScreen({navigation}) {
  const [loading, setLoading] = useState(true);
  const [supplierConfig, setSupplierConfig] = useState(null);
  const [billStats, setBillStats] = useState({
    totalBills: 0,
    thisMonthBills: 0,
    thisMonthRevenue: '0.00',
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // Fetch supplier config
      const supplier = await getSupplierConfig();
      if (supplier) {
        setSupplierConfig(supplier);
      }

      // Fetch bills for stats
      const bills = await getBills();
      if (bills && bills.length > 0) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Count bills this month and calculate revenue
        let monthlyBills = 0;
        let monthlyRevenue = 0;

        bills.forEach(bill => {
          const billDate = new Date(bill.date);
          if (
            billDate.getMonth() === currentMonth &&
            billDate.getFullYear() === currentYear
          ) {
            monthlyBills += 1;
            monthlyRevenue += parseFloat(bill.grand_total || 0);
          }
        });

        setBillStats({
          totalBills: bills.length,
          thisMonthBills: monthlyBills,
          thisMonthRevenue: monthlyRevenue.toFixed(2),
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewBill = () => navigation.navigate('NewBill');
  const handleViewBills = () => navigation.navigate('ViewOldBills');
  const handleCustomers = () => navigation.navigate('CustomerManagement');
  const handleProducts = () => navigation.navigate('ProductManagement');
  const handleSettings = () => navigation.navigate('SupplierSettings');

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Card style={styles.heroCard}>
          <Card.Content>
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Image
                  source={OCB_LOGO}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.businessName}>
                {supplierConfig?.legal_business_name || 'Your Business'}
              </Text>
              <Text style={styles.gstin}>
                {supplierConfig?.gstin
                  ? `GSTIN: ${supplierConfig.gstin}`
                  : 'No GSTIN set'}
              </Text>
              {!supplierConfig && (
                <Button
                  mode="text"
                  onPress={handleSettings}
                  style={styles.setupButton}>
                  Complete Setup
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons
                name="file-document-multiple"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.statValue}>{billStats.totalBills}</Text>
            <Text style={styles.statLabel}>Total Bills</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons
                name="calendar-month"
                size={24}
                color={theme.colors.success}
              />
            </View>
            <Text style={styles.statValue}>{billStats.thisMonthBills}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons
                name="currency-inr"
                size={24}
                color={theme.colors.warning}
              />
            </View>
            <Text style={styles.statValue}>₹{billStats.thisMonthRevenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          {/* New Bill Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleNewBill}
            activeOpacity={0.7}>
            <Card style={styles.actionCardInner}>
              <Card.Content>
                <View style={styles.actionIcon}>
                  <MaterialIcons
                    name="file-plus"
                    size={40}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.actionTitle}>New Bill</Text>
                <Text style={styles.actionDesc}>Create invoice</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* View Bills Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleViewBills}
            activeOpacity={0.7}>
            <Card style={styles.actionCardInner}>
              <Card.Content>
                <View style={styles.actionIcon}>
                  <MaterialIcons
                    name="file-document-outline"
                    size={40}
                    color={theme.colors.secondary}
                  />
                </View>
                <Text style={styles.actionTitle}>View Bills</Text>
                <Text style={styles.actionDesc}>Manage invoices</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Customers Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCustomers}
            activeOpacity={0.7}>
            <Card style={styles.actionCardInner}>
              <Card.Content>
                <View style={styles.actionIcon}>
                  <MaterialIcons
                    name="account-multiple"
                    size={40}
                    color={theme.colors.tertiary}
                  />
                </View>
                <Text style={styles.actionTitle}>Customers</Text>
                <Text style={styles.actionDesc}>Manage clients</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Products Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleProducts}
            activeOpacity={0.7}>
            <Card style={styles.actionCardInner}>
              <Card.Content>
                <View style={styles.actionIcon}>
                  <MaterialIcons
                    name="package-variant"
                    size={40}
                    color={theme.colors.success}
                  />
                </View>
                <Text style={styles.actionTitle}>Products</Text>
                <Text style={styles.actionDesc}>Manage items</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Settings Link */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <View style={styles.settingsRow}>
              <MaterialIcons
                name="cog"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.settingsText}>Business Settings</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB for Quick New Bill */}
      <FAB
        icon="plus"
        label="New Bill"
        onPress={handleNewBill}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  heroCard: {
    marginBottom: 20,
    backgroundColor: theme.colors.primaryContainer,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 54,
    height: 54,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    marginBottom: 4,
  },
  gstin: {
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    opacity: 0.8,
    marginBottom: 12,
  },
  setupButton: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
  },
  actionCardInner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  settingsCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onBackground,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

export default HomeScreen;
