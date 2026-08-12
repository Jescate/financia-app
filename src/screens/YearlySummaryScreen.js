import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, TrendingUp, AlertCircle, Calendar, SearchX } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function YearlySummaryScreen({ navigation }) {
  const { getUserData } = useAuth();
  const data = getUserData();

  const [dateParam, setDateParam] = useState(() => new Date().getFullYear());
  const [showPicker, setShowPicker] = useState(false);

  // Computations
  const { yearTransactions, availableYears, yearlyKPIs, budgetProgress, chartData } = useMemo(() => {
    if (!data) return {};

    const availableSet = new Set();
    const currentYear = new Date().getFullYear();
    availableSet.add(currentYear);
    const available = [currentYear];

    data.transactions.forEach(t => {
      const dbDate = t.date;
      const ty = dbDate && dbDate.includes('-') ? parseInt(dbDate.substring(0, 4), 10) : new Date(dbDate).getFullYear();
      if (!availableSet.has(ty)) {
        availableSet.add(ty);
        available.push(ty);
      }
    });

    available.sort((a, b) => b - a);

    const activeYearTxs = data.transactions.filter(t => {
      const dbDate = t.date;
      const ty = dbDate && dbDate.includes('-') ? parseInt(dbDate.substring(0, 4), 10) : new Date(dbDate).getFullYear();
      return ty === dateParam;
    });

    let income = 0;
    let expenses = 0;
    
    // For chart data (0 to 11 = Jan to Dec)
    const monthlyExpenses = new Array(12).fill(0);
    
    activeYearTxs.forEach(t => {
       if (t.type === 'gasto') {
          expenses += t.amount;
          const monthStr = t.date && t.date.includes('-') ? t.date.substring(5, 7) : null;
          const monthIdx = monthStr ? parseInt(monthStr, 10) - 1 : new Date(t.date).getMonth();
          monthlyExpenses[monthIdx] += t.amount;
       } else {
          income += t.amount;
       }
    });

    const savings = income - expenses; // Basic calculation

    const categorySpend = {};
    if (data.categories) {
       Object.keys(data.categories).forEach(c => {
          if (c !== 'Ingresos') categorySpend[c] = { spent: 0 };
       });
    }
    
    activeYearTxs.forEach(t => {
       if (t.type === 'gasto' && categorySpend[t.category]) {
          categorySpend[t.category].spent += t.amount;
       } else if (t.type === 'gasto' && !categorySpend[t.category]) {
          // Fallback if category was deleted or renamed
          categorySpend['Otros Gastos'] = categorySpend['Otros Gastos'] || { spent: 0 };
          categorySpend['Otros Gastos'].spent += t.amount;
       }
    });

    return {
       yearTransactions: activeYearTxs,
       availableYears: available,
       yearlyKPIs: { income, expenses, savings },
       budgetProgress: categorySpend,
       chartData: monthlyExpenses
    }
  }, [data, dateParam]);

  if (!data) return null;

  // Chart Setup Helpers
  const maxExpense = Math.max(...chartData, 10);
  const barWidth = (width - 60) / 12;

  const monthLabels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {data.name || 'Usuario'} 👋</Text>
        <Text style={styles.headerTitle}>Resumen Anual</Text>
      </View>

      {/* Selector Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar Año</Text>
              {availableYears?.map((ay, i) => {
                 const isSelected = ay === dateParam;
                 return (
                   <TouchableOpacity 
                     key={i} 
                     style={styles.modalItem}
                     onPress={() => {
                        setDateParam(ay);
                        setShowPicker(false);
                     }}
                   >
                      <Text style={[styles.modalItemText, isSelected && {color: '#0A84FF', fontWeight: 'bold'}]}>
                        {ay}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" color="#0A84FF" size={20} />}
                   </TouchableOpacity>
                 )
              })}
           </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Year Selector */}
        <TouchableOpacity style={styles.yearSelector} onPress={() => setShowPicker(true)}>
          <Calendar color="#0A84FF" size={20} />
          <Text style={styles.yearText}>{dateParam}</Text>
          <ChevronDown color="#FFFFFF" size={20} />
        </TouchableOpacity>

        {/* Global Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Neto</Text>
          <Text style={styles.balanceAmount}>S/ {yearlyKPIs?.savings.toLocaleString()}</Text>
          <View style={styles.balanceDetails}>
             <View style={styles.balanceRow}>
                <Text style={styles.balanceSubLabel}>Total Ingresos</Text>
                <Text style={[styles.balanceSubAmount, { color: '#32D74B' }]}>+ S/ {yearlyKPIs?.income.toLocaleString()}</Text>
             </View>
             <View style={styles.balanceRow}>
                <Text style={styles.balanceSubLabel}>Total Gastos</Text>
                <Text style={[styles.balanceSubAmount, { color: '#FF453A' }]}>- S/ {yearlyKPIs?.expenses.toLocaleString()}</Text>
             </View>
          </View>
        </View>

        {yearTransactions?.length === 0 ? (
          <View style={styles.emptyState}>
             <SearchX color="#8E8E93" size={48} style={{marginBottom: 16}} />
             <Text style={styles.emptyTitle}>Sin Movimientos Anuales</Text>
             <Text style={styles.emptyDesc}>No existen transacciones para mostrar en este año.</Text>
          </View>
        ) : (
          <>
            {/* Gastos Mensuales Chart */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Evolución de Gastos</Text>
              <TrendingUp color="#8E8E93" size={20} />
            </View>
            <View style={styles.chartCard}>
              <View style={styles.chartArea}>
                {chartData.map((val, idx) => {
                  const barHeight = (val / maxExpense) * 150;
                  return (
                    <View key={idx} style={styles.chartBarContainer}>
                      <View style={[styles.chartBar, { height: barHeight > 0 ? barHeight : 4 }]} />
                      <Text style={styles.chartLabel}>{monthLabels[idx]}</Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Gastos Totales por Categoría */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Distribución de Gastos</Text>
            </View>
            
            <View style={styles.budgetCard}>
              {Object.keys(budgetProgress).map((category, idx) => {
                const spent = budgetProgress[category].spent;
                if (spent === 0 && expenses === 0) return null;
                const progress = expenses > 0 ? (spent / expenses) : 0;
                
                let progressColor = '#32D74B';
                if (progress > 0.4 && progress <= 0.7) progressColor = '#FFD60A';
                if (progress > 0.7) progressColor = '#FF453A';
                
                return (
                  <TouchableOpacity key={idx} style={styles.budgetRow}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.budgetName}>{category}</Text>
                      <Text style={[styles.budgetName, {color: '#8E8E93'}]}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={styles.budgetProgressContainer}>
                      <View style={[styles.budgetProgressBar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progressColor }]} />
                    </View>
                    <Text style={styles.budgetSubtext}>
                      S/ {spent.toLocaleString()} gastados
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate('ManageCategories')}>
                <Text style={styles.manageBtnText}>Gestionar Categorías</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { color: '#8E8E93', fontSize: 16, marginBottom: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1C1C1E', width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { color: '#FFF', fontSize: 16 },
  yearSelector: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginBottom: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1C1C1E', borderRadius: 20 },
  yearText: { color: '#0A84FF', fontSize: 16, fontWeight: '600' },
  balanceCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, marginBottom: 32 },
  balanceLabel: { color: '#8E8E93', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginBottom: 24 },
  balanceDetails: { borderTopWidth: 1, borderTopColor: '#2C2C2E', paddingTop: 16, gap: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceSubLabel: { color: '#E5E5EA', fontSize: 14 },
  balanceSubAmount: { fontSize: 16, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  chartCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginBottom: 32 },
  chartArea: { height: 180, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartBarContainer: { alignItems: 'center', width: 20 },
  chartBar: { width: 8, backgroundColor: '#32D74B', borderRadius: 4, marginBottom: 8 },
  chartLabel: { color: '#8E8E93', fontSize: 10 },
  budgetCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20 },
  budgetRow: { marginBottom: 20 },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  budgetName: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  budgetProgressContainer: { height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  budgetProgressBar: { height: '100%', borderRadius: 4 },
  budgetSubtext: { color: '#8E8E93', fontSize: 12 },
  manageBtn: { backgroundColor: '#1C1C1E', marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
  manageBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyDesc: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 20 }
});
