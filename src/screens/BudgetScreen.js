import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Calculator, Plus, Trash2, Check, Edit2, X } from 'lucide-react-native';

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
     return (data.transactions || []).filter(t => {
         if(!t.date || !t.date.includes('-')) return false;
         const parts = t.date.split('-');
         const y = parseInt(parts[0], 10);
         const m = parseInt(parts[1], 10) - 1;
         return y === cy && m === cm && t.type === 'gasto';
     });
  }, [data]);

  if (!data || !data.budgets) return <SafeAreaView style={styles.container}><Text style={{color:'#FFF', padding:20}}>Cargando presupuestos...</Text></SafeAreaView>;

  const groups = Object.keys(data.budgets);

  const totalsByGroup = useMemo(() => {
     let fijos = { limit: 0, spent: 0, color: '#67E8F9' };
     let culpa = { limit: 0, spent: 0, color: '#A78BFA' };
     let ahorro = { limit: 0, spent: 0, color: '#00E5CC' };

     if(data && data.budgets) {
         const groupsMap = {
            'Gastos fijos': fijos,
            'Gastos libres de culpa': culpa,
            'Ahorro e inversión': ahorro
         };

         Object.keys(data.budgets).forEach(g => {
            if(groupsMap[g]){
               groupsMap[g].limit = data.budgets[g].reduce((sum, item) => sum + item.limit, 0);
            }
         });

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
     if (Platform.OS === 'web') {
       window.alert('Categoría creada con éxito.');
     } else {
       Alert.alert('Éxito', 'Categoría creada con éxito.');
     }
  };

  const handleSaveEdit = (group, name) => {
     if(editingLimit && editingLimit.limit !== undefined) {
         updateBudgetLimit(group, name, editingLimit.limit);
         if (Platform.OS === 'web') {
           window.alert('Presupuesto actualizado con éxito.');
         } else {
           Alert.alert('Éxito', 'Presupuesto actualizado con éxito.');
         }
     }
     setEditingLimit(null);
  };

  const handleDelete = (group, name) => {
    const doDelete = async () => {
      await deleteBudgetSubcategory(group, name);
      if (Platform.OS === 'web') {
        window.alert('Categoría eliminada con éxito.');
      } else {
        Alert.alert('Éxito', 'Categoría eliminada con éxito.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Borrar la categoría "${name}" de tu presupuesto?`)) {
        doDelete();
      }
    } else {
      Alert.alert("Eliminar categoría", `¿Borrar la categoría "${name}" de tu presupuesto?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: doDelete }
      ]);
    }
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
                 <View style={[styles.stackedSegment, { flex: 1, backgroundColor: '#1E1E2A' }]} />
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
                <Text style={styles.legendText}>Fijos (S/ {totalsByGroup.fijos.spent.toLocaleString()})</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: totalsByGroup.culpa.color}]} />
                <Text style={styles.legendText}>Libres (S/ {totalsByGroup.culpa.spent.toLocaleString()})</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: totalsByGroup.ahorro.color}]} />
                <Text style={styles.legendText}>Ahorro (S/ {totalsByGroup.ahorro.spent.toLocaleString()})</Text>
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
                  <Plus color="#00E5CC" size={18} />
                  <Text style={styles.addBtnText}>Añadir</Text>
              </TouchableOpacity>
          </View>

          <View style={styles.budgetList}>
              {data.budgets[activeGroup].length === 0 ? (
                  <Text style={styles.emptyText}>No tienes categorías en este bloque. Toca "Añadir" para empezar a presupuestar.</Text>
              ) : (
                  data.budgets[activeGroup].map((sub, idx) => {
                      const spent = currentMonthTransactions
                        .filter(t => t.category === activeGroup && t.subcategory === sub.name)
                        .reduce((acc, t) => acc + t.amount, 0);

                      const limit = sub.limit;
                      const progress = limit > 0 ? (spent / limit) : 0;
                      let progressColor = '#00E5CC';
                      if(progress >= 0.8 && progress <= 1) progressColor = '#E879A8';
                      if(progress > 1) progressColor = '#EF4444';

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
                                        <Text style={{color: '#8E8E93', fontWeight: 'bold'}}>S/</Text>
                                        <TextInput 
                                            style={styles.editInput}
                                            keyboardType="numeric"
                                            value={editingLimit.limit}
                                            onChangeText={t => setEditingLimit({...editingLimit, limit: t})}
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={() => handleSaveEdit(activeGroup, sub.name)} style={styles.saveIcon}>
                                            <Check color="#00E5CC" size={20} />
                                        </TouchableOpacity>
                                     </View>
                                  ) : (
                                     <View style={styles.limitWrap}>
                                         <Text style={styles.budgetLimitText}>Límite: S/ {limit.toLocaleString()}</Text>
                                     </View>
                                  )}
                              </View>

                              <View style={styles.progressBg}>
                                  <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progressColor }]} />
                              </View>
                              
                              <View style={styles.budgetFooterRow}>
                                  <Text style={[styles.remainingText, progress > 1 && {color: '#EF4444'}]}>
                                      {progress <= 1 ? `Disponible: S/ ${(limit - spent).toLocaleString()}` : `Excedido por: S/ ${(spent - limit).toLocaleString()}`}
                                  </Text>
                                  <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                                      <TouchableOpacity 
                                        style={{padding: 6, backgroundColor: '#1E1E2A', borderRadius: 8}}
                                        onPress={() => setEditingLimit({ group: activeGroup, name: sub.name, limit: limit.toString() })}
                                      >
                                          <Edit2 color="#67E8F9" size={16} />
                                      </TouchableOpacity>
                                      <TouchableOpacity 
                                        style={{padding: 6, backgroundColor: '#2A1020', borderRadius: 8}}
                                        onPress={() => handleDelete(activeGroup, sub.name)}
                                      >
                                          <Trash2 color="#EF4444" size={16} />
                                      </TouchableOpacity>
                                  </View>
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
                <TouchableOpacity style={[styles.btn, {backgroundColor: '#1E1E2A'}]} onPress={() => setShowAddModal(false)}>
                   <Text style={{color: '#FFF', fontWeight:'bold'}}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, {backgroundColor: '#00E5CC'}]} onPress={handleAddSub}>
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
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  distributionContainer: { backgroundColor: '#12121A', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionHeading: { color: '#8E8E93', fontSize: 13, marginBottom: 4 },
  totalSpentText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  stackedBarContainer: { height: 10, backgroundColor: '#1E1E2A', borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginBottom: 12 },
  stackedSegment: { height: '100%' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#8E8E93', fontSize: 11 },
  tabsContainer: { paddingHorizontal: 20, marginBottom: 16 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#12121A', marginRight: 10 },
  tabBtnActive: { backgroundColor: '#00E5CC' },
  tabText: { color: '#8E8E93', fontWeight: '600', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  groupTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#00E5CC', fontWeight: '600', fontSize: 14 },
  budgetList: { gap: 16 },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginVertical: 20 },
  budgetItem: { backgroundColor: '#12121A', borderRadius: 16, padding: 16 },
  budgetInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  budgetName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  budgetSpent: { color: '#8E8E93', fontSize: 13 },
  limitWrap: { backgroundColor: '#1E1E2A', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  budgetLimitText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  editWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E2A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  editInput: { color: '#FFFFFF', fontWeight: 'bold', width: 60, marginLeft: 4, textAlign: 'right' },
  saveIcon: { marginLeft: 8, padding: 4 },
  progressBg: { height: 8, backgroundColor: '#1E1E2A', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  budgetFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remainingText: { color: '#00E5CC', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#12121A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#8E8E93', marginBottom: 8, fontSize: 14 },
  input: { backgroundColor: '#1E1E2A', color: '#FFFFFF', padding: 14, borderRadius: 10, fontSize: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10, marginBottom: 10 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }
});
