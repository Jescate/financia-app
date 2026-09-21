import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Calendar as CalendarIcon, Wallet, CreditCard, X } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen({ navigation }) {
  const { getUserData, addTransaction, payCreditCard } = useAuth();
  const data = getUserData();
  
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [accountId, setAccountId] = useState('');
  
  const [category, setCategory] = useState('Gastos Fijos');
  const [subcategory, setSubcategory] = useState('');
  
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPayCreditModal, setShowPayCreditModal] = useState(false);
  const [selectedCreditCardId, setSelectedCreditCardId] = useState('');
  const [showCat, setShowCat] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showAcc, setShowAcc] = useState(false);

  useEffect(() => {
    if (data && data.budgets && data.budgets[category] && data.budgets[category].length > 0) {
      setSubcategory(data.budgets[category][0].name);
    } else {
      setSubcategory('Otros');
    }
  }, [category, data]);

  // If loading, render loading screen instead of null (blank screen)
  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00E5CC" />
          <Text style={{ color: '#8E8E93', marginTop: 12 }}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el movimiento.');
      return;
    }
    if (!accountId) {
      Alert.alert('Error', 'Por favor selecciona la cuenta.');
      return;
    }
    if (type === 'gasto' && (!category || !subcategory)) {
      Alert.alert('Error', 'Por favor selecciona la categoría y subcategoría para el gasto.');
      return;
    }

    const newTx = {
      type,
      amount: parseFloat(amount),
      name,
      description,
      category: type === 'ingreso' ? 'Ingresos' : category,
      subcategory: type === 'ingreso' ? 'General' : subcategory,
      date: date.toISOString(),
      accountId
    };

    addTransaction(newTx);
    
    Alert.alert('Completado', 'Movimiento registrado con éxito.', [
      { text: 'OK', onPress: () => {
        setAmount('');
        setName('');
        setDescription('');
        setDate(new Date());
      }}
    ]);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const accounts = data.accounts || [];
  const creditCards = accounts.filter(a => a.type === 'credit');

  const handlePayCreditCard = () => {
    if (!selectedCreditCardId) return;
    payCreditCard(selectedCreditCardId);
    Alert.alert('Listo', 'La deuda de la tarjeta se ha reiniciado a 0.');
    setShowPayCreditModal(false);
    setSelectedCreditCardId('');
  };

  const formattedDate = () => {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const MAIN_CATEGORIES = data.budgets ? Object.keys(data.budgets) : [];
  const selectedAccountName = accounts.find(a => a.id === accountId)?.name || 'Selecciona una cuenta';

  const closeDropdowns = () => {
    setShowAcc(false);
    setShowCat(false);
    setShowSub(false);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transacciones</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Pay Credit Card Button */}
          <TouchableOpacity 
            style={styles.payCreditBtn}
            onPress={() => setShowPayCreditModal(true)}
          >
            <CreditCard color="#A78BFA" size={20} />
            <Text style={styles.payCreditBtnText}>Pagar Tarjeta de Crédito</Text>
          </TouchableOpacity>

          {/* Tabs Gasto / Ingreso */}
          <View style={styles.typeTabs}>
            <TouchableOpacity 
              style={[styles.typeTab, type === 'gasto' && styles.typeTabActiveGasto]} 
              onPress={() => { setType('gasto'); closeDropdowns(); }}
            >
              <Text style={[styles.typeTabText, type === 'gasto' && { color: '#EF4444' }]}>Gasto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeTab, type === 'ingreso' && styles.typeTabActiveIngreso]} 
              onPress={() => { setType('ingreso'); closeDropdowns(); }}
            >
              <Text style={[styles.typeTabText, type === 'ingreso' && { color: '#00E5CC' }]}>Ingreso</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>S/</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#2C2C2E"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.formContainer}>
            
            {/* Account Picker */}
            <View style={[styles.inputGroup, { zIndex: 12 }]}>
              <Text style={styles.label}>{type === 'gasto' ? '¿Con qué cuenta pagaste? *' : '¿A qué cuenta ingresó? *'}</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => { closeDropdowns(); setShowAcc(!showAcc); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Wallet color="#8E8E93" size={20} />
                  <Text style={[styles.pickerText, !accountId && {color: '#8E8E93'}]}>{selectedAccountName}</Text>
                </View>
                <ChevronDown color="#8E8E93" size={20} />
              </TouchableOpacity>

              {showAcc && (
                <View style={styles.dropdownMenu}>
                  {accounts.map((acc) => (
                    <TouchableOpacity 
                      key={acc.id} 
                      style={styles.dropdownItem}
                      onPress={() => { setAccountId(acc.id); closeDropdowns(); }}
                    >
                      <View>
                        <Text style={[styles.dropdownItemText, accountId === acc.id && { color: '#00E5CC', fontWeight: '600' }]}>{acc.name}</Text>
                        <Text style={{color: '#8E8E93', fontSize: 12}}>
                           {acc.balance !== undefined ? 'S/ ' + acc.balance.toLocaleString() : 'Cargando saldo'}
                        </Text>
                      </View>
                      {accountId === acc.id && <Ionicons name="checkmark" color="#00E5CC" size={16} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Date Picker */}
            <View style={[styles.inputGroup, { zIndex: 11 }]}>
              <Text style={styles.label}>Fecha *</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => { closeDropdowns(); setShowDatePicker(true); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon color="#8E8E93" size={20} />
                  <Text style={styles.pickerText}>{formattedDate()}</Text>
                </View>
                <ChevronDown color="#8E8E93" size={20} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant="dark" 
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título del movimiento *</Text>
              <TextInput
                style={styles.input}
                placeholder={type === 'gasto' ? "Ej. Supermercado" : "Ej. Sueldo Marzo"}
                placeholderTextColor="#636366"
                value={name}
                onChangeText={setName}
              />
            </View>

            {type === 'gasto' && (
              <>
                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                  <Text style={styles.label}>Categoría Principal *</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => { closeDropdowns(); setShowCat(!showCat); }}>
                    <Text style={styles.pickerText}>{category}</Text>
                    <ChevronDown color="#8E8E93" size={20} />
                  </TouchableOpacity>

                  {showCat && (
                    <View style={styles.dropdownMenu}>
                      {MAIN_CATEGORIES.map((cat) => (
                        <TouchableOpacity 
                          key={cat} 
                          style={styles.dropdownItem}
                          onPress={() => { setCategory(cat); closeDropdowns(); }}
                        >
                          <Text style={[styles.dropdownItemText, category === cat && { color: '#00E5CC', fontWeight: '600' }]}>{cat}</Text>
                          {category === cat && <Ionicons name="checkmark" color="#00E5CC" size={16} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Subcategoría */}
                <View style={[styles.inputGroup, { zIndex: 9 }]}>
                  <Text style={styles.label}>Subcategoría *</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => { closeDropdowns(); setShowSub(!showSub); }}>
                    <Text style={styles.pickerText}>{subcategory}</Text>
                    <ChevronDown color="#8E8E93" size={20} />
                  </TouchableOpacity>

                  {showSub && (
                    <View style={styles.dropdownMenu}>
                      {data.budgets[category]?.map((sub) => (
                        <TouchableOpacity 
                          key={sub.name} 
                          style={styles.dropdownItem}
                          onPress={() => { setSubcategory(sub.name); closeDropdowns(); }}
                        >
                          <Text style={[styles.dropdownItemText, subcategory === sub.name && { color: '#00E5CC', fontWeight: '600' }]}>{sub.name}</Text>
                          {subcategory === sub.name && <Ionicons name="checkmark" color="#00E5CC" size={16} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={[styles.inputGroup, { zIndex: 1 }]}>
              <Text style={styles.label}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Añade una nota..."
                placeholderTextColor="#636366"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

          </View>

        </ScrollView>
          
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: type === 'gasto' ? '#EF4444' : '#00E5CC' }]} onPress={handleSave}>
            <Text style={[styles.saveBtnText, type === 'ingreso' && { color: '#000000' }]}>Guardar Movimiento</Text>
          </TouchableOpacity>
        </View>

      {/* Pay Credit Card Modal */}
      <Modal visible={showPayCreditModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagar Tarjeta de Crédito</Text>
              <TouchableOpacity onPress={() => setShowPayCreditModal(false)}>
                <X color="#8E8E93" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Selecciona la tarjeta que deseas pagar. Esto reiniciará el crédito gastado a 0.</Text>
            {creditCards.map(cc => (
              <TouchableOpacity 
                key={cc.id}
                style={[styles.ccItem, selectedCreditCardId === cc.id && styles.ccItemActive]}
                onPress={() => setSelectedCreditCardId(cc.id)}
              >
                <View>
                  <Text style={{color: '#FFFFFF', fontSize: 16, fontWeight: '600'}}>{cc.name}</Text>
                  <Text style={{color: '#E879A8', fontSize: 13, marginTop: 4}}>Gastado: S/ {(cc.usedCredit || 0).toLocaleString()}</Text>
                </View>
                <CreditCard color="#A78BFA" size={24} />
              </TouchableOpacity>
            ))}
            {creditCards.length === 0 && (
              <Text style={{color: '#8E8E93', textAlign: 'center', padding: 20}}>No tienes tarjetas de crédito registradas</Text>
            )}
            <TouchableOpacity 
              style={[styles.modalPayBtn, !selectedCreditCardId && styles.modalPayBtnDisabled]}
              onPress={handlePayCreditCard}
              disabled={!selectedCreditCardId}
            >
              <Text style={{color: '#000000', fontSize: 16, fontWeight: 'bold'}}>Pagar y Reiniciar Deuda</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  payCreditBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E1E2A', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#A78BFA' },
  payCreditBtnText: { color: '#A78BFA', fontWeight: '600', fontSize: 15 },
  typeTabs: { flexDirection: 'row', backgroundColor: '#12121A', borderRadius: 12, padding: 4, marginBottom: 32 },
  typeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  typeTabActiveGasto: { backgroundColor: '#2A1020' },
  typeTabActiveIngreso: { backgroundColor: '#0A2020' },
  typeTabText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 8 },
  currencySymbol: { fontSize: 32, color: '#8E8E93', fontWeight: '600' },
  amountInput: { fontSize: 48, color: '#FFFFFF', fontWeight: '700', minWidth: 100 },
  formContainer: { backgroundColor: '#12121A', borderRadius: 16, padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#E5E5EA', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1E1E2A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, color: '#FFFFFF', fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerButton: { backgroundColor: '#1E1E2A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  dropdownMenu: { backgroundColor: '#1E1E2A', borderRadius: 10, marginTop: 8, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A2A3A' },
  dropdownItemText: { color: '#FFFFFF', fontSize: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(10,10,15,0.9)', borderTopWidth: 1, borderTopColor: '#12121A' },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#12121A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { color: '#8E8E93', marginBottom: 16, fontSize: 14 },
  ccItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1E1E2A', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  ccItemActive: { backgroundColor: '#2A2A3A', borderColor: '#A78BFA' },
  modalPayBtn: { backgroundColor: '#A78BFA', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  modalPayBtnDisabled: { backgroundColor: '#3A3A4C', opacity: 0.6 }
});
