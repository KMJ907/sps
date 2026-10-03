const DAYS = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
  "일"
];

const DAY_NAMES = {
  월: "월요일",
  화: "화요일",
  수: "수요일",
  목: "목요일",
  금: "금요일",
  토: "토요일",
  일: "일요일"
};

const DEFAULT_SUBJECTS = [
  "수학",
  "영어",
  "국어"
];

let subjects =
  JSON.parse(
    localStorage.getItem("subjects_v3")
  ) || DEFAULT_SUBJECTS;

let courses =
  JSON.parse(
    localStorage.getItem("courses_v3")
  ) || [];

let selectedCourseId = null;

let deferredInstallPrompt = null;


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    normalizeData();

    renderSubjectDropdowns();
    renderCourses();
    renderDashboard();
    renderSubjectList();

    updateDate();

    setupInstallButton();

    setupServiceWorker();

    checkMorningNotification();

    setupModalKeyboard();

  }
);


/* =========================================
   DATA NORMALIZATION
========================================= */

function normalizeData() {

  if (!Array.isArray(subjects)) {
    subjects = [...DEFAULT_SUBJECTS];
  }

  if (!Array.isArray(courses)) {
    courses = [];
  }

  courses = courses.map(course => {

    if (!course.id) {
      course.id = Date.now() + Math.random();
    }

    if (!Array.isArray(course.completedEpisodes)) {
      course.completedEpisodes =
        new Array(
          Number(course.totalEp) || 0
        ).fill(false);
    }

    if (!course.plan) {
      course.plan = {};
    }

    DAYS.forEach(day => {

      if (
        typeof course.plan[day] !== "number"
      ) {
        course.plan[day] = 0;
      }

    });

    return course;

  });

  saveToLocalStorage();

}


/* =========================================
   NAVIGATION
========================================= */

function switchTab(tabName) {

  document
    .querySelectorAll(".tab-content")
    .forEach(section => {

      section.classList.remove("active");

    });


  const target =
    document.getElementById(
      `tab-${tabName}`
    );

  if (target) {
    target.classList.add("active");
  }


  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.remove("active");

    });


  document
    .querySelectorAll(".mobile-nav-item")
    .forEach(button => {

      button.classList.remove("active");

    });


  const desktopNav =
    document.getElementById(
      `nav-${tabName}`
    );

  const mobileNav =
    document.getElementById(
      `mobile-nav-${tabName}`
    );


  if (desktopNav) {
    desktopNav.classList.add("active");
  }

  if (mobileNav) {
    mobileNav.classList.add("active");
  }


  updatePageHeader(tabName);


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (tabName === "dashboard") {
    renderDashboard();
  }

  if (tabName === "classroom") {
    renderSubjectDropdowns();
    renderCourses();
  }

  if (tabName === "settings") {
    renderSubjectList();
  }

}


/* =========================================
   PAGE HEADER
========================================= */

function updatePageHeader(tabName) {

  const titles = {

    dashboard: [
      "홈",
      "오늘의 학습을 확인하세요."
    ],

    classroom: [
      "강좌",
      "수강 중인 강좌를 관리하세요."
    ],

    settings: [
      "설정",
      "SPS 환경을 관리하세요."
    ],

    data: [
      "데이터 관리",
      "학습 데이터를 안전하게 관리하세요."
    ]

  };


  const data =
    titles[tabName] ||
    titles.dashboard;


  const title =
    document.getElementById(
      "page-title"
    );

  const subtitle =
    document.getElementById(
      "page-subtitle"
    );


  if (title) {
    title.textContent = data[0];
  }

  if (subtitle) {
    subtitle.textContent = data[1];
  }

}


/* =========================================
   SUBJECT
========================================= */

function addSubject(event) {

  event.preventDefault();


  const input =
    document.getElementById(
      "input-new-subject"
    );


  const name =
    input.value.trim();


  if (!name) {
    return;
  }


  if (subjects.includes(name)) {

    alert(
      "이미 존재하는 과목입니다."
    );

    return;

  }


  subjects.push(name);

  saveToLocalStorage();

  input.value = "";

  renderSubjectList();

  renderSubjectDropdowns();

}


function deleteSubject(subjectName) {

  const used =
    courses.some(
      course =>
        course.subject === subjectName
    );


  let message =
    `'${subjectName}' 과목을 삭제하시겠습니까?`;


  if (used) {

    message +=
      "\n\n현재 이 과목을 사용하는 강좌가 있습니다.";

  }


  if (!confirm(message)) {
    return;
  }


  subjects =
    subjects.filter(
      subject =>
        subject !== subjectName
    );


  saveToLocalStorage();

  renderSubjectList();

  renderSubjectDropdowns();

}


function renderSubjectList() {

  const list =
    document.getElementById(
      "subject-list"
    );


  if (!list) {
    return;
  }


  list.innerHTML = "";


  if (subjects.length === 0) {

    list.innerHTML =
      "<li style='color:#94a3b8;font-size:12px;'>등록된 과목이 없습니다.</li>";

    return;

  }


  subjects.forEach(subject => {

    const li =
      document.createElement("li");

    li.className =
      "subject-tag";


    const span =
      document.createElement("span");

    span.textContent =
      subject;


    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = "×";

    button.onclick = () =>
      deleteSubject(subject);


    li.appendChild(span);

    li.appendChild(button);

    list.appendChild(li);

  });

}


function renderSubjectDropdowns() {

  const select =
    document.getElementById(
      "input-subject"
    );


  if (!select) {
    return;
  }


  const current =
    select.value;


  select.innerHTML =
    `
      <option value="" disabled>
        과목 선택
      </option>
    `;


  subjects.forEach(subject => {

    const option =
      document.createElement(
        "option"
      );

    option.value = subject;

    option.textContent = subject;

    select.appendChild(option);

  });


  if (
    subjects.includes(current)
  ) {

    select.value = current;

  } else {

    select.selectedIndex = 0;

  }

}


/* =========================================
   COURSE
========================================= */

function addCourse(event) {

  event.preventDefault();


  const title =
    document
      .getElementById("input-title")
      .value
      .trim();


  const teacher =
    document
      .getElementById("input-teacher")
      .value
      .trim();


  const subject =
    document
      .getElementById("input-subject")
      .value;


  const totalEp =
    parseInt(
      document
        .getElementById("input-total-ep")
        .value,
      10
    );


  if (
    !title ||
    !teacher ||
    !subject ||
    !totalEp ||
    totalEp < 1
  ) {

    alert(
      "모든 항목을 올바르게 입력해주세요."
    );

    return;

  }


  const newCourse = {

    id:
      Date.now(),

    title,

    teacher,

    subject,

    totalEp,

    completedEpisodes:
      new Array(totalEp).fill(false),

    plan: {

      월: 0,
      화: 0,
      수: 0,
      목: 0,
      금: 0,
      토: 0,
      일: 0

    }

  };


  courses.push(newCourse);

  saveToLocalStorage();


  event.target.reset();


  renderSubjectDropdowns();

  renderCourses();

  renderDashboard();


  alert(
    "강좌가 등록되었습니다."
  );

}


function deleteCourse(id) {

  const course =
    courses.find(
      item =>
        item.id === id
    );


  if (!course) {
    return;
  }


  if (
    !confirm(
      `"${course.title}" 강좌를 삭제하시겠습니까?`
    )
  ) {
    return;
  }


  courses =
    courses.filter(
      item =>
        item.id !== id
    );


  saveToLocalStorage();

  renderCourses();

  renderDashboard();

}


/* =========================================
   COURSE RENDER
========================================= */

function renderCourses() {

  updateFilterOptions();


  const list =
    document.getElementById(
      "course-list"
    );


  if (!list) {
    return;
  }


  const subjectFilter =
    document.getElementById(
      "filter-subject"
    )?.value || "ALL";


  const teacherFilter =
    document.getElementById(
      "filter-teacher"
    )?.value || "ALL";


  const filtered =
    courses.filter(course => {

      const subjectMatch =
        subjectFilter === "ALL" ||
        course.subject === subjectFilter;


      const teacherMatch =
        teacherFilter === "ALL" ||
        course.teacher === teacherFilter;


      return (
        subjectMatch &&
        teacherMatch
      );

    });


  const count =
    document.getElementById(
      "course-count-label"
    );


  if (count) {
    count.textContent =
      `${filtered.length}개`;
  }


  list.innerHTML = "";


  if (filtered.length === 0) {

    list.innerHTML = `
      <div
        style="
          grid-column:1/-1;
          padding:40px 20px;
          text-align:center;
          color:#94a3b8;
          font-size:13px;
        "
      >
        등록된 강좌가 없습니다.
      </div>
    `;

    return;

  }


  filtered.forEach(
    course =>
      list.appendChild(
        createCourseElement(course)
      )
  );

}


function createCourseElement(course) {

  const item =
    document.createElement("article");


  item.className =
    "course-item";


  const completed =
    getCompletedCount(course);


  const progress =
    getProgress(course);


  const planSummary =
    getPlanSummary(course);


  item.innerHTML = `

    <div class="course-info">

      <h4>
        ${escapeHtml(course.title)}
      </h4>


      <div class="course-tags">

        <span class="tag">
          ${escapeHtml(course.subject)}
        </span>

        <span class="tag">
          ${escapeHtml(course.teacher)}
        </span>

      </div>


      <div class="course-progress-info">

        <span>
          진도
        </span>

        <strong>
          ${completed}/${course.totalEp}강
          · ${progress}%
        </strong>

      </div>


      <div class="progress-bar-container">

        <div
          class="progress-bar-fill"
          style="width:${progress}%"
        ></div>

      </div>


      <p class="course-plan-summary">
        ${
          planSummary ||
          "설정된 학습 계획이 없습니다."
        }
      </p>

    </div>


    <div class="course-actions">

      <button
        class="btn-progress"
        onclick="openProgressModal(${course.id})"
      >
        진도 체크
      </button>


      <button
        class="btn-plan"
        onclick="openPlanModal(${course.id})"
      >
        계획 수정
      </button>


      <button
        class="btn-delete"
        onclick="deleteCourse(${course.id})"
      >
        삭제
      </button>

    </div>

  `;


  return item;

}


/* =========================================
   FILTER
========================================= */

function updateFilterOptions() {

  const subjectSelect =
    document.getElementById(
      "filter-subject"
    );


  const teacherSelect =
    document.getElementById(
      "filter-teacher"
    );


  if (
    !subjectSelect ||
    !teacherSelect
  ) {
    return;
  }


  const oldSubject =
    subjectSelect.value || "ALL";


  const oldTeacher =
    teacherSelect.value || "ALL";


  const subjectsInCourses =
    [
      ...new Set(
        courses
          .map(course =>
            course.subject
          )
          .filter(Boolean)
      )
    ];


  const teachersInCourses =
    [
      ...new Set(
        courses
          .map(course =>
            course.teacher
          )
          .filter(Boolean)
      )
    ];


  subjectSelect.innerHTML =
    `
      <option value="ALL">
        전체 보기
      </option>
    `;


  subjectsInCourses.forEach(
    subject => {

      const option =
        document.createElement(
          "option"
        );

      option.value = subject;

      option.textContent = subject;

      subjectSelect.appendChild(
        option
      );

    }
  );


  teacherSelect.innerHTML =
    `
      <option value="ALL">
        전체 보기
      </option>
    `;


  teachersInCourses.forEach(
    teacher => {

      const option =
        document.createElement(
          "option"
        );

      option.value = teacher;

      option.textContent = teacher;

      teacherSelect.appendChild(
        option
      );

    }
  );


  if (
    subjectsInCourses.includes(
      oldSubject
    )
  ) {

    subjectSelect.value =
      oldSubject;

  } else {

    subjectSelect.value =
      "ALL";

  }


  if (
    teachersInCourses.includes(
      oldTeacher
    )
  ) {

    teacherSelect.value =
      oldTeacher;

  } else {

    teacherSelect.value =
      "ALL";

  }

}


/* =========================================
   PROGRESS
========================================= */

function openProgressModal(id) {

  selectedCourseId = id;


  const course =
    courses.find(
      item =>
        item.id === id
    );


  if (!course) {
    return;
  }


  document
    .getElementById(
      "modal-progress-course-name"
    )
    .textContent =
      course.title;


  renderEpisodeGrid(course);


  document
    .getElementById(
      "progress-modal"
    )
    .classList
    .add("active");


  document.body.style.overflow =
    "hidden";

}


function renderEpisodeGrid(course) {

  const container =
    document.getElementById(
      "episode-list-container"
    );


  const completed =
    getCompletedCount(course);


  const progress =
    getProgress(course);


  document
    .getElementById(
      "modal-progress-text"
    )
    .textContent =
      `${completed} / ${course.totalEp}강 완료 · ${progress}%`;


  document
    .getElementById(
      "modal-progress-bar"
    )
    .style.width =
      `${progress}%`;


  container.innerHTML = "";


  course.completedEpisodes.forEach(
    (done, index) => {

      const label =
        document.createElement(
          "label"
        );


      label.className =
        "episode-item";


      label.innerHTML = `

        <input
          type="checkbox"
          ${done ? "checked" : ""}
        >

        <span>
          ${index + 1}강
        </span>

      `;


      const checkbox =
        label.querySelector(
          "input"
        );


      checkbox.addEventListener(
        "change",
        () =>
          toggleEpisode(index)
      );


      container.appendChild(
        label
      );

    }
  );

}


function toggleEpisode(index) {

  const course =
    courses.find(
      item =>
        item.id === selectedCourseId
    );


  if (!course) {
    return;
  }


  course.completedEpisodes[index] =
    !course.completedEpisodes[index];


  saveToLocalStorage();


  renderEpisodeGrid(course);

  renderCourses();

  renderDashboard();

}


/* =========================================
   PLAN MODAL
========================================= */

function openPlanModal(id) {

  selectedCourseId = id;


  const course =
    courses.find(
      item =>
        item.id === id
    );


  if (!course) {
    return;
  }


  document
    .getElementById(
      "modal-plan-course-name"
    )
    .textContent =
      course.title;


  const container =
    document.getElementById(
      "day-settings-container"
    );


  container.innerHTML = "";


  DAYS.forEach(day => {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "day-row";


    row.innerHTML = `

      <span>
        ${DAY_NAMES[day]}
      </span>

      <div>

        <input
          type="number"
          min="0"
          max="${course.totalEp}"
          id="input-day-${day}"
          value="${course.plan[day] || 0}"
        >

        강

      </div>

    `;


    container.appendChild(row);

  });


  document
    .getElementById(
      "plan-modal"
    )
    .classList
    .add("active");


  document.body.style.overflow =
    "hidden";

}


function savePlan() {

  const course =
    courses.find(
      item =>
        item.id === selectedCourseId
    );


  if (!course) {
    return;
  }


  DAYS.forEach(day => {

    const input =
      document.getElementById(
        `input-day-${day}`
      );


    const value =
      parseInt(
        input.value,
        10
      ) || 0;


    course.plan[day] =
      Math.max(
        0,
        Math.min(
          value,
          course.totalEp
        )
      );

  });


  saveToLocalStorage();

  closeModal("plan-modal");

  renderCourses();

  renderDashboard();

}


function closeModal(modalId) {

  const modal =
    document.getElementById(
      modalId
    );


  if (modal) {
    modal.classList.remove(
      "active"
    );
  }


  if (
    !document.querySelector(
      ".modal.active"
    )
  ) {

    document.body.style.overflow =
      "";

  }


  selectedCourseId = null;

}


/* =========================================
   DASHBOARD
========================================= */

function renderDashboard() {

  updateTodayDate();

  renderTodayPlans();

  renderStats();

  renderRecentCourses();

  renderWeeklyPlan();

}


function renderStats() {

  const courseStat =
    document.getElementById(
      "stat-courses"
    );


  const progressStat =
    document.getElementById(
      "stat-progress"
    );


  const todayStat =
    document.getElementById(
      "stat-today"
    );


  if (courseStat) {
    courseStat.textContent =
      courses.length;
  }


  let totalEpisodes = 0;

  let completedEpisodes = 0;


  courses.forEach(course => {

    totalEpisodes +=
      Number(course.totalEp) || 0;

    completedEpisodes +=
      getCompletedCount(course);

  });


  const average =
    totalEpisodes === 0
      ? 0
      : Math.round(
          (
            completedEpisodes /
            totalEpisodes
          ) *
          100
        );


  if (progressStat) {
    progressStat.textContent =
      `${average}%`;
  }


  const today =
    getTodayDay();


  const todayCount =
    courses.reduce(
      (sum, course) =>
        sum +
        (
          Number(
            course.plan?.[today]
          ) || 0
        ),
      0
    );


  if (todayStat) {
    todayStat.textContent =
      todayCount;
  }

}


function renderTodayPlans() {

  const container =
    document.getElementById(
      "today-plan-list"
    );


  if (!container) {
    return;
  }


  const plans =
    getTodayPlans();


  const progressCircle =
    document.getElementById(
      "today-progress-circle"
    );


  const progressNumber =
    document.getElementById(
      "today-progress-number"
    );


  let doneCount = 0;


  plans.forEach(plan => {

    const course =
      courses.find(
        c =>
          c.id === plan.courseId
      );


    if (!course) {
      return;
    }


    const target =
      getPlanEpisodeIndexes(
        course,
        plan.count
      );


    target.forEach(index => {

      if (
        course.completedEpisodes[index]
      ) {
        doneCount++;
      }

    });

  });


  const total =
    plans.reduce(
      (sum, plan) =>
        sum + plan.count,
      0
    );


  const percentage =
    total === 0
      ? 0
      : Math.round(
          (doneCount / total) * 100
        );


  if (progressNumber) {
    progressNumber.textContent =
      `${percentage}%`;
  }


  if (progressCircle) {

    progressCircle.style.background =
      `
        conic-gradient(
          #60a5fa ${percentage * 3.6}deg,
          rgba(255,255,255,0.18)
          ${percentage * 3.6}deg
        )
      `;

  }


  container.innerHTML = "";


  if (plans.length === 0) {

    container.innerHTML = `
      <div class="today-empty">
        오늘 등록된 학습 계획이 없습니다.
      </div>
    `;

    return;

  }


  plans.forEach(
    (plan, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "today-plan-item";


      item.innerHTML = `

        <div class="plan-number">
          ${index + 1}
        </div>

        <div>

          <strong>
            ${escapeHtml(plan.title)}
          </strong>

          <span>
            ${escapeHtml(plan.subject)}
            · ${plan.count}강
          </span>

        </div>

      `;


      container.appendChild(
        item
      );

    }
  );

}


function renderRecentCourses() {

  const container =
    document.getElementById(
      "recent-course-list"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (courses.length === 0) {

    container.innerHTML = `
      <div
        style="
          grid-column:1/-1;
          color:#94a3b8;
          font-size:12px;
          padding:15px 0;
        "
      >
        아직 등록된 강좌가 없습니다.
      </div>
    `;

    return;

  }


  courses
    .slice()
    .sort(
      (a, b) =>
        getProgress(b) -
        getProgress(a)
    )
    .slice(0, 6)
    .forEach(course => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "recent-course";


      const progress =
        getProgress(course);


      card.innerHTML = `

        <div class="recent-course-title">
          ${escapeHtml(course.title)}
        </div>

        <div class="recent-course-meta">
          ${escapeHtml(course.subject)}
          · ${escapeHtml(course.teacher)}
        </div>

        <div class="recent-course-progress">

          <div
            class="progress-bar-container"
          >
            <div
              class="progress-bar-fill"
              style="width:${progress}%"
            ></div>
          </div>

        </div>

        <div
          style="
            margin-top:6px;
            color:#64748b;
            font-size:10px;
          "
        >
          ${progress}% 완료
        </div>

      `;


      card.onclick = () =>
        openProgressModal(course.id);


      container.appendChild(card);

    });

}


function renderWeeklyPlan() {

  const today =
    getTodayDay();


  DAYS.forEach(day => {

    const card =
      document.getElementById(
        `day-${day}`
      );


    const list =
      document.getElementById(
        `list-${day}`
      );


    if (!card || !list) {
      return;
    }


    card.classList.toggle(
      "today",
      day === today
    );


    list.innerHTML = "";


    let hasPlan = false;


    courses.forEach(course => {

      const count =
        Number(
          course.plan?.[day]
        ) || 0;


      if (count <= 0) {
        return;
      }


      hasPlan = true;


      const li =
        document.createElement(
          "li"
        );


      li.textContent =
        `[${course.subject}] ${course.title} · ${count}강`;


      list.appendChild(li);

    });


    if (!hasPlan) {

      const li =
        document.createElement(
          "li"
        );


      li.className =
        "empty";


      li.textContent =
        "일정 없음";


      list.appendChild(li);

    }

  });

}


/* =========================================
   TODAY
========================================= */

function getTodayDay() {

  const index =
    new Date().getDay();


  return DAYS[
    index === 0
      ? 6
      : index - 1
  ];

}


function getTodayPlans() {

  const day =
    getTodayDay();


  const plans = [];


  courses.forEach(course => {

    const count =
      Number(
        course.plan?.[day]
      ) || 0;


    if (count > 0) {

      plans.push({

        courseId:
          course.id,

        title:
          course.title,

        subject:
          course.subject,

        count

      });

    }

  });


  return plans;

}


function showTodayPlans() {

  const container =
    document.getElementById(
      "today-modal-list"
    );


  const plans =
    getTodayPlans();


  container.innerHTML = "";


  if (plans.length === 0) {

    container.innerHTML = `
      <div class="today-modal-item">
        <strong>
          오늘의 계획이 없습니다.
        </strong>

        <span>
          강좌에서 학습 계획을 설정해보세요.
        </span>
      </div>
    `;

  } else {

    plans.forEach(plan => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "today-modal-item";


      item.innerHTML = `

        <strong>
          ${escapeHtml(plan.title)}
        </strong>

        <span>
          ${escapeHtml(plan.subject)}
          · 오늘 ${plan.count}강
        </span>

      `;


      container.appendChild(item);

    });

  }


  document
    .getElementById(
      "today-modal"
    )
    .classList
    .add("active");


  document.body.style.overflow =
    "hidden";

}


/* =========================================
   DATE
========================================= */

function updateDate() {

  const element =
    document.getElementById(
      "mobile-date"
    );


  if (!element) {
    return;
  }


  const now =
    new Date();


  element.textContent =
    now.toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short"
      }
    );

}


function updateTodayDate() {

  const element =
    document.getElementById(
      "today-date"
    );


  if (!element) {
    return;
  }


  const now =
    new Date();


  element.textContent =
    now.toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      }
    );

}


/* =========================================
   LOCAL STORAGE
========================================= */

function saveToLocalStorage() {

  localStorage.setItem(
    "subjects_v3",
    JSON.stringify(subjects)
  );


  localStorage.setItem(
    "courses_v3",
    JSON.stringify(courses)
  );

}


/* =========================================
   EXPORT
========================================= */

function exportData() {

  if (
    courses.length === 0 &&
    subjects.length === 0
  ) {

    alert(
      "내보낼 데이터가 없습니다."
    );

    return;

  }


  const backup = {

    app:
      "SPS",

    version:
      "3.0",

    exportedAt:
      new Date().toISOString(),

    subjects,

    courses

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          backup,
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


  const link =
    document.createElement(
      "a"
    );


  const date =
    new Date()
      .toISOString()
      .slice(0, 10);


  link.href = url;

  link.download =
    `SPS-backup-${date}.json`;


  link.click();


  URL.revokeObjectURL(url);

}


/* =========================================
   IMPORT
========================================= */

function importData(event) {

  const file =
    event.target.files?.[0];


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    function (e) {

      try {

        const data =
          JSON.parse(
            e.target.result
          );


        let importedCourses;
        let importedSubjects;


        if (
          data &&
          Array.isArray(
            data.courses
          )
        ) {

          importedCourses =
            data.courses;

          importedSubjects =
            Array.isArray(
              data.subjects
            )
              ? data.subjects
              : DEFAULT_SUBJECTS;

        }

        else if (
          Array.isArray(data)
        ) {

          importedCourses =
            data;

          importedSubjects =
            DEFAULT_SUBJECTS;

        }

        else {

          throw new Error(
            "Invalid data"
          );

        }


        if (
          !confirm(
            "현재 데이터를 백업 파일의 데이터로 교체하시겠습니까?"
          )
        ) {

          event.target.value = "";

          return;

        }


        subjects =
          importedSubjects;


        courses =
          importedCourses;


        normalizeData();


        renderSubjectDropdowns();

        renderSubjectList();

        renderCourses();

        renderDashboard();


        alert(
          "데이터를 성공적으로 복원했습니다."
        );

      }

      catch (error) {

        console.error(error);

        alert(
          "올바른 SPS JSON 파일이 아닙니다."
        );

      }


      event.target.value = "";

    };


  reader.readAsText(file);

}


/* =========================================
   PWA
========================================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;

    showInstallButtons();

  }
);


window.addEventListener(
  "appinstalled",
  () => {

    deferredInstallPrompt =
      null;

    hideInstallButtons();

  }
);


function setupInstallButton() {

  if (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches
  ) {

    hideInstallButtons();

  }

}


function showInstallButtons() {

  [
    "install-app-btn",
    "desktop-install-btn",
    "settings-install-btn"
  ]
    .forEach(id => {

      const button =
        document.getElementById(id);

      if (button) {
        button.style.display =
          "";
      }

    });

}


function hideInstallButtons() {

  [
    "install-app-btn",
    "desktop-install-btn"
  ]
    .forEach(id => {

      const button =
        document.getElementById(id);

      if (button) {
        button.style.display =
          "none";
      }

    });

}


async function installApp() {

  if (!deferredInstallPrompt) {

    alert(
      "현재 브라우저에서 바로 설치할 수 없습니다.\n\n브라우저 메뉴의 '앱 설치' 또는 '홈 화면에 추가'를 이용해주세요."
    );

    return;

  }


  deferredInstallPrompt.prompt();


  try {

    await deferredInstallPrompt
      .userChoice;

  }

  catch (error) {

    console.error(error);

  }


  deferredInstallPrompt =
    null;

  hideInstallButtons();

}


/* =========================================
   SERVICE WORKER
========================================= */

function setupServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {
    return;
  }


  navigator.serviceWorker
    .register(
      "./sw.js"
    )
    .then(() => {

      console.log(
        "SPS Service Worker registered."
      );

    })
    .catch(error => {

      console.error(
        "Service Worker error:",
        error
      );

    });

}


/* =========================================
   NOTIFICATION
========================================= */

async function requestNotificationPermission() {

  if (
    !("Notification" in window)
  ) {

    alert(
      "이 브라우저에서는 알림을 사용할 수 없습니다."
    );

    return;

  }


  const permission =
    await Notification.requestPermission();


  if (
    permission === "granted"
  ) {

    alert(
      "알림 권한이 허용되었습니다."
    );

  }

  else {

    alert(
      "알림 권한이 허용되지 않았습니다."
    );

  }

}


function checkMorningNotification() {

  const now =
    new Date();


  const hour =
    now.getHours();


  const today =
    now.toISOString()
      .slice(0, 10);


  const key =
    "sps_morning_notification";


  const last =
    localStorage.getItem(key);


  /*
   * 오전 7시 이후 앱을 열었을 때
   * 오늘 아직 안내하지 않았다면 표시.
   *
   * 브라우저가 완전히 종료된 상태에서
   * 정확히 07:00에 실행되는 것은
   * 순수 PWA만으로 보장할 수 없다.
   */

  if (
    hour >= 7 &&
    last !== today
  ) {

    localStorage.setItem(
      key,
      today
    );


    setTimeout(
      () => {

        if (
          "Notification" in window &&
          Notification.permission ===
            "granted"
        ) {

          new Notification(
            "SPS · 오늘의 계획",
            {
              body:
                "오늘의 계획을 확인하세요!",
              icon:
                "./image/icon-192.png"
            }
          );

        }

        else {

          showTodayPlans();

        }

      },
      1000
    );

  }

}


/* =========================================
   MODAL KEYBOARD
========================================= */

function setupModalKeyboard() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }


      document
        .querySelectorAll(
          ".modal.active"
        )
        .forEach(modal => {

          modal.classList.remove(
            "active"
          );

        });


      document.body.style.overflow =
        "";

    }
  );

}


/* =========================================
   HELPERS
========================================= */

function getCompletedCount(course) {

  return (
    course.completedEpisodes
      ?.filter(Boolean)
      .length || 0
  );

}


function getProgress(course) {

  if (
    !course.totalEp ||
    course.totalEp <= 0
  ) {
    return 0;
  }


  return Math.round(
    (
      getCompletedCount(course) /
      course.totalEp
    ) *
    100
  );

}


function getPlanSummary(course) {

  return DAYS
    .filter(
      day =>
        Number(
          course.plan?.[day]
        ) > 0
    )
    .map(
      day =>
        `${day} ${course.plan[day]}강`
    )
    .join(" · ");

}


function getPlanEpisodeIndexes(
  course,
  count
) {

  const indexes = [];


  for (
    let i = 0;
    i < course.totalEp &&
    indexes.length < count;
    i++
  ) {

    if (
      !course.completedEpisodes[i]
    ) {

      indexes.push(i);

    }

  }


  return indexes;

}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}