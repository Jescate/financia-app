import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Calculator, Plus, Trash2, Check } from 'lucide-react-native';

export default function BudgetScreen() {
  const { getUserData, updateBudgetLimit, addBudgetSubcategory, deleteBudgetSubcategory } = useAuth();
  const data = getUserData();

  const [activeGroup, setActiveGroup] = useState('Gastos fijos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubLimit, setNewSubLimit] = useState('');

  const [editingLimit, setEditingLimit] = useState(null); // { group, name, limit }
  
  const currentMonthTransactions = useMemo(() => {
     if(!data) return [];
     const d = new Date();
     const cy = d.getFullYear();
     const cm = d.getMonth();
     return data.transactions.filter(t => {
         if(!t.date || !t.date.includes('-')) return false;
         const parts = t.date.split('-');
         const y = parseInt(parts[0], 10);
         const m = parseInt(parts[1], 10) - 1;
         return y === cy && m === cm && t.type === 'gasto';
     });
  }, [data]);

  if (!data || !data.budgets) return <SafeAreaView style={styles.container}><Text style={{color:'#FFF', padding:20}}>Cargando presupuestos...</Text></SafeAreaView>;

  const groups = Object.keys(data.budgets);

  // Total budget vs spent computations
  const totalsByGroup = useMemo(() => {
     let fijos = { limit: 0, spent: 0, color: '#0A84FF' };
     let culpa = { limit: 0, spent: 0, color: '#BF5AF2' };
     let ahorro = { limit: 0, spent: 0, color: '#32D74B' };

     if(data && data.budgets) {
         const groupsMap = {
            'Gastos fijos': fijos,
            'Gastos libres de culpa': culpa,
            'Ahorro e inversión': ahorro
         };

         // sum limits
         Object.keys(data.budgets).forEach(g => {
            if(groupsMap[g]){
               groupsMap[g].limit = data.budgets[g].reduce((sum, item) => sum + item.limit, 0);
            }
         });

         // sum spent
         currentMonthTransactions.forEach(t => {
            if(groupsMap[t.category]){
               groupsMap[t.category].spent += t.amount;
            }
         });
     }
     
     const totalSpent = fijos.spent + culpa.spent + ahorro.spent;

     return { fijos, culpa, ahorro, totalSpent };
  }, [data, currentMonthTransactions]);

  const handleAddSub = () => {
     if(!newSubName.trim() || !newSubLimit.trim()) return;
     addBudgetSubcategory(activeGroup, newSubName.trim(), newSubLimit);
     setShowAddModal(false);
     setNewSubName('');
     setNewSubLimit('');
  };

  const handleSaveEdit = (group, name) => {
     if(editingLimit && editingLimit.limit !== undefined) {
         updateBudgetLimit(group, name, editingLimit.limit);
     }
     setEditingLimit(null);
  };

  const handleDelete = (group, name) => {
      Alert.alert("Eliminar categoría", `¿Borrar la categoría ${name} de tu presupuesto?`, [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => deleteBudgetSubcategory(group, name) }
      ])
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Presupuesto</Text>
      </View>

      <View style={styles.distributionContainer}>
         <Text style={styles.sectionHeading}>Distribución Global (Mes Actual)</Text>
         <Text style={styles.totalSpentText}>S/ {totalsByGroup.totalSpent.toLocaleString()}</Text>
         
         <View style={styles.stackedBarContainer}>
             {totalsByGroup.totalSpent === 0 ? (
                 <View style={[styles.stackedSegment, { flex: 1, backgroundColor: '#2C2C2E' }]} />
             ) : (
                 <>
                   {totalsByGroup.fijos.spent > 0 && <View style={[styles.stackedSegment, { flex: totalsByGroup.fijos.spent / totalsByGroup.totalSpent, backgroundColor: totalsByGroup.fijos.color }]} />}
                   {totalsByGroup.culpa.spent > 0 && <View style={[styles.stackedSegment, { flex: totalsByGroup.culpa.spent / totalsByGroup.totalSpent, backgroundColor: totalsByGroup.culpa.color }]} />}
                   {totalsByGroup.ahorro.spent > 0 && <View style={[styles.stackedSegment, { flex: totalsByGroup.ahorro.spent / totalsByGroup.totalSpent, backgroundColor: totalsByGroup.ahorro.color }]} />}
                 </>
             )}
         </View>

         <View style={styles.legendContainer}>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: totalsByGroup.fijos.color}]} />
                <Text style={styles.legendText}>Fijos (S/ {totalsByGroup.fijos.spent})</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: totalsByGroup.culpa.color}]} />
                <Text style={styles.legendText}>Libres (S/ {totalsByGroup.culpa.spent})</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: totalsByGroup.ahorro.color}]} />
                <Text style={styles.legendText}>Ahorro (S/ {totalsByGroup.ahorro.spent})</Text>
             </View>
         </View>
      </View>

      <View style={styles.tabsContainer}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {groups.map(group => (
               <TouchableOpacity 
                  key={group} 
                  style={[styles.tabBtn, activeGroup === group && styles.tabBtnActive]}
                  onPress={() => setActiveGroup(group)}
               >
                  <Text style={[styles.tabText, activeGroup === group && {color: '#000'}]}>{group}</Text>
               </TouchableOpacity>
            ))}
         </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{activeGroup}</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                  <Plus color="#32D74B" size={18} />
                  <Text style={styles.addBtnText}>Añadir</Text>
              </TouchableOpacity>
          </View>

          <View style={styles.budgetList}>
              {data.budgets[activeGroup].length === 0 ? (
                  <Text style={styles.emptyText}>No tienes categorías en este bloque. Toca "Añadir" para empezar a presupuestar.</Text>
              ) : (
                  data.budgets[activeGroup].map((sub, idx) => {
                      // Calculate real expenses this month for this subcategory
                      // Since transactions map to "category" and "subcategory", we must map:
                      // In the new system, `activeGroup` maps to `transaction.category` 
                      // and `sub.name` maps to `transaction.subcategory`. Wait. In our forms we just use the name if possible.
                      const spent = currentMonthTransactions
                        .filter(t => t.category === activeGroup && t.subcategory === sub.name)
                        .reduce((acc, t) => acc + t.amount, 0);

                      const limit = sub.limit;
                      const progress = limit > 0 ? (spent / limit) : 0;
                      let progressColor = '#32D74B';
                      if(progress >= 0.8 && progress <= 1) progressColor = '#FFD60A';
                      if(progress > 1) progressColor = '#FF453A';

                      const isEditingThis = editingLimit?.group === activeGroup && editingLimit?.name === sub.name;

                      return (
                          <View key={idx} style={styles.budgetItem}>
                              <View style={styles.budgetInfoRow}>
                                  <View style={{flex: 1}}>
                                     <Text style={styles.budgetName}>{sub.name}</Text>
                                     <Text style={styles.budgetSpent}>Llevas S/ {spent.toLocaleString()}</Text>
                                  </View>
                                  
                                  {isEditingThis ? (
                                     <View style={styles.editWrap}>
                                        <Text style={{color: '#8E8E93'}}>S/</Text>
                                        <TextInput 
                                            style={styles.editInput}
                                            keyboardType="numeric"
                                            value={editingLimit.limit}
                                            onChangeText={t => setEditingLimit({...editingLimit, limit: t})}
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={() => handleSaveEdit(activeGroup, sub.name)} style={styles.saveIcon}>
                                            <Check color="#32D74B" size={18} />
                                        </TouchableOpacity>
                                     </View>
                                  ) : (
                                     <TouchableOpacity style={styles.limitWrap} onPress={() => setEditingLimit({ group: activeGroup, name: sub.name, limit: limit.toString() })}>
                                         <Text style={styles.budgetLimitText}>Límite: S/ {limit.toLocaleString()}</Text>
                                     </TouchableOpacity>
                                  )}
                              </View>

                              <View style={styles.progressBg}>
                                  <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progressColor }]} />
                              </View>
                              
                              <View style={styles.budgetFooterRow}>
                                  <Text style={[styles.remainingText, progress > 1 && {color: '#FF453A'}]}>
                                      {progress <= 1 ? `Disponible: S/ ${(limit - spent).toLocaleString()}` : `Excedido por: S/ ${(spent - limit).toLocaleString()}`}
                                  </Text>
                                  <TouchableOpacity onPress={() => handleDelete(activeGroup, sub.name)}>
                                      <Trash2 color="#FF453A" size={16} />
                                  </TouchableOpacity>
                              </View>
                          </View>
                      )
                  })
              )}
          </View>
      </ScrollView>

      {/* MODAL NUEVA CATEGORIA */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>Nueva Categoría en {activeGroup}</Text>
             
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre (Ej. Gimnasio)</Text>
                <TextInput style={styles.input} placeholderTextColor="#8E8E93" placeholder="Ingresa nombre" value={newSubName} onChangeText={setNewSubName} />
             </View>
             
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Límite Mensual Estimado (S/)</Text>
                <TextInput style={styles.input} placeholderTextColor="#8E8E93" placeholder="100.00" keyboardType="numeric" value={newSubLimit} onChangeText={setNewSubLimit} />
             </View>

             <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.btn, {backgroundColor: '#2C2C2E'}]} onPress={() => setShowAddModal(false)}>
                   <Text style={{color: '#FFF', fontWeight:'bold'}}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={handleAddSub}>
                   <Text style={{color: '#000', fontWeight:'bold'}}>Añadir</Text>
                </TouchableOpacity>
             </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  distributionContainer: { paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1C1C1E', marginBottom: 16 },
  sectionHeading: { color: '#8E8E93', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  totalSpentText: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  stackedBarContainer: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  stackedSegment: { height: '100%' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: '#8E8E93', fontSize: 12 },
  tabsContainer: { paddingLeft: 20, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1C1C1E', paddingBottom: 16 },
  tabBtn: { backgroundColor: '#1C1C1E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 12 },
  tabBtnActive: { backgroundColor: '#32D74B' },
  tabText: { color: '#8E8E93', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  groupTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: '#32D74B', fontWeight: '600', fontSize: 13 },
  budgetList: { gap: 20 },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  budgetItem: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 16 },
  budgetInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  budgetName: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  budgetSpent: { color: '#8E8E93', fontSize: 13 },
  limitWrap: { backgroundColor: '#2C2C2E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  budgetLimitText: { color: '#E5E5EA', fontSize: 13, fontWeight: '500' },
  editWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  editInput: { color: '#FFF', width: 60, marginLeft: 4 },
  saveIcon: { marginLeft: 8 },
  progressBg: { height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  budgetFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remainingText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#8E8E93', marginBottom: 8, fontSize: 13 },
  input: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 14, borderRadius: 10 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center', backgroundColor: '#32D74B' }
});
