import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { WalletCards, TrendingUp, PiggyBank, Edit2, Plus, Trash2, X, CreditCard } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CashScreen() {
  const { getUserData, updateAccountBalance, addAccount, deleteAccount, renameAccount } = useAuth();
  const data = getUserData();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [editNames, setEditNames] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('cash');
  const [newAccCurrency, setNewAccCurrency] = useState('PEN');
  const [newAccBaseAmount, setNewAccBaseAmount] = useState('');

  if (!data) return null;

  const totalSoles = data.accounts.filter(a => a.currency === 'PEN' && a.type !== 'credit').reduce((acc, a) => acc + a.balance, 0);
  const totalInvertido = data.accounts.filter(a => a.currency === 'USD' && a.type === 'savings').reduce((acc, a) => acc + a.balance, 0);
  const totalCreditoGastado = data.accounts.filter(a => a.type === 'credit').reduce((acc, a) => acc + (a.usedCredit || 0), 0);

  const handleEditPress = () => {
    if (isEditing) {
      Object.keys(editValues).forEach(id => {
         const valStr = editValues[id];
         if (valStr && !isNaN(valStr)) {
            updateAccountBalance(id, valStr);
         }
      });
      Object.keys(editNames).forEach(id => {
         const nameStr = editNames[id];
         if (nameStr && nameStr.trim().length > 0) {
            renameAccount(id, nameStr.trim());
         }
      });
      setIsEditing(false);
      setEditValues({});
      setEditNames({});
      if (Platform.OS === 'web') {
        window.alert('Cuentas actualizadas con éxito.');
      } else {
        Alert.alert('Éxito', 'Cuentas actualizadas con éxito.');
      }
    } else {
      const initialVals = {};
      const initialNames = {};
      data.accounts.forEach(a => {
        if (a.type === 'credit') {
          initialVals[a.id] = (a.availableCredit || 0).toString();
        } else {
          initialVals[a.id] = (a.balance || 0).toString();
        }
        initialNames[a.id] = a.name;
      });
      setEditValues(initialVals);
      setEditNames(initialNames);
      setIsEditing(true);
    }
  };

  const handleDelete = (id) => {
    const doDelete = async () => {
      await deleteAccount(id);
      if (Platform.OS === 'web') {
        window.alert('Cuenta eliminada con éxito.');
      } else {
        Alert.alert('Éxito', 'Cuenta eliminada con éxito.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas eliminar esta cuenta?')) {
        doDelete();
      }
    } else {
      Alert.alert("Eliminar cuenta", "¿Estás seguro que deseas eliminar esta cuenta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: doDelete }
      ]);
    }
  };

  const handleCreateAccount = () => {
    if (!newAccName.trim()) return;
    addAccount(newAccName.trim(), newAccType, newAccCurrency, newAccBaseAmount);
    setNewAccName('');
    setNewAccBaseAmount('');
    setShowAddModal(false);
    if (Platform.OS === 'web') {
      window.alert('Cuenta creada con éxito.');
    } else {
      Alert.alert('Éxito', 'Cuenta creada con éxito.');
    }
  };

  const getAccountTypeLabel = (type) => {
    switch(type) {
      case 'credit': return 'Tarjeta de Cr\u00e9dito';
      case 'savings': return 'Ahorros';
      case 'cash': 
      default: return 'D\u00e9bito';
    }
  };

  const getAccountIcon = (account) => {
    if (account.type === 'credit') return <CreditCard color="#A78BFA" size={24} />;
    if (account.type === 'savings') return <PiggyBank color="#67E8F9" size={24} />;
    return <WalletCards color="#00E5CC" size={24} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Cuentas</Text>
        <TouchableOpacity style={styles.editBtn} onPress={handleEditPress}>
          {isEditing ? <Ionicons name="checkmark" color="#00E5CC" size={20} /> : <Edit2 color="#67E8F9" size={20} />}
          <Text style={[styles.editBtnText, { color: isEditing ? '#00E5CC' : '#67E8F9' }]}>
            {isEditing ? 'Guardar' : 'Editar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#12121A' }]}>
              <View style={styles.labelWithIcon}>
                <WalletCards color="#8E8E93" size={14} />
                <Text style={styles.summaryLabel}>Total Soles (S/)</Text>
              </View>
              <Text style={[styles.summaryValue, { color: '#00E5CC' }]}>S/ {totalSoles.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#12121A' }]}>
              <View style={styles.labelWithIcon}>
                <TrendingUp color="#8E8E93" size={14} />
                <Text style={styles.summaryLabel}>Total Invertido ($)</Text>
              </View>
              <Text style={[styles.summaryValue, { color: '#67E8F9' }]}>$ {totalInvertido.toLocaleString()}</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#12121A', marginTop: 12 }]}>
            <View style={styles.labelWithIcon}>
              <CreditCard color="#8E8E93" size={14} />
              <Text style={styles.summaryLabel}>Cr\u00e9dito Total Gastado</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#E879A8' }]}>S/ {totalCreditoGastado.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
            <Text style={styles.sectionTitle}>Detalles de Cuentas</Text>
            {!isEditing && (
              <TouchableOpacity style={styles.addIconBtn} onPress={() => setShowAddModal(true)}>
                <Plus color="#00E5CC" size={20} />
                <Text style={styles.addIconBtnText}>Nueva</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {data.accounts.map((account) => (
            <View key={account.id} style={[styles.accountCard, isEditing && styles.accountCardEditing]}>
              <View style={styles.accountIcon}>
                {getAccountIcon(account)}
              </View>
              
              <View style={styles.accountInfo}>
                {isEditing ? (
                  <TextInput 
                     style={styles.editNameInput}
                     value={editNames[account.id]}
                     onChangeText={(text) => setEditNames(prev => ({...prev, [account.id]: text}))}
                  />
                ) : (
                  <Text style={styles.accountName}>{account.name}</Text>
                )}
                <Text style={styles.accountType}>
                  {getAccountTypeLabel(account.type)}
                </Text>
              </View>
              
              <View style={styles.accountAmount}>
                {isEditing ? (
                  <View style={styles.editInputContainer}>
                     <Text style={styles.editCurrency}>{account.currency === 'USD' ? '$' : 'S/'}</Text>
                     <TextInput 
                        style={styles.editInput}
                        keyboardType="numeric"
                        value={editValues[account.id]}
                        onChangeText={(text) => setEditValues(prev => ({...prev, [account.id]: text}))}
                     />
                  </View>
                ) : (
                  <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.amountText}>
                        {account.currency === 'USD' ? '$ ' : 'S/ '} 
                        {account.type === 'credit' ? account.availableCredit?.toLocaleString() || 0 : account.balance?.toLocaleString() || 0}
                      </Text>
                      {account.type === 'credit' && (
                         <Text style={{color: '#8E8E93', fontSize: 11, marginTop: 4}}>
                            L\u00edmite: {account.currency === 'USD' ? '$' : 'S/'} {account.creditLimit?.toLocaleString() || 0}
                         </Text>
                      )}
                  </View>
                )}
              </View>

              {isEditing && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(account.id)}>
                   <Trash2 color="#EF4444" size={20} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Cuenta</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color="#8E8E93" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de la cuenta</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. BCP Ahorros"
                placeholderTextColor="#8E8E93"
                value={newAccName}
                onChangeText={setNewAccName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de cuenta</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                   style={[styles.typeBtn, newAccType === 'cash' && styles.typeBtnActive]}
                   onPress={() => setNewAccType('cash')}
                >
                   <Text style={[styles.typeBtnText, newAccType === 'cash' && styles.typeBtnTextActive]}>D\u00e9bito</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.typeBtn, newAccType === 'savings' && styles.typeBtnActive]}
                   onPress={() => setNewAccType('savings')}
                >
                   <Text style={[styles.typeBtnText, newAccType === 'savings' && styles.typeBtnTextActive]}>Ahorros</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.typeBtn, newAccType === 'credit' && styles.typeBtnActive]}
                   onPress={() => setNewAccType('credit')}
                >
                   <Text style={[styles.typeBtnText, newAccType === 'credit' && styles.typeBtnTextActive]}>Cr\u00e9dito</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Moneda</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                   style={[styles.typeBtn, newAccCurrency === 'PEN' && {borderColor: '#00E5CC'}]}
                   onPress={() => setNewAccCurrency('PEN')}
                >
                   <Text style={[styles.typeBtnText, newAccCurrency === 'PEN' && {color: '#00E5CC'}]}>Soles (PEN)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.typeBtn, newAccCurrency === 'USD' && {borderColor: '#00E5CC'}]}
                   onPress={() => setNewAccCurrency('USD')}
                >
                   <Text style={[styles.typeBtnText, newAccCurrency === 'USD' && {color: '#00E5CC'}]}>D\u00f3lares (USD)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>{newAccType === 'credit' ? 'L\u00edmite de Cr\u00e9dito' : 'Saldo Inicial'}</Text>
                <TextInput 
                   style={styles.input} 
                   placeholderTextColor="#8E8E93" 
                   keyboardType="numeric"
                   placeholder="0.00" 
                   value={newAccBaseAmount} 
                   onChangeText={setNewAccBaseAmount} 
                />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateAccount}>
              <Text style={styles.saveBtnText}>Crear Cuenta</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#12121A', borderRadius: 20 },
  editBtnText: { fontWeight: '600', fontSize: 14 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  summaryContainer: { gap: 12, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, justifyContent: 'center' },
  summaryLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 8 },
  labelWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  addIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addIconBtnText: { color: '#00E5CC', fontSize: 14, fontWeight: '600' },
  accountCard: { flexDirection: 'row', backgroundColor: '#12121A', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  accountCardEditing: { borderColor: '#8E8E93', paddingVertical: 12 },
  accountIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E1E2A', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  accountInfo: { flex: 1, marginRight: 8 },
  accountName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  editNameInput: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#00E5CC', padding: 0 },
  accountType: { color: '#8E8E93', fontSize: 12 },
  accountAmount: { alignItems: 'flex-end', justifyContent: 'center' },
  amountText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  editInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E2A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, minWidth: 90 },
  editCurrency: { color: '#8E8E93', marginRight: 4, fontWeight: '600' },
  editInput: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'right' },
  deleteBtn: { marginLeft: 12, padding: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#12121A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#8E8E93', marginBottom: 8, fontSize: 14 },
  input: { backgroundColor: '#1E1E2A', color: '#FFFFFF', padding: 15, borderRadius: 10, fontSize: 16 },
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1E1E2A', alignItems: 'center', marginHorizontal: 2 },
  typeBtnActive: { backgroundColor: '#00E5CC', borderColor: '#00E5CC' },
  typeBtnText: { color: '#E5E5EA', fontWeight: '600', fontSize: 13 },
  typeBtnTextActive: { color: '#000000' },
  saveBtn: { backgroundColor: '#00E5CC', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveBtnText: { color: '#000000', fontSize: 16, fontWeight: 'bold' }
});
