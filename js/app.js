const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 데이터 상태
let subjects =
  JSON.parse(localStorage.getItem('subjects_v3')) ||
  ['수학', '영어', '국어'];

let courses =
  JSON.parse(localStorage.getItem('courses_v3')) ||
  [];

let selectedCourseId = null;


// ==========================================
// 초기화
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  renderSubjectDropdowns();
  renderCourses();
  renderDashboard();
  renderSubjectList();

  setupInstallButton();

});


// ==========================================
// 탭 전환
// ==========================================

function switchTab(tabName) {

  document
    .querySelectorAll('.tab-content')
    .forEach(el => {
      el.classList.remove('active');
    });

  document
    .querySelectorAll('nav button')
    .forEach(el => {
      el.classList.remove('active');
    });


  const tab = document.getElementById(`tab-${tabName}`);
  const navButton = document.getElementById(`nav-${tabName}`);

  if (tab) {
    tab.classList.add('active');
  }

  if (navButton) {
    navButton.classList.add('active');
  }


  if (tabName === 'dashboard') {
    renderDashboard();
  }

  if (tabName === 'classroom') {
    renderSubjectDropdowns();
    renderCourses();
  }

  if (tabName === 'settings') {
    renderSubjectList();
  }

}


// ==========================================
// 과목 관리
// ==========================================

function addSubject(event) {

  event.preventDefault();

  const input =
    document.getElementById('input-new-subject');

  const subjectName =
    input.value.trim();


  if (!subjectName) {
    return;
  }


  if (subjects.includes(subjectName)) {

    alert('이미 존재하는 과목입니다.');

    return;
  }


  subjects.push(subjectName);

  saveToLocalStorage();

  input.value = '';

  renderSubjectList();

  renderSubjectDropdowns();

}


function deleteSubject(subjectName) {

  if (
    confirm(
      `'${subjectName}' 과목을 삭제하시겠습니까?`
    )
  ) {

    subjects =
      subjects.filter(
        s => s !== subjectName
      );

    saveToLocalStorage();

    renderSubjectList();

    renderSubjectDropdowns();

  }

}


function renderSubjectList() {

  const container =
    document.getElementById('subject-list');

  if (!container) {
    return;
  }

  container.innerHTML = '';


  subjects.forEach(subject => {

    const li =
      document.createElement('li');

    li.className = 'subject-tag';


    li.innerHTML = `
      <span>${subject}</span>
      <button onclick="deleteSubject('${subject}')">&times;</button>
    `;


    container.appendChild(li);

  });

}


function renderSubjectDropdowns() {

  const courseSelect =
    document.getElementById('input-subject');

  if (!courseSelect) {
    return;
  }


  const currentVal =
    courseSelect.value;


  courseSelect.innerHTML =
    '<option value="" disabled selected>과목 선택</option>' +
    subjects
      .map(
        s => `<option value="${s}">${s}</option>`
      )
      .join('');


  if (subjects.includes(currentVal)) {
    courseSelect.value = currentVal;
  }

}


// ==========================================
// 강좌 관리
// ==========================================

function addCourse(event) {

  event.preventDefault();


  const title =
    document
      .getElementById('input-title')
      .value
      .trim();

  const teacher =
    document
      .getElementById('input-teacher')
      .value
      .trim();

  const subject =
    document
      .getElementById('input-subject')
      .value;

  const totalEp =
    parseInt(
      document
        .getElementById('input-total-ep')
        .value
    ) || 0;


  if (
    !title ||
    !teacher ||
    !subject ||
    totalEp <= 0
  ) {

    alert(
      '모든 필드를 올바르게 입력해주세요.'
    );

    return;
  }


  const completedEpisodes =
    new Array(totalEp).fill(false);


  const newCourse = {

    id: Date.now(),

    title,

    teacher,

    subject,

    totalEp,

    completedEpisodes,

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

  renderCourses();

  renderDashboard();

}


function deleteCourse(id) {

  if (
    confirm(
      '해당 강좌를 삭제하시겠습니까?'
    )
  ) {

    courses =
      courses.filter(
        c => c.id !== id
      );

    saveToLocalStorage();

    renderCourses();

    renderDashboard();

  }

}


function renderCourses() {

  updateFilterOptions();


  const filterSubject =
    document
      .getElementById('filter-subject')
      .value;

  const filterTeacher =
    document
      .getElementById('filter-teacher')
      .value;

  const list =
    document.getElementById('course-list');


  list.innerHTML = '';


  const filteredCourses =
    courses.filter(course => {

      const matchSubject =
        filterSubject === 'ALL' ||
        course.subject === filterSubject;

      const matchTeacher =
        filterTeacher === 'ALL' ||
        course.teacher === filterTeacher;

      return (
        matchSubject &&
        matchTeacher
      );

    });


  if (filteredCourses.length === 0) {

    list.innerHTML =
      '<p style="color:#888; text-align:center; padding:20px;">등록되거나 조건에 맞는 강좌가 없습니다.</p>';

    return;
  }


  filteredCourses.forEach(course => {

    const completedCount =
      course.completedEpisodes
        .filter(Boolean)
        .length;


    const progressPercent =
      Math.round(
        (completedCount / course.totalEp) *
        100
      ) || 0;


    const planSummary =
      DAYS
        .filter(
          day => course.plan[day] > 0
        )
        .map(
          day =>
            `${day}(${course.plan[day]}강)`
        )
        .join(', ');


    const item =
      document.createElement('div');

    item.className =
      'course-item';


    item.innerHTML = `

      <div class="course-info">

        <h4>${course.title}</h4>

        <div class="tags">

          <span class="tag">
            과목: ${course.subject}
          </span>

          <span class="tag">
            강사: ${course.teacher}님
          </span>

        </div>


        <div>

          <small>
            진도율:
            ${completedCount}/${course.totalEp}강
            (${progressPercent}%)
          </small>

          <div class="progress-bar-container">

            <div
              class="progress-bar-fill"
              style="width:${progressPercent}%;">
            </div>

          </div>

        </div>


        <p
          style="font-size:0.85rem; color:#666; margin-top:4px;">

          ${
            planSummary
              ? '수강 플랜: ' + planSummary
              : '설정된 계획 없음'
          }

        </p>

      </div>


      <div class="course-actions">

        <button
          class="btn-secondary"
          onclick="openProgressModal(${course.id})">

          진도 체크

        </button>

        <button
          class="btn-primary"
          onclick="openPlanModal(${course.id})">

          계획 수정

        </button>

        <button
          class="btn-delete"
          onclick="deleteCourse(${course.id})">

          삭제

        </button>

      </div>

    `;


    list.appendChild(item);

  });

}


function updateFilterOptions() {

  const subjectSelect =
    document.getElementById('filter-subject');

  const teacherSelect =
    document.getElementById('filter-teacher');


  if (!subjectSelect || !teacherSelect) {
    return;
  }


  const selectedSubject =
    subjectSelect.value;

  const selectedTeacher =
    teacherSelect.value;


  const subjectOptions =
    [
      'ALL',
      ...new Set(
        courses.map(
          c => c.subject
        )
      )
    ];


  const teacherOptions =
    [
      'ALL',
      ...new Set(
        courses.map(
          c => c.teacher
        )
      )
    ];


  subjectSelect.innerHTML =
    subjectOptions
      .map(
        s =>
          `<option value="${s}">
            ${s === 'ALL'
              ? '전체 보기'
              : s}
          </option>`
      )
      .join('');


  teacherSelect.innerHTML =
    teacherOptions
      .map(
        t =>
          `<option value="${t}">
            ${t === 'ALL'
              ? '전체 보기'
              : t}
          </option>`
      )
      .join('');


  if (
    subjectOptions.includes(
      selectedSubject
    )
  ) {

    subjectSelect.value =
      selectedSubject;

  }


  if (
    teacherOptions.includes(
      selectedTeacher
    )
  ) {

    teacherSelect.value =
      selectedTeacher;

  }

}


// ==========================================
// 진도 체크 모달
// ==========================================

function openProgressModal(id) {

  selectedCourseId = id;


  const course =
    courses.find(
      c => c.id === id
    );


  if (!course) {
    return;
  }


  document
    .getElementById(
      'modal-progress-course-name'
    )
    .innerText =
      course.title;


  renderEpisodeGrid(course);


  document
    .getElementById('progress-modal')
    .classList
    .add('active');

}


function renderEpisodeGrid(course) {

  const container =
    document.getElementById(
      'episode-list-container'
    );


  container.innerHTML = '';


  const completedCount =
    course.completedEpisodes
      .filter(Boolean)
      .length;


  const progressPercent =
    Math.round(
      (completedCount / course.totalEp) *
      100
    ) || 0;


  document
    .getElementById(
      'modal-progress-bar'
    )
    .style.width =
      `${progressPercent}%`;


  document
    .getElementById(
      'modal-progress-text'
    )
    .innerText =
      `${completedCount} / ${course.totalEp}강 완료 (${progressPercent}%)`;


  course.completedEpisodes
    .forEach(
      (isDone, idx) => {

        const epNum =
          idx + 1;


        const label =
          document.createElement(
            'label'
          );


        label.className =
          'episode-item';


        label.innerHTML = `

          <input
            type="checkbox"
            ${isDone ? 'checked' : ''}
            onchange="toggleEpisode(${idx})">

          ${epNum}강

        `;


        container.appendChild(label);

      }
    );

}


function toggleEpisode(index) {

  const course =
    courses.find(
      c => c.id === selectedCourseId
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


// ==========================================
// 학습 계획 모달
// ==========================================

function openPlanModal(id) {

  selectedCourseId = id;


  const course =
    courses.find(
      c => c.id === id
    );


  if (!course) {
    return;
  }


  document
    .getElementById(
      'modal-plan-course-name'
    )
    .innerText =
      course.title;


  const container =
    document.getElementById(
      'day-settings-container'
    );


  container.innerHTML = '';


  DAYS.forEach(day => {

    const count =
      course.plan[day] || 0;


    const row =
      document.createElement(
        'div'
      );


    row.className =
      'day-row';


    row.innerHTML = `

      <span>
        ${day}요일
      </span>

      <div>

        <input
          type="number"
          id="input-day-${day}"
          min="0"
          value="${count}">

        강

      </div>

    `;


    container.appendChild(row);

  });


  document
    .getElementById('plan-modal')
    .classList
    .add('active');

}


function savePlan() {

  const course =
    courses.find(
      c => c.id === selectedCourseId
    );


  if (!course) {
    return;
  }


  DAYS.forEach(day => {

    const val =
      parseInt(
        document
          .getElementById(
            `input-day-${day}`
          )
          .value
      ) || 0;


    course.plan[day] =
      val;

  });


  saveToLocalStorage();

  closeModal('plan-modal');

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
      'active'
    );
  }


  selectedCourseId = null;

}


// ==========================================
// 대시보드
// ==========================================

function renderDashboard() {

  DAYS.forEach(day => {

    const dayList =
      document.getElementById(
        `list-${day}`
      );


    if (!dayList) {
      return;
    }


    dayList.innerHTML = '';


    let hasPlan = false;


    courses.forEach(course => {

      const count =
        course.plan[day];


      if (count > 0) {

        hasPlan = true;


        for (
          let i = 0;
          i < count;
          i++
        ) {

          const li =
            document.createElement(
              'li'
            );


          li.innerText =
            `[${course.subject}] ${course.title}`;


          dayList.appendChild(
            li
          );

        }

      }

    });


    if (!hasPlan) {

      dayList.innerHTML =
        '<li style="background:none; border:none; color:#aaa; padding:0;">일정 없음</li>';

    }

  });

}


// ==========================================
// LocalStorage
// ==========================================

function saveToLocalStorage() {

  localStorage.setItem(
    'subjects_v3',
    JSON.stringify(subjects)
  );


  localStorage.setItem(
    'courses_v3',
    JSON.stringify(courses)
  );

}


// ==========================================
// JSON 내보내기
// ==========================================

function exportData() {

  if (
    courses.length === 0 &&
    subjects.length === 0
  ) {

    alert(
      '내보낼 데이터가 없습니다.'
    );

    return;
  }


  const backupData = {

    subjects,

    courses

  };


  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(
      JSON.stringify(
        backupData,
        null,
        2
      )
    );


  const downloadAnchor =
    document.createElement('a');


  downloadAnchor.setAttribute(
    'href',
    dataStr
  );


  downloadAnchor.setAttribute(
    'download',
    `lecture_planner_backup_${new Date().toISOString().slice(0, 10)}.json`
  );


  document.body.appendChild(
    downloadAnchor
  );


  downloadAnchor.click();

  downloadAnchor.remove();

}


// ==========================================
// JSON 불러오기
// ==========================================

function importData(event) {

  const file =
    event.target.files[0];


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    function(e) {

      try {

        const importedData =
          JSON.parse(
            e.target.result
          );


        // 현재 버전 데이터
        if (
          importedData.courses &&
          Array.isArray(
            importedData.courses
          )
        ) {

          if (
            confirm(
              '기존 데이터를 덮어쓰고 선택한 파일의 데이터로 복구하시겠습니까?'
            )
          ) {

            courses =
              importedData.courses;


            subjects =
              importedData.subjects ||
              [
                '수학',
                '영어',
                '국어'
              ];


            saveToLocalStorage();


            renderSubjectDropdowns();

            renderCourses();

            renderDashboard();

            renderSubjectList();


            alert(
              '성공적으로 데이터를 불러왔습니다!'
            );

          }

        }


        // 이전 버전 호환
        else if (
          Array.isArray(
            importedData
          )
        ) {

          if (
            confirm(
              '이전 버전의 데이터입니다. 불러오시겠습니까?'
            )
          ) {

            courses =
              importedData;


            saveToLocalStorage();


            renderSubjectDropdowns();

            renderCourses();

            renderDashboard();


            alert(
              '성공적으로 데이터를 불러왔습니다!'
            );

          }

        }


        else {

          alert(
            '올바른 JSON 데이터 형식이 아닙니다.'
          );

        }

      }

      catch (err) {

        console.error(err);

        alert(
          '파일을 읽는 도중 오류가 발생했습니다.'
        );

      }

    };


  reader.readAsText(file);

}


// ==========================================
// PWA 설치
// ==========================================

let deferredInstallPrompt = null;


// 설치 가능 이벤트
window.addEventListener(
  'beforeinstallprompt',
  (event) => {

    console.log(
      'SPS 앱 설치가 가능합니다.'
    );


    // 브라우저 기본 설치 UI를 막음
    event.preventDefault();


    deferredInstallPrompt =
      event;


    showInstallButton();

  }
);


// 설치 버튼 표시
function showInstallButton() {

  const button =
    document.getElementById(
      'install-app-btn'
    );


  if (!button) {
    return;
  }


  // 이미 앱으로 실행 중이면 표시하지 않음
  if (
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches
  ) {

    button.style.display =
      'none';

    return;

  }


  button.style.display =
    'inline-block';

}


// 설치 버튼 설정
function setupInstallButton() {

  const button =
    document.getElementById(
      'install-app-btn'
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    'click',
    installApp
  );


  // 이미 설치된 앱인지 확인
  if (
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches
  ) {

    button.style.display =
      'none';

  }

}


// 실제 설치 실행
async function installApp() {

  if (!deferredInstallPrompt) {

    alert(
      '현재 이 브라우저에서는 앱 설치를 사용할 수 없습니다.\n\n브라우저 메뉴에서 "앱 설치" 또는 "홈 화면에 추가"를 이용해 주세요.'
    );

    return;

  }


  // 설치 안내 표시
  deferredInstallPrompt.prompt();


  try {

    const result =
      await deferredInstallPrompt.userChoice;


    console.log(
      'PWA 설치 결과:',
      result.outcome
    );


    if (
      result.outcome === 'accepted'
    ) {

      console.log(
        'SPS 앱 설치가 승인되었습니다.'
      );

    }

    else {

      console.log(
        'SPS 앱 설치가 취소되었습니다.'
      );

    }

  }

  catch (error) {

    console.error(
      '앱 설치 처리 중 오류:',
      error
    );

  }


  deferredInstallPrompt =
    null;


  const button =
    document.getElementById(
      'install-app-btn'
    );


  if (button) {

    button.style.display =
      'none';

  }

}


// 설치 완료 이벤트
window.addEventListener(
  'appinstalled',
  () => {

    console.log(
      'StudyPlanService가 앱으로 설치되었습니다.'
    );


    deferredInstallPrompt =
      null;


    const button =
      document.getElementById(
        'install-app-btn'
      );


    if (button) {

      button.style.display =
        'none';

    }

  }
);


// 이미 설치된 상태 확인
window.addEventListener(
  'DOMContentLoaded',
  () => {

    if (
      window.matchMedia(
        '(display-mode: standalone)'
      ).matches
    ) {

      const button =
        document.getElementById(
          'install-app-btn'
        );


      if (button) {

        button.style.display =
          'none';

      }

    }

  }
);