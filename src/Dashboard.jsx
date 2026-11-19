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
  FileText,
  UserRound,
  Mail,
  LockKeyhole,
  Save,
  LogOut,
} from "lucide-react";

import { supabase } from "./lib/supabase";

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

const isSavingsWithdrawal = (transaction) =>
  transaction?.type === "expense" &&
  String(transaction.title || "")
    .toLowerCase()
    .startsWith("retiro de ahorro:");

// ========================================
// APLICACIÓN
// ========================================

function App({ userId, user, onLogout }) {
  // Las claves v2 permiten comenzar sin los datos de demostración anteriores.
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [goals, setGoals] = useState([]);

  const [budgets, setBudgets] = useState({});
  const [recurring, setRecurring] = useState([]);

  const [page, setPage] = useState("dashboard");
  const [profileName, setProfileName] = useState(
    user?.user_metadata?.full_name || "",
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState(currentMonth());
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [reportDate, setReportDate] = useState(currentMonth());

  const [calendarMonth, setCalendarMonth] = useState(currentMonth());
  const [selectedDate, setSelectedDate] = useState(today());

  const [goalModal, setGoalModal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const [withdrawModal, setWithdrawModal] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

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
    let active = true;

    async function loadTransactions() {
      setDataLoading(true);
      setDataError("");

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (!active) return;

      if (error) {
        setDataError(error.message);
      } else {
        setTransactions(data || []);
      }

      setDataLoading(false);
    }

    loadTransactions();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;

    async function loadGoals() {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });

      if (!active) return;

      if (error) {
        setDataError(error.message);
      } else {
        setGoals(data || []);
      }
    }

    loadGoals();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;

    async function loadCloudSettings() {
      setDataError("");
      const [budgetResult, recurringResult] = await Promise.all([
        supabase.from("budgets").select("*").eq("user_id", userId),
        supabase
          .from("recurring")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
      ]);

      if (!active) return;
      if (budgetResult.error || recurringResult.error) {
        const message =
          budgetResult.error?.message || recurringResult.error?.message;
        setDataError(message);
        window.alert(
          `No se pudieron cargar tus presupuestos o gastos recurrentes: ${message}`,
        );
        return;
      }

      let budgetRows = budgetResult.data || [];
      let recurringRows = recurringResult.data || [];

      // Migración única: conserva los datos antiguos del navegador si la tabla cloud está vacía.
      if (budgetRows.length === 0) {
        try {
          const legacy = JSON.parse(
            localStorage.getItem("fintrack-budgets-v2") || "{}",
          );
          const rows = Object.entries(legacy)
            .map(([key, value]) => ({
              user_id: userId,
              period: key.slice(0, 7),
              category: key.slice(8),
              monthly_limit: Number(value),
            }))
            .filter(
              (row) =>
                row.period.length === 7 &&
                row.category &&
                Number.isFinite(row.monthly_limit),
            );
          if (rows.length) {
            const result = await supabase.from("budgets").insert(rows).select();
            if (result.error) throw result.error;
            budgetRows = result.data || [];
            localStorage.removeItem("fintrack-budgets-v2");
          }
        } catch (error) {
          console.error("Migración de presupuestos:", error);
          setDataError(
            `No se pudieron migrar los presupuestos locales: ${error.message}`,
          );
        }
      }

      if (recurringRows.length === 0) {
        try {
          const legacy = JSON.parse(
            localStorage.getItem("fintrack-recurring-v2") || "[]",
          );
          const rows = legacy
            .map((item) => ({
              user_id: userId,
              title: String(item.title || "").trim(),
              category: item.category || "Otros",
              amount: Number(item.amount),
              day: Math.min(31, Math.max(1, Number(item.day) || 1)),
            }))
            .filter(
              (row) =>
                row.title && Number.isFinite(row.amount) && row.amount > 0,
            );
          if (rows.length) {
            const result = await supabase
              .from("recurring")
              .insert(rows)
              .select();
            if (result.error) throw result.error;
            recurringRows = result.data || [];
            localStorage.removeItem("fintrack-recurring-v2");
          }
        } catch (error) {
          console.error("Migración de gastos recurrentes:", error);
          setDataError(
            `No se pudieron migrar los gastos recurrentes locales: ${error.message}`,
          );
        }
      }

      if (!active) return;
      setBudgets(
        Object.fromEntries(
          budgetRows.map((row) => [
            `${row.period}-${row.category}`,
            Number(row.monthly_limit),
          ]),
        ),
      );
      setRecurring(recurringRows || []);
    }

    loadCloudSettings();
    return () => {
      active = false;
    };
  }, [userId]);

  // ========================================
  // CÁLCULOS FINANCIEROS
  // ========================================

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense" && !isSavingsWithdrawal(t))
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

  const periodBalance = periodIncome - periodExpenses;

  const periodAvailableBalance = periodBalance - periodSavings;

  const savingsRate =
    periodIncome > 0 ? (periodBalance / periodIncome) * 100 : 0;
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

  // Período válido para estadísticas.
  // Evita errores si desde Movimientos se seleccionó "Todos".
  const analyticsPeriod = months.includes(period) ? period : currentMonth();

  const analyticsTransactions = transactions.filter(
    (t) => monthKey(t.date) === analyticsPeriod,
  );

  const analyticsIncome = analyticsTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const analyticsExpenses = analyticsTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const analyticsSavings = goals.reduce(
    (sum, goal) =>
      sum +
      (goal.contributions || [])
        .filter((item) => monthKey(item.date) === analyticsPeriod)
        .reduce((subtotal, item) => subtotal + Number(item.amount), 0),
    0,
  );

  const analyticsBalance = analyticsIncome - analyticsExpenses;

  const analyticsAvailable = analyticsBalance - analyticsSavings;

  const analyticsSavingsRate =
    analyticsIncome > 0 ? (analyticsBalance / analyticsIncome) * 100 : 0;

  // Mes anterior
  const previousPeriodDate = new Date(analyticsPeriod + "-01T12:00:00");
  previousPeriodDate.setMonth(previousPeriodDate.getMonth() - 1);

  const previousPeriodKey = [
    previousPeriodDate.getFullYear(),
    String(previousPeriodDate.getMonth() + 1).padStart(2, "0"),
  ].join("-");

  const previousTransactions = transactions.filter(
    (t) => monthKey(t.date) === previousPeriodKey,
  );

  const previousIncome = previousTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const previousExpenses = previousTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const previousBalance = previousIncome - previousExpenses;

  const percentageChange = (current, previous) => {
    if (previous === 0) {
      return current === 0 ? "—" : "Nuevo";
    }

    const percentage = ((current - previous) / previous) * 100;

    return `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`;
  };

  // Gastos agrupados por categoría
  const analyticsCategories = Object.values(
    analyticsTransactions
      .filter((t) => t.type === "expense")
      .reduce((groups, transaction) => {
        const name = transaction.category || "Otros";

        if (!groups[name]) {
          groups[name] = { name, amount: 0, count: 0 };
        }

        groups[name].amount += Number(transaction.amount);
        groups[name].count += 1;

        return groups;
      }, {}),
  ).sort((a, b) => b.amount - a.amount);

  const highestCategory = analyticsCategories[0] || null;

  const highestExpense =
    analyticsTransactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null;

  // Evolución de los últimos seis meses
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(analyticsPeriod + "-01T12:00:00");
      date.setMonth(date.getMonth() - (5 - index));

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      const list = transactions.filter((t) => monthKey(t.date) === key);

      const ingresos = list
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const gastos = list
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: date.toLocaleDateString("es-AR", {
          month: "short",
        }),
        ingresos,
        gastos,
        resultado: ingresos - gastos,
      };
    });
  }, [transactions, analyticsPeriod]);

  // ========================================
  // INFORMES FINANCIEROS
  // ========================================

  const reportYear = reportDate.slice(0, 4);

  const reportKey = reportPeriod === "monthly" ? reportDate : reportYear;

  const reportTransactions = transactions.filter((t) =>
    reportPeriod === "monthly"
      ? monthKey(t.date) === reportKey
      : String(t.date).startsWith(reportKey),
  );

  const reportIncome = reportTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const reportExpenses = reportTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const reportBalance = reportIncome - reportExpenses;

  const reportSavings = goals.reduce(
    (sum, goal) =>
      sum +
      (goal.contributions || [])
        .filter((item) =>
          reportPeriod === "monthly"
            ? monthKey(item.date) === reportKey
            : String(item.date || "").startsWith(reportKey),
        )
        .reduce((subtotal, item) => subtotal + Number(item.amount), 0),
    0,
  );

  const reportAvailable = reportBalance - reportSavings;

  const reportSavingsRate =
    reportIncome > 0 ? (reportBalance / reportIncome) * 100 : 0;

  // Período anterior
  const reportPreviousKey = (() => {
    if (reportPeriod === "yearly") {
      return String(Number(reportYear) - 1);
    }

    const date = new Date(reportDate + "-01T12:00:00");
    date.setMonth(date.getMonth() - 1);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })();

  const reportPreviousTransactions = transactions.filter((t) =>
    reportPeriod === "monthly"
      ? monthKey(t.date) === reportPreviousKey
      : String(t.date).startsWith(reportPreviousKey),
  );

  const reportPreviousIncome = reportPreviousTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const reportPreviousExpenses = reportPreviousTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const reportPreviousBalance = reportPreviousIncome - reportPreviousExpenses;

  // Gastos por categoría
  const reportCategories = Object.values(
    reportTransactions
      .filter((t) => t.type === "expense")
      .reduce((groups, transaction) => {
        const name = transaction.category || "Otros";

        if (!groups[name]) {
          groups[name] = { name, amount: 0, count: 0 };
        }

        groups[name].amount += Number(transaction.amount);
        groups[name].count += 1;

        return groups;
      }, {}),
  ).sort((a, b) => b.amount - a.amount);

  const reportPreviousLabel =
    reportPeriod === "monthly"
      ? new Date(reportPreviousKey + "-02T12:00:00").toLocaleDateString(
          "es-AR",
          { month: "long", year: "numeric" },
        )
      : reportPreviousKey;

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
    { id: "reports", label: "Informes", icon: FileText },
    { id: "recurring", label: "Recurrentes", icon: Repeat },
    { id: "settings", label: "Configuración", icon: Settings },
    { id: "profile", label: "Mi perfil", icon: UserRound },
  ];

  // ========================================
  // PERFIL Y SEGURIDAD
  // ========================================

  useEffect(() => {
    setProfileName(user?.user_metadata?.full_name || "");
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();

    const name = profileName.trim();

    if (!name) {
      setProfileError("Ingresá tu nombre.");
      return;
    }

    setProfileLoading(true);
    setProfileError("");
    setProfileMessage("");

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
      },
    });

    setProfileLoading(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setProfileName(data.user.user_metadata.full_name || name);
    setProfileMessage("Tu perfil se actualizó correctamente.");
  };

  const changePassword = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileMessage("");

    if (newPassword.length < 6) {
      setProfileError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setProfileError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPasswordLoading(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setProfileMessage("Tu contraseña se cambió correctamente.");
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés cerrar sesión?",
    );

    if (!confirmed) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert(`No se pudo cerrar sesión: ${error.message}`);
      return;
    }

    if (onLogout) onLogout();
  };

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

  const saveTransaction = async (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !form.date
    ) {
      return;
    }

    setDataError("");

    const movement = {
      title: form.title.trim(),
      category: form.category,
      type: form.type,
      amount,
      date: form.date,
      recurring: false,
      user_id: userId,
    };

    try {
      if (editing) {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            title: movement.title,
            category: movement.category,
            type: movement.type,
            amount: movement.amount,
            date: movement.date,
          })
          .eq("id", editing)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;

        setTransactions((prev) =>
          prev.map((t) => (t.id === editing ? data : t)),
        );
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .insert(movement)
          .select()
          .single();

        if (error) throw error;

        setTransactions((prev) => [data, ...prev]);
      }

      setModal(false);
    } catch (error) {
      setDataError(error.message);
      window.alert(`No se pudo guardar el movimiento: ${error.message}`);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este movimiento?")) {
      return;
    }

    setDataError("");

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setDataError(error.message);
      window.alert(`No se pudo eliminar el movimiento: ${error.message}`);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // ========================================
  // AHORROS
  // ========================================

  const addGoal = async (e) => {
    e.preventDefault();

    const target = Number(goalForm.target);

    if (!goalForm.name.trim() || !Number.isFinite(target) || target <= 0)
      return;

    setDataError("");

    const newGoal = {
      user_id: userId,
      name: goalForm.name.trim(),
      target,
      date: goalForm.date || null,
      contributions: [],
    };

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert(newGoal)
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => [...prev, data]);

      setGoalForm({ name: "", target: "", date: "" });
    } catch (error) {
      setDataError(error.message);
      window.alert(`No se pudo guardar la meta: ${error.message}`);
    }
  };

  const addContribution = async (e) => {
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

    const remaining = Number(goal.target) - saved;

    if (amount > remaining) {
      window.alert(
        `El aporte supera lo que falta para completar el objetivo: ${money(remaining)}.`,
      );
      return;
    }

    const updatedContributions = [
      ...(goal.contributions || []),
      { id: crypto.randomUUID(), amount, date: today() },
    ];

    setDataError("");

    const { data, error } = await supabase
      .from("goals")
      .update({ contributions: updatedContributions })
      .eq("id", goal.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      setDataError(error.message);
      window.alert(`No se pudo guardar el aporte: ${error.message}`);
      return;
    }

    setGoals((prev) => prev.map((item) => (item.id === goal.id ? data : item)));

    setContributionAmount("");
    setGoalModal(null);
  };

  const withdrawFromGoal = async (e) => {
    e.preventDefault();

    const amount = Number(withdrawAmount);
    const goal = goals.find((item) => item.id === withdrawModal);

    if (!goal || !Number.isFinite(amount) || amount <= 0) {
      window.alert("Ingresá un importe válido.");
      return;
    }

    const saved = (goal.contributions || []).reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    if (amount > saved) {
      window.alert(
        `No podés retirar más de lo que tenés ahorrado. Disponible: ${money(saved)}.`,
      );
      return;
    }

    setWithdrawLoading(true);
    setDataError("");

    try {
      const { data, error } = await supabase.rpc("withdraw_from_goal", {
        p_goal_id: goal.id,
        p_amount: amount,
        p_date: today(),
      });

      if (error) throw error;

      if (!data?.goal || !data?.transaction) {
        throw new Error(
          "La operación se realizó, pero no se recibió la información actualizada.",
        );
      }

      setGoals((prev) =>
        prev.map((item) => (item.id === goal.id ? data.goal : item)),
      );

      setTransactions((prev) => [data.transaction, ...prev]);

      setWithdrawAmount("");
      setWithdrawModal(null);

      window.alert(`Retiraste ${money(amount)} de "${goal.name}".`);
    } catch (error) {
      setDataError(error.message);
      window.alert(`No se pudo realizar el retiro: ${error.message}`);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("¿Eliminar este objetivo y todos sus aportes?")) {
      return;
    }

    setDataError("");

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setDataError(error.message);
      window.alert(`No se pudo eliminar el objetivo: ${error.message}`);
      return;
    }

    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  // ========================================
  // PRESUPUESTOS
  // ========================================

  const budgetKey = (category) => `${period}-${category}`;

  const saveBudget = async (category) => {
    const amount = Number(budgetDraft[category]);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Ingresá un límite mayor que cero.");
      return;
    }

    const existing = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("period", period)
      .maybeSingle();
    if (existing.error) {
      window.alert(
        `No se pudo comprobar el presupuesto: ${existing.error.message}`,
      );
      return;
    }

    const payload = {
      user_id: userId,
      category,
      period,
      monthly_limit: amount,
    };
    const result = existing.data
      ? await supabase
          .from("budgets")
          .update({ monthly_limit: amount })
          .eq("id", existing.data.id)
          .eq("user_id", userId)
          .select()
          .single()
      : await supabase.from("budgets").insert(payload).select().single();

    if (result.error) {
      window.alert(
        `No se pudo guardar el presupuesto: ${result.error.message}`,
      );
      return;
    }
    setBudgets((prev) => ({
      ...prev,
      [budgetKey(category)]: Number(result.data.monthly_limit),
    }));
  };

  // ========================================
  // GASTOS RECURRENTES
  // ========================================

  const reportsContent = (
    <>
      <div className="page-content">
        <div className="welcome-row">
          <div>
            <h1>Informes financieros</h1>
            <p>Un resumen de cómo estás administrando tu dinero.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Período del informe</h3>
          </div>

          <div className="form-row">
            <select
              className="period-select"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>

            {reportPeriod === "monthly" ? (
              <input
                type="month"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            ) : (
              <input
                type="number"
                min="2000"
                max="2100"
                value={reportYear}
                onChange={(e) => setReportDate(`${e.target.value}-01`)}
              />
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Ingresos</span>
              <TrendingUp />
            </div>
            <div className="stat-value">{money(reportIncome)}</div>
            <div className="stat-foot">Total recibido</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Gastos</span>
              <TrendingDown />
            </div>
            <div className="stat-value">{money(reportExpenses)}</div>
            <div className="stat-foot">Total gastado</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Balance</span>
              <Wallet />
            </div>
            <div className="stat-value">{money(reportBalance)}</div>
            <div className="stat-foot">Ingresos menos gastos</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Aportes a metas</span>
              <PiggyBank />
            </div>
            <div className="stat-value">{money(reportSavings)}</div>
            <div className="stat-foot">Dinero destinado a tus metas</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Disponible</span>
              <Wallet />
            </div>
            <div className="stat-value">{money(reportAvailable)}</div>
            <div className="stat-foot">Balance menos aportes a metas</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Tasa de ahorro</span>
              <TrendingUp />
            </div>
            <div className="stat-value">{reportSavingsRate.toFixed(1)}%</div>
            <div className="stat-foot">Balance sobre ingresos</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Comparación con el período anterior</h3>
            <span>{reportPreviousLabel}</span>
          </div>

          <div className="category-item">
            <span>Ingresos anteriores</span>
            <strong>{money(reportPreviousIncome)}</strong>
          </div>

          <div className="category-item">
            <span>Gastos anteriores</span>
            <strong>{money(reportPreviousExpenses)}</strong>
          </div>

          <div className="category-item">
            <span>Balance anterior</span>
            <strong>{money(reportPreviousBalance)}</strong>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Gastos por categoría</h3>
            <strong>{money(reportExpenses)}</strong>
          </div>

          {reportCategories.length === 0 ? (
            <div className="empty-state">
              No hay gastos registrados en este período.
            </div>
          ) : (
            reportCategories.map((category) => (
              <div className="category-item" key={category.name}>
                <div className="category-stat">
                  <strong>{category.name}</strong>
                  <span>
                    {category.count} movimientos ·{" "}
                    {reportExpenses > 0
                      ? ((category.amount / reportExpenses) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>

                <div>
                  <strong>{money(category.amount)}</strong>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${
                          reportExpenses > 0
                            ? (category.amount / reportExpenses) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const addRecurring = async (e) => {
    e.preventDefault();
    const amount = Number(recurringForm.amount);
    const day = Math.min(31, Math.max(1, Number(recurringForm.day) || 1));
    const title = recurringForm.title.trim();
    if (!title || !Number.isFinite(amount) || amount <= 0) return;

    const { data, error } = await supabase
      .from("recurring")
      .insert({
        user_id: userId,
        title,
        category: recurringForm.category,
        amount,
        day,
      })
      .select()
      .single();

    if (error) {
      window.alert(`No se pudo guardar el gasto recurrente: ${error.message}`);
      return;
    }
    setRecurring((prev) => [...prev, data]);
    setRecurringForm({
      title: "",
      category: "Alimentación",
      amount: "",
      day: "1",
    });
  };

  const registerRecurring = async (item) => {
    const month = currentMonth();
    const alreadyRegistered = transactions.some(
      (t) => t.recurring_id === item.id && monthKey(t.date) === month,
    );
    if (alreadyRegistered) {
      window.alert("Este gasto recurrente ya fue registrado este mes.");
      return;
    }

    const now = new Date();
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const date = `${month}-${String(Math.min(Number(item.day), lastDay)).padStart(2, "0")}`;
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        title: item.title,
        category: item.category,
        type: "expense",
        amount: Number(item.amount),
        date,
        recurring: true,
        recurring_id: item.id,
      })
      .select()
      .single();

    if (error) {
      window.alert(`No se pudo registrar el gasto: ${error.message}`);
      return;
    }
    setTransactions((prev) => [data, ...prev]);
  };

  const deleteRecurring = async (id) => {
    if (
      !window.confirm(
        "¿Eliminar este gasto recurrente? Los movimientos ya registrados se conservarán.",
      )
    )
      return;
    const { error } = await supabase
      .from("recurring")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      window.alert(`No se pudo eliminar el gasto recurrente: ${error.message}`);
      return;
    }
    setRecurring((prev) => prev.filter((item) => item.id !== id));
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

  const resetAll = async () => {
    if (
      !window.confirm(
        "Se eliminarán permanentemente todos tus movimientos, ahorros, presupuestos y gastos recurrentes de tu cuenta. ¿Querés continuar?",
      )
    )
      return;
    const tables = ["transactions", "goals", "budgets", "recurring"];
    const results = await Promise.all(
      tables.map((table) =>
        supabase.from(table).delete().eq("user_id", userId),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed) {
      window.alert(
        `No se pudieron eliminar todos los datos: ${failed.error.message}. Revisá Supabase antes de volver a intentarlo.`,
      );
      return;
    }
    setTransactions([]);
    setGoals([]);
    setBudgets({});
    setRecurring([]);
    setSearch("");
    setFilter("all");
    setPeriod(currentMonth());
    setCalendarMonth(currentMonth());
    setSelectedDate(today());
    window.alert("Tus datos fueron eliminados de tu cuenta.");
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="23"
              height="23"
              fill="none"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5"
                clipRule="evenodd"
              />
            </svg>
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

                          <div className="savings-goal-actions">
                            <button
                              className="primary-button savings-contribute-button"
                              disabled={complete}
                              onClick={() => {
                                setGoalModal(goal.id);
                                setContributionAmount("");
                              }}
                            >
                              <Plus size={17} />
                              {complete
                                ? "Objetivo completado"
                                : "Agregar ahorro"}
                            </button>

                            <button
                              type="button"
                              className="secondary-button savings-withdraw-button"
                              disabled={saved <= 0}
                              onClick={() => {
                                setWithdrawModal(goal.id);
                                setWithdrawAmount("");
                              }}
                            >
                              <ArrowDownRight size={17} />
                              Retirar dinero
                            </button>
                          </div>

                          {(goal.contributions || []).length > 0 && (
                            <div className="savings-history">
                              <strong>Historial de movimientos</strong>

                              {[...goal.contributions].reverse().map((c) => {
                                const isWithdrawal = Number(c.amount) < 0;

                                return (
                                  <div
                                    className="savings-history-row"
                                    key={c.id}
                                  >
                                    <span>
                                      {isWithdrawal ? "Retiro" : "Aporte"} ·{" "}
                                      {dateLabel(c.date)}
                                    </span>

                                    <strong
                                      style={{
                                        color: isWithdrawal
                                          ? "#f17d83"
                                          : "#39d9a1",
                                      }}
                                    >
                                      {isWithdrawal ? "−" : "+"}
                                      {money(Math.abs(Number(c.amount)))}
                                    </strong>
                                  </div>
                                );
                              })}
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
                  <div className="eyebrow">FINTRACK ANALYTICS</div>
                  <h1>Estadísticas</h1>
                  <p>Entendé cómo administrás tu dinero y cómo evoluciona.</p>
                </div>

                <select
                  className="period-select"
                  value={analyticsPeriod}
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

              {/* INDICADORES PRINCIPALES */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Ingresos</span>
                    <TrendingUp color="#39d9a1" />
                  </div>
                  <div className="stat-value">{money(analyticsIncome)}</div>
                  <p>
                    {percentageChange(analyticsIncome, previousIncome)} respecto
                    al mes anterior
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Gastos</span>
                    <TrendingDown color="#f17d83" />
                  </div>
                  <div className="stat-value">{money(analyticsExpenses)}</div>
                  <p>
                    {percentageChange(analyticsExpenses, previousExpenses)}{" "}
                    respecto al mes anterior
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Resultado</span>
                    <Wallet color="#9b8af5" />
                  </div>
                  <div className="stat-value">{money(analyticsBalance)}</div>
                  <p>Ingresos menos gastos</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Ahorros registrados</span>
                    <PiggyBank color="#39d9a1" />
                  </div>
                  <div className="stat-value">{money(analyticsSavings)}</div>
                  <p>Dinero destinado a tus metas</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Disponible después de ahorrar</span>
                    <Wallet color="#39d9a1" />
                  </div>
                  <div className="stat-value">{money(analyticsAvailable)}</div>
                  <p>Resultado menos ahorros registrados</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Tasa de ahorro</span>
                    <PiggyBank color="#39d9a1" />
                  </div>
                  <div className="stat-value">
                    {analyticsSavingsRate.toFixed(1)}%
                  </div>
                  <p>
                    {analyticsIncome > 0
                      ? "Porcentaje de ingresos que quedó después de gastos"
                      : "Registrá ingresos para calcularla"}
                  </p>
                </div>
              </section>

              {/* COMPARACIÓN MENSUAL */}
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Comparación con el mes anterior</h2>
                    <p>Así evolucionaron tus números financieros</p>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Ingresos anteriores</span>
                    <div className="stat-value">{money(previousIncome)}</div>
                    <p>
                      Variación:{" "}
                      {percentageChange(analyticsIncome, previousIncome)}
                    </p>
                  </div>

                  <div className="stat-card">
                    <span>Gastos anteriores</span>
                    <div className="stat-value">{money(previousExpenses)}</div>
                    <p>
                      Variación:{" "}
                      {percentageChange(analyticsExpenses, previousExpenses)}
                    </p>
                  </div>

                  <div className="stat-card">
                    <span>Resultado anterior</span>
                    <div className="stat-value">{money(previousBalance)}</div>
                    <p>Resultado del mes previo</p>
                  </div>
                </div>
              </div>

              {/* EVOLUCIÓN */}
              <div className="panel chart-panel standalone-chart">
                <div className="panel-heading">
                  <div>
                    <h2>Evolución financiera</h2>
                    <p>
                      Ingresos, gastos y resultado de los últimos seis meses
                    </p>
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
                        name="Ingresos"
                        fill="#39d9a1"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="gastos"
                        name="Gastos"
                        fill="#f17d83"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="resultado"
                        name="Resultado"
                        fill="#9b8af5"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GASTOS POR CATEGORÍA */}
              <div className="panel category-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Distribución de gastos</h2>
                    <p>Descubrí dónde se concentra tu dinero</p>
                  </div>
                </div>

                {analyticsCategories.length === 0 ? (
                  <div className="empty-state">
                    Todavía no hay gastos registrados en este período.
                  </div>
                ) : (
                  analyticsCategories.map((item) => {
                    const percentage =
                      analyticsExpenses > 0
                        ? (item.amount / analyticsExpenses) * 100
                        : 0;

                    return (
                      <div className="category-item" key={item.name}>
                        <div className="category-stat">
                          <strong>{item.name}</strong>
                          <span>{money(item.amount)}</span>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <p>
                          {percentage.toFixed(1)}% de tus gastos · {item.count}{" "}
                          movimientos
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ANÁLISIS AUTOMÁTICO */}
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">ANÁLISIS INTELIGENTE</div>
                    <h2>Tu situación financiera</h2>
                    <p>
                      Un resumen automático basado en tus movimientos
                      registrados
                    </p>
                  </div>
                </div>

                {analyticsTransactions.length === 0 ? (
                  <div className="empty-state">
                    Todavía no hay movimientos suficientes para analizar este
                    período.
                  </div>
                ) : (
                  <div className="category-list">
                    <div className="category-item">
                      <strong>
                        {analyticsBalance > 0
                          ? "Tu balance es positivo"
                          : analyticsBalance < 0
                            ? "Tus gastos superan tus ingresos"
                            : "Tu balance está equilibrado"}
                      </strong>
                      <p>
                        {analyticsBalance > 0
                          ? `Después de tus gastos, te quedaron ${money(analyticsBalance)}.`
                          : analyticsBalance < 0
                            ? `Gastaste ${money(Math.abs(analyticsBalance))} más de lo que ingresaste.`
                            : "Tus ingresos y gastos fueron iguales."}
                      </p>
                    </div>

                    <div className="category-item">
                      <strong>
                        {highestCategory
                          ? `Tu categoría con más gastos: ${highestCategory.name}`
                          : "Todavía no registraste gastos"}
                      </strong>
                      <p>
                        {highestCategory
                          ? `Destinaste ${money(highestCategory.amount)} a esta categoría, equivalente al ${analyticsExpenses > 0 ? ((highestCategory.amount / analyticsExpenses) * 100).toFixed(1) : 0}% de tus gastos.`
                          : "Cuando registres gastos, podremos identificar tus principales categorías."}
                      </p>
                    </div>

                    <div className="category-item">
                      <strong>Tu movimiento más alto</strong>
                      <p>
                        {highestExpense
                          ? `${highestExpense.title} · ${money(Number(highestExpense.amount))} · ${highestExpense.category || "Otros"}`
                          : "Todavía no hay gastos para identificar."}
                      </p>
                    </div>

                    <div className="category-item">
                      <strong>Tu capacidad de ahorro</strong>
                      <p>
                        {analyticsIncome > 0
                          ? analyticsBalance > 0
                            ? `Conservaste el ${analyticsSavingsRate.toFixed(1)}% de tus ingresos después de los gastos.`
                            : "Este período no quedó dinero positivo después de los gastos."
                          : "Necesitás registrar ingresos para analizar tu capacidad de ahorro."}
                      </p>
                    </div>

                    <div className="category-item">
                      <strong>Dinero destinado a tus metas</strong>
                      <p>
                        Registraste {money(analyticsSavings)} en aportes a tus
                        objetivos durante este período.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {page === "reports" && reportsContent}

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
                        t.recurring_id === item.id &&
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
                            onClick={() => deleteRecurring(item.id)}
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

          {/* MI PERFIL */}

          {page === "profile" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">CUENTA PERSONAL</div>
                  <h1>Mi perfil</h1>
                  <p>Administrá tu información personal y seguridad.</p>
                </div>
              </div>

              <div className="panel settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Información personal</h2>
                    <p>Actualizá los datos de tu cuenta.</p>
                  </div>
                  <UserRound size={23} />
                </div>

                <div className="profile-card">
                  <div className="avatar profile-large-avatar">
                    {(profileName || user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>{profileName || "Usuario FinTrack"}</h3>
                    <span>{user?.email || "Sin correo electrónico"}</span>
                  </div>
                </div>

                <form className="profile-form" onSubmit={saveProfile}>
                  <label>
                    Nombre completo
                    <div className="profile-input">
                      <UserRound size={17} />
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                    </div>
                  </label>

                  <label>
                    Correo electrónico
                    <div className="profile-input disabled">
                      <Mail size={17} />
                      <input type="email" value={user?.email || ""} disabled />
                    </div>
                    <span className="settings-help">
                      El correo está asociado a tu cuenta de acceso.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={profileLoading}
                  >
                    <Save size={17} />
                    {profileLoading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </div>

              <div className="panel settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Seguridad de la cuenta</h2>
                    <p>Actualizá tu contraseña de acceso.</p>
                  </div>
                  <LockKeyhole size={23} />
                </div>

                <form className="profile-form" onSubmit={changePassword}>
                  <label>
                    Nueva contraseña
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </label>

                  <label>
                    Confirmar contraseña
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Repetí tu nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={passwordLoading}
                  >
                    <LockKeyhole size={17} />
                    {passwordLoading ? "Actualizando..." : "Cambiar contraseña"}
                  </button>
                </form>
              </div>

              {(profileMessage || profileError) && (
                <div className="panel">
                  <p
                    style={{
                      color: profileError ? "#f17d83" : "#39d9a1",
                      margin: 0,
                    }}
                  >
                    {profileError || profileMessage}
                  </p>
                </div>
              )}

              <div className="panel settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Sesión</h2>
                    <p>Administrá el acceso a tu cuenta.</p>
                  </div>
                  <LogOut size={22} />
                </div>

                <div className="settings-actions">
                  <button className="danger-button" onClick={handleLogout}>
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
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
                    <span>Tus datos se sincronizan con Supabase</span>
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
                  La exportación incluye ingresos y gastos. Tus objetivos,
                  presupuestos y gastos recurrentes también se guardan en tu
                  cuenta y se sincronizan de forma segura.
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

      {/* MODAL DE RETIRO DE AHORRO */}

      {withdrawModal !== null && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !withdrawLoading) {
              setWithdrawModal(null);
            }
          }}
        >
          <form className="transaction-modal" onSubmit={withdrawFromGoal}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">RETIRO DE AHORRO</div>
                <h2>Retirar dinero</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                disabled={withdrawLoading}
                onClick={() => setWithdrawModal(null)}
              >
                <X />
              </button>
            </div>

            {(() => {
              const goal = goals.find((item) => item.id === withdrawModal);

              const saved = (goal?.contributions || []).reduce(
                (sum, item) => sum + Number(item.amount),
                0,
              );

              return (
                <>
                  <p className="savings-modal-description">
                    {goal
                      ? `Vas a retirar dinero de tu objetivo "${goal.name}".`
                      : "Seleccioná el importe que querés retirar."}
                  </p>

                  <div className="savings-available">
                    <span>Dinero ahorrado en este objetivo</span>
                    <strong>{money(saved)}</strong>
                  </div>

                  <label>
                    ¿Cuánto querés retirar?
                    <input
                      autoFocus
                      required
                      type="number"
                      min="0.01"
                      max={saved}
                      step="0.01"
                      placeholder="Ej. 25000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </label>

                  <p className="savings-modal-description">
                    El retiro también se registrará automáticamente como un
                    gasto en tus movimientos.
                  </p>
                </>
              );
            })()}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={withdrawLoading}
                onClick={() => setWithdrawModal(null)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={withdrawLoading}
              >
                <Check size={16} />
                {withdrawLoading ? "Procesando..." : "Confirmar retiro"}
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
