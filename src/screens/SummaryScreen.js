import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, Dimensions, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Calendar, SearchX, PieChart, TrendingUp, AlertCircle, Edit2, Trash2, X } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SummaryScreen() {
  const { user, getUserData, editTransaction, deleteTransaction } = useAuth();
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

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const openEditTx = (tx) => {
    setEditingTx(tx);
    setEditName(tx.name);
    setEditAmount(tx.amount.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTx || !editName.trim() || !editAmount) return;
    await editTransaction(editingTx.id, { name: editName.trim(), amount: parseFloat(editAmount) });
    setShowEditModal(false);
    setEditingTx(null);
    if (Platform.OS === 'web') {
      window.alert('Movimiento editado con éxito.');
    } else {
      Alert.alert('Éxito', 'Movimiento editado con éxito.');
    }
  };

  const handleDeleteTx = (tx) => {
    const doDelete = async () => {
      await deleteTransaction(tx.id);
      if (Platform.OS === 'web') {
        window.alert('Movimiento borrado con éxito.');
      } else {
        Alert.alert('Éxito', 'Movimiento borrado con éxito.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de eliminar este movimiento?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Eliminar transacción",
        "¿Estás seguro de eliminar este movimiento?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: doDelete }
        ]
      );
    }
  };

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
            if (mIdx >= 0 && mIdx < 12) yMonthlyChart[mIdx] += t.amount;

            categorySpendYearly[t.category] = (categorySpendYearly[t.category] || 0) + t.amount;
        } else {
            yInc += t.amount;
        }
    });

    const yBal = yInc - yExp;

    return {
        availMonths, 
        availYears,
        mTransactions,
        yTransactions,
        allTransactions: data.transactions || [],
        mInc, mExp, mBal,
        yInc, yExp, yBal,
        yMonthlyChart,
        categorySpendYearly
    };
  }, [data, dateParamM, dateParamY]);

  if (!data || !computedData) return null;

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const shortMonthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const maxYExpense = Math.max(...computedData.yMonthlyChart, 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hola, {user?.name ? user.name.split(' ')[0] : 'Usuario'} 👋</Text>
        <View style={styles.modeTabs}>
           <TouchableOpacity 
              style={[styles.modeTab, mode === 'mensual' && styles.modeTabActive]} 
              onPress={() => setMode('mensual')}
           >
              <Text style={[styles.modeTabText, mode === 'mensual' && styles.modeTabTextActive]}>Mensual</Text>
           </TouchableOpacity>
           <TouchableOpacity 
              style={[styles.modeTab, mode === 'anual' && styles.modeTabActive]} 
              onPress={() => setMode('anual')}
           >
              <Text style={[styles.modeTabText, mode === 'anual' && styles.modeTabTextActive]}>Anual</Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                 {mode === 'mensual' ? 'Seleccionar Mes' : 'Seleccionar Año'}
              </Text>
              
              {mode === 'mensual' ? (
                 computedData.availMonths.map((am, i) => {
                    const isSelected = am.year === dateParamM.year && am.month === dateParamM.month;
                    return (
                      <TouchableOpacity 
                        key={i} 
                        style={styles.modalItem}
                        onPress={() => { setDateParamM(am); setShowPicker(false); }}
                      >
                         <Text style={[styles.modalItemText, isSelected && {color: '#00E5CC', fontWeight: 'bold'}]}>
                           {monthNames[am.month]} {am.year}
                         </Text>
                         {isSelected && <Ionicons name="checkmark" color="#00E5CC" size={20} />}
                      </TouchableOpacity>
                    )
                 })
              ) : (
                 computedData.availYears.map((ay, i) => {
                    const isSelected = ay === dateParamY;
                    return (
                      <TouchableOpacity 
                        key={i} 
                        style={styles.modalItem}
                        onPress={() => { setDateParamY(ay); setShowPicker(false); }}
                      >
                         <Text style={[styles.modalItemText, isSelected && {color: '#00E5CC', fontWeight: 'bold'}]}>
                           Año {ay}
                         </Text>
                         {isSelected && <Ionicons name="checkmark" color="#00E5CC" size={20} />}
                      </TouchableOpacity>
                    )
                 })
              )}
           </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         {/* Date Selector Header */}
         <TouchableOpacity style={styles.dateSelectorBtn} onPress={() => setShowPicker(true)}>
            <Calendar color="#00E5CC" size={18} />
            <Text style={styles.dateSelectorText}>
               {mode === 'mensual' 
                  ? `${monthNames[dateParamM.month]} ${dateParamM.year}`
                  : `Año ${dateParamY}`
               }
            </Text>
            <ChevronDown color="#8E8E93" size={18} />
         </TouchableOpacity>

         {mode === 'mensual' ? (
            // --- MONTHLY VIEW ---
            <>
               <View style={styles.balanceCard}>
                   <Text style={styles.kpiLabel}>Balance del Mes</Text>
                   <Text style={[styles.balanceAmount, {color: computedData.mBal >= 0 ? '#00E5CC' : '#EF4444'}]}>
                      S/ {computedData.mBal.toLocaleString()}
                   </Text>
                   
                   <View style={styles.balanceDetails}>
                       <View style={styles.balanceRowInner}>
                           <Text style={styles.balanceSubLabel}>Ingresos</Text>
                           <Text style={[styles.balanceSubAmount, { color: '#00E5CC' }]}>+ S/ {computedData.mInc.toLocaleString()}</Text>
                       </View>
                       <View style={styles.balanceRowInner}>
                           <Text style={styles.balanceSubLabel}>Gastos</Text>
                           <Text style={[styles.balanceSubAmount, { color: '#EF4444' }]}>- S/ {computedData.mExp.toLocaleString()}</Text>
                       </View>
                   </View>

                   {/* Visual Bar */}
                   <View style={styles.monthlyVisualBarContainer}>
                      {computedData.mInc === 0 && computedData.mExp === 0 ? (
                         <View style={[styles.monthlyVisualSegment, { flex: 1, backgroundColor: '#1E1E2A' }]} />
                      ) : (
                         <>
                            {computedData.mInc > 0 && <View style={[styles.monthlyVisualSegment, { flex: computedData.mInc, backgroundColor: '#00E5CC' }]} />}
                            {computedData.mExp > 0 && <View style={[styles.monthlyVisualSegment, { flex: computedData.mExp, backgroundColor: '#EF4444' }]} />}
                         </>
                      )}
                   </View>
                   <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8}}>
                       <Text style={{color: '#8E8E93', fontSize: 11}}>Ingresos</Text>
                       <Text style={{color: '#8E8E93', fontSize: 11}}>Gastos</Text>
                   </View>
               </View>

               {/* Transactions List with Edit & Delete icons */}
               <View style={styles.section}>
                   <Text style={styles.sectionTitle}>
                      {computedData.mTransactions.length > 0 ? 'Historial del Mes (Editar / Eliminar)' : 'Todas las Transacciones (Editar / Eliminar)'}
                   </Text>
                   
                   {((computedData.mTransactions.length > 0 ? computedData.mTransactions : computedData.allTransactions).length === 0) ? (
                      <View style={styles.emptyState}>
                          <SearchX color="#8E8E93" size={48} style={{marginBottom: 16}} />
                          <Text style={styles.emptyTitle}>Sin Movimientos</Text>
                      </View>
                   ) : (
                      <View style={styles.listCard}>
                          {(computedData.mTransactions.length > 0 ? computedData.mTransactions : computedData.allTransactions).map((expense, idx, arr) => (
                          <View key={expense.id} style={[styles.expenseRow, idx < arr.length - 1 && styles.borderBottom]}>
                              <View style={{flex: 1, marginRight: 8}}>
                                  <Text style={styles.expenseName}>{expense.name}</Text>
                                  <Text style={styles.expenseCategory}>{expense.category} • {expense.date ? expense.date.split('T')[0] : ''}</Text>
                              </View>
                              <Text style={[styles.expenseAmount, expense.type === 'ingreso' && { color: '#00E5CC' }]}>
                                  {expense.type === 'ingreso' ? '+' : '-'}S/ {expense.amount.toLocaleString()}
                              </Text>
                              <View style={{flexDirection: 'row', marginLeft: 12, gap: 8, alignItems: 'center'}}>
                                  <TouchableOpacity onPress={() => openEditTx(expense)} style={{padding: 6, backgroundColor: '#1E1E2A', borderRadius: 8}}>
                                    <Edit2 color="#67E8F9" size={16} />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleDeleteTx(expense)} style={{padding: 6, backgroundColor: '#2A1020', borderRadius: 8}}>
                                    <Trash2 color="#EF4444" size={16} />
                                  </TouchableOpacity>
                              </View>
                          </View>
                          ))}
                      </View>
                   )}
               </View>
            </>
         ) : (
            // --- YEARLY VIEW ---
            <>
               <View style={styles.balanceCard}>
                 <Text style={styles.kpiLabel}>Balance Anual Neto</Text>
                 <Text style={[styles.balanceAmount, {color: computedData.yBal >= 0 ? '#00E5CC' : '#EF4444'}]}>S/ {computedData.yBal.toLocaleString()}</Text>
                 <View style={styles.balanceDetails}>
                     <View style={styles.balanceRowInner}>
                         <Text style={styles.balanceSubLabel}>Total Ingresos</Text>
                         <Text style={[styles.balanceSubAmount, { color: '#00E5CC' }]}>+ S/ {computedData.yInc.toLocaleString()}</Text>
                     </View>
                     <View style={styles.balanceRowInner}>
                         <Text style={styles.balanceSubLabel}>Total Gastos</Text>
                         <Text style={[styles.balanceSubAmount, { color: '#EF4444' }]}>- S/ {computedData.yExp.toLocaleString()}</Text>
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

                     <View style={styles.section}>
                         <Text style={styles.sectionTitle}>Transacciones del Año</Text>
                         <View style={styles.listCard}>
                             {computedData.yTransactions.map((expense, idx) => (
                             <View key={expense.id} style={[styles.expenseRow, idx < computedData.yTransactions.length - 1 && styles.borderBottom]}>
                                 <View style={{flex: 1, marginRight: 8}}>
                                     <Text style={styles.expenseName}>{expense.name}</Text>
                                     <Text style={styles.expenseCategory}>{expense.category} • {expense.date ? expense.date.split('T')[0] : ''}</Text>
                                 </View>
                                 <Text style={[styles.expenseAmount, expense.type === 'ingreso' && { color: '#00E5CC' }]}>
                                     {expense.type === 'ingreso' ? '+' : '-'}S/ {expense.amount.toLocaleString()}
                                 </Text>
                             </View>
                             ))}
                         </View>
                     </View>
                 </>
               )}
            </>
         )}
      </ScrollView>

      {/* Edit Transaction Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editModalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar Transacción</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X color="#8E8E93" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.editInputGroup}>
              <Text style={styles.editLabel}>Título del movimiento</Text>
              <TextInput
                style={styles.editTextInput}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.editInputGroup}>
              <Text style={styles.editLabel}>Monto (S/)</Text>
              <TextInput
                style={styles.editTextInput}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <TouchableOpacity 
              style={styles.editSaveBtn}
              onPress={handleSaveEdit}
            >
              <Text style={styles.editSaveBtnText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  modeTabs: { flexDirection: 'row', backgroundColor: '#12121A', borderRadius: 20, padding: 3 },
  modeTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  modeTabActive: { backgroundColor: '#1E1E2A' },
  modeTabText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  modeTabTextActive: { color: '#00E5CC' },
  dateSelectorBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginBottom: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#12121A', borderRadius: 20 },
  dateSelectorText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#12121A', width: '80%', borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E1E2A', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { color: '#FFF', fontSize: 16 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  balanceCard: { backgroundColor: '#12121A', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center' },
  kpiLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 6 },
  balanceAmount: { fontSize: 32, fontWeight: '800', marginBottom: 20 },
  balanceDetails: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 16 },
  balanceRowInner: { alignItems: 'center' },
  balanceSubLabel: { color: '#8E8E93', fontSize: 12, marginBottom: 4 },
  balanceSubAmount: { fontSize: 16, fontWeight: '700' },
  monthlyVisualBarContainer: { flexDirection: 'row', height: 8, width: '100%', borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  monthlyVisualSegment: { height: '100%' },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  listCard: { backgroundColor: '#12121A', borderRadius: 16, paddingHorizontal: 16 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1E1E2A' },
  expenseName: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginBottom: 3 },
  expenseCategory: { color: '#8E8E93', fontSize: 12 },
  expenseAmount: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  chartCard: { backgroundColor: '#12121A', borderRadius: 16, padding: 16, marginBottom: 24 },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, paddingTop: 20 },
  chartBarContainer: { alignItems: 'center', flex: 1 },
  chartBar: { width: 14, backgroundColor: '#EF4444', borderRadius: 4 },
  chartLabel: { color: '#8E8E93', fontSize: 10, marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  editModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  editModalContent: { backgroundColor: '#12121A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editModalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  editInputGroup: { marginBottom: 20 },
  editLabel: { color: '#8E8E93', marginBottom: 8 },
  editTextInput: { backgroundColor: '#1E1E2A', color: '#FFFFFF', padding: 15, borderRadius: 10, fontSize: 16 },
  editSaveBtn: { backgroundColor: '#00E5CC', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  editSaveBtnText: { color: '#000000', fontSize: 16, fontWeight: 'bold' }
});
