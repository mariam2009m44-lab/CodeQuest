/**
 * CodeQuest Curriculum Loader
 * المصدر الوحيد للحقيقة هو ملفات الـ JSON الخارجية
 */

const CURRICULUM_FILES = {
    javascript: 'js_curriculum.json',
    python: 'python_curriculum.json',
    cpp: 'cpp_curriculum.json'
};

/**
 * دالة غير متزامنة لتحميل المنهج حسب اللغة
 * @param {string} language - 'javascript' | 'python' | 'cpp'
 * @returns {Promise<Object|null>} - بيانات المنهج
 */
async function loadCurriculum(language) {
    const file = CURRICULUM_FILES[language];
    
    if (!file) {
        console.error('❌ اللغة غير مدعومة:', language);
        return null;
    }

    try {
        // جلب الملف من السيرفر
        const response = await fetch(file);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ تم تحميل منهج ${language} بنجاح`);
        return data;
        
    } catch (error) {
        console.error(`❌ فشل تحميل منهج ${language}:`, error);
        return null;
    }
}

// تصدير الدالة عشان الصفحات التانية تستخدمها
window.CodeQuestCurriculum = {
    loadCurriculum
};
