
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
} from "./services/firebase.js";

/* =========================================
   NAVIGATION
========================================= */

const navigation = [
  { label: "الرئيسية", path: "/", icon: Home },
  { label: "ملفي الشخصي", path: "/profile", icon: UserRound },
  { label: "لغات البرمجة", path: "/languages", icon: BookOpen },
  { label: "ساحة الأكواد", path: "/playground", icon: Code2 },
  { label: "الألعاب", path: "/games", icon: Gamepad2 },
  { label: "مشاريعي", path: "/projects", icon: FolderKanban },
  { label: "إنجازاتي", path: "/achievements", icon: Trophy },
  { label: "الإعدادات", path: "/settings", icon: Settings }
];

/* =========================================
   PROGRAMMING LANGUAGES
========================================= */

const languageData = [
  {
    id: "python",
    name: "Python",
    description: "ابدئي رحلتك في عالم البرمجة.",
    logo: "/assets/logos/python.svg",
    className: "python"
  },
  {
    id: "javascript",
    name: "JavaScript",
    description: "تعلمي بناء مواقع وتطبيقات تفاعلية.",
    logo: "/assets/logos/javascript.svg",
    className: "javascript"
  },
  {
    id: "cpp",
    name: "C++",
    description: "اكتشفي أساسيات البرمجة المتقدمة.",
    logo: "/assets/logos/cpp.svg",
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
    "بطل البرمجة"
  );
}

function getCompletedLessons(progress) {
  return Object.values(progress || {}).reduce(
    (total, language) =>
      total + safeNumber(language?.completedCount),
    0
  );
}

function getLanguageProgress(progress, languageId) {
  const totalLessons = curriculumTotals[languageId] || 0;

  if (!totalLessons) return 0;

  const completed = safeNumber(
    progress?.[languageId]?.completedCount
  );

  return Math.min(
    100,
    Math.round((completed / totalLessons) * 100)
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({ icon, label, value, color }) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>

      <div className="stat-info">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

/* =========================================
   COURSE CARD
========================================= */

function CourseCard({ course, progress = 0 }) {
  return (
    <article className={`course-card ${course.className}`}>
      <div className="course-card-top">
        <img
          className="course-logo"
          src={course.logo}
          alt={`${course.name} logo`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <span className="course-status">
          {progress > 0
            ? `${progress}% مكتمل`
            : "ابدأ الآن"}
        </span>
      </div>

      <h3>{course.name}</h3>
      <p>{course.description}</p>

      <div
        className="course-progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`تقدم ${course.name}`}
      >
        <div
          className="course-progress-value"
          style={{ width: `${progress}%` }}
        />
      </div>

      <NavLink
        to={`/languages?lang=${course.id}`}
        className="course-button"
      >
        استكشف اللغة
        <ChevronLeft size={17} />
      </NavLink>
    </article>
  );
}

/* =========================================
   LOADING SCREEN
========================================= */

function LoadingScreen() {
  return (
    <div className="cq-loading" dir="rtl">
      <LoaderCircle size={38} className="cq-spinner" />

      <h2>Cody Academy</h2>

      <p>بنجهز مغامرتك البرمجية...</p>
    </div>
  );
}

/* =========================================
   LOGIN PAGE
========================================= */

function LoginPage() {
  return (
    <main className="cq-login" dir="rtl">
      <div className="cq-login-card">
        <div className="cq-login-icon">
          <Rocket size={36} />
        </div>

        <h1>Cody Academy</h1>

        <p>
          سجّلي الدخول من صفحة تسجيل الدخول الأصلية
          في CodeQuest، ثم افتحي لوحة Cody Academy.
        </p>

        <a
          className="primary-button"
          href="../login.html"
        >
          الذهاب لتسجيل الدخول
        </a>
      </div>
    </main>
  );
}

/* =========================================
   PROTECTED ROUTE
========================================= */

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================
   APPLICATION LAYOUT
========================================= */

function AppLayout({
  user,
  profile,
  progress,
  dataError,
  onLogout
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();

  const currentPage =
    navigation.find(
      (item) => item.path === location.pathname
    )?.label || "مغامرتي الفضائية";

  const displayName = getDisplayName(user, profile);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await onLogout();
    } catch (error) {
      console.error("Logout error:", error);

      alert("تعذر تسجيل الخروج. حاولي مرة أخرى.");

      setLoggingOut(false);
    }
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell" dir="rtl">

      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="إغلاق القائمة"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >

        <div className="sidebar-brand">
          <div className="brand-icon">
            <Rocket size={25} />
          </div>

          <div className="brand-text">
            <h2>Cody Academy</h2>
            <span>SPACE EDITION</span>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={closeMobileMenu}
            aria-label="إغلاق القائمة"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <span>🚀</span>
          </div>

          <div className="sidebar-user-info">
            <strong>{displayName}</strong>
            <span>رحلتك مستمرة!</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">
            القائمة الرئيسية
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={19} />

                <span>{item.label}</span>

                <ChevronLeft
                  className="sidebar-link-arrow"
                  size={15}
                />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-cody-tip">
            <div className="cody-tip-icon">
              <Sparkles size={20} />
            </div>

            <strong>كودي معاك!</strong>

            <p>
              كل مبرمج عظيم بدأ بخطوة صغيرة.
            </p>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <LoaderCircle
                size={18}
                className="cq-spinner"
              />
            ) : (
              <LogOut size={18} />
            )}

            <span>
              {loggingOut
                ? "جاري الخروج..."
                : "تسجيل الخروج"}
            </span>
          </button>

        </div>
      </aside>

      <main className="main-area">

        <header className="top-header">

          <div className="header-right">

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={23} />
            </button>

            <div className="header-page-title">
              <span>مغامرتي الفضائية</span>
              <small>{currentPage}</small>
            </div>

          </div>

          <div className="header-left">

            <div className="header-welcome">
              <span>أهلاً بعودتك،</span>
              <strong>{displayName} 👋</strong>
            </div>

            <NavLink
              to="/profile"
              className="header-avatar"
              aria-label="الملف الشخصي"
            >
              🚀
            </NavLink>

          </div>

        </header>

        <div className="page-content">

          {dataError && (
            <div
              className="data-error-message"
              role="alert"
            >
              {dataError}
            </div>
          )}

          <Outlet
            context={{
              user,
              profile,
              progress
            }}
          />

        </div>

        <footer className="app-footer">
          <span>© Cody Academy</span>
          <span>صُنع بحب للمبرمجين الصغار ✨</span>
        </footer>

      </main>

      <nav className="mobile-bottom-nav">

        {navigation.slice(0, 4).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `mobile-bottom-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

      </nav>

    </div>
  );
}

/* =========================================
   DASHBOARD PAGE
========================================= */

function DashboardPage() {
  const { profile, progress } = useOutletContext();

  const xp = safeNumber(profile?.xp);
  const coins = safeNumber(profile?.coins);

  const level = Math.max(
    1,
    safeNumber(profile?.level, 1)
  );

  const projects = safeNumber(
    profile?.completedProjects
  );

  const completedLessons =
    getCompletedLessons(progress);

  return (
    <div className="dashboard-page">

      <section className="welcome-banner">

        <div className="welcome-content">

          <span className="welcome-label">
            <Sparkles size={15} />
            SPACE EDITION
          </span>

          <h1>
            مستعد لمغامرة برمجية جديدة؟ 🚀
          </h1>

          <p>
            اتعلم البرمجة، العب، ابنِ مشاريعك،
            واكتشف قدراتك مع كودي!
          </p>

          <NavLink
            to="/languages"
            className="primary-button"
          >
            ابدأ التعلم
            <ChevronLeft size={18} />
          </NavLink>

        </div>

        <div
          className="welcome-mascot"
          aria-label="كودي"
        >
          🤖
        </div>

      </section>

      <section className="stats-grid">

        <StatCard
          icon={<Trophy size={22} />}
          label="النقاط"
          value={coins}
          color="gold"
        />

        <StatCard
          icon={<Sparkles size={22} />}
          label="الخبرة XP"
          value={xp}
          color="purple"
        />

        <StatCard
          icon={<Rocket size={22} />}
          label="المستوى"
          value={level}
          color="blue"
        />

        <StatCard
          icon={<FolderKanban size={22} />}
          label="المشاريع"
          value={projects}
          color="green"
        />

      </section>

      <section className="section-heading">

        <div>
          <h2>رحلتك التعليمية</h2>

          <p>
            أنهيت {completedLessons} درسًا.
            كمّلي رحلتك!
          </p>
        </div>

        <NavLink
          to="/languages"
          className="text-link"
        >
          كل اللغات
          <ChevronLeft size={16} />
        </NavLink>

      </section>

      <section className="courses-grid">

        {languageData.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={getLanguageProgress(
              progress,
              course.id
            )}
          />
        ))}

      </section>

      <section className="cody-tip-card">

        <div className="cody-tip-icon">
          <Sparkles size={23} />
        </div>

        <div>
          <h3>رسالة من كودي</h3>

          <p>
            متقلقش لو قابلتك مشكلة في الكود.
            كل خطأ فرصة جديدة للتعلم!
          </p>
        </div>

      </section>

    </div>
  );
}

/* =========================================
   PROFILE PAGE
========================================= */

function ProfilePage() {
  const { user, profile, progress } =
    useOutletContext();

  const displayName = getDisplayName(
    user,
    profile
  );

  const completedLessons =
    getCompletedLessons(progress);

  return (
    <section className="profile-page">

      <div className="section-heading">
        <div>
          <h1>ملفي الشخصي</h1>
          <p>
            تابعي بيانات حسابك وإنجازاتك التعليمية.
          </p>
        </div>
      </div>

      <article className="profile-card">

        <div className="profile-avatar">
          🚀
        </div>

        <h2>{displayName}</h2>

        <p>
          {user?.email || "لا يوجد بريد إلكتروني"}
        </p>

        <div className="profile-details">

          <div>
            <span>المستوى</span>
            <strong>
              {Math.max(
                1,
                safeNumber(profile?.level, 1)
              )}
            </strong>
          </div>

          <div>
            <span>الخبرة XP</span>
            <strong>
              {safeNumber(profile?.xp)}
            </strong>
          </div>

          <div>
            <span>الدروس المكتملة</span>
            <strong>{completedLessons}</strong>
          </div>

        </div>

      </article>

    </section>
  );
}

/* =========================================
   LANGUAGES PAGE
========================================= */

function LanguagesPage() {
  const { progress } = useOutletContext();

  return (
    <section className="languages-page">

      <div className="section-heading">
        <div>
          <h1>لغات البرمجة</h1>

          <p>
            اختاري اللغة التي تريدين تعلمها.
          </p>
        </div>
      </div>

      <section className="courses-grid">

        {languageData.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={getLanguageProgress(
              progress,
              course.id
            )}
          />
        ))}

      </section>

    </section>
  );
}

/* =========================================
   TEMPORARY PAGES
========================================= */

const placeholderPages = {
  "/playground": {
    icon: Code2,
    title: "ساحة الأكواد",
    description:
      "مساحة كتابة وتشغيل الأكواد البرمجية."
  },

  "/games": {
    icon: Gamepad2,
    title: "الألعاب",
    description:
      "ألعاب تعليمية تفاعلية لتطوير مهاراتك البرمجية."
  },

  "/projects": {
    icon: FolderKanban,
    title: "مشاريعي",
    description:
      "هنا هتلاقي مشاريعك وتحفظ إنجازاتك."
  },

  "/achievements": {
    icon: Trophy,
    title: "إنجازاتي",
    description:
      "تابعي الشارات والإنجازات اللي حققتيها."
  },

  "/settings": {
    icon: Settings,
    title: "الإعدادات",
    description:
      "إدارة إعدادات المنصة وحسابك."
  }
};

function PlaceholderPage({ page }) {
  const Icon = page.icon;

  return (
    <section className="empty-state">

      <div className="empty-state-icon">
        <Icon size={38} />
      </div>

      <h1>{page.title}</h1>

      <p>{page.description}</p>

      <span className="coming-soon-label">
        <Sparkles size={15} />
        سيتم ربط هذه الميزة في المرحلة التالية
      </span>

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

  const [authLoading, setAuthLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  /* ---------------------------------------
     AUTHENTICATION LISTENER
  --------------------------------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,

      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },

      (error) => {
        console.error(
          "Authentication listener:",
          error
        );

        setDataError(
          "تعذر التحقق من حالة الحساب."
        );

        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ---------------------------------------
     FIRESTORE DATA LISTENERS
  --------------------------------------- */

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setProgress({});
      setDataError("");

      return undefined;
    }

    let profileReady = false;
    let progressReady = false;

    const profileRef = doc(
      db,
      "users",
      user.uid
    );

    const progressRef = collection(
      db,
      "users",
      user.uid,
      "lessonProgress"
    );

    const unsubscribeProfile = onSnapshot(
      profileRef,

      (snapshot) => {
        profileReady = true;

        if (snapshot.exists()) {
          setProfile({
            uid: user.uid,
            ...snapshot.data()
          });
        } else {
          setProfile({
            uid: user.uid,
            displayName:
              user.displayName || "بطل البرمجة",
            email: user.email || ""
          });
        }

        if (profileReady && progressReady) {
          setDataError("");
        }
      },

      (error) => {
        console.error(
          "Profile listener:",
          error
        );

        setDataError(
  
          "تعذر تحميل بيانات الملف الشخصي. تأكدي من اتصال الإنترنت وصلاحيات قاعدة البيانات."
        );
      }
    );

    const unsubscribeProgress = onSnapshot(
      progressRef,

      (snapshot) => {
        progressReady = true;

        const records = {};

        snapshot.forEach((item) => {
          const data = item.data();
          const language = data.language;

          if (!language) return;

          if (!records[language]) {
            records[language] = {
              completedCount: 0,
              lessons: []
            };
          }

          records[language].lessons.push({
            id: item.id,
            ...data
          });

          if (data.completed === true) {
            records[language].completedCount += 1;
          }
        });

        setProgress(records);

        if (profileReady && progressReady) {
          setDataError("");
        }
      },

      (error) => {
        console.error(
          "Progress listener:",
          error
        );

        setDataError(
          "تعذر تحميل تقدم الدروس. تأكدي من اتصال الإنترنت وصلاحيات قاعدة البيانات."
        );
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeProgress();
    };
  }, [user]);

  /* ---------------------------------------
     LOGOUT
  --------------------------------------- */

  async function handleLogout() {
    await logoutUser();
  }

  /* ---------------------------------------
     AUTH LOADING
  --------------------------------------- */

  if (authLoading) {
    return <LoadingScreen />;
  }

  /* ---------------------------------------
     ROUTES
  --------------------------------------- */

  return (
    <Routes>

      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/" replace />
            : <LoginPage />
        }
      />

      <Route
        element={
          <ProtectedRoute user={user}>
            <AppLayout
              user={user}
              profile={profile}
              progress={progress}
              dataError={dataError}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      >

        <Route
          index
          element={<DashboardPage />}
        />

        <Route
          path="profile"
          element={<ProfilePage />}
        />

        <Route
          path="languages"
          element={<LanguagesPage />}
        />

        {Object.entries(placeholderPages).map(
          ([path, page]) => (
            <Route
              key={path}
              path={path.slice(1)}
              element={
                <PlaceholderPage page={page} />
              }
            />
          )
        )}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Route>

    </Routes>
  );
}
