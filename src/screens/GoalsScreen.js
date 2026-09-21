import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Target, Plus, Trash2, Edit2, TrendingUp, X, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function GoalsScreen() {
  const { goals, addGoal, updateGoal, deleteGoal, addMoneyToGoal, getUserData, updateAccountBalance } = useAuth();
  const data = getUserData();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const debitAccounts = data ? data.accounts.filter(a => a.type === 'cash') : [];

  const openAddModal = () => {
    setModalMode('add');
    setName('');
    setAmount('');
    setIsModalVisible(true);
  };

  const openEditModal = (goal) => {
    setModalMode('edit');
    setSelectedGoalId(goal.id);
    setName(goal.name);
    setAmount(goal.targetAmount.toString());
    setIsModalVisible(true);
  };

  const openAddMoneyModal = (goal) => {
    setModalMode('addMoney');
    setSelectedGoalId(goal.id);
    setAmount('');
    setSelectedAccountId('');
    setShowAccountPicker(false);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (modalMode === 'add') {
      if (name && amount) addGoal(name, amount);
    } else if (modalMode === 'edit') {
      if (name && amount && selectedGoalId) updateGoal(selectedGoalId, name, amount);
    } else if (modalMode === 'addMoney') {
      if (amount && selectedGoalId && selectedAccountId) {
        const account = debitAccounts.find(a => a.id === selectedAccountId);
        if (account) {
          const newBalance = account.balance - parseFloat(amount);
          await updateAccountBalance(selectedAccountId, newBalance.toString());
        }
        addMoneyToGoal(selectedGoalId, amount);
      }
    }
    setIsModalVisible(false);
  };

  const selectedAccountName = debitAccounts.find(a => a.id === selectedAccountId)?.name || 'Selecciona una cuenta';

  const renderGoal = ({ item }) => {
    const progress = Math.min((item.currentAmount / item.targetAmount) * 100, 100) || 0;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.goalName}>{item.name}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
              <Edit2 color="#8E8E93" size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteGoal(item.id)} style={[styles.actionBtn, { marginLeft: 15 }]}>
              <Trash2 color="#EF4444" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.amountText}>
          S/ {item.currentAmount.toFixed(2)} de S/ {item.targetAmount.toFixed(2)}
        </Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>{progress.toFixed(1)}% completado</Text>

        <TouchableOpacity 
           style={styles.addMoneyBtn}
           onPress={() => openAddMoneyModal(item)}
           disabled={item.currentAmount >= item.targetAmount}
        >
          <TrendingUp color={item.currentAmount >= item.targetAmount ? "#8E8E93" : "#00E5CC"} size={16} />
          <Text style={[styles.addMoneyText, item.currentAmount >= item.targetAmount && { color: "#8E8E93" }]}>
            {item.currentAmount >= item.targetAmount ? "Meta Alcanzada" : "Aportar a meta"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Metas</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus color="#000000" size={24} />
        </TouchableOpacity>
      </View>

      {goals && goals.length > 0 ? (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={renderGoal}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Target color="#8E8E93" size={48} />
          <Text style={styles.emptyText}>A\u00fan no tienes metas de ahorro.</Text>
          <Text style={styles.emptySubtext}>Crea una nueva meta para empezar a ahorrar.</Text>
        </View>
      )}

      <Modal visible={isModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'add' ? 'Nueva Meta' : modalMode === 'edit' ? 'Editar Meta' : 'Aportar Dinero'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color="#8E8E93" size={24} />
              </TouchableOpacity>
            </View>

            {(modalMode === 'add' || modalMode === 'edit') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la meta (Ej. Viaje)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Escribe el nombre..."
                  placeholderTextColor="#8E8E93"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {modalMode === 'addMoney' ? 'Monto a aportar (S/)' : 'Monto objetivo (S/)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {modalMode === 'addMoney' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>\u00bfDe qu\u00e9 cuenta sale? (Solo d\u00e9bito)</Text>
                <TouchableOpacity 
                  style={styles.accountSelector} 
                  onPress={() => setShowAccountPicker(!showAccountPicker)}
                >
                  <Text style={[styles.accountSelectorText, !selectedAccountId && { color: '#8E8E93' }]}>
                    {selectedAccountName}
                  </Text>
                  <ChevronDown color="#8E8E93" size={20} />
                </TouchableOpacity>
                {showAccountPicker && (
                  <View style={styles.accountPickerList}>
                    {debitAccounts.map(acc => (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountPickerItem, selectedAccountId === acc.id && styles.accountPickerItemActive]}
                        onPress={() => {
                          setSelectedAccountId(acc.id);
                          setShowAccountPicker(false);
                        }}
                      >
                        <Text style={[styles.accountPickerItemText, selectedAccountId === acc.id && { color: '#00E5CC' }]}>
                          {acc.name}
                        </Text>
                        <Text style={styles.accountPickerBalance}>
                          S/ {acc.balance?.toLocaleString() || 0}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {debitAccounts.length === 0 && (
                      <Text style={styles.noAccountsText}>No tienes cuentas de d\u00e9bito</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.saveBtn, modalMode === 'addMoney' && !selectedAccountId && styles.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={modalMode === 'addMoney' && !selectedAccountId}
            >
              <Text style={styles.saveBtnText}>
                {modalMode === 'add' ? 'Crear Meta' : modalMode === 'edit' ? 'Guardar Cambios' : 'A\u00f1adir Dinero'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    padding: 20, paddingTop: 60, flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { backgroundColor: '#00E5CC', padding: 10, borderRadius: 20 },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#12121A', borderRadius: 15, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalName: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 4 },
  amountText: { color: '#8E8E93', fontSize: 14, marginBottom: 15 },
  progressContainer: { height: 8, backgroundColor: '#1E1E2A', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#00E5CC' },
  progressPercentage: { color: '#E5E5EA', fontSize: 12, textAlign: 'right', marginBottom: 15 },
  addMoneyBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#1E1E2A', padding: 12, borderRadius: 8 
  },
  addMoneyText: { color: '#00E5CC', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#FFFFFF', fontSize: 18, marginTop: 10 },
  emptySubtext: { color: '#8E8E93', marginTop: 5, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#12121A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#8E8E93', marginBottom: 8 },
  input: { backgroundColor: '#1E1E2A', color: '#FFFFFF', padding: 15, borderRadius: 10, fontSize: 16 },
  accountSelector: { backgroundColor: '#1E1E2A', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountSelectorText: { color: '#FFFFFF', fontSize: 16 },
  accountPickerList: { backgroundColor: '#1E1E2A', borderRadius: 10, marginTop: 8, overflow: 'hidden' },
  accountPickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A3A', flexDirection: 'row', justifyContent: 'space-between' },
  accountPickerItemActive: { backgroundColor: '#2A2A3A' },
  accountPickerItemText: { color: '#FFFFFF', fontSize: 15 },
  accountPickerBalance: { color: '#8E8E93', fontSize: 14 },
  noAccountsText: { color: '#8E8E93', padding: 16, textAlign: 'center' },
  saveBtn: { backgroundColor: '#00E5CC', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveBtnDisabled: { backgroundColor: '#3A3A4C', opacity: 0.6 },
  saveBtnText: { color: '#000000', fontSize: 16, fontWeight: 'bold' }
});
