import React, { useEffect, useState } from "react";

import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useOutletContext
} from "react-router-dom";

import {
  Home,
  UserRound,
  Code2,
  Gamepad2,
  FolderKanban,
  Trophy,
  Settings,
  Menu,
  X,
  LogOut,
  Rocket,
  ChevronLeft,
  Sparkles,
  BookOpen,
  LoaderCircle
} from "lucide-react";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  collection,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  auth,
  db,
  logoutUser
} from "./src/services/firebase.js";

/* =========================================
   NAVIGATION
========================================= */

const navigation = [
  { label: "الرئيسية", path: "/", icon: Home },
  { label: "الملف الشخصي", path: "/profile", icon: UserRound },
  { label: "لغات البرمجة", path: "/languages", icon: BookOpen },
  { label: "ساحة الأكواد", path: "/playground", icon: Code2 },
  { label: "الألعاب", path: "/games", icon: Gamepad2 },
  { label: "المشاريع", path: "/projects", icon: FolderKanban },
  { label: "الإنجازات", path: "/achievements", icon: Trophy },
  { label: "الإعدادات", path: "/settings", icon: Settings }
];

/* =========================================
   PROGRAMMING LANGUAGES
========================================= */

const languageData = [
  {
    id: "python",
    name: "Python",
    description: "ابدأ رحلة تعلم لغة Python.",
    mark: "Py",
    className: "python"
  },
  {
    id: "javascript",
    name: "JavaScript",
    description: "تعلم بناء مواقع وتطبيقات تفاعلية.",
    mark: "JS",
    className: "javascript"
  },
  {
    id: "cpp",
    name: "C++",
    description: "اكتشف أساسيات البرمجة المتقدمة.",
    mark: "C++",
    className: "cpp"
  }
];

const curriculumTotals = {
  python: 24,
  javascript: 26,
  cpp: 23
};

/* =========================================
   HELPERS
========================================= */

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : fallback;
}

function getDisplayName(user, profile) {
  return (
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "مستكشف البرمجة"
  );
}

function getCompletedLessons(progress) {
  return Object.values(progress || {}).reduce(
    (total, language) =>
      total + safeNumber(language?.completedLessons),
    0
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("");
}

function getProgressPercentage(completed, total) {
  if (!total) return 0;

  return Math.min(
    100,
    Math.round((completed / total) * 100)
  );
}

/* =========================================
   LOADING SCREEN
========================================= */

function LoadingScreen() {
  return (
    <div className="app-loading" dir="rtl">
      <div className="loading-content">
        <div className="loading-logo">
          <LoaderCircle size={36} />
        </div>

        <h2>Cody Academy</h2>

        <p>جاري تجهيز المغامرة البرمجية...</p>
      </div>
    </div>
  );
}

/* =========================================
   COMING SOON
========================================= */

function ComingSoon({ title, description, icon: Icon }) {
  return (
    <section className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          {Icon ? <Icon size={38} /> : <Sparkles size={38} />}
        </div>

        <span className="coming-soon-label">
          قريبًا
        </span>

        <h1>{title}</h1>

        <p>
          {description ||
            "نعمل على تجهيز هذه الميزة لتكون متاحة قريبًا."}
        </p>

        <NavLink to="/" className="primary-button">
          العودة للرئيسية
          <ChevronLeft size={18} />
        </NavLink>
      </div>
    </section>
  );
}

/* =========================================
   MAIN APP
========================================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe = null;
    let progressUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }

        if (progressUnsubscribe) {
          progressUnsubscribe();
          progressUnsubscribe = null;
        }

        setUser(currentUser || null);
        setProfile(null);
        setProgress({});

        if (!currentUser) {
          setLoading(false);
          return;
        }

        const userRef = doc(
          db,
          "users",
          currentUser.uid
        );

        profileUnsubscribe = onSnapshot(
          userRef,
          (snapshot) => {
            setProfile(
              snapshot.exists()
                ? snapshot.data()
                : {}
            );

            setLoading(false);
          },
          (error) => {
            console.error(
              "Profile listener error:",
              error
            );

            setProfile({});
            setLoading(false);
          }
        );

        const progressRef = collection(
          db,
          "users",
          currentUser.uid,
          "progress"
        );

        progressUnsubscribe = onSnapshot(
          progressRef,
          (snapshot) => {
            const nextProgress = {};

            snapshot.forEach((item) => {
              nextProgress[item.id] = item.data();
            });

            setProgress(nextProgress);
          },
          (error) => {
            console.error(
              "Progress listener error:",
              error
            );

            setProgress({});
          }
        );
      }
    );

    return () => {
      authUnsubscribe();

      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (progressUnsubscribe) {
        progressUnsubscribe();
      }
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login.html" replace />;
  }

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            user={user}
            profile={profile}
            progress={progress}
          />
        }
      >
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/languages"
          element={<LanguagesPage />}
        />

        <Route
          path="/playground"
          element={
            <ComingSoon
              title="ساحة الأكواد"
              description="مساحة لكتابة الأكواد البرمجية وتجربة الأفكار."
              icon={Code2}
            />
          }
        />

        <Route
          path="/games"
          element={
            <ComingSoon
              title="الألعاب التعليمية"
              description="مجموعة من الألعاب والتحديات التعليمية."
              icon={Gamepad2}
            />
          }
        />

        <Route
          path="/projects"
          element={
            <ComingSoon
              title="المشاريع"
              description="مساحة لحفظ المشاريع البرمجية ومتابعتها."
              icon={FolderKanban}
            />
          }
        />

        <Route
          path="/achievements"
          element={
            <ComingSoon
              title="الإنجازات"
              description="تابع التقدم واجمع الإنجازات مع كل خطوة جديدة."
              icon={Trophy}
            />
          }
        />

        <Route
          path="/settings"
          element={
            <ComingSoon
              title="الإعدادات"
              description="إدارة إعدادات الحساب وتفضيلات المنصة."
              icon={Settings}
            />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Route>
    </Routes>
  );
}

/* =========================================
   MAIN LAYOUT
========================================= */

function MainLayout({ user, profile, progress }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const displayName = getDisplayName(user, profile);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <div className="kid-app" dir="rtl">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`kid-sidebar ${
          sidebarOpen ? "is-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Rocket size={25} />
          </div>

          <div className="brand-text">
            <strong>Cody Academy</strong>
            <span>مغامرتك البرمجية</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {getInitials(displayName)}
          </div>

          <div className="sidebar-user-info">
            <strong>{displayName}</strong>
            <span>مستكشف البرمجة</span>
          </div>
        </div>

        <nav className="sidebar-navigation">
          <span className="sidebar-section-title">
            القائمة الرئيسية
          </span>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>

                {location.pathname === item.path && (
                  <span className="active-indicator" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Sparkles size={19} />

            <p>
              كل خطوة صغيرة تقربك من تحقيق أهدافك البرمجية!
            </p>
          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="kid-main">
        <header className="kid-topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu size={23} />
          </button>

          <div className="topbar-page-title">
            <span>مرحبًا بعودتك!</span>
            <strong>{displayName}</strong>
          </div>

          <div className="topbar-actions">
            <div className="topbar-level">
              <Sparkles size={17} />
              <span>رحلة التعلم</span>
            </div>

            <div className="topbar-avatar">
              {getInitials(displayName)}
            </div>
          </div>
        </header>

        <div className="kid-page-content">
          <Outlet
            context={{
              user,
              profile,
              progress
            }}
          />
        </div>
      </main>
    </div>
  );
}

/* =========================================
   DASHBOARD
========================================= */

function Dashboard() {
  const { user, profile, progress } =
    useOutletContext();

  const displayName = getDisplayName(user, profile);

  const completedLessons =
    getCompletedLessons(progress);

  const totalLessons = Object.values(
    curriculumTotals
  ).reduce((sum, value) => sum + value, 0);

  const overallProgress = getProgressPercentage(
    completedLessons,
    totalLessons
  );

  return (
    <div className="dashboard-page">
      <section className="kid-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <Sparkles size={16} />
            أهلًا بك في عالم الإبداع
          </span>

          <h1>
            مغامرة برمجية
            <br />
            <span>جديدة بانتظارك!</span>
          </h1>

          <p>
            تعلم البرمجة خطوة بخطوة، واكتشف مهارات
            جديدة، واصنع مشاريعك بنفسك!
          </p>

          <NavLink
            to="/languages"
            className="hero-button"
          >
            ابدأ التعلم الآن
            <ChevronLeft size={19} />
          </NavLink>
        </div>

        <div className="hero-mascot">
          <div className="welcome-mascot">
            🤖
          </div>

          <div className="mascot-sparkle sparkle-one">
            ✦
          </div>

          <div className="mascot-sparkle sparkle-two">
            ✧
          </div>

          <div className="mascot-message">
            أهلًا يا {displayName}!
          </div>
        </div>

        <div className="hero-decoration decoration-one" />
        <div className="hero-decoration decoration-two" />
      </section>

      <section className="stats-grid">
        <StatCard
          icon={BookOpen}
          label="الدروس المكتملة"
          value={completedLessons}
          color="purple"
        />

        <StatCard
          icon={Code2}
          label="إجمالي الدروس"
          value={totalLessons}
          color="blue"
        />

        <StatCard
          icon={Trophy}
          label="نسبة التقدم"
          value={`${overallProgress}%`}
          color="yellow"
        />

        <StatCard
          icon={Rocket}
          label="لغات البرمجة"
          value={languageData.length}
          color="green"
        />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              طريقك نحو الاحتراف
            </span>

            <h2>رحلة التعلم</h2>
          </div>

          <NavLink to="/languages">
            عرض كل اللغات
            <ChevronLeft size={17} />
          </NavLink>
        </div>

        <div className="overall-progress-card">
          <div className="overall-progress-info">
            <div>
              <strong>التقدم الإجمالي</strong>

              <p>
                كل درس جديد يمثل خطوة نحو تطوير مهاراتك.
              </p>
            </div>

            <span>{overallProgress}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${overallProgress}%`
              }}
            />
          </div>

          <div className="progress-footer">
            <span>
              {completedLessons} درس مكتمل
            </span>

            <span>
              من أصل {totalLessons}
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              اكتشف مغامرتك التالية
            </span>

            <h2>لغات البرمجة</h2>
          </div>

          <NavLink to="/languages">
            المزيد
            <ChevronLeft size={17} />
          </NavLink>
        </div>

        <div className="language-cards-grid">
          {languageData.map((language) => (
            <LanguageCard
              key={language.id}
              language={language}
              progress={progress[language.id]}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="quick-action-card">
          <div className="quick-action-icon">
            <Code2 size={27} />
          </div>

          <div>
            <h3>مساحة البرمجة</h3>

            <p>
              اكتب الأكواد وجرب الأفكار البرمجية.
            </p>

            <NavLink to="/playground">
              الانتقال إلى الساحة
              <ChevronLeft size={16} />
            </NavLink>
          </div>
        </div>

        <div className="quick-action-card games-action">
          <div className="quick-action-icon">
            <Gamepad2 size={27} />
          </div>

          <div>
            <h3>الألعاب التعليمية</h3>

            <p>
              تعلم من خلال اللعب والتحديات.
            </p>

            <NavLink to="/games">
              اكتشف الألعاب
              <ChevronLeft size={16} />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">
        <Icon size={23} />
      </div>

      <div className="stat-info">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================
   LANGUAGE CARD
========================================= */

function LanguageCard({ language, progress }) {
  const completed = safeNumber(
    progress?.completedLessons
  );

  const total = curriculumTotals[language.id] || 0;

  const percentage = getProgressPercentage(
    completed,
    total
  );

  return (
    <div
      className={`language-card language-${language.className}`}
    >
      <div className="language-card-top">
        <div
          className={`language-logo language-logo-${language.className}`}
          role="img"
          aria-label={`رمز لغة ${language.name}`}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: "100%",
              height: "100%",
              fontWeight: 900,
              fontSize: language.className === "cpp" ? "0.9rem" : "1.05rem",
              color: "#F4F6FF",
              letterSpacing: "-0.03em"
            }}
          >
            {language.mark}
          </span>
        </div>

        <span className="language-progress-badge">
          {percentage}%
        </span>
      </div>

      <h3>{language.name}</h3>

      <p>{language.description}</p>

      <div className="language-progress">
        <div className="language-progress-label">
          <span>التقدم</span>

          <span>
            {completed}/{total}
          </span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${percentage}%`
            }}
          />
        </div>
      </div>

      <NavLink
        to={`/languages?language=${language.id}`}
        className="language-card-button"
      >
        ابدأ التعلم
        <ChevronLeft size={17} />
      </NavLink>
    </div>
  );
}

/* =========================================
   PROFILE PAGE
========================================= */

function ProfilePage() {
  const { user, profile, progress } =
    useOutletContext();

  const displayName = getDisplayName(user, profile);

  const completedLessons =
    getCompletedLessons(progress);

  const totalLessons = Object.values(
    curriculumTotals
  ).reduce((sum, value) => sum + value, 0);

  const overallProgress = getProgressPercentage(
        completedLessons,
    totalLessons
  );

  const level = Math.max(
    1,
    safeNumber(profile?.level, 1)
  );

  const xp = safeNumber(profile?.xp);
  const coins = safeNumber(profile?.coins);

  return (
    <div className="profile-page">
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              هويتك البرمجية
            </span>

            <h1>الملف الشخصي</h1>

            <p>
              جميع بيانات الحساب والتقدم التعليمي في مكان واحد.
            </p>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            <Rocket size={42} />
          </div>

          <h2>{displayName}</h2>

          <p className="profile-email">
            {user?.email || "لا يوجد بريد إلكتروني"}
          </p>

          <span className="profile-role">
            مستكشف البرمجة
          </span>

          <div className="profile-details">
            <div className="profile-detail-item">
              <span>المستوى</span>
              <strong>{level}</strong>
            </div>

            <div className="profile-detail-item">
              <span>نقاط الخبرة XP</span>
              <strong>{xp}</strong>
            </div>

            <div className="profile-detail-item">
              <span>العملات</span>
              <strong>{coins}</strong>
            </div>

            <div className="profile-detail-item">
              <span>الدروس المكتملة</span>
              <strong>{completedLessons}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              الإنجازات التعليمية
            </span>

            <h2>التقدم في التعلم</h2>
          </div>

          <strong>{overallProgress}%</strong>
        </div>

        <div className="overall-progress-card">
          <div className="overall-progress-info">
            <div>
              <strong>التقدم الإجمالي</strong>

              <p>
                كل درس جديد يمثل خطوة نحو تطوير المهارات.
              </p>
            </div>

            <span>{overallProgress}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${overallProgress}%`
              }}
            />
          </div>

          <div className="progress-footer">
            <span>
              {completedLessons} درس مكتمل
            </span>

            <span>
              من أصل {totalLessons}
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              الرحلة البرمجية
            </span>

            <h2>لغات البرمجة</h2>
          </div>
        </div>

        <div className="language-cards-grid">
          {languageData.map((language) => (
            <LanguageCard
              key={language.id}
              language={language}
              progress={progress[language.id]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================
   LANGUAGES PAGE
========================================= */

function LanguagesPage() {
  const { progress } = useOutletContext();

  return (
    <div className="languages-page">
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              اكتشف وتعلم
            </span>

            <h1>لغات البرمجة</h1>

            <p>
              اختر لغة البرمجة المناسبة وابدأ رحلة التعلم خطوة بخطوة.
            </p>
          </div>
        </div>

        <div className="language-cards-grid">
          {languageData.map((language) => (
            <LanguageCard
              key={language.id}
              language={language}
              progress={progress[language.id]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}