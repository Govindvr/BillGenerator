// @ts-nocheck

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  View,
} from 'react-native';
import {Text, Searchbar, FAB, SegmentedButtons} from 'react-native-paper';
import theme from '../config/theme';
import BillCard from '../components/card';
import {getBills} from '../config/supabaseClient';
import ErrorModal from '../components/errorModal';

const BillListItem = React.memo(function BillListItem({
  item,
  onViewBill,
  onRepeatCustomer,
}) {
  return (
    <View style={styles.billCardContainer}>
      <BillCard
        date={item.date}
        customerName={item.customer_name}
        amount={item.grand_total}
        inno={item.invoice_number}
        onPressButton={() => onViewBill(item.id)}
        handleClickText={() => onRepeatCustomer(item.id)}
      />
    </View>
  );
});

function ViewOldBills({navigation}) {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [billKindTab, setBillKindTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Error loading bills');

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchQuery, bills, billKindTab]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const billsData = await getBills();
      if (billsData) {
        // Sort by date descending (newest first)
        const sorted = billsData.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
        setBills(sorted);
      } else {
        setErrorMessage('No bills found');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      setErrorMessage('Error loading bills. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let nextBills = bills;

    if (billKindTab !== 'ALL') {
      nextBills = nextBills.filter(bill => bill.bill_kind === billKindTab);
    }

    if (!searchQuery.trim()) {
      setFilteredBills(nextBills);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = nextBills.filter(
      bill =>
        bill.customer_name.toLowerCase().includes(query) ||
        bill.invoice_number.toString().includes(query) ||
        bill.date.includes(query),
    );
    setFilteredBills(filtered);
  };

  const handleViewBill = useCallback(
    billId => {
      navigation.navigate('ViewBill', {billId: billId});
    },
    [navigation],
  );

  const handleRepeatCustomer = useCallback(
    billId => {
      navigation.navigate('NewBill', {billId: billId, repeatCustomer: true});
    },
    [navigation],
  );

  const handleNewBill = useCallback(() => {
    navigation.navigate('NewBill');
  }, [navigation]);

  const keyExtractor = useCallback(item => item.id.toString(), []);

  const renderBillItem = useCallback(
    ({item}) => (
      <BillListItem
        item={item}
        onViewBill={handleViewBill}
        onRepeatCustomer={handleRepeatCustomer}
      />
    ),
    [handleViewBill, handleRepeatCustomer],
  );

  const listEmptyComponent = useMemo(
    () =>
      searchQuery.trim() !== '' ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try searching with different keywords
          </Text>
        </View>
      ) : null,
    [searchQuery],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No bills found</Text>
      <Text style={styles.emptySubtext}>
        Create your first bill to get started
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <SegmentedButtons
          value={billKindTab}
          onValueChange={setBillKindTab}
          buttons={[
            {value: 'ALL', label: 'All'},
            {value: 'B2B', label: 'B2B'},
            {value: 'B2C', label: 'B2C'},
          ]}
          style={styles.tabs}
        />
        <Searchbar
          placeholder="Search by customer, bill #, or date"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {filteredBills.length === 0 && searchQuery.trim() === '' ? (
        renderEmpty()
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={keyExtractor}
          renderItem={renderBillItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={listEmptyComponent}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      {/* FAB for quick new bill */}
      <FAB
        icon="plus"
        label="New Bill"
        onPress={handleNewBill}
        style={styles.fab}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  searchbar: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  tabs: {
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  billCardContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

export default ViewOldBills;
