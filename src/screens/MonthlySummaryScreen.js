import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Calendar, SearchX, PieChart } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MonthlySummaryScreen() {
  const { getUserData } = useAuth();
  const data = getUserData();

  const [dateParam, setDateParam] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  
  const [showPicker, setShowPicker] = useState(false);

  const { monthTransactions, availableMonths, monthlyKPIs, categorySpend } = useMemo(() => {
    if (!data) return {};

    const available = [];
    const availableSet = new Set();
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    availableSet.add(`${currentYear}-${currentMonth}`);
    available.push({ year: currentYear, month: currentMonth });

    data.transactions.forEach(t => {
      const dbDate = t.date;
      if (dbDate && dbDate.includes('-')) {
        const parts = dbDate.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed month
        const k = `${y}-${m}`;
        if (!availableSet.has(k)) {
          availableSet.add(k);
          available.push({ year: y, month: m });
        }
      }
    });

    available.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    const mTransactions = data.transactions.filter(t => {
      const dbDate = t.date;
      if (dbDate && dbDate.includes('-')) {
        const parts = dbDate.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === dateParam.year && m === dateParam.month;
      }
      return false;
    });

    let income = 0;
    let expenses = 0;
    mTransactions.forEach(t => {
       if (t.type === 'gasto') expenses += t.amount;
       else income += t.amount;
    });

    // Compute category spent dynamically
    const catProgress = {};
    if (data.categories) {
       Object.keys(data.categories).forEach(mainCat => {
           if (mainCat !== 'Ingresos') {
             catProgress[mainCat] = { total: 0, items: {} };
             data.categories[mainCat].forEach(sub => {
                 catProgress[mainCat].items[sub] = 0;
             });
           }
       });
    }

    mTransactions.filter(t => t.type === 'gasto').forEach(t => {
       // Check if main category exists
       if (catProgress[t.category]) {
          catProgress[t.category].total += t.amount;
          // Check if subcategory item exists, else catch as "Otros"
          if (catProgress[t.category].items[t.subcategory] !== undefined) {
             catProgress[t.category].items[t.subcategory] += t.amount;
          } else {
             catProgress[t.category].items['Otros'] = (catProgress[t.category].items['Otros'] || 0) + t.amount;
          }
       } else {
          catProgress['Otros Gastos'] = catProgress['Otros Gastos'] || { total: 0, items: {} };
          catProgress['Otros Gastos'].total += t.amount;
          catProgress['Otros Gastos'].items[t.category || 'Varios'] = (catProgress['Otros Gastos'].items[t.category || 'Varios'] || 0) + t.amount;
       }
    });

    return { 
       monthTransactions: mTransactions,
       availableMonths: available,
       monthlyKPIs: { income, expenses },
       categorySpend: catProgress
    };

  }, [data, dateParam]);

  if (!data) return null;

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resumen Mensual</Text>
      </View>

      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccionar Mes</Text>
              {availableMonths?.map((am, i) => {
                 const isSelected = am.year === dateParam.year && am.month === dateParam.month;
                 return (
                   <TouchableOpacity 
                     key={i} 
                     style={styles.modalItem}
                     onPress={() => {
                        setDateParam(am);
                        setShowPicker(false);
                     }}
                   >
                      <Text style={[styles.modalItemText, isSelected && {color: '#0A84FF', fontWeight: 'bold'}]}>
                        {monthNames[am.month]} {am.year}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" color="#0A84FF" size={20} />}
                   </TouchableOpacity>
                 )
              })}
           </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.monthSelector} onPress={() => setShowPicker(true)}>
          <Calendar color="#32D74B" size={20} />
          <Text style={styles.monthText}>{monthNames[dateParam.month]} {dateParam.year}</Text>
          <ChevronDown color="#FFFFFF" size={20} />
        </TouchableOpacity>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Ingresos</Text>
            <Text style={[styles.kpiValue, { color: '#32D74B' }]}>S/ {monthlyKPIs?.income.toLocaleString()}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Gastos</Text>
            <Text style={[styles.kpiValue, { color: '#FF453A' }]}>S/ {monthlyKPIs?.expenses.toLocaleString()}</Text>
          </View>
        </View>

        {monthTransactions?.length === 0 ? (
          <View style={styles.emptyState}>
             <SearchX color="#8E8E93" size={48} style={{marginBottom: 16}} />
             <Text style={styles.emptyTitle}>Sin Movimientos</Text>
             <Text style={styles.emptyDesc}>No tienes transacciones registradas en este mes. Ve a la pestaña de Efectivo para comenzar.</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Desglose de Gastos</Text>
                <PieChart color="#8E8E93" size={20} />
              </View>

              {Object.entries(categorySpend).map(([category, details]) => {
                const totalSpent = details.total;
                if (totalSpent === 0) return null;
                
                return (
                  <View key={category} style={styles.categoryBlock}>
                    <View style={styles.categoryHeaderRow}>
                       <Text style={styles.categoryTitle}>{category}</Text>
                       <Text style={styles.categoryTotalSpent}>S/ {totalSpent.toLocaleString()}</Text>
                    </View>

                    {Object.entries(details.items).map(([subName, amount], idx) => {
                      if (amount === 0) return null;
                      const ratio = amount / totalSpent;
                      
                      return (
                        <View key={idx} style={styles.subItem}>
                          <View style={styles.subHeader}>
                            <Text style={styles.subName}>{subName}</Text>
                            <Text style={styles.subAmount}>S/ {amount.toLocaleString()}</Text>
                          </View>
                          <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${Math.min(ratio * 100, 100)}%` }]} />
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historial del Mes</Text>
              <View style={styles.topExpensesCard}>
                {monthTransactions.map((expense, idx) => (
                  <View key={expense.id} style={[styles.expenseRow, idx < monthTransactions.length - 1 && styles.borderBottom]}>
                    <View>
                      <Text style={styles.expenseName}>{expense.name}</Text>
                      <Text style={styles.expenseCategory}>
                        {expense.category} • {expense.date.split('T')[0]}
                      </Text>
                    </View>
                    <Text style={[styles.expenseAmount, expense.type === 'ingreso' && { color: '#32D74B' }]}>
                      {expense.type === 'ingreso' ? '+' : '-'}S/ {expense.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
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
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1C1C1E', width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { color: '#FFF', fontSize: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginBottom: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1C1C1E', borderRadius: 20 },
  monthText: { color: '#32D74B', fontSize: 16, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 16, marginBottom: 32 },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, backgroundColor: '#2C2C2E' },
  kpiLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  categoryBlock: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 16 },
  categoryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  categoryTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  categoryTotalSpent: { color: '#FF453A', fontSize: 16, fontWeight: '600' },
  subItem: { marginBottom: 12 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subName: { color: '#E5E5EA', fontSize: 14 },
  subAmount: { color: '#8E8E93', fontSize: 14 },
  progressBg: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#FFD60A' },
  topExpensesCard: { backgroundColor: '#1C1C1E', borderRadius: 16, paddingHorizontal: 16 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  expenseName: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  expenseCategory: { color: '#8E8E93', fontSize: 13 },
  expenseAmount: { color: '#FF453A', fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyDesc: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 20 }
});
