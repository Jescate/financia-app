import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
  webClientId: "948882782923-6bfqfhbbhden5dg6akhhq23rlmtg383u.apps.googleusercontent.com",
  iosClientId: "948882782923-4loqjeecrhh859mur0q1kktp1vmi6haj.apps.googleusercontent.com",
});
import { 
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, query, orderBy, onSnapshot,
  addDoc
} from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);



  const defaultFinancialData = {
    accounts: [
      { id: 'acc_1', name: 'Cuenta Ahorros Soles', type: 'savings', currency: 'PEN', balance: 0 },
      { id: 'acc_2', name: 'Cuenta Ahorros Dólares', type: 'savings', currency: 'USD', balance: 0 },
      { id: 'acc_3', name: 'Cuenta Sueldo', type: 'cash',  currency: 'PEN', balance: 0 },
      { id: 'acc_4', name: 'Tyba Pocket Soles', type: 'savings', currency: 'PEN', balance: 0 },
      { id: 'acc_5', name: 'Tyba Pocket Dólares', type: 'savings', currency: 'USD', balance: 0 },
      { id: 'acc_6', name: 'Inversiones', type: 'savings', currency: 'PEN', balance: 0 },
      { id: 'acc_7', name: 'Guardaditos', type: 'savings', currency: 'PEN', balance: 0 },
    ],
    budgets: {
       'Gastos fijos': [ { name: 'Alquiler', limit: 800 }, { name: 'Servicios', limit: 200 }, { name: 'Transporte', limit: 150 }, { name: 'Supermercado', limit: 400 }],
       'Gastos libres de culpa': [ { name: 'Restaurantes', limit: 250 }, { name: 'Ocio y Suscripciones', limit: 100 }, { name: 'Compras', limit: 150 }],
       'Ahorro e inversión': [ { name: 'Fondo de emergencia', limit: 200 }, { name: 'Bolsa / Fondos Mutuos', limit: 300 }]
    },
    goals: []
 };

  useEffect(() => {
    let unsubUser = () => {};
    let unsubTrans = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
         const userDocRef = doc(db, 'users', firebaseUser.uid);
         const snap = await getDoc(userDocRef);
         
         if (snap.exists()) {
             const d = snap.data();
             setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: d.name });
         } else {
             // Fallback for Users registering via Google/SSO implicitly
             const newName = firebaseUser.displayName || 'Usuario';
             setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: newName });
             await setDoc(userDocRef, {
                name: newName,
                email: firebaseUser.email,
                createdAt: new Date().toISOString(),
                accounts: defaultFinancialData.accounts,
                budgets: defaultFinancialData.budgets,
                goals: defaultFinancialData.goals
             });
         }

         unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if(docSnap.exists()){
               const data = docSnap.data();
               setGoals(data.goals || []);
               setUserData(prev => ({
                   accounts: data.accounts || [],
                   budgets: data.budgets || {},
                   transactions: prev?.transactions || []
               }));
            }
         });

         const q = query(collection(db, 'users', firebaseUser.uid, 'transactions'), orderBy('createdAt', 'desc'));
         unsubTrans = onSnapshot(q, (snapshot) => {
            const trans = [];
            snapshot.forEach(doc => { trans.push({ id: doc.id, ...doc.data() }); });
            
            // Standardizing sorting by 'date' (YYYY-MM-DD string) manually since createdAt is timestamp
            trans.sort((a,b) => new Date(b.date) - new Date(a.date));
            
            setUserData(prev => {
                if(!prev) return { accounts: [], budgets: {}, transactions: trans };
                return { ...prev, transactions: trans };
            });
            setLoading(false);
         });

      } else {
         setUser(null);
         setUserData(null);
         setGoals([]);
         setLoading(false);
         unsubUser();
         unsubTrans();
      }
    });

    return () => { unsubscribe(); unsubUser(); unsubTrans(); };
  }, []);

  const login = async (email, password) => {
    try {
       await signInWithEmailAndPassword(auth, email, password);
       return { success: true };
    } catch(err) {
       console.error("Login Error", err);
       return { success: false, error: 'invalid_credentials' };
    }
  };

  const loginWithGoogle = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        return { success: true };
      } catch (err) {
        console.error("Web Google login error:", err);
        return { success: false, error: err.message };
      }
    }

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const data = response.data || response;
      const type = response.type || 'success';

      if (type === 'success' || type === undefined) {
        const idToken = data.idToken;
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          return { success: true };
        } else {
          throw new Error('No se recibió idToken de Google');
        }
      }
      return { success: false, error: 'cancelled' };
    } catch(err) {
      console.error("Google login error:", err);
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password) => {
     try {
       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
       const uid = userCredential.user.uid;
       
       // Setup initial structure in Firestore
       await setDoc(doc(db, 'users', uid), {
           name,
           email,
           createdAt: new Date().toISOString(),
           accounts: defaultFinancialData.accounts,
           budgets: defaultFinancialData.budgets,
           goals: defaultFinancialData.goals
       });
       return true;
     } catch(err) {
       console.error("Register Error", err);
       return false;
     }
  };

  const logout = async () => {
    try {
       await signOut(auth);
       try {
         await GoogleSignin.signOut();
       } catch (gErr) {
         console.log("Google SignOut error or not signed in:", gErr);
       }
    } catch(err) {
       console.error(err);
    }
  };

  const getUserData = () => {
    if(loading) return null;
    return userData;
  };

  const syncUserDoc = async (newDraft) => {
     if(!user) return;
     const userDocRef = doc(db, 'users', user.uid);
     await updateDoc(userDocRef, {
        accounts: newDraft.accounts,
        budgets: newDraft.budgets
     });
  };

  // Sync Goals
  const syncGoals = async (newGoals) => {
     if(!user) return;
     const userDocRef = doc(db, 'users', user.uid);
     await updateDoc(userDocRef, { goals: newGoals });
  };

  // MUTATIONS (these write to Firestore, the onSnapshot handles reactivity)

  const addTransaction = async (transaction) => {
    if (!userData || !user) return;
    
    // 1. Add Transaction to Subcollection
    const { type, amount, name, category, subcategory, date, accountId } = transaction;
    const numAmount = parseFloat(amount);
    
    const newTrans = {
      date, type, amount: numAmount, category, subcategory, name, accountId, createdAt: Date.now()
    };
    
    await addDoc(collection(db, 'users', user.uid, 'transactions'), newTrans);

    // 2. Update the Account Balance immediately in the user Document
    const draft = { accounts: [...userData.accounts], budgets: userData.budgets };
    const accIdx = draft.accounts.findIndex(a => a.id === accountId);
    
    if (accIdx !== -1) {
        if (draft.accounts[accIdx].type === 'credit') {
           if (type === 'gasto') {
              draft.accounts[accIdx].usedCredit += numAmount;
              draft.accounts[accIdx].availableCredit -= numAmount;
           } else {
              draft.accounts[accIdx].usedCredit -= numAmount;
              draft.accounts[accIdx].availableCredit += numAmount;
           }
        } else {
           if (type === 'gasto') {
              draft.accounts[accIdx].balance -= numAmount;
           } else {
              draft.accounts[accIdx].balance += numAmount;
           }
        }
        await syncUserDoc(draft);
    }
  };

  const addAccount = async (name, type, currency, initialBalance) => {
    if (!userData || !user) return;
    const draft = { accounts: [...userData.accounts], budgets: userData.budgets };
    const numBalance = parseFloat(initialBalance) || 0;
    
    if (type === 'credit') {
       draft.accounts.push({ id: 'acc_' + Date.now(), name, type, currency, creditLimit: numBalance, usedCredit: 0, availableCredit: numBalance });
    } else {
       draft.accounts.push({ id: 'acc_' + Date.now(), name, type, currency, balance: numBalance });
    }
    
    await syncUserDoc(draft);
  };

  const deleteAccount = async (id) => {
    if (!userData || !user) return;
    const draft = { accounts: userData.accounts.filter(a => a.id !== id), budgets: userData.budgets };
    await syncUserDoc(draft);
  };

  const updateAccountBalance = async (accountId, newValue) => {
    if (!userData || !user) return;
    const draft = { accounts: [...userData.accounts], budgets: userData.budgets };
    const accIdx = draft.accounts.findIndex(a => a.id === accountId);
    if (accIdx !== -1) {
       draft.accounts[accIdx].balance = parseFloat(newValue) || 0;
       await syncUserDoc(draft);
    }
  };

  const renameAccount = async (accountId, newName) => {
    if (!userData || !user) return;
    const draft = { accounts: [...userData.accounts], budgets: userData.budgets };
    const accIdx = draft.accounts.findIndex(a => a.id === accountId);
    if (accIdx !== -1) {
       draft.accounts[accIdx].name = newName;
       await syncUserDoc(draft);
    }
  };

  const updateBudgetLimit = async (categoryGroup, subcategoryName, newLimit) => {
    if (!userData || !user) return;
    const draft = { accounts: userData.accounts, budgets: JSON.parse(JSON.stringify(userData.budgets)) };
    if(draft.budgets && draft.budgets[categoryGroup]){
       const subIdx = draft.budgets[categoryGroup].findIndex(s => s.name === subcategoryName);
       if (subIdx !== -1) {
          draft.budgets[categoryGroup][subIdx].limit = parseFloat(newLimit) || 0;
       }
    }
    await syncUserDoc(draft);
  };

  const addBudgetSubcategory = async (categoryGroup, subcategoryName, limit) => {
    if (!userData || !user) return;
    const draft = { accounts: userData.accounts, budgets: JSON.parse(JSON.stringify(userData.budgets)) };
    if(draft.budgets && draft.budgets[categoryGroup]){
       draft.budgets[categoryGroup].push({ name: subcategoryName, limit: parseFloat(limit) || 0 });
    }
    await syncUserDoc(draft);
  };

  const deleteBudgetSubcategory = async (categoryGroup, subcategoryName) => {
    if (!userData || !user) return;
    const draft = { accounts: userData.accounts, budgets: JSON.parse(JSON.stringify(userData.budgets)) };
    if(draft.budgets && draft.budgets[categoryGroup]){
       draft.budgets[categoryGroup] = draft.budgets[categoryGroup].filter(s => s.name !== subcategoryName);
    }
    await syncUserDoc(draft);
  };

  const addGoal = async (name, targetAmount) => {
    const newGoal = { id: 'g_' + Date.now(), name, targetAmount: parseFloat(targetAmount), currentAmount: 0, createdAt: new Date().toISOString() };
    const draftGoals = [newGoal, ...goals];
    setGoals(draftGoals); // optimistic UI
    await syncGoals(draftGoals);
  };

  const updateGoal = async (id, newName, newTargetAmount) => {
    const draftGoals = goals.map(g => g.id === id ? { ...g, name: newName, targetAmount: parseFloat(newTargetAmount) } : g);
    setGoals(draftGoals); 
    await syncGoals(draftGoals);
  };

  const deleteGoal = async (id) => {
    const draftGoals = goals.filter(g => g.id !== id);
    setGoals(draftGoals);
    await syncGoals(draftGoals);
  };

  const addMoneyToGoal = async (id, amountToAdd) => {
    const draftGoals = goals.map(g => {
      if (g.id === id) {
        let newAmount = g.currentAmount + parseFloat(amountToAdd);
        if (newAmount > g.targetAmount) newAmount = g.targetAmount;
        return { ...g, currentAmount: newAmount };
      }
      return g;
    });
    setGoals(draftGoals);
    await syncGoals(draftGoals);
  };


  const payCreditCard = async (accountId) => {
    if (!userData || !user) return;
    const draft = { accounts: [...userData.accounts], budgets: userData.budgets };
    const accIdx = draft.accounts.findIndex(a => a.id === accountId);
    if (accIdx !== -1 && draft.accounts[accIdx].type === 'credit') {
       draft.accounts[accIdx].usedCredit = 0;
       draft.accounts[accIdx].availableCredit = draft.accounts[accIdx].creditLimit;
       await syncUserDoc(draft);
    }
  };

  const editTransaction = async (transactionId, updatedFields) => {
    if (!user) return;
    const transRef = doc(db, 'users', user.uid, 'transactions', transactionId);
    await updateDoc(transRef, updatedFields);
  };

  const deleteTransaction = async (transactionId) => {
    if (!user) return;
    const transRef = doc(db, 'users', user.uid, 'transactions', transactionId);
    await deleteDoc(transRef);
  };


  const deleteTransactionsForMonths = async (monthNumbers = ['05', '08']) => {
    if (!user || !userData) return;
    const { getDocs, deleteDoc: firestoreDeleteDoc } = require('firebase/firestore');
    const q = query(collection(db, 'users', user.uid, 'transactions'));
    const snapshot = await getDocs(q);
    let deletedCount = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.date) {
        const parts = data.date.split('-');
        if (parts.length >= 2) {
          const monthStr = parts[1]; // '05', '08', etc.
          if (monthNumbers.includes(monthStr)) {
            await firestoreDeleteDoc(docSnap.ref);
            deletedCount++;
          }
        }
      }
    }
    console.log('Deleted ' + deletedCount + ' transactions for months: ' + monthNumbers.join(', '));
    return deletedCount;
  };

  const bypassLogin = () => {
    // Only for absolute desperate testing if auth is not working. Cannot be used properly with real firestore rules yet.
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, loginWithGoogle, logout, register, bypassLogin, getUserData,  
      addTransaction, updateAccountBalance, addAccount, deleteAccount, renameAccount,
      updateBudgetLimit, addBudgetSubcategory, deleteBudgetSubcategory,
      goals, addGoal, updateGoal, deleteGoal, addMoneyToGoal,
      payCreditCard, editTransaction, deleteTransaction, deleteTransactionsForMonths
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
