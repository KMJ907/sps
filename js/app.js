"use strict";

/*
 * StudyPlanService
 * Version 2
 */

const STORAGE_KEY = "sps_data_v4";
const THEME_KEY = "sps_theme";
const NOTIFICATION_KEY = "sps_notifications";

let deferredInstallPrompt = null;

let state = {
    courses: [],
    plans: []
};


/* =========================================================
   BASIC UTILITIES
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}

function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}

function todayString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
    });
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   STORAGE
========================================================= */

function saveState() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
}

function loadState() {

    const raw =
        localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        state = {
            courses: [],
            plans: []
        };

        return;
    }

    try {

        const parsed = JSON.parse(raw);

        state = {
            courses: Array.isArray(parsed.courses)
                ? parsed.courses
                : [],

            plans: Array.isArray(parsed.plans)
                ? parsed.plans
                : []
        };

    } catch {

        state = {
            courses: [],
            plans: []
        };
    }
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(THEME_KEY);

    if (theme === "dark") {
        document.body.classList.add("dark");
        $("#themeBtn").textContent = "☀️";
    }
}

function toggleTheme() {

    const isDark =
        document.body.classList.toggle("dark");

    localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
    );

    $("#themeBtn").textContent =
        isDark ? "☀️" : "🌙";
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const totalCourses =
        state.courses.length;

    const completed =
        state.courses.reduce(
            (sum, course) =>
                sum + Number(course.completed || 0),
            0
        );

    const totalLectures =
        state.courses.reduce(
            (sum, course) =>
                sum + Number(course.total || 0),
            0
        );

    const average =
        totalLectures === 0
            ? 0
            : Math.round(
                completed /
                totalLectures *
                100
            );

    const todayCount =
        state.plans.filter(
            plan =>
                plan.date === todayString()
        ).length;

    $("#totalCourses").textContent =
        totalCourses;

    $("#completedLectures").textContent =
        completed;

    $("#averageProgress").textContent =
        `${average}%`;

    $("#todayPlanCount").textContent =
        `${todayCount}개`;
}


/* =========================================================
   COURSE
========================================================= */

function renderSubjects() {

    const filter =
        $("#subjectFilter");

    const current =
        filter.value;

    const subjects = [
        ...new Set(
            state.courses
                .map(course => course.subject)
                .filter(Boolean)
        )
    ];

    filter.innerHTML =
        `<option value="all">전체 과목</option>` +
        subjects
            .sort()
            .map(
                subject =>
                    `<option value="${escapeHTML(subject)}">
                        ${escapeHTML(subject)}
                    </option>`
            )
            .join("");

    if (
        subjects.includes(current)
    ) {
        filter.value = current;
    }
}

function getProgress(course) {

    const total =
        Number(course.total || 0);

    const completed =
        Number(course.completed || 0);

    if (total <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            completed / total * 100
        )
    );
}

function renderCourses() {

    const container =
        $("#courseList");

    const search =
        $("#courseSearch").value
            .trim()
            .toLowerCase();

    const subject =
        $("#subjectFilter").value;

    const courses =
        state.courses.filter(course => {

            const matchesSearch =
                !search ||
                course.name
                    .toLowerCase()
                    .includes(search) ||
                String(course.teacher || "")
                    .toLowerCase()
                    .includes(search);

            const matchesSubject =
                subject === "all" ||
                course.subject === subject;

            return (
                matchesSearch &&
                matchesSubject
            );
        });

    $("#emptyCourses")
        .classList.toggle(
            "hidden",
            courses.length !== 0
        );

    container.innerHTML =
        courses.map(course => {

            const progress =
                getProgress(course);

            return `
                <article class="course-card">

                    <div class="course-top">

                        <span class="course-subject">
                            ${escapeHTML(course.subject)}
                        </span>

                        <button
                            class="course-delete"
                            data-course-delete="${course.id}"
                            title="삭제">
                            ⋮
                        </button>

                    </div>

                    <h3>
                        ${escapeHTML(course.name)}
                    </h3>

                    <div class="course-teacher">
                        ${course.teacher
                            ? escapeHTML(course.teacher)
                            : "강사 정보 없음"}
                    </div>

                    <div class="progress-wrap">

                        <div class="progress-label">

                            <span>진도율</span>

                            <strong>
                                ${progress}%
                            </strong>

                        </div>

                        <div class="progress">
                            <div
                                class="progress-bar"
                                style="width:${progress}%">
                            </div>
                        </div>

                    </div>

                    <div class="course-footer">

                        <small>
                            ${course.completed || 0}
                            /
                            ${course.total || 0}
                            강
                        </small>

                        <button
                            data-course="${course.id}">
                            상세 보기 →
                        </button>

                    </div>

                </article>
            `;
        }).join("");
}


/* =========================================================
   COURSE DETAIL
========================================================= */

function openCourseDetail(id) {

    const course =
        state.courses.find(
            item => item.id === id
        );

    if (!course) return;

    $("#detailCourseName").textContent =
        course.name;

    const progress =
        getProgress(course);

    $("#courseDetailContent").innerHTML = `

        <div class="progress-wrap">

            <div class="progress-label">
                <span>현재 진도</span>
                <strong>${progress}%</strong>
            </div>

            <div class="progress">
                <div
                    class="progress-bar"
                    style="width:${progress}%">
                </div>
            </div>

        </div>

        <div style="margin-top:20px">

            <label>
                완료 강의 수
                <input
                    id="detailCompleted"
                    type="number"
                    min="0"
                    max="${course.total}"
                    value="${course.completed || 0}">
            </label>

        </div>

        <button
            id="saveCourseProgress"
            class="primary-button full-width">
            진도 저장
        </button>
    `;

    openModal("courseDetailModal");

    $("#saveCourseProgress")
        .onclick = () => {

            let completed =
                Number(
                    $("#detailCompleted").value
                );

            completed =
                Math.max(
                    0,
                    Math.min(
                        course.total,
                        completed
                    )
                );

            course.completed =
                completed;

            saveState();

            renderAll();

            closeModal(
                "courseDetailModal"
            );

            showToast(
                "강좌 진도가 저장되었습니다."
            );
        };
}


/* =========================================================
   PLAN
========================================================= */

function renderTodayPlan() {

    const date =
        todayString();

    const plans =
        state.plans
            .filter(
                plan => plan.date === date
            )
            .sort(
                (a, b) =>
                    Number(a.completed) -
                    Number(b.completed)
            );

    $("#todayModalDate").textContent =
        formatDate(date);

    $("#todayEmpty")
        .classList.toggle(
            "hidden",
            plans.length !== 0
        );

    $("#todayPlanList").innerHTML =
        plans.map(plan => `

            <div
                class="today-plan ${
                    plan.completed
                        ? "completed"
                        : ""
                }">

                <input
                    class="plan-check"
                    type="checkbox"
                    ${plan.completed ? "checked" : ""}
                    data-plan-check="${plan.id}">

                <div class="today-plan-content">

                    <strong>
                        ${escapeHTML(plan.title)}
                    </strong>

                    <small>
                        ${escapeHTML(
                            plan.subject || "일반"
                        )}
                        ·
                        ${plan.minutes || 0}분
                    </small>

                </div>

                <button
                    class="modal-close"
                    data-plan-delete="${plan.id}">
                    ×
                </button>

            </div>

        `).join("");
}

function renderWeek() {

    const container =
        $("#weekPlan");

    const base =
        new Date();

    const day =
        base.getDay();

    const mondayOffset =
        day === 0 ? -6 : 1 - day;

    container.innerHTML = "";

    const names = [
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
        "일"
    ];

    for (let i = 0; i < 7; i++) {

        const date =
            new Date(base);

        date.setDate(
            base.getDate() +
            mondayOffset +
            i
        );

        const dateString =
            date.toISOString()
                .slice(0, 10);

        const plans =
            state.plans.filter(
                plan =>
                    plan.date ===
                    dateString
            );

        const card =
            document.createElement("div");

        card.className =
            "day-card" +
            (
                dateString === todayString()
                    ? " today"
                    : ""
            );

        card.innerHTML = `

            <div class="day-name">
                ${names[i]}요일
            </div>

            <div class="day-date">
                ${date.getMonth() + 1}/${date.getDate()}
            </div>

            <div class="day-plan">

                ${
                    plans.length
                        ? plans.map(
                            plan => `
                                <div
                                    class="mini-plan ${
                                        plan.completed
                                            ? "done"
                                            : ""
                                    }">
                                    ${escapeHTML(
                                        plan.title
                                    )}
                                </div>
                            `
                        ).join("")
                        : `
                            <div
                                style="
                                    color:var(--muted);
                                    font-size:11px;
                                    margin-top:15px;
                                ">
                                계획 없음
                            </div>
                        `
                }

            </div>
        `;

        container.appendChild(card);
    }
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    const modal = $(`#${id}`);

    if (modal) {
        modal.classList.remove("hidden");
    }
}

function closeModal(id) {
    const modal = $(`#${id}`);

    if (modal) {
        modal.classList.add("hidden");
    }
}

function closeAllModals() {
    $$(".modal").forEach(
        modal =>
            modal.classList.add("hidden")
    );
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(message) {

    const toast =
        $("#toast");

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(
            () =>
                toast.classList.remove(
                    "show"
                ),
            2500
        );
}


/* =========================================================
   BACKUP
========================================================= */

function backupData() {

    const data = {
        version: 4,
        exportedAt:
            new Date().toISOString(),
        ...state
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        `sps-backup-${todayString()}.json`;

    a.click();

    URL.revokeObjectURL(url);

    showToast(
        "데이터를 백업했습니다."
    );
}

function restoreData(file) {

    const reader =
        new FileReader();

    reader.onload = event => {

        try {

            const data =
                JSON.parse(
                    event.target.result
                );

            if (
                !Array.isArray(
                    data.courses
                ) ||
                !Array.isArray(
                    data.plans
                )
            ) {
                throw new Error(
                    "invalid"
                );
            }

            state = {
                courses:
                    data.courses,
                plans:
                    data.plans
            };

            saveState();

            renderAll();

            showToast(
                "데이터를 복원했습니다."
            );

        } catch {

            alert(
                "올바른 SPS 백업 파일이 아닙니다."
            );
        }
    };

    reader.readAsText(file);
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function getNotificationEnabled() {

    return (
        localStorage.getItem(
            NOTIFICATION_KEY
        ) === "true"
    );
}

function setNotificationEnabled(value) {

    localStorage.setItem(
        NOTIFICATION_KEY,
        String(value)
    );
}

async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        alert(
            "이 브라우저는 알림 기능을 지원하지 않습니다."
        );

        return false;
    }

    const permission =
        await Notification.requestPermission();

    if (permission !== "granted") {

        showToast(
            "알림 권한이 허용되지 않았습니다."
        );

        return false;
    }

    return true;
}

async function enableNotifications() {

    const granted =
        await requestNotificationPermission();

    if (!granted) {

        $("#notificationToggle").checked =
            false;

        setNotificationEnabled(false);

        return;
    }

    setNotificationEnabled(true);

    $("#notificationToggle").checked =
        true;

    showToast(
        "매일 오전 7시 알림을 활성화했습니다."
    );

    scheduleNextMorningCheck();
}

function disableNotifications() {

    setNotificationEnabled(false);

    $("#notificationToggle").checked =
        false;

    showToast(
        "아침 알림을 비활성화했습니다."
    );
}


/* =========================================================
   7 AM CHECK
========================================================= */

function notificationKeyForToday() {

    return `sps_morning_${todayString()}`;
}

async function sendTodayNotification() {

    if (
        !("serviceWorker" in navigator)
    ) {
        return;
    }

    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const registration =
        await navigator.serviceWorker.ready;

    const count =
        state.plans.filter(
            plan =>
                plan.date === todayString()
        ).length;

    await registration.showNotification(
        "StudyPlanService",
        {
            body:
                "오늘의 계획을 확인하세요!",
            icon:
                "image/icon-192.png",
            badge:
                "image/icon-192.png",
            tag:
                "sps-morning-plan",
            renotify: true,
            data: {
                url:
                    "./?showToday=true"
            }
        }
    );
}

async function checkMorningNotification() {

    if (
        !getNotificationEnabled()
    ) {
        return;
    }

    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }

    const now =
        new Date();

    const minutes =
        now.getHours() * 60 +
        now.getMinutes();

    /*
     * 오전 7시 이후에 앱이 실행되었다면
     * 오늘 알림을 아직 보내지 않은 경우
     * 한 번 표시한다.
     */

    if (minutes < 7 * 60) {
        return;
    }

    const key =
        notificationKeyForToday();

    if (
        localStorage.getItem(key) === "sent"
    ) {
        return;
    }

    localStorage.setItem(
        key,
        "sent"
    );

    await sendTodayNotification();
}

function scheduleNextMorningCheck() {

    const now =
        new Date();

    const next =
        new Date(now);

    next.setHours(7, 0, 0, 0);

    if (next <= now) {
        next.setDate(
            next.getDate() + 1
        );
    }

    const delay =
        next.getTime() -
        now.getTime();

    setTimeout(
        async () => {

            await checkMorningNotification();

            scheduleNextMorningCheck();

        },
        Math.min(
            delay,
            2147483647
        )
    );
}


/* =========================================================
   NOTIFICATION CLICK RESULT
========================================================= */

function checkNotificationLaunch() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    if (
        params.get("showToday") ===
        "true"
    ) {

        /*
         * 앱 초기 렌더링이 끝난 뒤
         * 오늘의 계획 팝업을 연다.
         */

        setTimeout(
            () => {

                renderTodayPlan();

                openModal(
                    "todayModal"
                );

                history.replaceState(
                    {},
                    "",
                    window.location.pathname
                );

            },
            350
        );
    }
}


/* =========================================================
   PWA INSTALL
========================================================= */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredInstallPrompt =
            event;

        $("#installBtn")
            .classList.remove(
                "hidden"
            );
    }
);

window.addEventListener(
    "appinstalled",
    () => {

        deferredInstallPrompt =
            null;

        $("#installBtn")
            .classList.add(
                "hidden"
            );

        showToast(
            "StudyPlanService가 설치되었습니다."
        );
    }
);

async function installApp() {

    if (!deferredInstallPrompt) {

        showToast(
            "브라우저 메뉴에서 앱 설치를 선택할 수 있습니다."
        );

        return;
    }

    deferredInstallPrompt.prompt();

    await deferredInstallPrompt
        .userChoice;

    deferredInstallPrompt =
        null;

    $("#installBtn")
        .classList.add(
            "hidden"
        );
}


/* =========================================================
   SERVICE WORKER
========================================================= */

async function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {
        return;
    }

    try {

        await navigator.serviceWorker.register(
            "./sw.js"
        );

    } catch (error) {

        console.error(
            "Service Worker registration failed:",
            error
        );
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

    $("#themeBtn").onclick =
        toggleTheme;

    $("#todayPlanBtn").onclick =
        () => {

            renderTodayPlan();

            openModal(
                "todayModal"
            );
        };

    $("#addCourseBtn").onclick =
        () =>
            openModal(
                "courseModal"
            );

    $("#addPlanBtn").onclick =
        () => {

            $("#planDate").value =
                todayString();

            openModal(
                "planModal"
            );
        };

    $("#backupBtn").onclick =
        backupData;

    $("#restoreBtn").onclick =
        () =>
            $("#restoreFile").click();

    $("#restoreFile").onchange =
        event => {

            const file =
                event.target.files[0];

            if (file) {
                restoreData(file);
            }

            event.target.value = "";
        };

    $("#settingsBtn").onclick =
        () =>
            openModal(
                "settingsModal"
            );

    $("#notificationBtn").onclick =
        () =>
            openModal(
                "notificationModal"
            );

    $("#settingsNotification").onclick =
        () => {

            closeModal(
                "settingsModal"
            );

            $("#notificationToggle").checked =
                getNotificationEnabled();

            openModal(
                "notificationModal"
            );
        };

    $("#settingsBackup").onclick =
        () => {

            backupData();

            closeModal(
                "settingsModal"
            );
        };

    $("#settingsReset").onclick =
        () => {

            const confirmed =
                confirm(
                    "모든 강좌와 학습 계획을 삭제할까요?\n이 작업은 되돌릴 수 없습니다."
                );

            if (!confirmed) {
                return;
            }

            state = {
                courses: [],
                plans: []
            };

            saveState();

            renderAll();

            closeModal(
                "settingsModal"
            );

            showToast(
                "모든 데이터가 삭제되었습니다."
            );
        };

    $("#notificationToggle").onchange =
        event => {

            if (event.target.checked) {
                enableNotifications();
            } else {
                disableNotifications();
            }
        };

    $("#testNotificationBtn").onclick =
        async () => {

            const granted =
                await requestNotificationPermission();

            if (!granted) {
                return;
            }

            await sendTodayNotification();

            showToast(
                "테스트 알림을 보냈습니다."
            );
        };

    $("#installBtn").onclick =
        installApp;

    $("#courseSearch").oninput =
        renderCourses;

    $("#subjectFilter").onchange =
        renderCourses;


    /* COURSE FORM */

    $("#courseForm").onsubmit =
        event => {

            event.preventDefault();

            const course = {

                id:
                    uid("course"),

                name:
                    $("#courseName")
                        .value
                        .trim(),

                subject:
                    $("#courseSubject")
                        .value
                        .trim(),

                teacher:
                    $("#courseTeacher")
                        .value
                        .trim(),

                total:
                    Number(
                        $("#courseTotal")
                            .value
                    ),

                completed: 0
            };

            state.courses.push(
                course
            );

            saveState();

            renderAll();

            event.target.reset();

            $("#courseTotal").value =
                20;

            closeModal(
                "courseModal"
            );

            showToast(
                "강좌가 추가되었습니다."
            );
        };


    /* PLAN FORM */

    $("#planForm").onsubmit =
        event => {

            event.preventDefault();

            const plan = {

                id:
                    uid("plan"),

                title:
                    $("#planTitle")
                        .value
                        .trim(),

                date:
                    $("#planDate")
                        .value,

                subject:
                    $("#planSubject")
                        .value
                        .trim(),

                minutes:
                    Number(
                        $("#planMinutes")
                            .value
                    ),

                completed: false
            };

            state.plans.push(
                plan
            );

            saveState();

            renderAll();

            event.target.reset();

            $("#planDate").value =
                todayString();

            closeModal(
                "planModal"
            );

            showToast(
                "학습 계획이 추가되었습니다."
            );
        };


    /* DYNAMIC BUTTONS */

    document.addEventListener(
        "click",
        event => {

            const courseButton =
                event.target.closest(
                    "[data-course]"
                );

            if (courseButton) {

                openCourseDetail(
                    courseButton
                        .dataset
                        .course
                );

                return;
            }

            const deleteCourse =
                event.target.closest(
                    "[data-course-delete]"
                );

            if (deleteCourse) {

                const id =
                    deleteCourse
                        .dataset
                        .courseDelete;

                if (
                    confirm(
                        "이 강좌를 삭제할까요?"
                    )
                ) {

                    state.courses =
                        state.courses.filter(
                            course =>
                                course.id !== id
                        );

                    saveState();

                    renderAll();

                    showToast(
                        "강좌가 삭제되었습니다."
                    );
                }

                return;
            }

            const checkPlan =
                event.target.closest(
                    "[data-plan-check]"
                );

            if (checkPlan) {

                const plan =
                    state.plans.find(
                        item =>
                            item.id ===
                            checkPlan
                                .dataset
                                .planCheck
                    );

                if (plan) {

                    plan.completed =
                        checkPlan.checked;

                    saveState();

                    renderAll();

                    renderTodayPlan();
                }

                return;
            }

            const deletePlan =
                event.target.closest(
                    "[data-plan-delete]"
                );

            if (deletePlan) {

                state.plans =
                    state.plans.filter(
                        plan =>
                            plan.id !==
                            deletePlan
                                .dataset
                                .planDelete
                    );

                saveState();

                renderAll();

                renderTodayPlan();

                return;
            }

            const closeButton =
                event.target.closest(
                    "[data-close]"
                );

            if (closeButton) {

                closeModal(
                    closeButton
                        .dataset
                        .close
                );
            }

        }
    );


    /* MODAL BACKDROP */

    $$(".modal-backdrop")
        .forEach(backdrop => {

            backdrop.onclick = () => {

                const modal =
                    backdrop.closest(
                        ".modal"
                    );

                if (modal) {
                    modal.classList.add(
                        "hidden"
                    );
                }
            };

        });


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {
                closeAllModals();
            }

        }
    );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderSubjects();

    renderCourses();

    renderWeek();

    updateDashboard();

    $("#todayTitle").textContent =
        "오늘도 차근차근 시작해볼까요?";

    $("#todayDate").textContent =
        formatDate(
            todayString()
        );
}


/* =========================================================
   INIT
========================================================= */

async function init() {

    loadState();

    loadTheme();

    setupEvents();

    renderAll();

    $("#notificationToggle").checked =
        getNotificationEnabled();

    $("#planDate").value =
        todayString();

    await registerServiceWorker();

    checkNotificationLaunch();

    await checkMorningNotification();

    scheduleNextMorningCheck();
}

document.addEventListener(
    "DOMContentLoaded",
    init
);