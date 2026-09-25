import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Leaf,
  MapPin,
  Menu,
  PackageCheck,
  Recycle,
  Sparkles,
  Utensils,
  Users,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./App.css";

const API = "http://localhost:5050";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === undefined || value === null) return;

    const target = Number(value);
    const duration = 900;
    const start = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}

function App() {
  const [expectedPeople, setExpectedPeople] = useState(100);
  const [isHoliday, setIsHoliday] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [surplus, setSurplus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [error, setError] = useState("");

  const [surplusForm, setSurplusForm] = useState({
    foodName: "",
    quantity: "",
    unit: "meals",
    pickupLocation: "",
    availableDate: new Date().toISOString().split("T")[0],
    sourceName: "",
  });

  const [surplusSubmitting, setSurplusSubmitting] = useState(false);
  const [surplusMessage, setSurplusMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsRes, surplusRes] = await Promise.all([
          fetch(`${API}/api/analytics`),
          fetch(`${API}/api/surplus`),
        ]);

        const analyticsData = await analyticsRes.json();
        const surplusData = await surplusRes.json();

        if (analyticsData.success) {
          setAnalytics(analyticsData.analytics);
        }

        if (surplusData.success) {
          setSurplus(surplusData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);

  const registerSurplus = async (e) => {
    e.preventDefault();
    setSurplusSubmitting(true);
    setSurplusMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/api/surplus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foodName: surplusForm.foodName,
          quantity: Number(surplusForm.quantity),
          unit: surplusForm.unit,
          pickupLocation: surplusForm.pickupLocation,
          availableDate: surplusForm.availableDate,
          sourceName: surplusForm.sourceName,
          sourceType: "restaurant",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not register surplus food");
      }

      setSurplusMessage("Surplus food registered successfully!");

      setSurplusForm({
        foodName: "",
        quantity: "",
        unit: "meals",
        pickupLocation: "",
        availableDate: new Date().toISOString().split("T")[0],
        sourceName: "",
      });

      const refreshResponse = await fetch(`${API}/api/surplus`);
      const refreshData = await refreshResponse.json();

      if (refreshData.success) {
        setSurplus(refreshData);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSurplusSubmitting(false);
    }
  };

  const updateSurplusStatus = async (id, status) => {
    setError("");

    try {
      const response = await fetch(`${API}/api/surplus/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          ...(status === "reserved"
            ? { organizationName: "Hope Food Foundation" }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not update surplus status");
      }

      const refreshResponse = await fetch(`${API}/api/surplus`);
      const refreshData = await refreshResponse.json();

      if (refreshData.success) {
        setSurplus(refreshData);
      }
    } catch (err) {
      setError(err.message || "Could not update surplus status");
    }
  };

  const generatePrediction = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedPeople: Number(expectedPeople),
          isHoliday,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Prediction failed");
      }

      setPrediction(data.prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableMeals = surplus?.summary?.availableMeals || 0;

  const chartData = analytics?.recentRecords
    ? [...analytics.recentRecords]
        .reverse()
        .map((item) => ({
          day: new Date(item.date).toLocaleDateString("en-IN", {
            weekday: "short",
          }),
          prepared: Number(item.food_prepared || 0),
          consumed: Number(item.food_consumed || 0),
          wasted: Number(item.food_wasted || 0),
        }))
    : [];

  return (
    <div className="site">

      {/* Animated background */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-overlay" />

      {/* Floating particles */}
      <div className="particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.span
            key={i}
            className="particle"
            initial={{
              opacity: 0,
              y: 50,
              x: `${i * 8}%`,
            }}
            animate={{
              opacity: [0, 0.5, 0],
              y: [-10, -100, -180],
              x: [`${i * 8}%`, `${i * 8 + 3}%`, `${i * 8 - 2}%`],
            }}
            transition={{
              duration: 7 + i % 4,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* NAVBAR */}
      <header className="navbar">
        <a href="#top" className="logo">
          <motion.div
            className="logo-mark"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <Leaf size={20} />
          </motion.div>

          <div>
            <strong>FoodWise</strong>
            <span>INTELLIGENCE</span>
          </div>
        </a>

        <nav>
          <a href="#overview">Overview</a>
          <a href="#prediction">Prediction</a>
          <a href="#surplus">Redistribution</a>
        </nav>

        <div className="nav-status">
          <span className="pulse" />
          AI ONLINE
        </div>

        <button
          className="mobile-menu"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </header>

      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            className="mobile-nav"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <a href="#overview" onClick={() => setMobileMenu(false)}>
              Overview
            </a>
            <a href="#prediction" onClick={() => setMobileMenu(false)}>
              Prediction
            </a>
            <a href="#surplus" onClick={() => setMobileMenu(false)}>
              Redistribution
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="top">

        {/* HERO */}
        <section className="hero">
          <motion.div
            className="hero-copy"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="hero-tag">
              <Sparkles size={14} />
              AI-POWERED FOOD INTELLIGENCE
            </div>

            <h1>
              Feed people.
              <br />
              <span>Not landfills.</span>
            </h1>

            <p>
              FoodWise predicts tomorrow's demand, reduces overproduction,
              and redirects safe surplus food to people who need it.
            </p>

            <div className="hero-actions">
              <a href="#prediction" className="primary-button">
                Start prediction
                <ArrowUpRight size={17} />
              </a>

              <a href="#surplus" className="secondary-button">
                Explore impact
                <ChevronRight size={17} />
              </a>
            </div>

            <div className="hero-trust">
              <div className="avatar-stack">
                <span>🍚</span>
                <span>🥗</span>
                <span>🍛</span>
              </div>
              <div>
                <strong>Smart food management</strong>
                <small>Built for cafeterias, hostels & restaurants</small>
              </div>
            </div>
          </motion.div>

          {/* HERO VISUAL */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="orb">
              <div className="orb-ring ring-one" />
              <div className="orb-ring ring-two" />

              <motion.div
                className="food-orb"
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 4, -4, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                🌱
              </motion.div>

              <div className="orbit-card orbit-top">
                <Brain size={16} />
                <div>
                  <small>AI confidence</small>
                  <strong>{prediction?.confidence || 89.5}%</strong>
                </div>
              </div>

              <div className="orbit-card orbit-bottom">
                <Recycle size={16} />
                <div>
                  <small>Waste reduced</small>
                  <strong>{analytics?.wastePercentage || 5.7}%</strong>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* LIVE NUMBERS */}
        <section id="overview" className="metrics">
          <motion.div
            className="metric-card metric-featured"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="metric-icon">
              <Utensils size={19} />
            </div>
            <div>
              <span>Food prepared</span>
              <strong>
                <AnimatedNumber value={analytics?.totalPrepared || 0} />
                <small> meals</small>
              </strong>
            </div>
            <CircleDot className="metric-dot" />
          </motion.div>

          <motion.div
            className="metric-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="metric-icon green">
              <CheckCircle2 size={19} />
            </div>
            <div>
              <span>Consumed</span>
              <strong>
                <AnimatedNumber value={analytics?.totalConsumed || 0} />
                <small> meals</small>
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="metric-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="metric-icon orange">
              <Recycle size={19} />
            </div>
            <div>
              <span>Waste rate</span>
              <strong>
                {analytics?.wastePercentage || 0}
                <small>%</small>
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="metric-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="metric-icon purple">
              <PackageCheck size={19} />
            </div>
            <div>
              <span>Surplus meals</span>
              <strong>
                <AnimatedNumber value={availableMeals} />
                <small> available</small>
              </strong>
            </div>
          </motion.div>
        </section>

        {/* PREDICTION */}
        <section className="analytics-section">
          <div className="section-heading-row">
            <div className="section-intro">
              <span>LIVE DATA — FOOD CONSUMPTION</span>
              <h2>See where your food<br /><em>actually goes.</em></h2>
            </div>

            <div className="chart-legend">
              <span><i className="prepared-dot" /> Prepared</span>
              <span><i className="consumed-dot" /> Consumed</span>
              <span><i className="wasted-dot" /> Wasted</span>
            </div>
          </div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="chart-top">
              <div>
                <span>RECENT HISTORY</span>
                <strong>
                  {analytics?.totalWasted || 0} meals wasted
                </strong>
              </div>

              <div className="waste-badge">
                {analytics?.wastePercentage || 0}% waste
              </div>
            </div>

            <div className="chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(16,34,24,.08)"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#7d8b84" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#7d8b84" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(185,255,69,.08)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid rgba(16,34,24,.08)",
                        boxShadow: "0 15px 40px rgba(16,34,24,.1)",
                      }}
                    />
                    <Bar
                      dataKey="prepared"
                      fill="#163b27"
                      radius={[5, 5, 0, 0]}
                      animationDuration={900}
                    />
                    <Bar
                      dataKey="consumed"
                      fill="#91bd61"
                      radius={[5, 5, 0, 0]}
                      animationDuration={1100}
                    />
                    <Bar
                      dataKey="wasted"
                      fill="#e4ad59"
                      radius={[5, 5, 0, 0]}
                      animationDuration={1300}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  Loading food consumption history...
                </div>
              )}
            </div>

            <div className="chart-insight">
              <Sparkles size={17} />
              <div>
                <strong>FoodWise insight</strong>
                <p>
                  {analytics
                    ? `Your current waste rate is ${analytics.wastePercentage}%. ${analytics.totalWasted} meals were wasted across ${analytics.recordCount} recorded days.`
                    : "Analyzing your food consumption patterns..."}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="prediction" className="prediction-section">
          <motion.div
            className="section-intro"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span>01 — DEMAND ENGINE</span>
            <h2>Know what to cook<br /><em>before you cook it.</em></h2>
          </motion.div>

          <div className="prediction-layout">

            <motion.div
              className="prediction-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="card-label">
                <Brain size={15} />
                AI DEMAND PREDICTION
              </div>

              <h3>Tomorrow's demand</h3>

              <p>
                Tell FoodWise how many people you expect. Our model uses
                historical consumption patterns to estimate the right amount.
              </p>

              <div className="input-block">
                <label>
                  <Users size={15} />
                  Expected people
                </label>

                <div className="number-input">
                  <input
                    type="number"
                    min="0"
                    value={expectedPeople}
                    onChange={(e) => setExpectedPeople(e.target.value)}
                  />
                  <span>people</span>
                </div>
              </div>

              <button
                className="holiday-control"
                onClick={() => setIsHoliday(!isHoliday)}
              >
                <CalendarDays size={17} />
                <div>
                  <strong>Holiday</strong>
                  <small>Adjust prediction for holiday demand</small>
                </div>

                <span className={`switch ${isHoliday ? "on" : ""}`}>
                  <i />
                </span>
              </button>

              <button
                className="generate"
                onClick={generatePrediction}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Analyzing demand...
                  </>
                ) : (
                  <>
                    Generate prediction
                    <ArrowUpRight size={18} />
                  </>
                )}
              </button>

              {error && <div className="error-box">{error}</div>}
            </motion.div>

            <motion.div
              className="forecast-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="forecast-header">
                <div>
                  <span>LIVE FORECAST</span>
                  <h3>{prediction ? "Prediction ready" : "Awaiting input"}</h3>
                </div>
                <div className="live-badge">
                  <span />
                  LIVE
                </div>
              </div>

              <div className="forecast-number">
                <motion.strong
                  key={prediction?.predictedDemand || 0}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {prediction?.predictedDemand || "—"}
                </motion.strong>
                <span>meals predicted</span>
              </div>

              <div className="wave-chart">
                {[45, 65, 40, 72, 55, 82, 68, 91, 74, 86, 62, 78].map(
                  (height, i) => (
                    <motion.div
                      key={i}
                      className="wave-bar"
                      initial={{ height: 5 }}
                      animate={{
                        height: prediction ? `${height}%` : "8%",
                      }}
                      transition={{
                        delay: i * 0.04,
                        duration: 0.7,
                      }}
                    />
                  )
                )}
              </div>

              <div className="forecast-bottom">
                <div>
                  <span>Recommended</span>
                  <strong>{prediction?.recommendedPreparation || "—"} meals</strong>
                </div>

                <div>
                  <span>Confidence</span>
                  <strong>{prediction?.confidence || "—"}%</strong>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SURPLUS */}
                {/* REGISTER SURPLUS FOOD */}
        <section className="register-section">
          <motion.div
            className="register-copy"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span className="eyebrow">
              <Recycle size={15} />
              REGISTER SURPLUS
            </span>

            <h2>
              Have extra food?
              <br />
              <span>Put it to good use.</span>
            </h2>

            <p>
              Register safe surplus food and make it visible to nearby
              redistribution organizations.
            </p>

            <div className="register-points">
              <div>
                <CheckCircle2 size={18} />
                <span>Connect surplus with organizations</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Reduce unnecessary food waste</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Track redistribution in real time</span>
              </div>
            </div>
          </motion.div>

          <motion.form
            className="surplus-form"
            onSubmit={registerSurplus}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="form-heading">
              <div className="form-icon">
                <PackageCheck size={21} />
              </div>

              <div>
                <h3>Register food</h3>
                <p>Tell FoodWise what is available.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Food name
                <input
                  required
                  value={surplusForm.foodName}
                  onChange={(e) =>
                    setSurplusForm({
                      ...surplusForm,
                      foodName: e.target.value,
                    })
                  }
                  placeholder="e.g. Rice Meals"
                />
              </label>

              <label>
                Quantity
                <input
                  required
                  min="1"
                  type="number"
                  value={surplusForm.quantity}
                  onChange={(e) =>
                    setSurplusForm({
                      ...surplusForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="e.g. 30"
                />
              </label>

              <label>
                Unit
                <select
                  value={surplusForm.unit}
                  onChange={(e) =>
                    setSurplusForm({
                      ...surplusForm,
                      unit: e.target.value,
                    })
                  }
                >
                  <option value="meals">Meals</option>
                  <option value="portions">Portions</option>
                  <option value="kg">Kilograms</option>
                  <option value="packets">Packets</option>
                </select>
              </label>

              <label>
                Available date
                <input
                  required
                  type="date"
                  value={surplusForm.availableDate}
                  onChange={(e) =>
                    setSurplusForm({
                      ...surplusForm,
                      availableDate: e.target.value,
                    })
                  }
                />
              </label>

              <label className="full-field">
                Restaurant / Hostel
                <input
                  required
                  value={surplusForm.sourceName}
                  onChange={(e) =>
                    setSurplusForm({
                      ...surplusForm,
                      sourceName: e.target.value,
                    })
                  }
                  placeholder="e.g. Green Leaf Restaurant"
                />
              </label>

              <label className="full-field">
                Pickup location
                <input
                  required
                  value={surplusForm.pickupLocation}
                  onChange={(e) =>
                    setSurplusForm({
                      ...surplusForm,
                      pickupLocation: e.target.value,
                    })
                  }
                  placeholder="e.g. MG Road, Bengaluru"
                />
              </label>
            </div>

            {surplusMessage && (
              <div className="form-success">
                <CheckCircle2 size={18} />
                {surplusMessage}
              </div>
            )}

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button form-submit"
              disabled={surplusSubmitting}
            >
              {surplusSubmitting ? (
                "Registering..."
              ) : (
                <>
                  Register surplus
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </motion.form>
        </section>

                {/* LIVE SURPLUS REGISTRY */}
        <section className="registry-section">
          <motion.div
            className="section-heading-row"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="section-intro">
              <span>LIVE SURPLUS REGISTRY</span>
              <h2>
                Every extra meal
                <br />
                <em>has a destination.</em>
              </h2>
            </div>

            <div className="registry-count">
              <strong>{surplus?.listings?.length || 0}</strong>
              <span>registered listings</span>
            </div>
          </motion.div>

          <motion.div
            className="registry-table-wrap"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {surplus?.listings?.length ? (
              <div className="registry-table">
                <div className="registry-row registry-header">
                  <span>FOOD</span>
                  <span>QUANTITY</span>
                  <span>REGISTERED BY</span>
                  <span>PICKUP LOCATION</span>
                  <span>STATUS</span>
                </div>

                {surplus.listings.map((item, index) => (
                  <motion.div
                    className="registry-row"
                    key={item.id || index}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <div className="registry-food">
                      <div className="registry-food-icon">
                        <Utensils size={17} />
                      </div>

                      <div>
                        <strong>{item.food_name}</strong>
                        <small>{item.source_type || "Food provider"}</small>
                      </div>
                    </div>

                    <strong>
                      {item.quantity} {item.unit || "meals"}
                    </strong>

                    <span className="registry-source">
                      {item.source_name || "—"}
                    </span>

                    <div className="registry-location">
                      <MapPin size={14} />
                      <span>{item.pickup_location || "—"}</span>
                    </div>

                    <span
                      className={`registry-status ${
                        item.pickup_status === "reserved"
                          ? "reserved"
                          : item.pickup_status === "picked_up"
                            ? "picked"
                            : "available"
                      }`}
                    >
                      <CircleDot size={11} />
                      {item.pickup_status === "picked_up"
                        ? "Picked up"
                        : item.pickup_status === "reserved"
                          ? "Reserved"
                          : "Available"}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="registry-empty">
                <PackageCheck size={28} />
                <strong>No surplus registered yet</strong>
                <span>Registered food will appear here automatically.</span>
              </div>
            )}
          </motion.div>
        </section>

        <section id="surplus" className="surplus-section-new">
          <div className="section-heading-row">
            <div className="section-intro">
              <span>02 — CIRCULAR FOOD NETWORK</span>
              <h2>Surplus doesn't mean<br /><em>useless.</em></h2>
            </div>

            <div className="available-bubble">
              <Recycle size={17} />
              {availableMeals} meals ready
            </div>
          </div>

          <div className="surplus-list">
            {surplus?.surplus?.map((item, index) => (
              <motion.div
                className="surplus-item"
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="food-number">
                  0{index + 1}
                </div>

                <div className="food-symbol">
                  {item.food_name.toLowerCase().includes("rice")
                    ? "🍚"
                    : item.food_name.toLowerCase().includes("curry")
                    ? "🥘"
                    : "🫓"}
                </div>

                <div className="food-details">
                  <strong>{item.food_name}</strong>
                  <span>
                    {item.quantity} {item.unit}
                  </span>
                </div>

                <div className="food-location">
                  <MapPin size={14} />
                  {item.distance_km} km
                  <small>{item.pickup_location || item.source_name}</small>
                </div>

                <div className="food-action-area">
                  <div className={`food-status ${item.pickup_status}`}>
                    {item.pickup_status === "available"
                      ? "Available"
                      : item.pickup_status === "reserved"
                        ? "Reserved"
                        : "Picked Up"}
                  </div>

                  {item.pickup_status === "available" && (
                    <button
                      className="surplus-action-button"
                      onClick={() =>
                        updateSurplusStatus(item.id, "reserved")
                      }
                    >
                      Reserve Food
                      <ArrowUpRight size={15} />
                    </button>
                  )}

                  {item.pickup_status === "reserved" && (
                    <button
                      className="surplus-action-button picked-button"
                      onClick={() =>
                        updateSurplusStatus(item.id, "picked_up")
                      }
                    >
                      Mark Picked Up
                      <CheckCircle2 size={15} />
                    </button>
                  )}

                  {item.pickup_status === "picked_up" && (
                    <div className="redistributed-label">
                      <CheckCircle2 size={15} />
                      Redistributed
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* IMPACT */}
        <section className="impact-section">
          <div className="section-intro">
            <span>03 — MEASURABLE IMPACT</span>
            <h2>Small changes.<br /><em>Real-world impact.</em></h2>
          </div>

          <div className="impact-grid">
            <div className="impact-card">
              <Leaf size={22} />
              <strong><AnimatedNumber value={analytics?.totalConsumed || 0} /></strong>
              <span>Meals consumed</span>
            </div>

            <div className="impact-card">
              <Recycle size={22} />
              <strong><AnimatedNumber value={analytics?.totalWasted || 0} /></strong>
              <span>Meals tracked as waste</span>
            </div>

            <div className="impact-card">
              <PackageCheck size={22} />
              <strong><AnimatedNumber value={surplus?.summary?.redistributedMeals || 0} /></strong>
              <span>Meals redistributed</span>
            </div>

            <div className="impact-card">
              <Users size={22} />
              <strong><AnimatedNumber value={surplus?.summary?.totalListings || 0} /></strong>
              <span>Surplus listings</span>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <motion.section
          className="final-cta"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div>
            <Sparkles size={25} />
            <h2>Every meal counts.</h2>
            <p>
              Predict smarter. Reduce waste. Redirect surplus.
            </p>
          </div>

          <a href="#prediction">
            Make a prediction
            <ArrowUpRight size={18} />
          </a>
        </motion.section>
      </main>

      <footer>
        <div className="logo">
          <div className="logo-mark">
            <Leaf size={17} />
          </div>
          <strong>FoodWise AI</strong>
        </div>
        <span>AI-Based Food Waste Reduction System</span>
        <span>Built for Hackathon 2026</span>
      </footer>
    </div>
  );
}

export default App;
