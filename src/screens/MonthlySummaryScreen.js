import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Calendar, SearchX, PieChart, Edit2, Trash2, X } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MonthlySummaryScreen() {
  const { getUserData, editTransaction, deleteTransaction, deleteTransactionsForMonths } = useAuth();
  const data = getUserData();

  const [dateParam, setDateParam] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  
  const [showPicker, setShowPicker] = useState(false);

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

  const handleDeleteMayAugust = () => {
    Alert.alert(
      "Borrar mayo y agosto",
      "¿Deseas eliminar todas las transacciones de mayo y agosto?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, borrar", 
          style: "destructive", 
          onPress: async () => {
            if (deleteTransactionsForMonths) {
              const count = await deleteTransactionsForMonths(['05', '08']);
              Alert.alert("Listo", `Se borraron ${count || 0} transacciones de mayo y agosto.`);
            }
          } 
        }
      ]
    );
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

  const { monthTransactions, availableMonths, monthlyKPIs, categorySpend, allTransactions } = useMemo(() => {
    if (!data) return {};

    const available = [];
    const availableSet = new Set();
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    availableSet.add(`${currentYear}-${currentMonth}`);
    available.push({ year: currentYear, month: currentMonth });

    const allTx = data.transactions || [];

    allTx.forEach(t => {
      const dbDate = t.date;
      if (dbDate && dbDate.includes('-')) {
        const parts = dbDate.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
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

    const mTransactions = allTx.filter(t => {
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
       if (catProgress[t.category]) {
          catProgress[t.category].total += t.amount;
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
       categorySpend: catProgress,
       allTransactions: allTx
    };

  }, [data, dateParam]);

  if (!data) return null;

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // Display month transactions if available, otherwise display all transactions so user can always see & edit them!
  const txListToDisplay = (monthTransactions && monthTransactions.length > 0) ? monthTransactions : (allTransactions || []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
        <Text style={styles.headerTitle}>Resumen Mensual</Text>
        <TouchableOpacity 
          style={{backgroundColor: '#2A1020', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444'}}
          onPress={handleDeleteMayAugust}
        >
          <Text style={{color: '#EF4444', fontSize: 12, fontWeight: '600'}}>Borrar Mayo/Agosto</Text>
        </TouchableOpacity>
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
                      <Text style={[styles.modalItemText, isSelected && {color: '#67E8F9', fontWeight: 'bold'}]}>
                        {monthNames[am.month]} {am.year}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" color="#67E8F9" size={20} />}
                   </TouchableOpacity>
                 )
              })}
           </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.monthSelector} onPress={() => setShowPicker(true)}>
          <Calendar color="#00E5CC" size={20} />
          <Text style={styles.monthText}>{monthNames[dateParam.month]} {dateParam.year}</Text>
          <ChevronDown color="#FFFFFF" size={20} />
        </TouchableOpacity>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Ingresos</Text>
            <Text style={[styles.kpiValue, { color: '#00E5CC' }]}>S/ {monthlyKPIs?.income.toLocaleString()}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Gastos</Text>
            <Text style={[styles.kpiValue, { color: '#EF4444' }]}>S/ {monthlyKPIs?.expenses.toLocaleString()}</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {monthTransactions?.length > 0 && (
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
        )}

        {/* Transaction History - ALWAYS VISIBLE SO YOU CAN EDIT ANY TRANSACTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {monthTransactions?.length > 0 ? 'Historial del Mes' : 'Todas las Transacciones (Editar/Eliminar)'}
          </Text>
          {txListToDisplay.length === 0 ? (
            <View style={styles.emptyState}>
               <SearchX color="#8E8E93" size={48} style={{marginBottom: 16}} />
               <Text style={styles.emptyTitle}>Sin Movimientos</Text>
               <Text style={styles.emptyDesc}>No tienes transacciones registradas.</Text>
            </View>
          ) : (
            <View style={styles.topExpensesCard}>
              {txListToDisplay.map((expense, idx) => (
                <View key={expense.id} style={[styles.expenseRow, idx < txListToDisplay.length - 1 && styles.borderBottom]}>
                  <View style={{flex: 1, marginRight: 8}}>
                    <Text style={styles.expenseName}>{expense.name}</Text>
                    <Text style={styles.expenseCategory}>
                      {expense.category} • {expense.date ? expense.date.split('T')[0] : ''}
                    </Text>
                  </View>
                  <Text style={[styles.expenseAmount, expense.type === 'ingreso' && { color: '#00E5CC' }]}>
                    {expense.type === 'ingreso' ? '+' : '-'}S/ {expense.amount.toLocaleString()}
                  </Text>
                  <View style={{flexDirection: 'row', marginLeft: 12, gap: 10, alignItems: 'center'}}>
                    <TouchableOpacity onPress={() => openEditTx(expense)} style={{padding: 6, backgroundColor: '#1E1E2A', borderRadius: 8}}>
                      <Edit2 color="#67E8F9" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteTx(expense)} style={{padding: 6, backgroundColor: '#2A1020', borderRadius: 8}}>
                      <Trash2 color="#EF4444" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#12121A', width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E1E2A', flexDirection: 'row', justifyContent: 'space-between' },
  modalItemText: { color: '#FFF', fontSize: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginBottom: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#12121A', borderRadius: 20 },
  monthText: { color: '#00E5CC', fontSize: 16, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', backgroundColor: '#12121A', borderRadius: 16, paddingVertical: 16, marginBottom: 32 },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, backgroundColor: '#1E1E2A' },
  kpiLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  categoryBlock: { backgroundColor: '#12121A', borderRadius: 16, padding: 16, marginBottom: 16 },
  categoryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  categoryTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  categoryTotalSpent: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  subItem: { marginBottom: 12 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subName: { color: '#E5E5EA', fontSize: 14 },
  subAmount: { color: '#8E8E93', fontSize: 14 },
  progressBg: { height: 6, backgroundColor: '#1E1E2A', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#A78BFA' },
  topExpensesCard: { backgroundColor: '#12121A', borderRadius: 16, paddingHorizontal: 16 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1E1E2A' },
  expenseName: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  expenseCategory: { color: '#8E8E93', fontSize: 13 },
  expenseAmount: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyDesc: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
