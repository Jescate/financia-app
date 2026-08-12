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

const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -20,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={onPress}
  >
    <View style={styles.floatingButton}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#2C2C2E',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#32D74B',
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
          tabBarLabelStyle: { display: 'none' }, // the floating button has no text label to keep it clean, but screen uses title
          tabBarIcon: ({ focused }) => <Plus color="#FFF" size={32} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#32D74B',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8, // for android
    justifyContent: 'center',
    alignItems: 'center',
  }
});
