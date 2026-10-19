import re

# 1. إضافة زرار الإعدادات في صفحة الملف الشخصي (profile.html)
if os.path.exists('profile.html'):
    with open('profile.html', 'r', encoding='utf-8') as f:
        prof = f.read()

    # بنحط أيقونة الترس جنب العنوان
    old_header = '<div class="header"><a href="languages.html" class="btn-back">← رجوع</a><h1>الملف الشخصي</h1></div>'
    new_header = '<div class="header"><a href="languages.html" class="btn-back">← رجوع</a><h1>الملف الشخصي</h1><a href="settings.html" style="color:var(--primary); font-size:1.5rem;"><i class="ri-settings-4-line"></i></a></div>'
    
    if old_header in prof:
        prof = prof.replace(old_header, new_header)
    else:
        # طريقة بديلة لو الهيدر متغير
        prof = prof.replace('<h1>الملف الشخصي</h1>', '<h1>الملف الشخصي</h1><a href="settings.html" style="color:var(--primary); font-size:1.5rem;"><i class="ri-settings-4-line"></i></a>')

    with open('profile.html', 'w', encoding='utf-8') as f:
        f.write(prof)
    print("✅ تم إضافة زرار الإعدادات في صفحة الملف الشخصي.")

# 2. إضافة زرار الإعدادات في لوحة التحكم (dashboard.html)
if os.path.exists('dashboard.html'):
    with open('dashboard.html', 'r', encoding='utf-8') as f:
        dash = f.read()

    # هنضيف أيقونة الترس جنب شريط النقاط (XP) فوق
    # بندور على الكود اللي فيه شريط النقاط
    target = '<div class="stat-item" style="border-color: var(--primary); color: var(--primary);"><i class="ri-medal-fill"></i> مستوى <span id="nav-level">1</span></div>'
    replacement = target + '<a href="settings.html" style="color:var(--text-muted); font-size:1.5rem; margin-right:10px;"><i class="ri-settings-4-line"></i></a>'
    
    if target in dash:
        dash = dash.replace(target, replacement)
    else:
        # لو الكود مختلف، نضيفها في الهيدر
        dash = dash.replace('</header>', '<a href="settings.html" style="color:var(--text-muted); font-size:1.5rem; margin-right:10px;"><i class="ri-settings-4-line"></i></a></header>')

    with open('dashboard.html', 'w', encoding='utf-8') as f:
        f.write(dash)
    print("✅ تم إضافة زرار الإعدادات في لوحة التحكم.")
