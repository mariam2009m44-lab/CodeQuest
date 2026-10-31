
import React, { useState } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
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
} from "lucide-react";

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
  { label: "الإعدادات", path: "/settings", icon: Settings },
];

/* =========================================
   APP LAYOUT
========================================= */

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage =
    navigation.find((item) => item.path === location.pathname)?.label ||
    "مغامرتي الفضائية";

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    // تسجيل الخروج الحقيقي سيتم ربطه بخدمة Firebase لاحقًا.
    navigate("/login");
    closeMobileMenu();
  }

  return (
    <div className="app-shell" dir="rtl">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="إغلاق القائمة"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}
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
            <strong>بطل البرمجة</strong>
            <span>رحلتك بدأت!</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">القائمة الرئيسية</p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
                <ChevronLeft className="sidebar-link-arrow" size={15} />
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
            <p>كل مبرمج عظيم بدأ بخطوة صغيرة.</p>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
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
              <strong>بطل البرمجة 👋</strong>
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
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>© Cody Academy</span>
          <span>صُنع بحب للمبرمجين الصغار ✨</span>
        </footer>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav">
        {navigation.slice(0, 4).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `mobile-bottom-link ${isActive ? "active" : ""}`
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
   DASHBOARD
========================================= */

function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-label">
            <Sparkles size={15} /> SPACE EDITION
          </span>

          <h1>مستعد لمغامرة برمجية جديدة؟ 🚀</h1>

          <p>
            اتعلم البرمجة، العب، ابنِ مشاريعك، واكتشف قدراتك
            مع كودي!
          </p>

          <NavLink to="/languages" className="primary-button">
            ابدأ التعلم
            <ChevronLeft size={18} />
          </NavLink>
        </div>

        <div className="welcome-mascot" aria-label="كودي">
          🤖
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={<Trophy size={22} />}
          label="النقاط"
          value="0"
          color="gold"
        />

        <StatCard
          icon={<Sparkles size={22} />}
          label="الخبرة XP"
          value="0"
          color="purple"
        />

        <StatCard
          icon={<Rocket size={22} />}
          label="المستوى"
          value="1"
          color="blue"
        />

        <StatCard
          icon={<FolderKanban size={22} />}
          label="المشاريع"
          value="0"
          color="green"
        />
      </section>

      <section className="section-heading">
        <div>
          <h2>رحلتك التعليمية</h2>
          <p>اختار اللغة اللي تحب تبدأ بيها.</p>
        </div>

        <NavLink to="/languages" className="text-link">
          كل اللغات <ChevronLeft size={16} />
        </NavLink>
      </section>

      <section className="courses-grid">
        <CourseCard
          name="Python"
          description="ابدأ رحلتك في عالم البرمجة."
          logo="/assets/logos/python.svg"
          path="/languages"
          className="python"
        />

        <CourseCard
          name="JavaScript"
          description="تعلم بناء مواقع وتطبيقات تفاعلية."
          logo="/assets/logos/javascript.svg"
          path="/languages"
          className="javascript"
        />

        <CourseCard
          name="C++"
          description="اكتشف أساسيات البرمجة المتقدمة."
          logo="/assets/logos/cpp.svg"
          path="/languages"
          className="cpp"
        />
      </section>

      <section className="cody-tip-card">
        <div className="cody-tip-icon">
          <Sparkles size={23} />
        </div>

        <div>
          <h3>رسالة من كودي</h3>
          <p>
            متقلقش لو قابلتك مشكلة في الكود. كل خطأ فرصة
            جديدة للتعلم!
          </p>
        </div>
      </section>
    </div>
  );
}

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

function CourseCard({ name, description, logo, path, className }) {
  return (
    <article className={`course-card ${className}`}>
      <div className="course-card-top">
        <img
          className="course-logo"
          src={logo}
          alt={`${name} logo`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <span className="course-status">ابدأ الآن</span>
      </div>

      <h3>{name}</h3>
      <p>{description}</p>

      <NavLink to={path} className="course-button">
        استكشف اللغة <ChevronLeft size={17} />
      </NavLink>
    </article>
  );
}

/* =========================================
   PLACEHOLDER PAGES
   These pages will be connected to their
   real features in the next implementation steps.
========================================= */

const pageContent = {
  "/profile": {
    icon: UserRound,
    title: "ملفي الشخصي",
    description: "هنا هتقدر تشوف بيانات حسابك وشخصيتك وتقدمك.",
  },
  "/languages": {
    icon: BookOpen,
    title: "لغات البرمجة",
    description: "اختار Python أو JavaScript أو C++ وابدأ التعلم.",
  },
  "/playground": {
    icon: Code2,
    title: "ساحة الأكواد",
    description: "مساحة كتابة وتشغيل الأكواد البرمجية.",
  },
  "/games": {
    icon: Gamepad2,
    title: "الألعاب",
    description: "ألعاب تعليمية تفاعلية لتطوير مهاراتك البرمجية.",
  },
  "/projects": {
    icon: FolderKanban,
    title: "مشاريعي",
    description: "هنا هتلاقي مشاريعك وتحفظ إنجازاتك.",
  },
  "/achievements": {
    icon: Trophy,
    title: "إنجازاتي",
    description: "تابع الشارات والإنجازات اللي حققتها.",
  },
  "/settings": {
    icon: Settings,
    title: "الإعدادات",
    description: "إدارة إعدادات المنصة وحسابك.",
  },
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
        جاري تجهيز هذه الصفحة
      </span>
    </section>
  );
}

function LoginPage() {
  return (
    <div className="login-placeholder" dir="rtl">
      <div className="login-placeholder-icon">
        <Rocket size={35} />
      </div>

      <h1>Cody Academy</h1>
      <p>
        صفحة تسجيل الدخول سيتم ربطها بخدمة Firebase Authentication
        في مرحلة إعداد الحسابات.
      </p>

      <NavLink to="/" className="primary-button">
        العودة للرئيسية
      </NavLink>
    </div>
  );
}

/* =========================================
   APP ROUTES
========================================= */

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        {Object.entries(pageContent).map(([path, page]) => (
          <Route
            key={path}
            path={path.slice(1)}
            element={<PlaceholderPage page={page} />}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
