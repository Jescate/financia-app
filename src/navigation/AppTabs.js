import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PieChart, Wallet, Plus, Calculator, Target } from 'lucide-react-native';

import SummaryScreen from '../screens/SummaryScreen';
import CashScreen from '../screens/CashScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BudgetScreen from '../screens/BudgetScreen';
import GoalsScreen from '../screens/GoalsScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#12121A',
          borderTopColor: '#1E1E2A',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00E5CC',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen 
        name="Summary" 
        component={SummaryScreen} 
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} />
        }} 
      />
      
      <Tab.Screen 
        name="Cash" 
        component={CashScreen} 
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />
        }} 
      />
      
      <Tab.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{
          title: 'Transacciones',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.floatingButton}>
              <Plus color="#000000" size={28} />
            </View>
          ),
        }} 
      />

      <Tab.Screen 
        name="Budget" 
        component={BudgetScreen} 
        options={{
          title: 'Presupuesto',
          tabBarIcon: ({ color, size }) => <Calculator color={color} size={size} />
        }} 
      />

      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen} 
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00E5CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  }
});
