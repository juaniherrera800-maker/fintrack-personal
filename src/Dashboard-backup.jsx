import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Target,
  Settings,
  Search,
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  X,
  Trash2,
  Pencil,
  CalendarDays,
  CreditCard,
  ShoppingBag,
  Car,
  Utensils,
  HeartPulse,
  House,
  BriefcaseBusiness,
  Menu,
  Check,
  PiggyBank,
  Download,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import "./App.css";

// ========================================
// CONFIGURACIÓN GENERAL
// ========================================

const categories = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Entretenimiento",
  "Salud",
  "Compras",
  "Trabajo",
  "Otros",
];

const expenseCategories = categories.filter((c) => c !== "Trabajo");

const categoryIcons = {
  Alimentación: Utensils,
  Transporte: Car,
  Vivienda: House,
  Entretenimiento: ShoppingBag,
  Salud: HeartPulse,
  Compras: CreditCard,
  Trabajo: BriefcaseBusiness,
  Otros: Wallet,
};

const money = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const currentMonth = () => today().slice(0, 7);
const monthKey = (date) => String(date || "").slice(0, 7);

const dateLabel = (date) =>
  date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";

const readStore = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

// ========================================
// APLICACIÓN
// ========================================

function App() {
  // Las claves v2 permiten comenzar sin los datos de demostración anteriores.
  const [transactions, setTransactions] = useState(() =>
    readStore("fintrack-transactions-v2", []),
  );

  const [goals, setGoals] = useState(() => readStore("fintrack-goals-v2", []));

  const [budgets, setBudgets] = useState(() =>
    readStore("fintrack-budgets-v2", {}),
  );

  const [recurring, setRecurring] = useState(() =>
    readStore("fintrack-recurring-v2", []),
  );

  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState(currentMonth());

  const [calendarMonth, setCalendarMonth] = useState(currentMonth());
  const [selectedDate, setSelectedDate] = useState(today());

  const [goalModal, setGoalModal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const [goalForm, setGoalForm] = useState({
    name: "",
    target: "",
    date: "",
  });

  const [budgetDraft, setBudgetDraft] = useState({});

  const [recurringForm, setRecurringForm] = useState({
    title: "",
    category: "Alimentación",
    amount: "",
    day: "1",
  });

  const [form, setForm] = useState({
    title: "",
    category: "Alimentación",
    type: "expense",
    amount: "",
    date: today(),
  });

  // ========================================
  // GUARDADO AUTOMÁTICO
  // ========================================

  useEffect(() => {
    localStorage.setItem(
      "fintrack-transactions-v2",
      JSON.stringify(transactions),
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("fintrack-goals-v2", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("fintrack-budgets-v2", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("fintrack-recurring-v2", JSON.stringify(recurring));
  }, [recurring]);

  // ========================================
  // CÁLCULOS FINANCIEROS
  // ========================================

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const savingsTotal = goals.reduce(
    (sum, goal) =>
      sum +
      (goal.contributions || []).reduce(
        (subtotal, item) => subtotal + Number(item.amount),
        0,
      ),
    0,
  );

  const availableBalance = incomeTotal - expenseTotal - savingsTotal;

  const periodTransactions = transactions.filter(
    (t) => monthKey(t.date) === period,
  );

  const periodIncome = periodTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodExpenses = periodTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodSavings = goals.reduce(
    (sum, goal) =>
      sum +
      (goal.contributions || [])
        .filter((item) => monthKey(item.date) === period)
        .reduce((subtotal, item) => subtotal + Number(item.amount), 0),
    0,
  );

  const periodBalance = periodIncome - periodExpenses - periodSavings;

  const months = [
    ...new Set([currentMonth(), ...transactions.map((t) => monthKey(t.date))]),
  ]
    .filter(Boolean)
    .sort()
    .reverse();

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = `${t.title} ${t.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesType = filter === "all" || t.type === filter;
        const matchesMonth = period === "all" || monthKey(t.date) === period;

        return matchesSearch && matchesType && matchesMonth;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, filter, period]);

  const categoryData = expenseCategories
    .map((category) => ({
      name: category,
      amount: periodTransactions
        .filter((t) => t.type === "expense" && t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(period + "-01T12:00:00");
      date.setMonth(date.getMonth() - (5 - index));

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      const list = transactions.filter((t) => monthKey(t.date) === key);

      return {
        month: date.toLocaleDateString("es-AR", { month: "short" }),
        ingresos: list
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0),
        gastos: list
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });
  }, [transactions, period]);

  // ========================================
  // NAVEGACIÓN
  // ========================================

  const navItems = [
    { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { id: "transactions", label: "Movimientos", icon: ArrowLeftRight },
    { id: "savings", label: "Ahorros", icon: PiggyBank },
    { id: "budgets", label: "Presupuestos", icon: Target },
    { id: "calendar", label: "Calendario", icon: CalendarDays },
    { id: "statistics", label: "Estadísticas", icon: ChartNoAxesCombined },
    { id: "recurring", label: "Recurrentes", icon: Repeat },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  // ========================================
  // MOVIMIENTOS
  // ========================================

  const openNew = (type = "expense") => {
    setEditing(null);
    setForm({
      title: "",
      category: type === "income" ? "Trabajo" : "Alimentación",
      type,
      amount: "",
      date: today(),
    });
    setModal(true);
  };

  const openEdit = (transaction) => {
    setEditing(transaction.id);
    setForm({
      title: transaction.title,
      category: transaction.category,
      type: transaction.type,
      amount: String(transaction.amount),
      date: transaction.date,
    });
    setModal(true);
  };

  const saveTransaction = (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !form.date
    )
      return;

    if (editing) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editing ? { ...form, amount, id: editing } : t,
        ),
      );
    } else {
      setTransactions((prev) => [{ ...form, amount, id: Date.now() }, ...prev]);
    }

    setModal(false);
  };

  const deleteTransaction = (id) => {
    if (window.confirm("¿Querés eliminar este movimiento?")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // ========================================
  // AHORROS
  // ========================================

  const addGoal = (e) => {
    e.preventDefault();

    const target = Number(goalForm.target);

    if (!goalForm.name.trim() || !Number.isFinite(target) || target <= 0)
      return;

    setGoals((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: goalForm.name.trim(),
        target,
        date: goalForm.date,
        contributions: [],
      },
    ]);

    setGoalForm({ name: "", target: "", date: "" });
  };

  const addContribution = (e) => {
    e.preventDefault();

    const amount = Number(contributionAmount);
    const goal = goals.find((item) => item.id === goalModal);

    if (!goal || !Number.isFinite(amount) || amount <= 0) return;

    if (amount > availableBalance) {
      window.alert(
        `No tenés saldo disponible suficiente. Disponible: ${money(availableBalance)}.`,
      );
      return;
    }

    const saved = (goal.contributions || []).reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const remaining = goal.target - saved;

    if (amount > remaining) {
      window.alert(
        `El aporte supera lo que falta para completar el objetivo: ${money(remaining)}.`,
      );
      return;
    }

    setGoals((prev) =>
      prev.map((item) =>
        item.id === goalModal
          ? {
              ...item,
              contributions: [
                ...(item.contributions || []),
                { id: Date.now(), amount, date: today() },
              ],
            }
          : item,
      ),
    );

    setContributionAmount("");
    setGoalModal(null);
  };

  const deleteGoal = (id) => {
    if (window.confirm("¿Eliminar este objetivo y todos sus aportes?")) {
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
    }
  };

  // ========================================
  // PRESUPUESTOS
  // ========================================

  const budgetKey = (category) => `${period}-${category}`;

  const saveBudget = (category) => {
    const amount = Number(budgetDraft[category]);

    if (!Number.isFinite(amount) || amount < 0) return;

    setBudgets((prev) => ({
      ...prev,
      [budgetKey(category)]: amount,
    }));
  };

  // ========================================
  // GASTOS RECURRENTES
  // ========================================

  const addRecurring = (e) => {
    e.preventDefault();

    const amount = Number(recurringForm.amount);
    const day = Math.min(31, Math.max(1, Number(recurringForm.day) || 1));

    if (!recurringForm.title.trim() || !Number.isFinite(amount) || amount <= 0)
      return;

    setRecurring((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: recurringForm.title.trim(),
        category: recurringForm.category,
        amount,
        day,
      },
    ]);

    setRecurringForm({
      title: "",
      category: "Alimentación",
      amount: "",
      day: "1",
    });
  };

  const registerRecurring = (item) => {
    const month = currentMonth();

    const alreadyRegistered = transactions.some(
      (t) => t.recurringId === item.id && monthKey(t.date) === month,
    );

    if (alreadyRegistered) {
      window.alert("Este gasto recurrente ya fue registrado este mes.");
      return;
    }

    const lastDay = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    ).getDate();

    const date = `${month}-${String(Math.min(item.day, lastDay)).padStart(2, "0")}`;

    setTransactions((prev) => [
      {
        id: Date.now(),
        title: item.title,
        category: item.category,
        type: "expense",
        amount: item.amount,
        date,
        recurringId: item.id,
      },
      ...prev,
    ]);
  };

  // ========================================
  // EXPORTACIÓN Y RESTABLECIMIENTO
  // ========================================

  const exportCSV = () => {
    const rows = [
      ["Fecha", "Descripción", "Tipo", "Categoría", "Importe"],
      ...transactions.map((t) => [
        t.date,
        t.title,
        t.type === "income" ? "Ingreso" : "Gasto",
        t.category,
        t.amount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `fintrack-movimientos-${today()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    if (
      !window.confirm(
        "Se eliminarán todos tus movimientos, ahorros, presupuestos y gastos recurrentes. ¿Querés continuar?",
      )
    )
      return;

    setTransactions([]);
    setGoals([]);
    setBudgets({});
    setRecurring([]);
    setSearch("");
    setFilter("all");
    setPeriod(currentMonth());
    setCalendarMonth(currentMonth());
    setSelectedDate(today());
  };

  // ========================================
  // LISTA REUTILIZABLE DE MOVIMIENTOS
  // ========================================

  const transactionList = (items) => (
    <div className="transaction-list">
      {items.length === 0 ? (
        <div className="empty-state">
          <Wallet size={30} />
          <p>No hay movimientos para mostrar.</p>
        </div>
      ) : (
        items.map((t) => {
          const Icon = categoryIcons[t.category] || Wallet;

          return (
            <div className="transaction-row" key={t.id}>
              <div className={`transaction-icon ${t.type}`}>
                <Icon size={19} />
              </div>

              <div className="transaction-info">
                <strong>{t.title}</strong>
                <span>
                  {t.category} · {dateLabel(t.date)}
                </span>
              </div>

              <strong className={`transaction-amount ${t.type}`}>
                {t.type === "income" ? "+" : "−"}
                {money(t.amount)}
              </strong>

              <div className="transaction-actions">
                <button title="Editar" onClick={() => openEdit(t)}>
                  <Pencil size={15} />
                </button>
                <button
                  title="Eliminar"
                  onClick={() => deleteTransaction(t.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ========================================
  // CALENDARIO
  // ========================================

  const calendarDateObject = new Date(calendarMonth + "-01T12:00:00");
  const daysInMonth = new Date(
    calendarDateObject.getFullYear(),
    calendarDateObject.getMonth() + 1,
    0,
  ).getDate();

  const firstDay =
    (new Date(
      calendarDateObject.getFullYear(),
      calendarDateObject.getMonth(),
      1,
    ).getDay() +
      6) %
    7;

  const daysWithTransactions = new Set(
    transactions
      .filter((t) => monthKey(t.date) === calendarMonth)
      .map((t) => Number(t.date.slice(8, 10))),
  );

  const calendarItems = transactions
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  const changeCalendarMonth = (amount) => {
    const date = new Date(calendarMonth + "-01T12:00:00");
    date.setMonth(date.getMonth() + amount);

    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    setCalendarMonth(next);
    setSelectedDate(`${next}-01`);
  };

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>
          <span>
            fintrack<span className="brand-dot">.</span>
          </span>
          <button className="mobile-close" onClick={() => setMobileMenu(false)}>
            <X />
          </button>
        </div>

        <div className="workspace-label">ESPACIO PERSONAL</div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => {
                  setPage(item.id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {page === item.id && <span className="active-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-symbol">
              <TrendingUp size={18} />
            </div>
            <strong>Tu futuro financiero</strong>
            <p>Pequeños pasos, grandes objetivos.</p>
          </div>

          <div className="profile">
            <div className="avatar">F</div>
            <div>
              <strong>Mi cuenta</strong>
              <span>Personal</span>
            </div>
            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <div className="mobile-overlay" onClick={() => setMobileMenu(false)} />
      )}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMobileMenu(true)}>
            <Menu />
          </button>

          <div className="breadcrumb">
            FinTrack <span>/</span>
            <strong>{navItems.find((n) => n.id === page)?.label}</strong>
          </div>

          <div className="topbar-actions">
            <div className="date-chip">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              })}
            </div>
            <div className="top-avatar">F</div>
          </div>
        </header>

        <div className="page-content">
          {/* RESUMEN */}

          {page === "dashboard" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">TU RESUMEN FINANCIERO</div>
                  <h1>Hola, bienvenido 👋</h1>
                  <p>Este es el estado de tus finanzas personales.</p>
                </div>

                <div className="welcome-actions">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="period-select"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {new Date(m + "-02T12:00:00").toLocaleDateString(
                          "es-AR",
                          { month: "long", year: "numeric" },
                        )}
                      </option>
                    ))}
                  </select>

                  <button className="primary-button" onClick={() => openNew()}>
                    <Plus size={17} /> Nuevo movimiento
                  </button>
                </div>
              </div>

              <section className="stats-grid">
                <div className="stat-card balance-card">
                  <div className="stat-top">
                    <span>Dinero disponible</span>
                    <div className="stat-icon">
                      <Wallet size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{money(availableBalance)}</div>
                  <div className="stat-foot">
                    Ingresos menos gastos y ahorros
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Ingresos del mes</span>
                    <div className="stat-icon green">
                      <TrendingUp size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{money(periodIncome)}</div>
                  <div className="stat-foot">Ingresos registrados</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Gastos del mes</span>
                    <div className="stat-icon red">
                      <TrendingDown size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{money(periodExpenses)}</div>
                  <div className="stat-foot">Gastos registrados</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Total ahorrado</span>
                    <div className="stat-icon purple">
                      <PiggyBank size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{money(savingsTotal)}</div>
                  <div className="stat-foot">
                    Dinero separado para tus objetivos
                  </div>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Actividad financiera</h2>
                      <p>Ingresos y gastos de los últimos 6 meses</p>
                    </div>
                    <span className="live-label">
                      <span /> Evolución
                    </span>
                  </div>

                  <div className="chart-legend">
                    <span>
                      <i className="legend-income" /> Ingresos
                    </span>
                    <span>
                      <i className="legend-expense" /> Gastos
                    </span>
                  </div>

                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="incomeGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#39d9a1"
                              stopOpacity={0.22}
                            />
                            <stop
                              offset="100%"
                              stopColor="#39d9a1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="expenseGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f17d83"
                              stopOpacity={0.16}
                            />
                            <stop
                              offset="100%"
                              stopColor="#f17d83"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="#252b37"
                          strokeDasharray="4 5"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="#737d8d"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#737d8d"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v === 0 ? "0" : `${Math.round(v / 1000)}k`
                          }
                        />
                        <Tooltip
                          formatter={(v) => money(v)}
                          contentStyle={{
                            background: "#171d28",
                            border: "1px solid #303949",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="ingresos"
                          stroke="#39d9a1"
                          strokeWidth={2.5}
                          fill="url(#incomeGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="gastos"
                          stroke="#f17d83"
                          strokeWidth={2.5}
                          fill="url(#expenseGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel category-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Gastos por categoría</h2>
                      <p>Distribución de tus gastos</p>
                    </div>
                    <MoreHorizontal size={20} />
                  </div>

                  {categoryData.length === 0 ? (
                    <div className="empty-state">
                      Todavía no hay gastos registrados.
                    </div>
                  ) : (
                    <div className="category-list">
                      {categoryData.map((item, index) => (
                        <div className="category-item" key={item.name}>
                          <div className="category-line">
                            <span>{item.name}</span>
                            <strong>{money(item.amount)}</strong>
                          </div>
                          <div className="progress-track">
                            <div
                              className={`progress-fill fill-${index % 5}`}
                              style={{
                                width: `${(item.amount / Math.max(periodExpenses, 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="category-total">
                    <span>Total de gastos</span>
                    <strong>{money(periodExpenses)}</strong>
                  </div>
                </div>
              </section>

              <section className="panel transactions-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Movimientos recientes</h2>
                    <p>Tu actividad financiera más reciente</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("transactions")}
                  >
                    Ver todos <ArrowUpRight size={15} />
                  </button>
                </div>
                {transactionList(
                  [...transactions]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5),
                )}
              </section>
            </>
          )}

          {/* MOVIMIENTOS */}

          {page === "transactions" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">CONTROL DE ACTIVIDAD</div>
                  <h1>Movimientos</h1>
                  <p>Administrá todos tus ingresos y gastos.</p>
                </div>
                <button className="primary-button" onClick={() => openNew()}>
                  <Plus size={17} /> Nuevo movimiento
                </button>
              </div>

              <div className="panel transactions-panel">
                <div className="filter-bar">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      placeholder="Buscar movimiento..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="period-select"
                  >
                    <option value="all">Todos</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                  </select>

                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="period-select"
                  >
                    <option value="all">Todos los meses</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {transactionList(filteredTransactions)}
              </div>
            </>
          )}

          {/* AHORROS */}

          {page === "savings" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">PLANIFICACIÓN FINANCIERA</div>
                  <h1>Mis ahorros</h1>
                  <p>Separá dinero de tus gastos y seguí tus objetivos.</p>
                </div>
              </div>

              <section className="stats-grid">
                <div className="stat-card balance-card">
                  <div className="stat-top">
                    <span>Dinero ahorrado</span>
                    <div className="stat-icon green">
                      <PiggyBank size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{money(savingsTotal)}</div>
                  <div className="stat-foot">Total acumulado</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Dinero disponible</span>
                    <div className="stat-icon">
                      <Wallet size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{money(availableBalance)}</div>
                  <div className="stat-foot">Después de gastos y ahorros</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Objetivos</span>
                    <div className="stat-icon purple">
                      <Target size={19} />
                    </div>
                  </div>
                  <div className="stat-value">{goals.length}</div>
                  <div className="stat-foot">Metas creadas</div>
                </div>
              </section>

              <div className="panel savings-create-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Crear objetivo</h2>
                    <p>¿Para qué querés ahorrar?</p>
                  </div>
                  <Target size={21} />
                </div>

                <form className="savings-form" onSubmit={addGoal}>
                  <label>
                    Nombre del objetivo
                    <input
                      required
                      placeholder="Ej. Comprar una computadora"
                      value={goalForm.name}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Meta en pesos
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="500000"
                      value={goalForm.target}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, target: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Fecha objetivo (opcional)
                    <input
                      type="date"
                      min={today()}
                      value={goalForm.date}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, date: e.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="primary-button">
                    <Plus size={17} /> Crear objetivo
                  </button>
                </form>
              </div>

              <div className="panel savings-goals-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Mis objetivos</h2>
                    <p>Seguimiento de tu progreso</p>
                  </div>
                  <span className="live-label">
                    <span /> {goals.length} objetivos
                  </span>
                </div>

                {goals.length === 0 ? (
                  <div className="empty-state">
                    <Target size={30} />
                    <p>Todavía no tenés objetivos de ahorro.</p>
                    <span>Creá tu primera meta para comenzar.</span>
                  </div>
                ) : (
                  <div className="savings-goals-list">
                    {goals.map((goal) => {
                      const saved = (goal.contributions || []).reduce(
                        (sum, c) => sum + Number(c.amount),
                        0,
                      );
                      const progress = Math.min(
                        100,
                        (saved / goal.target) * 100,
                      );
                      const complete = saved >= goal.target;

                      return (
                        <div className="savings-goal-card" key={goal.id}>
                          <div className="savings-goal-top">
                            <div>
                              <h3>{goal.name}</h3>
                              <span>
                                {goal.date
                                  ? `Fecha objetivo: ${dateLabel(goal.date)}`
                                  : "Sin fecha límite"}
                              </span>
                            </div>
                            <button
                              className="delete-goal-button"
                              onClick={() => deleteGoal(goal.id)}
                              title="Eliminar objetivo"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>

                          <div className="savings-goal-amounts">
                            <strong>{money(saved)}</strong>
                            <span>de {money(goal.target)}</span>
                          </div>

                          <div className="savings-progress-track">
                            <div
                              className="savings-progress-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="savings-goal-bottom">
                            <strong>{progress.toFixed(1)}% completado</strong>
                            <span>
                              {complete
                                ? "¡Objetivo alcanzado!"
                                : `Faltan ${money(goal.target - saved)}`}
                            </span>
                          </div>

                          <button
                            className="primary-button savings-contribute-button"
                            disabled={complete}
                            onClick={() => {
                              setGoalModal(goal.id);
                              setContributionAmount("");
                            }}
                          >
                            <Plus size={17} />{" "}
                            {complete
                              ? "Objetivo completado"
                              : "Agregar ahorro"}
                          </button>

                          {(goal.contributions || []).length > 0 && (
                            <div className="savings-history">
                              <strong>Historial de aportes</strong>
                              {[...goal.contributions].reverse().map((c) => (
                                <div className="savings-history-row" key={c.id}>
                                  <span>{dateLabel(c.date)}</span>
                                  <strong>+{money(c.amount)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* PRESUPUESTOS */}

          {page === "budgets" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">PLANIFICACIÓN MENSUAL</div>
                  <h1>Presupuestos</h1>
                  <p>Definí cuánto querés gastar por categoría.</p>
                </div>

                <select
                  className="period-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {new Date(m + "-02T12:00:00").toLocaleDateString(
                        "es-AR",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <div className="panel category-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Límites por categoría</h2>
                    <p>Configurá cuánto querés gastar por mes.</p>
                  </div>
                  <Target size={21} />
                </div>

                <div className="budget-list">
                  {expenseCategories.map((category, index) => {
                    const spent = periodTransactions
                      .filter(
                        (t) => t.type === "expense" && t.category === category,
                      )
                      .reduce((sum, t) => sum + Number(t.amount), 0);

                    const limit = Number(budgets[budgetKey(category)] || 0);
                    const percentage =
                      limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

                    return (
                      <div className="budget-item" key={category}>
                        <div className="category-line">
                          <strong>{category}</strong>
                          <span>{money(spent)} gastados</span>
                        </div>

                        <div className="progress-track">
                          <div
                            className={`progress-fill fill-${index % 5}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="budget-edit-row">
                          <span>
                            {limit > 0
                              ? `Disponible: ${money(limit - spent)}`
                              : "Todavía sin límite"}
                          </span>
                          <div>
                            <input
                              type="number"
                              min="0"
                              placeholder="Límite mensual"
                              value={budgetDraft[category] ?? (limit || "")}
                              onChange={(e) =>
                                setBudgetDraft((prev) => ({
                                  ...prev,
                                  [category]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="secondary-button"
                              onClick={() => saveBudget(category)}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>

                        {limit > 0 && spent > limit && (
                          <p className="budget-warning">
                            Superaste el límite por {money(spent - limit)}.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* CALENDARIO */}

          {page === "calendar" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">ACTIVIDAD POR FECHA</div>
                  <h1>Calendario</h1>
                  <p>Consultá tus movimientos día por día.</p>
                </div>
                <button className="primary-button" onClick={() => openNew()}>
                  <Plus size={17} /> Nuevo movimiento
                </button>
              </div>

              <div className="calendar-layout">
                <div className="panel calendar-panel">
                  <div className="calendar-month-heading">
                    <button
                      className="icon-button"
                      onClick={() => changeCalendarMonth(-1)}
                    >
                      <ChevronLeft />
                    </button>
                    <h2>
                      {calendarDateObject.toLocaleDateString("es-AR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <button
                      className="icon-button"
                      onClick={() => changeCalendarMonth(1)}
                    >
                      <ChevronRight />
                    </button>
                  </div>

                  <div className="calendar-grid">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                      (day) => (
                        <strong key={day}>{day}</strong>
                      ),
                    )}

                    {Array.from({ length: firstDay }, (_, index) => (
                      <span key={`blank-${index}`} />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, index) => {
                      const day = index + 1;
                      const date = `${calendarMonth}-${String(day).padStart(2, "0")}`;

                      return (
                        <button
                          key={day}
                          className={`${daysWithTransactions.has(day) ? "has-movement" : ""} ${selectedDate === date ? "selected-day" : ""} ${today() === date ? "today" : ""}`}
                          onClick={() => setSelectedDate(date)}
                        >
                          {day}
                          {daysWithTransactions.has(day) && <i />}
                        </button>
                      );
                    })}
                  </div>

                  <p className="calendar-hint">
                    Los puntos indican días con movimientos. Seleccioná un día
                    para ver sus registros.
                  </p>
                </div>

                <div className="panel calendar-detail">
                  <div className="panel-heading">
                    <div>
                      <h2>Movimientos del día</h2>
                      <p>{dateLabel(selectedDate)}</p>
                    </div>
                  </div>
                  {transactionList(calendarItems)}
                </div>
              </div>
            </>
          )}

          {/* ESTADÍSTICAS */}

          {page === "statistics" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">ANÁLISIS</div>
                  <h1>Estadísticas</h1>
                  <p>Compará ingresos, gastos y evolución financiera.</p>
                </div>

                <select
                  className="period-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {new Date(m + "-02T12:00:00").toLocaleDateString(
                        "es-AR",
                        { month: "long", year: "numeric" },
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Ingresos del período</span>
                    <TrendingUp color="#39d9a1" />
                  </div>
                  <div className="stat-value">{money(periodIncome)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Gastos del período</span>
                    <TrendingDown color="#f17d83" />
                  </div>
                  <div className="stat-value">{money(periodExpenses)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Ahorros del período</span>
                    <PiggyBank color="#39d9a1" />
                  </div>
                  <div className="stat-value">{money(periodSavings)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Resultado del período</span>
                    <Wallet color="#9b8af5" />
                  </div>
                  <div className="stat-value">{money(periodBalance)}</div>
                </div>
              </section>

              <div className="panel chart-panel standalone-chart">
                <div className="panel-heading">
                  <div>
                    <h2>Comparación mensual</h2>
                    <p>Ingresos y gastos de los últimos seis meses</p>
                  </div>
                </div>
                <div className="chart-wrap large-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        stroke="#252b37"
                        strokeDasharray="4 5"
                        vertical={false}
                      />
                      <XAxis dataKey="month" stroke="#737d8d" />
                      <YAxis
                        stroke="#737d8d"
                        tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      />
                      <Tooltip formatter={(v) => money(v)} />
                      <Bar
                        dataKey="ingresos"
                        fill="#39d9a1"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="gastos"
                        fill="#f17d83"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel category-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Gastos por categoría</h2>
                    <p>Distribución del período seleccionado</p>
                  </div>
                </div>
                {categoryData.length === 0 ? (
                  <div className="empty-state">
                    Todavía no hay gastos en este período.
                  </div>
                ) : (
                  categoryData.map((item) => (
                    <div
                      className="category-line category-stat"
                      key={item.name}
                    >
                      <span>{item.name}</span>
                      <strong>{money(item.amount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* GASTOS RECURRENTES */}

          {page === "recurring" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">GASTOS HABITUALES</div>
                  <h1>Gastos recurrentes</h1>
                  <p>
                    Guardá tus gastos fijos y registralos cuando los pagues.
                  </p>
                </div>
              </div>

              <div className="panel savings-create-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Agregar gasto recurrente</h2>
                    <p>Por ejemplo: alquiler, internet o suscripciones.</p>
                  </div>
                  <Repeat size={21} />
                </div>

                <form className="savings-form" onSubmit={addRecurring}>
                  <label>
                    Descripción
                    <input
                      required
                      placeholder="Ej. Internet"
                      value={recurringForm.title}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          title: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Categoría
                    <select
                      value={recurringForm.category}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          category: e.target.value,
                        })
                      }
                    >
                      {expenseCategories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Importe
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="0"
                      value={recurringForm.amount}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          amount: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Día habitual del mes
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={recurringForm.day}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          day: e.target.value,
                        })
                      }
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    <Plus size={17} /> Guardar gasto fijo
                  </button>
                </form>
              </div>

              <div className="panel transactions-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Mis gastos recurrentes</h2>
                    <p>Registrá cada uno una sola vez por mes.</p>
                  </div>
                  <span className="live-label">
                    {recurring.length} guardados
                  </span>
                </div>

                {recurring.length === 0 ? (
                  <div className="empty-state">
                    <Repeat size={30} />
                    <p>No agregaste gastos recurrentes todavía.</p>
                  </div>
                ) : (
                  recurring.map((item) => {
                    const done = transactions.some(
                      (t) =>
                        t.recurringId === item.id &&
                        monthKey(t.date) === currentMonth(),
                    );

                    return (
                      <div className="transaction-row" key={item.id}>
                        <div className="transaction-icon expense">
                          <Repeat size={19} />
                        </div>
                        <div className="transaction-info">
                          <strong>{item.title}</strong>
                          <span>
                            {item.category} · Día {item.day} de cada mes
                          </span>
                        </div>
                        <strong className="transaction-amount expense">
                          {money(item.amount)}
                        </strong>
                        <div className="transaction-actions">
                          <button
                            disabled={done}
                            title={
                              done
                                ? "Ya registrado este mes"
                                : "Registrar este mes"
                            }
                            onClick={() => registerRecurring(item)}
                          >
                            {done ? <Check size={16} /> : <Plus size={16} />}
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "¿Eliminar este gasto recurrente?",
                                )
                              ) {
                                setRecurring((prev) =>
                                  prev.filter((r) => r.id !== item.id),
                                );
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* CONFIGURACIÓN */}

          {page === "settings" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">PERSONALIZACIÓN</div>
                  <h1>Configuración</h1>
                  <p>Administrá tus datos y preferencias.</p>
                </div>
              </div>

              <div className="panel settings-panel">
                <h2>Tu espacio personal</h2>

                <div className="setting-row">
                  <div>
                    <strong>Moneda</strong>
                    <span>Moneda utilizada para tus movimientos</span>
                  </div>
                  <span className="setting-value">ARS · Peso argentino</span>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Almacenamiento</strong>
                    <span>
                      Los datos se guardan localmente en este navegador
                    </span>
                  </div>
                  <span className="saved-status">
                    <Check size={14} /> Activo
                  </span>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Movimientos</strong>
                    <span>Registros guardados</span>
                  </div>
                  <strong>{transactions.length}</strong>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Objetivos de ahorro</strong>
                    <span>Metas creadas</span>
                  </div>
                  <strong>{goals.length}</strong>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Gastos recurrentes</strong>
                    <span>Plantillas guardadas</span>
                  </div>
                  <strong>{recurring.length}</strong>
                </div>

                <div className="settings-actions">
                  <button className="secondary-button" onClick={exportCSV}>
                    <Download size={16} /> Exportar movimientos CSV
                  </button>
                  <button className="danger-button" onClick={resetAll}>
                    <Trash2 size={16} /> Restablecer todos mis datos
                  </button>
                </div>

                <p className="settings-help">
                  La exportación incluye ingresos y gastos. Los objetivos,
                  presupuestos y gastos recurrentes se guardan por separado en
                  este navegador.
                </p>
              </div>
            </>
          )}
        </div>

        <footer className="footer">
          FINTRACK PERSONAL <span>·</span> Tus finanzas, bajo control.
        </footer>
      </main>

      {/* MODAL DE APORTES */}

      {goalModal !== null && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setGoalModal(null);
          }}
        >
          <form className="transaction-modal" onSubmit={addContribution}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">REGISTRO DE AHORRO</div>
                <h2>Agregar dinero</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setGoalModal(null)}
              >
                <X />
              </button>
            </div>

            <p className="savings-modal-description">
              Este aporte se descuenta del dinero disponible, pero no cuenta
              como gasto de consumo.
            </p>

            <div className="savings-available">
              <span>Dinero disponible</span>
              <strong>{money(availableBalance)}</strong>
            </div>

            <label>
              ¿Cuánto querés ahorrar?
              <input
                autoFocus
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="Ej. 25000"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setGoalModal(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                <Check size={16} /> Confirmar aporte
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE MOVIMIENTOS */}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form className="transaction-modal" onSubmit={saveTransaction}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">
                  {editing ? "ACTUALIZAR REGISTRO" : "NUEVO REGISTRO"}
                </div>
                <h2>{editing ? "Editar movimiento" : "Agregar movimiento"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
              >
                <X />
              </button>
            </div>

            <div className="type-switch">
              <button
                type="button"
                className={
                  form.type === "expense" ? "selected expense-selected" : ""
                }
                onClick={() =>
                  setForm({
                    ...form,
                    type: "expense",
                    category: "Alimentación",
                  })
                }
              >
                <ArrowDownRight size={17} /> Gasto
              </button>
              <button
                type="button"
                className={
                  form.type === "income" ? "selected income-selected" : ""
                }
                onClick={() =>
                  setForm({ ...form, type: "income", category: "Trabajo" })
                }
              >
                <ArrowUpRight size={17} /> Ingreso
              </button>
            </div>

            <label>
              Descripción
              <input
                required
                autoFocus
                placeholder="Ej. Compra del supermercado"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <label>
              Monto en pesos
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>

            <div className="form-grid">
              <label>
                Categoría
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {(form.type === "expense"
                    ? expenseCategories
                    : ["Trabajo", "Otros"]
                  ).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label>
                Fecha
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                <Check size={16} />{" "}
                {editing ? "Guardar cambios" : "Guardar movimiento"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
