import { useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  Home,
  UserRound,
  Code2,
  Gamepad2,
  FolderKanban,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Rocket,
  Star,
  Coins,
  Flame,
  BookOpen,
  Bot,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

/* =====================================
   بيانات لغات البرمجة والشعارات الأصلية
===================================== */

const languages = [
  {
    name: "Python",
    description: "ابدأ رحلتك مع لغة البرمجة Python",
    progress: 0,
    logo: "https://cdn.simpleicons.org/python/3776AB",
    color: "python",
    path: "/languages",
  },
  {
    name: "JavaScript",
    description: "تعلم بناء المواقع والتطبيقات",
    progress: 0,
    logo: "https://cdn.simpleicons.org/javascript/F7DF1E",
    color: "javascript",
    path: "/languages",
  },
  {
    name: "C++",
    description: "اكتشف أساسيات البرمجة المتقدمة",
    progress: 0,
    logo: "https://cdn.simpleicons.org/cplusplus/00599C",
    color: "cpp",
    path: "/languages",
  },
];

/* =====================================
   روابط القائمة
===================================== */

const navigation = [
  { label: "الرئيسية", path: "/", icon: Home },
  { label: "ملفي الشخصي", path: "/profile", icon: UserRound },
  { label: "لغات البرمجة", path: "/languages", icon: Code2 },
  { label: "ساحة الأكواد", path: "/playground", icon: BookOpen },
  { label: "الألعاب", path: "/games", icon: Gamepad2 },
  { label: "مشاريعي", path: "/projects", icon: FolderKanban },
  { label: "إنجازاتي", path: "/achievements", icon: Trophy },
  { label: "الإعدادات", path: "/settings", icon: Settings },
];

/* =====================================
   القائمة الجانبية
===================================== */

function Sidebar({ onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Rocket size={25} />
        </div>

        <div>
          <h2>Cody Academy</h2>
          <span>رحلتك في عالم البرمجة</span>
        </div>
      </div>

      <div className="sidebar-section-title">
        القائمة الرئيسية
      </div>

      <nav className="sidebar-navigation">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />

              <span>{item.label}</span>

              <ChevronLeft
                size={15}
                className="nav-arrow"
              />
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-cody">
          <div className="cody-small-icon">
            <Bot size={25} />
          </div>

          <div>
            <strong>كودي معاك!</strong>
            <p>مستعد يساعدك تتعلم</p>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            alert(
              "سيتم ربط تسجيل الخروج بنظام Firebase في مرحلة المصادقة."
            );
          }}
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}

/* =====================================
   قائمة الموبايل السفلية
===================================== */

function MobileNavigation() {
  return (
    <nav className="mobile-navigation">
      {navigation.slice(0, 5).map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `mobile-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* =====================================
   الهيدر
===================================== */

function Header({ onMenuClick }) {
  const location = useLocation();

  const currentPage =
    navigation.find(
      (item) => item.path === location.pathname
    )?.label || "Cody Academy";

  return (
    <header className="app-header">
      <button
        className="mobile-menu-button"
        onClick={onMenuClick}
        aria-label="فتح القائمة"
      >
        <Menu size={23} />
      </button>

      <div className="header-title">
        <span>مساحتك التعليمية</span>
        <h1>{currentPage}</h1>
      </div>

      <div className="header-user">
        <div className="header-user-info">
          <strong>بطل البرمجة</strong>
          <span>المستكشف الصغير</span>
        </div>

        <div className="header-avatar">
          <Rocket size={23} />
        </div>
      </div>
    </header>
  );
}

/* =====================================
   بطاقات الإحصائيات
===================================== */

function StatCard({
  icon: Icon,
  title,
  value,
  detail,
  color,
}) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-icon">
        <Icon size={23} />
      </div>

      <div className="stat-content">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

/* =====================================
   عنوان الأقسام
===================================== */

function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

/* =====================================
   شعار لغة البرمجة
===================================== */

function LanguageLogo({ language }) {
  return (
    <div className={`course-logo ${language.color}`}>
      <img
        src={language.logo}
        alt={`${language.name} official logo`}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

/* =====================================
   كارت لغة البرمجة
===================================== */

function LanguageCard({ language }) {
  return (
    <article
      className={`course-card ${language.color}`}
    >
      <div className="course-card-top">
        <LanguageLogo language={language} />

        <span className="course-level">
          مبتدئ
        </span>
      </div>

      <h3>{language.name}</h3>

      <p>{language.description}</p>

      <div className="progress-label">
        <span>التقدم</span>
        <strong>{language.progress}%</strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${language.progress}%`,
          }}
        />
      </div>

      <NavLink
        to={language.path}
        className="course-button"
      >
        استكشف المنهج
        <ChevronLeft size={17} />
      </NavLink>
    </article>
  );
}

/* =====================================
   الصفحة الرئيسية
===================================== */

function Dashboard() {
  return (
    <div className="page-content">

      <section className="welcome-banner">
        <div className="welcome-text">
          <span className="welcome-label">
            <Sparkles size={15} />
            أهلاً بعودتك!
          </span>

          <h2>
            مستعد لمغامرة برمجية جديدة؟
          </h2>

          <p>
            كل سطر كود بتكتبه بيقربك خطوة
            من إنك تصبح مبرمجًا محترفًا.
          </p>

          <NavLink
            to="/languages"
            className="primary-button"
          >
            ابدأ التعلم
            <ChevronLeft size={18} />
          </NavLink>
        </div>

        <div className="welcome-illustration">
          <div className="welcome-orbit orbit-one" />
          <div className="welcome-orbit orbit-two" />

          <div className="welcome-rocket">
            🚀
          </div>

          <Star
            className="welcome-star star-one"
            size={22}
          />

          <Star
            className="welcome-star star-two"
            size={16}
          />
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={Coins}
          title="النقاط"
          value="0"
          detail="اجمع نقاطًا بالتعلم"
          color="purple"
        />

        <StatCard
          icon={Flame}
          title="أيام الاستمرار"
          value="0"
          detail="ابدأ سلسلة تعلمك"
          color="orange"
        />

        <StatCard
          icon={Trophy}
          title="المستوى"
          value="1"
          detail="المستكشف المبتدئ"
          color="blue"
        />

        <StatCard
          icon={FolderKanban}
          title="المشاريع"
          value="0"
          detail="مشاريعك المكتملة"
          color="green"
        />
      </section>

      <section className="content-section">
        <SectionTitle
          title="مسارات التعلم"
          subtitle="اختار اللغة اللي تحب تبدأ بيها"
        />

        <div className="courses-grid">
          {languages.map((language) => (
            <LanguageCard
              key={language.name}
              language={language}
            />
          ))}
        </div>
      </section>

      <section className="cody-tip-card">
        <div className="cody-tip-icon">
          <Bot size={32} />
        </div>

        <div>
          <span>رسالة من كودي</span>

          <h3>
            كل مبرمج عظيم بدأ بأول سطر كود!
          </h3>

          <p>
            خد وقتك في التعلم، وجرب بنفسك،
            ومتخافش من الأخطاء.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =====================================
   الملف الشخصي
===================================== */

function Profile() {
  return (
    <div className="page-content">
      <SectionTitle
        title="ملفي الشخصي"
        subtitle="تابع معلوماتك وإنجازاتك التعليمية"
      />

      <section className="profile-card">
        <div className="profile-avatar">
          🚀
        </div>

        <h2>بطل البرمجة</h2>

        <p>المستكشف الصغير</p>

        <div className="profile-details">
          <div>
            <span>المستوى</span>
            <strong>1</strong>
          </div>

          <div>
            <span>النقاط</span>
            <strong>0</strong>
          </div>

          <div>
            <span>المشاريع</span>
            <strong>0</strong>
          </div>
        </div>

        <p className="info-notice">
          بيانات الحساب والتقدم ستُحمّل من Firebase
          بعد ربط خدمة الحسابات.
        </p>
      </section>
    </div>
  );
}

/* =====================================
   صفحة لغات البرمجة
===================================== */

function Languages() {
  return (
    <div className="page-content">
      <SectionTitle
        title="لغات البرمجة"
        subtitle="اختار مسارك وابدأ أول مغامرة"
      />

      <div className="courses-grid">
        {languages.map((language) => (
          <LanguageCard
            key={language.name}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

/* =====================================
   محرر الأكواد
===================================== */

function Playground() {
  const [code, setCode] = useState(
    'print("Hello, Cody!")'
  );

  return (
    <div className="page-content">
      <SectionTitle
        title="ساحة الأكواد"
        subtitle="اكتب وجرب أفكارك البرمجية"
      />

      <section className="editor-card">
        <div className="editor-toolbar">
          <span>
            <Code2 size={18} />
            Python
          </span>

          <span className="editor-status">
            مساحة تجريبية
          </span>
        </div>

        <textarea
          className="code-editor"
          value={code}
          onChange={(event) =>
            setCode(event.target.value)
          }
          spellCheck="false"
          dir="ltr"
          aria-label="محرر الأكواد"
        />

        <div className="editor-footer">
          <span>
            المحرر الحالي للتجهيز فقط
          </span>

          <button
            className="primary-button"
            onClick={() =>
              alert(
                "سيتم ربط تشغيل الأكواد بخدمة التنفيذ الآمنة لاحقًا."
              )
            }
          >
            تشغيل الكود
          </button>
        </div>
      </section>
    </div>
  );
}

/* =====================================
   صفحة الألعاب
===================================== */

function Games() {
  const games = [
    {
      emoji: "🧩",
      title: "متاهة الأكواد",
      description:
        "ساعد كودي يوصل للهدف باستخدام التفكير المنطقي.",
    },
    {
      emoji: "🌌",
      title: "مهمة الفضاء",
      description:
        "اكتشف الطريق الصحيح خلال تحديات البرمجة.",
    },
    {
      emoji: "💎",
      title: "اجمع الكنوز",
      description:
        "حل التحديات واجمع الكنوز في مغامرتك.",
    },
  ];

  return (
    <div className="page-content">
      <SectionTitle
        title="عالم الألعاب"
        subtitle="تعلم البرمجة من خلال المغامرات والتحديات"
      />

      <div className="games-grid">
        {games.map((game) => (
          <article
            className="game-card"
            key={game.title}
          >
            <div className="game-emoji">
              {game.emoji}
            </div>

            <h3>{game.title}</h3>

            <p>{game.description}</p>

            <span className="coming-soon">
              <LockKeyhole size={14} />
              قيد التجهيز
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

/* =====================================
   صفحة المشاريع
===================================== */

function Projects() {
  return (
    <div className="page-content">
      <SectionTitle
        title="مشاريعي"
        subtitle="هنا هتلاقي المشاريع اللي بتبنيها أثناء التعلم"
      />

      <div className="empty-state">
        <FolderKanban size={42} />

        <h3>لسه مفيش مشاريع</h3>

        <p>
          ابدأ التعلم وأنشئ أول مشروع برمجي ليك.
        </p>

        <NavLink
          to="/languages"
          className="primary-button"
        >
          استكشف اللغات
        </NavLink>
      </div>
    </div>
  );
}

/* =====================================
   صفحة الإنجازات
===================================== */

function Achievements() {
  return (
    <div className="page-content">
      <SectionTitle
        title="إنجازاتي"
        subtitle="كل خطوة صغيرة تستحق التقدير"
      />

      <div className="empty-state">
        <Trophy size={42} />

        <h3>إنجازاتك في انتظارك!</h3>

        <p>
          أكمل الدروس والتحديات لفتح شارات جديدة.
        </p>
      </div>
    </div>
  );
}

/* =====================================
   الإعدادات
===================================== */

function SettingsPage() {
  return (
    <div className="page-content">
      <SectionTitle
        title="الإعدادات"
        subtitle="إعدادات حسابك وتجربتك التعليمية"
      />

      <div className="settings-card">
        <div className="settings-row">
          <div>
            <strong>الحساب</strong>
            <p>إدارة بيانات حسابك</p>
          </div>

          <UserRound size={21} />
        </div>

        <div className="settings-row">
          <div>
            <strong>المظهر</strong>
            <p>Cody Academy</p>
          </div>

          <Sparkles size={21} />
        </div>

        <div className="settings-row">
          <div>
            <strong>المساعدة</strong>
            <p>معلومات عن المنصة</p>
          </div>

          <Bot size={21} />
        </div>
      </div>
    </div>
  );
}

/* =====================================
   صفحة غير موجودة
===================================== */

function NotFound() {
  return (
    <div className="empty-state">
      <h2>الصفحة مش موجودة</h2>

      <NavLink
        to="/"
        className="primary-button"
      >
        العودة للرئيسية
      </NavLink>
    </div>
  );
}

/* =====================================
   التطبيق الرئيسي
===================================== */

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <div className="app-shell" dir="rtl">

      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="إغلاق القائمة"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      <Sidebar
        onNavigate={() =>
          setMobileMenuOpen(false)
        }
      />

      <div
        className={`mobile-sidebar ${
          mobileMenuOpen
            ? "mobile-sidebar-open"
            : ""
        }`}
      >
        <div className="mobile-sidebar-header">
          <strong>Cody Academy</strong>

          <button
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="إغلاق القائمة"
          >
            <X size={22} />
          </button>
        </div>

        <Sidebar
          onNavigate={() =>
            setMobileMenuOpen(false)
          }
        />
      </div>

      <main className="main-area">
        <Header
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
        />

        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/languages"
            element={<Languages />}
          />

          <Route
            path="/playground"
            element={<Playground />}
          />

          <Route
            path="/games"
            element={<Games />}
          />

          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/achievements"
            element={<Achievements />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>

      <MobileNavigation />
    </div>
  );
}