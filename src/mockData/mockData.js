export const USERS = {
  USER_A: { id: 'usr-1', name: 'Usuario A', email: 'usuarioa@test.com' },
  USER_B: { id: 'usr-2', name: 'Usuario B', email: 'usuariob@test.com' }
};

export const MOCK_DATA = {
  [USERS.USER_A.id]: {
    accounts: [
      { id: 'a1', name: 'Cuenta digital (S/)', balance: 1540.50, currency: 'PEN' },
      { id: 'a2', name: 'Cuenta digital ($)', balance: 800.00, currency: 'USD' },
      { id: 'a3', name: 'Cuenta sueldo', balance: 4200.00, currency: 'PEN' },
      { id: 'a4', name: 'Tyba Pocket (S/)', balance: 500.00, currency: 'PEN' },
      { id: 'a5', name: 'Tyba Pocket ($)', balance: 250.00, currency: 'USD' },
      { id: 'a6', name: 'Inversiones', balance: 10000.00, currency: 'PEN' },
      { id: 'a7', name: 'Tarjeta de crédito', availableCredit: 5000.00, currency: 'PEN' },
    ],
    budgets: {
      'Gastos Fijos': { limit: 2000 },
      'Libres de Culpa': { limit: 800 },
      'Ahorro e Inversión': { limit: 1000 },
    },
    subcategories: {
      'Gastos Fijos': [
        { name: 'Alquiler', limit: 1200 },
        { name: 'Servicios', limit: 300 },
        { name: 'Transporte', limit: 200 },
        { name: 'Suscripciones', limit: 100 },
      ],
      'Libres de Culpa': [
        { name: 'Restaurantes', limit: 400 },
        { name: 'Ocio', limit: 200 },
        { name: 'Compras', limit: 150 },
        { name: 'Viajes', limit: 50 },
      ],
      'Ahorro e Inversión': [
        { name: 'Fondo de emergencia', limit: 500 },
        { name: 'Inversión', limit: 300 },
        { name: 'Amortización', limit: 200 },
      ]
    },
    // The source of truth for the entire dashboard
    transactions: []
  },
  [USERS.USER_B.id]: {
    accounts: [
      { id: 'b1', name: 'Cuenta digital (S/)', balance: 500.00, currency: 'PEN' },
      { id: 'b2', name: 'Cuenta sueldo', balance: 8500.00, currency: 'PEN' },
      { id: 'b3', name: 'Inversiones', balance: 25000.00, currency: 'PEN' },
      { id: 'b4', name: 'Tarjeta de crédito', availableCredit: 15000.00, currency: 'PEN' },
    ],
    budgets: {
      'Gastos Fijos': { limit: 4000 },
      'Libres de Culpa': { limit: 2000 },
      'Ahorro e Inversión': { limit: 2500 },
    },
    subcategories: {
      'Gastos Fijos': [
        { name: 'Hipoteca', limit: 2500 },
        { name: 'Servicios Básicos', limit: 800 },
        { name: 'Mantenimiento Auto', limit: 700 },
      ],
      'Libres de Culpa': [
        { name: 'Viajes', limit: 1200 },
        { name: 'Ropa y Joyería', limit: 800 },
      ],
      'Ahorro e Inversión': [
        { name: 'Seguros', limit: 500 },
        { name: 'Acciones e Índices', limit: 2000 },
      ]
    },
    transactions: []
  }
};
