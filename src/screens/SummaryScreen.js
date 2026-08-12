import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Calendar, SearchX, PieChart, TrendingUp, AlertCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SummaryScreen() {
  const { user, getUserData } = useAuth();
  const data = getUserData();

  const [mode, setMode] = useState('mensual'); // 'mensual' | 'anual'

  // Date param for Monthly
  const [dateParamM, setDateParamM] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Date param for Yearly
  const [dateParamY, setDateParamY] = useState(() => new Date().getFullYear());

  const [showPicker, setShowPicker] = useState(false);

  // Computations
  const computedData = useMemo(() => {
    if (!data) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const availMonths = [{ year: currentYear, month: currentMonth }];
    const availMonthsSet = new Set([`${currentYear}-${currentMonth}`]);
    const availYears = [currentYear];
    const availYearsSet = new Set([currentYear]);

    data.transactions.forEach(t => {
      const dbDate = t.date;
      if (dbDate && dbDate.includes('-')) {
        const parts = dbDate.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        
        if (!availYearsSet.has(y)) {
           availYearsSet.add(y);
           availYears.push(y);
        }
        const mk = `${y}-${m}`;
        if (!availMonthsSet.has(mk)) {
           availMonthsSet.add(mk);
           availMonths.push({ year: y, month: m });
        }
      }
    });

    availYears.sort((a, b) => b - a);
    availMonths.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

    // Filter txs
    const mTransactions = [];
    const yTransactions = [];

    data.transactions.forEach(t => {
      const dbDate = t.date;
      if (dbDate && dbDate.includes('-')) {
        const parts = dbDate.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        
        if (y === dateParamY) yTransactions.push(t);
        if (y === dateParamM.year && m === dateParamM.month) mTransactions.push(t);
      }
    });

    // Monthly KPIs
    let mInc = 0, mExp = 0;
    mTransactions.forEach(t => { t.type === 'gasto' ? mExp += t.amount : mInc += t.amount; });
    const mBal = mInc - mExp;

    // Yearly KPIs
    let yInc = 0, yExp = 0;
    const yMonthlyChart = new Array(12).fill(0);
    const categorySpendYearly = {};

    yTransactions.forEach(t => { 
        if(t.type === 'gasto'){
            yExp += t.amount;
            const mIdx = parseInt(t.date.split('-')[1], 10) - 1;
            yMonthlyChart[mIdx] += t.amount;

            categorySpendYearly[t.category] = (categorySpendYearly[t.category] || 0) + t.amount;
        } else {
            yInc += t.amount;
        }
    });

    return {
        availMonths, 
        availYears,
        mTransactions,
        yTransactions,
        mInc, mExp, mBal,
        yInc, yExp, yBal: yInc - yExp,
        yMonthlyChart,
        categorySpendYearly
    }

  }, [data, dateParamM, dateParamY]);

  if (!computedData) return null;

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const shortMonthNames = ['E','F','M','A','M','J','J','A','S','O','N','D'];
  const maxYExpense = Math.max(...computedData.yMonthlyChart, 10);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={{color: '#8E8E93', fontSize: 16, marginBottom: 4}}>Hola, {user?.name || 'Usuario'} 👋</Text>
        <Text style={styles.headerTitle}>Resumen</Text>
      </View>

      {/* Tabs / Toggle Selector */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, mode === 'mensual' && styles.toggleBtnActive]} onPress={() => setMode('mensual')}>
            <Text style={[styles.toggleText, mode === 'mensual' && styles.toggleTextActive]}>Mensual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, mode === 'anual' && styles.toggleBtnActive]} onPress={() => setMode('anual')}>
            <Text style={[styles.toggleText, mode === 'anual' && styles.toggleTextActive]}>Anual</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Selector Button */}
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPicker(true)}>
          <Calendar color="#0A84FF" size={20} />
          <Text style={styles.dateText}>
              {mode === 'mensual' ? `${monthNames[dateParamM.month]} ${dateParamM.year}` : dateParamY}
          </Text>
          <ChevronDown color="#FFFFFF" size={20} />
        </TouchableOpacity>

        {mode === 'mensual' ? (
           // --- MONTHLY VIEW ---
           <>
              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Ingresos</Text>
                    <Text style={[styles.kpiValue, { color: '#32D74B' }]}>S/ {computedData.mInc.toLocaleString()}</Text>
                </View>
                <View style={styles.kpiDivider} />
                <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Gastos</Text>
                    <Text style={[styles.kpiValue, { color: '#FF453A' }]}>S/ {computedData.mExp.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.balanceCardSmall}>
                  <Text style={styles.kpiLabel}>Balance del Mes</Text>
                  <Text style={[styles.kpiValue, { fontSize: 24, paddingVertical: 5, color: computedData.mBal >= 0 ? '#32D74B' : '#FF453A' }]}>
                      {computedData.mBal >= 0 ? '+' : '-'}S/ {Math.abs(computedData.mBal).toLocaleString()}
                  </Text>
                  
                  {/* Visually map Income vs Expense to convey immediate feel of the month */}
                  <View style={styles.monthlyVisualBarContainer}>
                     {computedData.mInc === 0 && computedData.mExp === 0 ? (
                        <View style={[styles.monthlyVisualSegment, { flex: 1, backgroundColor: '#2C2C2E' }]} />
                     ) : (
                        <>
                           {computedData.mInc > 0 && <View style={[styles.monthlyVisualSegment, { flex: computedData.mInc, backgroundColor: '#32D74B' }]} />}
                           {computedData.mExp > 0 && <View style={[styles.monthlyVisualSegment, { flex: computedData.mExp, backgroundColor: '#FF453A' }]} />}
                        </>
                     )}
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8}}>
                      <Text style={{color: '#8E8E93', fontSize: 11}}>Entrada</Text>
                      <Text style={{color: '#8E8E93', fontSize: 11}}>Salida</Text>
                  </View>
              </View>

              {computedData.mTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                    <SearchX color="#8E8E93" size={48} style={{marginBottom: 16}} />
                    <Text style={styles.emptyTitle}>Sin Movimientos</Text>
                </View>
              ) : (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historial del Mes</Text>
                    <View style={styles.listCard}>
                        {computedData.mTransactions.map((expense, idx) => (
                        <View key={expense.id} style={[styles.expenseRow, idx < computedData.mTransactions.length - 1 && styles.borderBottom]}>
                            <View>
                                <Text style={styles.expenseName}>{expense.name}</Text>
                                <Text style={styles.expenseCategory}>{expense.category} • {expense.date.split('T')[0]}</Text>
                            </View>
                            <Text style={[styles.expenseAmount, expense.type === 'ingreso' && { color: '#32D74B' }]}>
                                {expense.type === 'ingreso' ? '+' : '-'}S/ {expense.amount.toLocaleString()}
                            </Text>
                        </View>
                        ))}
                    </View>
                </View>
              )}
           </>
        ) : (
           // --- YEARLY VIEW ---
           <>
              <View style={styles.balanceCard}>
                <Text style={styles.kpiLabel}>Balance Anual Neto</Text>
                <Text style={[styles.balanceAmount, {color: computedData.yBal >= 0 ? '#32D74B' : '#FF453A'}]}>S/ {computedData.yBal.toLocaleString()}</Text>
                <View style={styles.balanceDetails}>
                    <View style={styles.balanceRowInner}>
                        <Text style={styles.balanceSubLabel}>Total Ingresos</Text>
                        <Text style={[styles.balanceSubAmount, { color: '#32D74B' }]}>+ S/ {computedData.yInc.toLocaleString()}</Text>
                    </View>
                    <View style={styles.balanceRowInner}>
                        <Text style={styles.balanceSubLabel}>Total Gastos</Text>
                        <Text style={[styles.balanceSubAmount, { color: '#FF453A' }]}>- S/ {computedData.yExp.toLocaleString()}</Text>
                    </View>
                </View>
              </View>

              {computedData.yTransactions.length === 0 ? (
                 <View style={styles.emptyState}>
                    <SearchX color="#8E8E93" size={48} style={{marginBottom: 16}} />
                    <Text style={styles.emptyTitle}>Sin Movimientos Anuales</Text>
                 </View>
              ) : (
                <>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Evolución de Gastos</Text>
                        <TrendingUp color="#8E8E93" size={20} />
                    </View>
                    <View style={styles.chartCard}>
                        <View style={styles.chartArea}>
                            {computedData.yMonthlyChart.map((val, idx) => {
                                const barHeight = (val / maxYExpense) * 120;
                                return (
                                    <View key={idx} style={styles.chartBarContainer}>
                                        <View style={[styles.chartBar, { height: barHeight > 0 ? barHeight : 4 }]} />
                                        <Text style={styles.chartLabel}>{shortMonthNames[idx]}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Totales por Categoría</Text>
                    </View>
                    <View style={styles.budgetCard}>
                        {Object.entries(computedData.categorySpendYearly).map(([category, spent], idx) => {
                            if (spent === 0) return null;
                            const progress = computedData.yExp > 0 ? (spent / computedData.yExp) : 0;
                            return (
                                <View key={idx} style={styles.budgetRow}>
                                    <View style={styles.budgetHeader}>
                                        <Text style={styles.budgetName}>{category}</Text>
                                        <Text style={[styles.budgetName, {color: '#8E8E93'}]}>{Math.round(progress * 100)}%</Text>
                                    </View>
                                    <View style={styles.budgetProgressContainer}>
                                        <View style={[styles.budgetProgressBar, { width: `${progress * 100}%` }]} />
                                    </View>
                                    <Text style={styles.budgetSubtext}>S/ {spent.toLocaleString()} gastados</Text>
                                </View>
                            );
                        })}
                    </View>
                </>
              )}
           </>
        )}
      </ScrollView>

      {/* Reusable Modal for Both Selectors */}
      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                  {mode === 'mensual' ? 'Seleccionar Mes' : 'Seleccionar Año'}
              </Text>
              <ScrollView style={{maxHeight: 300}}>
              {(mode === 'mensual' ? computedData.availMonths : computedData.availYears)?.map((item, i) => {
                 const isSelected = mode === 'mensual' ? 
                      (item.year === dateParamM.year && item.month === dateParamM.month) : 
                      (item === dateParamY);
                      
                 return (
                   <TouchableOpacity 
                     key={i} 
                     style={styles.modalItem}
                     onPress={() => {
                        mode === 'mensual' ? setDateParamM(item) : setDateParamY(item);
                        setShowPicker(false);
                     }}
                   >
                      <Text style={[styles.modalItemText, isSelected && {color: '#0A84FF', fontWeight: 'bold'}]}>
                        {mode === 'mensual' ? `${monthNames[item.month]} ${item.year}` : item}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" color="#0A84FF" size={20} />}
                   </TouchableOpacity>
                 )
              })}
              </ScrollView>
           </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#1C1C1E', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#2C2C2E' },
  toggleText: { color: '#8E8E93', fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginBottom: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1C1C1E', borderRadius: 20 },
  dateText: { color: '#0A84FF', fontSize: 16, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 16, marginBottom: 12 },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, backgroundColor: '#2C2C2E' },
  kpiLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '700' },
  balanceCardSmall: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 },
  monthlyVisualBarContainer: { flexDirection: 'row', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 12 },
  monthlyVisualSegment: { height: '100%' },
  balanceCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, marginBottom: 24 },
  balanceAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginBottom: 24 },
  balanceDetails: { borderTopWidth: 1, borderTopColor: '#2C2C2E', paddingTop: 16, gap: 12 },
  balanceRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceSubLabel: { color: '#E5E5EA', fontSize: 14 },
  balanceSubAmount: { fontSize: 16, fontWeight: '600' },
  section: { top: 0 },
  listCard: { backgroundColor: '#1C1C1E', borderRadius: 16, paddingHorizontal: 16 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  expenseName: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  expenseCategory: { color: '#8E8E93', fontSize: 13 },
  expenseAmount: { color: '#FF453A', fontSize: 15, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  chartCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginBottom: 32 },
  chartArea: { height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartBarContainer: { alignItems: 'center', width: 20 },
  chartBar: { width: 8, backgroundColor: '#32D74B', borderRadius: 4, marginBottom: 8 },
  chartLabel: { color: '#8E8E93', fontSize: 10 },
  budgetCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20 },
  budgetRow: { marginBottom: 20 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetName: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  budgetProgressContainer: { height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  budgetProgressBar: { height: '100%', borderRadius: 4, backgroundColor: '#32D74B' },
  budgetSubtext: { color: '#8E8E93', fontSize: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1C1C1E', width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { color: '#FFF', fontSize: 16 },
});
